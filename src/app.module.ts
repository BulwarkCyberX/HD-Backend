import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BidsModule } from './modules/bids/bids.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BountyModule } from './modules/bounty/bounty.module';
import { VdpModule } from './modules/vdp/vdp.module';
import { FilesModule } from './modules/files/files.module';
import { AiModule } from './modules/ai/ai.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { SearchModule } from './modules/search/search.module';
import { QueuesModule } from './modules/queues/queues.module';
import { HealthModule } from './modules/health/health.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TrustModule } from './modules/trust/trust.module';
import { PspModule } from './modules/psp/psp.module';
import { KycModule } from './modules/kyc/kyc.module';
import { PublicModule } from './modules/public/public.module';
import { AdminModule } from './modules/admin/admin.module';
import { HourlyModule } from './modules/hourly/hourly.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    EntitiesModule,
    ProjectsModule,
    BidsModule,
    MessagesModule,
    ReportsModule,
    ReviewsModule,
    PaymentsModule,
    NotificationsModule,
    BountyModule,
    VdpModule,
    FilesModule,
    AiModule,
    WalletsModule,
    MilestonesModule,
    WithdrawalsModule,
    RealtimeModule,
    DisputesModule,
    SearchModule,
    QueuesModule,
    HealthModule,
    AnalyticsModule,
    OrganizationsModule,
    TrustModule,
    PspModule,
    KycModule,
    PublicModule,
    AdminModule,
    HourlyModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
