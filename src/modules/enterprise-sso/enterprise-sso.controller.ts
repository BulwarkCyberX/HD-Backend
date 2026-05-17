import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { EnterpriseSsoService } from './enterprise-sso.service';

@ApiTags('enterprise-sso')
@Controller()
export class EnterpriseSsoController {
  constructor(private readonly sso: EnterpriseSsoService) {}

  @Get('public/enterprise/:slug/sso')
  publicStatus(@Param('slug') slug: string) {
    return this.sso.getPublicStatus(slug);
  }

  @Get('auth/enterprise/:slug')
  async startLogin(
    @Param('slug') slug: string,
    @Query('next') next: string | undefined,
    @Res() res: Response,
  ) {
    const url = await this.sso.startLogin(slug, next);
    res.redirect(url);
  }

  @Get('auth/enterprise/:slug/callback')
  async callback(
    @Param('slug') slug: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      const web = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
      res.redirect(`${web}/auth/login?error=sso_missing_params`);
      return;
    }
    const redirectUrl = await this.sso.handleCallback(slug, code, state);
    res.redirect(redirectUrl);
  }
}
