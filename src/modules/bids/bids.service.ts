import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BidStatus, NotificationType, ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TransactionalEmailService } from '../email/transactional-email.service';
import { DomainEventsService } from '../realtime/domain-events.service';

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly transactional: TransactionalEmailService,
    private readonly events: DomainEventsService,
  ) {}

  private readonly bidSelect = {
    id: true,
    projectId: true,
    providerId: true,
    proposal: true,
    price: true,
    timeline: true,
    status: true,
    createdAt: true,
    provider: {
      select: {
        id: true,
        email: true,
        providerProfile: {
          select: {
            bidCredits: true,
            rating: true,
            totalReviews: true,
            completedProjects: true,
            validReportCount: true,
            reputationScore: true,
          },
        },
      },
    },
  } as const;

  async create(input: {
    providerId: string;
    role: UserRole;
    projectId: string;
    proposal: string;
    price: number;
    timeline: string;
  }) {
    if (input.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can submit bids');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, title: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId: input.providerId },
      select: { id: true, bidCredits: true },
    });
    if (!profile) throw new BadRequestException('Provider profile not found');
    if (profile.bidCredits <= 0) throw new ForbiddenException('Insufficient bid credits');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.providerProfile.update({
        where: { userId: input.providerId },
        data: { bidCredits: { decrement: 1 } },
      });
      return await tx.bid.create({
        data: {
          projectId: input.projectId,
          providerId: input.providerId,
          proposal: input.proposal,
          price: input.price,
          timeline: input.timeline,
          status: BidStatus.PENDING,
        },
        select: this.bidSelect,
      });
    });

    await this.notifications.create({
      userId: project.clientId,
      type: NotificationType.NEW_BID,
      message: `New bid on project "${project.title}"`,
    });

    this.events.bidUpdated({ projectId: input.projectId, bid: result });

    const providerUser = await this.prisma.user.findUnique({
      where: { id: input.providerId },
      select: { email: true, firstName: true },
    });
    if (providerUser?.email) {
      void this.transactional
        .sendBidPlacedProviderConfirmation({
          to: providerUser.email,
          providerName: providerUser.firstName ?? '',
          projectTitle: project.title,
          amount: input.price,
        })
        .catch(() => undefined);
    }

    return result;
  }

  async listForProject(input: { requesterId: string; role: UserRole; projectId: string }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can view project bids');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can view bids');
    }

    return await this.prisma.bid.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: 'desc' },
      select: this.bidSelect,
    });
  }

  async listMine(input: { requesterId: string; role: UserRole }) {
    if (input.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can view their bids');
    }

    return await this.prisma.bid.findMany({
      where: { providerId: input.requesterId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...this.bidSelect,
        project: { select: { id: true, title: true, status: true, visibility: true } },
      },
    });
  }

  async updateStatus(input: {
    requesterId: string;
    role: UserRole;
    bidId: string;
    status: 'ACCEPTED' | 'REJECTED';
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can manage bids');
    }
    const bid = await this.prisma.bid.findUnique({
      where: { id: input.bidId },
      select: { id: true, project: { select: { clientId: true } } },
    });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can manage bid status');
    }

    if (input.status === 'REJECTED') {
      const rejected = await this.prisma.bid.update({
        where: { id: input.bidId },
        data: { status: BidStatus.REJECTED },
        select: this.bidSelect,
      });
      this.events.bidUpdated({ projectId: rejected.projectId, bid: rejected });
      return rejected;
    }

    const updatedBid = await this.prisma.$transaction(async (tx) => {
      const row = await tx.bid.update({
        where: { id: input.bidId },
        data: { status: BidStatus.ACCEPTED },
        select: this.bidSelect,
      });

      await tx.project.update({
        where: { id: row.projectId },
        data: {
          selectedProviderId: row.providerId,
          status: ProjectStatus.IN_PROGRESS,
        },
      });

      await tx.bid.updateMany({
        where: {
          projectId: row.projectId,
          id: { not: row.id },
          status: BidStatus.PENDING,
        },
        data: { status: BidStatus.REJECTED },
      });

      return row;
    });

    const projectTitle = await this.prisma.project.findUnique({
      where: { id: updatedBid.projectId },
      select: { title: true },
    });

    await this.notifications.create({
      userId: updatedBid.providerId,
      type: NotificationType.BID_ACCEPTED,
      message: `Your bid was accepted on "${projectTitle?.title ?? 'project'}"`,
    });

    this.events.bidUpdated({ projectId: updatedBid.projectId, bid: updatedBid });

    return updatedBid;
  }
}
