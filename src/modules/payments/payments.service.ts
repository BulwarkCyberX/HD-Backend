import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, PaymentStatus, ProjectStatus, UserRole, type PaymentCurrency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private readonly paymentSelect = {
    id: true,
    projectId: true,
    payerId: true,
    payeeId: true,
    amount: true,
    currency: true,
    status: true,
    createdAt: true,
  } as const;

  async deposit(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    amount: number;
    currency: PaymentCurrency;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can deposit payment');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can deposit payment');
    }
    if (!project.selectedProviderId) {
      throw new BadRequestException('Project must have selected provider before deposit');
    }

    const existing = await this.prisma.payment.findUnique({
      where: { projectId: input.projectId },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new BadRequestException('Payment already exists for this project');
    }

    return await this.prisma.payment.create({
      data: {
        projectId: input.projectId,
        payerId: input.requesterId,
        payeeId: project.selectedProviderId,
        amount: input.amount,
        currency: input.currency,
        status: PaymentStatus.IN_ESCROW,
      },
      select: this.paymentSelect,
    });
  }

  async release(input: { requesterId: string; role: UserRole; projectId: string }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can release payment');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, status: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can release payment');
    }
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException('Project must be completed before release');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { projectId: input.projectId },
      select: { id: true, status: true },
    });
    if (!payment) throw new NotFoundException('Payment not found for project');
    if (payment.status !== PaymentStatus.IN_ESCROW) {
      throw new BadRequestException('Only escrowed payments can be released');
    }

    const released = await this.prisma.payment.update({
      where: { projectId: input.projectId },
      data: { status: PaymentStatus.RELEASED },
      select: this.paymentSelect,
    });

    await this.notifications.create({
      userId: released.payeeId,
      type: NotificationType.PAYMENT_RELEASED,
      message: `Escrow payment released for project ${released.projectId}`,
    });

    return released;
  }
}
