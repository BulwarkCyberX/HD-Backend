import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DisputeStatus, PaymentStatus, UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
  ) {}

  private filePublicUrl(fileId: string): string {
    const base =
      process.env.PUBLIC_API_URL ?? process.env.WEB_ORIGIN?.split(',')[0]?.trim() ?? 'http://localhost:4000';
    return `${base.replace(/\/$/, '')}/files/${fileId}`;
  }

  private readonly select = {
    id: true,
    projectId: true,
    openedById: true,
    category: true,
    status: true,
    title: true,
    description: true,
    resolution: true,
    resolvedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    category: import('@prisma/client').DisputeCategory;
    title: string;
    description: string;
  }) {
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const ok =
      input.role === UserRole.ADMIN ||
      project.clientId === input.requesterId ||
      project.selectedProviderId === input.requesterId;
    if (!ok) throw new ForbiddenException('Not a project participant');
    return this.prisma.dispute.create({
      data: {
        projectId: input.projectId,
        openedById: input.requesterId,
        category: input.category,
        title: input.title,
        description: input.description,
        status: DisputeStatus.OPEN,
      },
      select: this.select,
    });
  }

  async listForProject(input: { projectId: string; requesterId: string; role: UserRole }) {
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const ok =
      input.role === UserRole.ADMIN ||
      project.clientId === input.requesterId ||
      project.selectedProviderId === input.requesterId;
    if (!ok) throw new ForbiddenException('Not a project participant');
    return this.prisma.dispute.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: 'desc' },
      select: this.select,
    });
  }

  async getById(input: { disputeId: string; requesterId: string; role: UserRole }) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: input.disputeId },
      select: {
        ...this.select,
        project: {
          select: {
            id: true,
            title: true,
            clientId: true,
            selectedProviderId: true,
            status: true,
          },
        },
        openedBy: { select: { id: true, email: true, role: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            body: true,
            internal: true,
            createdAt: true,
            author: { select: { id: true, email: true, role: true } },
          },
        },
        evidence: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            note: true,
            createdAt: true,
            fileAsset: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
              },
            },
          },
        },
      },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    await this.assertDisputeAccess(dispute.projectId, input.requesterId, input.role);
    const comments =
      input.role === UserRole.ADMIN
        ? dispute.comments
        : dispute.comments.filter((c) => !c.internal);
    const evidence = dispute.evidence.map((e) => ({
      ...e,
      fileAsset: { ...e.fileAsset, url: this.filePublicUrl(e.fileAsset.id) },
    }));
    return { ...dispute, comments, evidence };
  }

  async listAdmin(role: UserRole) {
    if (role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    return this.prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        ...this.select,
        project: { select: { id: true, title: true } },
      },
    });
  }

  async addComment(input: {
    disputeId: string;
    requesterId: string;
    role: UserRole;
    body: string;
    internal?: boolean;
  }) {
    const d = await this.prisma.dispute.findUnique({
      where: { id: input.disputeId },
      select: { id: true, projectId: true, status: true },
    });
    if (!d) throw new NotFoundException('Dispute not found');
    if (d.status === DisputeStatus.RESOLVED || d.status === DisputeStatus.REFUNDED || d.status === DisputeStatus.REJECTED) {
      throw new BadRequestException('Dispute is closed');
    }
    await this.assertDisputeAccess(d.projectId, input.requesterId, input.role, input.internal);
    if (input.internal && input.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can post internal notes');
    }
    return this.prisma.disputeComment.create({
      data: {
        disputeId: input.disputeId,
        authorId: input.requesterId,
        body: input.body,
        internal: Boolean(input.internal),
      },
      select: {
        id: true,
        body: true,
        internal: true,
        createdAt: true,
        author: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async addEvidence(input: {
    disputeId: string;
    requesterId: string;
    role: UserRole;
    fileAssetId: string;
    note?: string;
  }) {
    const d = await this.prisma.dispute.findUnique({
      where: { id: input.disputeId },
      select: { id: true, projectId: true, status: true },
    });
    if (!d) throw new NotFoundException('Dispute not found');
    await this.assertDisputeAccess(d.projectId, input.requesterId, input.role);
    if (d.status === DisputeStatus.RESOLVED || d.status === DisputeStatus.REFUNDED || d.status === DisputeStatus.REJECTED) {
      throw new BadRequestException('Dispute is closed');
    }
    const file = await this.prisma.fileAsset.findUnique({
      where: { id: input.fileAssetId },
      select: { id: true, projectId: true, uploadedById: true },
    });
    if (!file) throw new NotFoundException('File not found');
    if (file.projectId !== d.projectId) {
      throw new BadRequestException('File must belong to the same project');
    }
    if (input.role !== UserRole.ADMIN && file.uploadedById !== input.requesterId) {
      throw new ForbiddenException('You can only attach files you uploaded');
    }
    const existing = await this.prisma.disputeEvidence.findUnique({
      where: { fileAssetId: input.fileAssetId },
    });
    if (existing) throw new BadRequestException('File already attached to a dispute');
    const row = await this.prisma.disputeEvidence.create({
      data: {
        disputeId: input.disputeId,
        fileAssetId: input.fileAssetId,
        note: input.note ?? null,
      },
      select: {
        id: true,
        note: true,
        createdAt: true,
        fileAsset: {
          select: { id: true, originalName: true, mimeType: true, size: true },
        },
      },
    });
    return {
      ...row,
      fileAsset: { ...row.fileAsset, url: this.filePublicUrl(row.fileAsset.id) },
    };
  }

  async resolve(input: {
    disputeId: string;
    adminId: string;
    role: UserRole;
    status: DisputeStatus;
    resolution?: string;
    processEscrowRefund?: boolean;
  }) {
    if (input.role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: input.disputeId },
      select: { id: true, projectId: true, status: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const shouldRefund =
      input.status === DisputeStatus.REFUNDED && input.processEscrowRefund !== false;

    if (shouldRefund) {
      await this.refundProjectEscrow({
        projectId: dispute.projectId,
        adminId: input.adminId,
        disputeId: dispute.id,
      });
    }

    return this.prisma.dispute.update({
      where: { id: input.disputeId },
      data: {
        status: input.status as DisputeStatus,
        resolution: input.resolution ?? null,
        resolvedAt: new Date(),
      },
      select: this.select,
    });
  }

  async markReview(input: { disputeId: string; adminId: string; role: UserRole }) {
    if (input.role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    return this.prisma.dispute.update({
      where: { id: input.disputeId },
      data: { status: DisputeStatus.UNDER_REVIEW },
      select: this.select,
    });
  }

  private async refundProjectEscrow(input: {
    projectId: string;
    adminId: string;
    disputeId: string;
  }) {
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { clientId: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const payment = await this.prisma.payment.findUnique({
      where: { projectId: input.projectId },
      select: { id: true, amount: true, currency: true, status: true, payerId: true },
    });
    if (!payment) {
      throw new BadRequestException('No payment record for this project');
    }
    if (payment.status === PaymentStatus.RELEASED) {
      throw new BadRequestException('Payment already released — cannot refund escrow');
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      return;
    }
    if (payment.status !== PaymentStatus.IN_ESCROW) {
      throw new BadRequestException('Payment is not in escrow');
    }

    const amount = new Prisma.Decimal(payment.amount);

    await this.prisma.$transaction(async (tx) => {
      await this.wallets.recordProjectEscrowRefundToClientTx(tx, {
        clientUserId: project.clientId,
        projectId: input.projectId,
        paymentId: payment.id,
        amount,
        currency: payment.currency,
        actorUserId: input.adminId,
        disputeId: input.disputeId,
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    });
  }

  private async assertDisputeAccess(
    projectId: string,
    userId: string,
    role: UserRole,
    internal?: boolean,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (role === UserRole.ADMIN) return;
    if (project.clientId === userId || project.selectedProviderId === userId) return;
    throw new ForbiddenException('Forbidden');
  }
}
