import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

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
    return await this.prisma.message.create({
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
