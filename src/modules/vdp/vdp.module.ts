import { Module } from '@nestjs/common';
import { VdpController } from './vdp.controller';
import { VdpService } from './vdp.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VdpController],
  providers: [VdpService],
})
export class VdpModule {}
