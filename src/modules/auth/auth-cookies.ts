import type { Response } from 'express';

const REFRESH_COOKIE = 'hd_refresh';
const ACCESS_COOKIE = 'hd_access';

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  opts: { secure: boolean; sameSite: 'lax' | 'strict' | 'none' },
) {
  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;
  const base = {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: '/',
  };
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: accessMaxAge });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...base, maxAge: refreshMaxAge });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

export function readRefreshCookie(req: { cookies?: Record<string, string> }): string | undefined {
  return req.cookies?.[REFRESH_COOKIE];
}

export function readAccessCookie(req: { cookies?: Record<string, string> }): string | undefined {
  return req.cookies?.[ACCESS_COOKIE];
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
