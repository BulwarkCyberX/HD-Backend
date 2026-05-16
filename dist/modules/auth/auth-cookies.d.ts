import type { Response } from 'express';
declare const REFRESH_COOKIE = "hd_refresh";
declare const ACCESS_COOKIE = "hd_access";
export declare function setAuthCookies(res: Response, tokens: {
    accessToken: string;
    refreshToken: string;
}, opts: {
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
}): void;
export declare function clearAuthCookies(res: Response): void;
export declare function readRefreshCookie(req: {
    cookies?: Record<string, string>;
}): string | undefined;
export { ACCESS_COOKIE, REFRESH_COOKIE };
