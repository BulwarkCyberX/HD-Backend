import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from '../../auth/roles.guard';
import { GoogleStrategy } from './google.strategy';
import { MicrosoftStrategy } from './microsoft.strategy';
import { FacebookStrategy } from './facebook.strategy';
import { LinkedInStrategy } from './linkedin.strategy';
import type { JwtSignOptions } from '@nestjs/jwt';

@Module({
  imports: [
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
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    GoogleStrategy,
    MicrosoftStrategy,
    FacebookStrategy,
    LinkedInStrategy,
  ],
  exports: [JwtModule, RolesGuard],
})
export class AuthModule {}
