import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { VerifyEmailTokenDto } from './dto/verify-email-token.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { OAuthProvider, OAuthUser } from './oauth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('verify-email/otp')
  @HttpCode(HttpStatus.OK)
  verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.auth.verifyEmail({ email: dto.email, code: dto.code });
  }

  @Post('verify-email/token')
  @HttpCode(HttpStatus.OK)
  verifyEmailToken(@Body() dto: VerifyEmailTokenDto) {
    return this.auth.verifyEmail({ token: dto.token });
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword({ token: dto.token, password: dto.password });
  }

  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  checkEmail(@Query('email') email: string) {
    return this.auth.checkEmailAvailability(email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('login/code/request')
  @HttpCode(HttpStatus.OK)
  requestLoginCode(@Body() dto: RequestLoginCodeDto) {
    return this.auth.requestLoginCode(dto);
  }

  @Post('login/code/verify')
  @HttpCode(HttpStatus.OK)
  verifyLoginCode(@Body() dto: VerifyLoginCodeDto) {
    return this.auth.verifyLoginCode(dto);
  }

  @Get('oauth/google')
  @UseGuards(AuthGuard('google'))
  oauthGoogle(@Query('next') next: string) {
    return { next };
  }

  @Get('oauth/google/callback')
  @UseGuards(AuthGuard('google'))
  async oauthGoogleCallback(@Req() req: Request, @Res() res: Response, @Query('next') next?: string) {
    return await this.finishOAuth('google', req, res, next);
  }

  @Get('oauth/microsoft')
  @UseGuards(AuthGuard('microsoft'))
  oauthMicrosoft(@Query('next') next: string) {
    return { next };
  }

  @Get('oauth/microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async oauthMicrosoftCallback(@Req() req: Request, @Res() res: Response, @Query('next') next?: string) {
    return await this.finishOAuth('microsoft', req, res, next);
  }

  @Get('oauth/facebook')
  @UseGuards(AuthGuard('facebook'))
  oauthFacebook(@Query('next') next: string) {
    return { next };
  }

  @Get('oauth/facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async oauthFacebookCallback(@Req() req: Request, @Res() res: Response, @Query('next') next?: string) {
    return await this.finishOAuth('facebook', req, res, next);
  }

  @Get('oauth/linkedin')
  @UseGuards(AuthGuard('linkedin'))
  oauthLinkedIn(@Query('next') next: string) {
    return { next };
  }

  @Get('oauth/linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async oauthLinkedInCallback(@Req() req: Request, @Res() res: Response, @Query('next') next?: string) {
    return await this.finishOAuth('linkedin', req, res, next);
  }

  private async finishOAuth(provider: OAuthProvider, req: Request, res: Response, next?: string) {
    const oauthUser = req.user as OAuthUser | undefined;
    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

    if (!oauthUser?.email) {
      const errorUrl = new URL('/auth/login', webOrigin);
      errorUrl.searchParams.set('error', 'oauth_missing_email');
      res.redirect(errorUrl.toString());
      return;
    }

    const session = await this.auth.loginWithOAuth({
      provider,
      email: oauthUser.email,
      providerId: oauthUser.providerId,
      displayName: oauthUser.displayName,
    });

    const callbackUrl = new URL('/auth/callback', webOrigin);
    callbackUrl.searchParams.set('token', session.accessToken);
    if (next) callbackUrl.searchParams.set('next', next);
    res.redirect(callbackUrl.toString());
  }
}

