import { Inject, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.module';
import type Redis from 'ioredis';
import {
  HD_BID,
  HD_MESSAGE,
  HD_MILESTONE,
  HD_NOTIFICATION,
  HD_REPORT,
} from './domain-events.service';

@WebSocketGateway({
  namespace: '/workspace',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @SubscribeMessage('joinUser')
  joinUser(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { ok: false as const };
    void client.join(`user:${userId}`);
    return { ok: true as const, room: `user:${userId}` };
  }

  handleConnection(client: Socket) {
    try {
      const token =
        (typeof client.handshake.auth?.token === 'string' && client.handshake.auth.token) ||
        (typeof client.handshake.query?.token === 'string' && client.handshake.query.token);
      if (!token) {
        throw new UnauthorizedException('Missing token');
      }
      const secret = this.config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access';
      const payload = this.jwt.verify<{ sub: string; role: string }>(token, { secret });
      client.data.userId = payload.sub;
      client.data.role = payload.role;
    } catch (e) {
      this.logger.warn(`WS disconnect: ${e instanceof Error ? e.message : e}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinProject')
  async joinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { projectId?: string },
  ) {
    const userId = client.data.userId as string | undefined;
    const projectId = body?.projectId;
    if (!userId || !projectId) return { ok: false as const, error: 'projectId required' };
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!project) return { ok: false as const, error: 'not_found' };
    const role = client.data.role as string | undefined;
    const ok =
      role === 'ADMIN' || project.clientId === userId || project.selectedProviderId === userId;
    if (!ok) return { ok: false as const, error: 'forbidden' };
    await client.join(`project:${projectId}`);
    return { ok: true as const, room: `project:${projectId}` };
  }

  @SubscribeMessage('typing')
  async typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { projectId?: string; typing?: boolean },
  ) {
    const userId = client.data.userId as string | undefined;
    const projectId = body?.projectId;
    if (!userId || !projectId) return;
    const key = `typing:${projectId}:${userId}`;
    if (body?.typing) {
      await this.redis.setex(key, 5, '1');
    } else {
      await this.redis.del(key);
    }
    client.to(`project:${projectId}`).emit('typing', { userId, typing: Boolean(body?.typing) });
  }

  @SubscribeMessage('presence')
  presence(@ConnectedSocket() client: Socket, @MessageBody() body: { projectId?: string }) {
    const userId = client.data.userId as string | undefined;
    const projectId = body?.projectId;
    if (!userId || !projectId) return;
    client.to(`project:${projectId}`).emit('presence', { userId, state: 'online' });
  }

  @OnEvent(HD_MESSAGE)
  broadcastMessage(payload: { projectId: string; message: unknown }) {
    this.server.to(`project:${payload.projectId}`).emit('message', payload.message);
  }

  @OnEvent(HD_NOTIFICATION)
  broadcastNotification(payload: { userId: string; notification: unknown }) {
    this.server.to(`user:${payload.userId}`).emit('notification', payload.notification);
  }

  @OnEvent(HD_BID)
  broadcastBid(payload: { projectId: string; bid: unknown }) {
    this.server.to(`project:${payload.projectId}`).emit('bid', payload.bid);
  }

  @OnEvent(HD_MILESTONE)
  broadcastMilestone(payload: { projectId: string; milestone: unknown }) {
    this.server.to(`project:${payload.projectId}`).emit('milestone', payload.milestone);
  }

  @OnEvent(HD_REPORT)
  broadcastReport(payload: { projectId: string; report: unknown }) {
    this.server.to(`project:${payload.projectId}`).emit('report', payload.report);
  }
}
