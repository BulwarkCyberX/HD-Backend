import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RealtimeGateway } from './realtime.gateway';
import { DomainEventsService } from './domain-events.service';
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
      }),
    }),
  ],
  providers: [RealtimeGateway, DomainEventsService],
  exports: [DomainEventsService],
})
export class RealtimeModule {}
