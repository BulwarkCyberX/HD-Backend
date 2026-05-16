import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { AuthService } from './auth.service';
import { clearAuthCookies, readRefreshCookie, setAuthCookies } from './auth-cookies';
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
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.login(dto);
    this.applyAuthCookies(req, res, session);
    return session;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body?: { refreshToken?: string }) {
    const refreshToken = readRefreshCookie(req) ?? body?.refreshToken;
    if (!refreshToken) {
      return { message: 'Missing refresh token' };
    }
    const session = await this.auth.refreshSession(refreshToken);
    setAuthCookies(res, { accessToken: session.accessToken, refreshToken }, this.cookieOpts(req));
    return session;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body?: { refreshToken?: string }) {
    const refreshToken = readRefreshCookie(req) ?? body?.refreshToken;
    await this.auth.logout(refreshToken);
    clearAuthCookies(res);
    return { ok: true };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  sessions(@CurrentUser() user: RequestUser) {
    return this.auth.listSessions(user.userId);
  }

  @Post('sessions/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  revokeSession(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.auth.revokeSession(user.userId, id);
  }

  @Post('sessions/revoke-others')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  revokeOthers(@CurrentUser() user: RequestUser, @Req() req: Request, @Body() body?: { refreshToken?: string }) {
    const refreshToken = readRefreshCookie(req) ?? body?.refreshToken;
    if (!refreshToken) return { ok: false };
    return this.auth.revokeOtherSessions(user.userId, refreshToken);
  }

  private applyAuthCookies(
    req: Request,
    res: Response,
    session: { accessToken: string; refreshToken?: string },
  ) {
    if (session.refreshToken) {
      setAuthCookies(res, { accessToken: session.accessToken, refreshToken: session.refreshToken }, this.cookieOpts(req));
    }
  }

  private cookieOpts(req: Request) {
    const secure = process.env.NODE_ENV === 'production' || req.secure;
    return { secure, sameSite: 'lax' as const };
  }

  @Post('login/code/request')
  @HttpCode(HttpStatus.OK)
  requestLoginCode(@Body() dto: RequestLoginCodeDto) {
    return this.auth.requestLoginCode(dto);
  }

  @Post('login/code/verify')
  @HttpCode(HttpStatus.OK)
  async verifyLoginCode(
    @Body() dto: VerifyLoginCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.verifyLoginCode(dto);
    this.applyAuthCookies(req, res, session);
    return session;
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

