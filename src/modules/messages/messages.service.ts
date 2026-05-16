import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEventsService } from '../realtime/domain-events.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: DomainEventsService,
  ) {}

  private async assertProjectParticipant(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const isParticipant = project.clientId === userId || project.selectedProviderId === userId;
    if (!isParticipant) throw new ForbiddenException('Only workspace participants can access messages');
    return project;
  }

  async create(input: { projectId: string; senderId: string; message: string }) {
    await this.assertProjectParticipant(input.projectId, input.senderId);
    const created = await this.prisma.message.create({
      data: {
        projectId: input.projectId,
        senderId: input.senderId,
        message: input.message,
      },
      select: {
        id: true,
        projectId: true,
        senderId: true,
        message: true,
        createdAt: true,
        sender: { select: { id: true, email: true, role: true } },
        files: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });
    this.events.messageCreated({ projectId: input.projectId, message: created });
    return created;
  }

  async listByProject(input: { projectId: string; requesterId: string }) {
    await this.assertProjectParticipant(input.projectId, input.requesterId);
    return await this.prisma.message.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        projectId: true,
        senderId: true,
        message: true,
        createdAt: true,
        sender: { select: { id: true, email: true, role: true } },
        files: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
