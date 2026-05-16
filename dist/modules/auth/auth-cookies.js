"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_COOKIE = exports.ACCESS_COOKIE = void 0;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
exports.readRefreshCookie = readRefreshCookie;
const REFRESH_COOKIE = 'hd_refresh';
exports.REFRESH_COOKIE = REFRESH_COOKIE;
const ACCESS_COOKIE = 'hd_access';
exports.ACCESS_COOKIE = ACCESS_COOKIE;
function setAuthCookies(res, tokens, opts) {
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
function clearAuthCookies(res) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
}
function readRefreshCookie(req) {
    return req.cookies?.[REFRESH_COOKIE];
}
//# sourceMappingURL=auth-cookies.js.map