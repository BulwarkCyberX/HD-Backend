import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import type Redis from 'ioredis';
export declare class RealtimeGateway implements OnGatewayConnection {
    private readonly jwt;
    private readonly config;
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    server: Server;
    constructor(jwt: JwtService, config: ConfigService, prisma: PrismaService, redis: Redis);
    joinUser(client: Socket): {
        ok: false;
        room?: undefined;
    } | {
        ok: true;
        room: string;
    };
    handleConnection(client: Socket): void;
    joinProject(client: Socket, body: {
        projectId?: string;
    }): Promise<{
        ok: false;
        error: string;
        room?: undefined;
    } | {
        ok: true;
        room: string;
        error?: undefined;
    }>;
    typing(client: Socket, body: {
        projectId?: string;
        typing?: boolean;
    }): Promise<void>;
    presence(client: Socket, body: {
        projectId?: string;
    }): void;
    broadcastMessage(payload: {
        projectId: string;
        message: unknown;
    }): void;
    broadcastNotification(payload: {
        userId: string;
        notification: unknown;
    }): void;
    broadcastBid(payload: {
        projectId: string;
        bid: unknown;
    }): void;
    broadcastMilestone(payload: {
        projectId: string;
        milestone: unknown;
    }): void;
    broadcastReport(payload: {
        projectId: string;
        report: unknown;
    }): void;
}
