import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from '../../auth/roles.guard';
import type { JwtSignOptions } from '@nestjs/jwt';
import { oauthStrategyProviders } from './oauth-strategies.providers';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = (config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m') as JwtSignOptions['expiresIn'];
        return {
          secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, ...oauthStrategyProviders],
  exports: [JwtModule, RolesGuard],
})
export class AuthModule {}
