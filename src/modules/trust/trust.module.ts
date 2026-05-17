import { Module } from '@nestjs/common';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';
import { FraudService } from './fraud.service';

@Module({
  controllers: [TrustController],
  providers: [TrustService, FraudService],
  exports: [TrustService, FraudService],
})
export class TrustModule {}
