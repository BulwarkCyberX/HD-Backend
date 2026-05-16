import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DigestSchedulerService } from './digest-scheduler.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [ConfigModule, PrismaModule, EmailModule, RealtimeModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, DigestSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
