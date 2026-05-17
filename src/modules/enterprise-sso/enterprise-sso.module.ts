import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { EnterpriseSsoController } from './enterprise-sso.controller';
import { EnterpriseSsoService } from './enterprise-sso.service';

@Module({
  imports: [
    AuthModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
      }),
    }),
  ],
  controllers: [EnterpriseSsoController],
  providers: [EnterpriseSsoService],
  exports: [EnterpriseSsoService],
})
export class EnterpriseSsoModule {}
