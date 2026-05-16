"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const auth_service_1 = require("./auth.service");
const auth_cookies_1 = require("./auth-cookies");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const request_login_code_dto_1 = require("./dto/request-login-code.dto");
const verify_login_code_dto_1 = require("./dto/verify-login-code.dto");
const verify_email_otp_dto_1 = require("./dto/verify-email-otp.dto");
const verify_email_token_dto_1 = require("./dto/verify-email-token.dto");
const resend_verification_dto_1 = require("./dto/resend-verification.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    register(dto) {
        return this.auth.register(dto);
    }
    verifyEmailOtp(dto) {
        return this.auth.verifyEmail({ email: dto.email, code: dto.code });
    }
    verifyEmailToken(dto) {
        return this.auth.verifyEmail({ token: dto.token });
    }
    resendVerification(dto) {
        return this.auth.resendVerification(dto.email);
    }
    forgotPassword(dto) {
        return this.auth.forgotPassword(dto.email);
    }
    resetPassword(dto) {
        return this.auth.resetPassword({ token: dto.token, password: dto.password });
    }
    checkEmail(email) {
        return this.auth.checkEmailAvailability(email);
    }
    async login(dto, req, res) {
        const session = await this.auth.login(dto);
        this.applyAuthCookies(req, res, session);
        return session;
    }
    async refresh(req, res, body) {
        const refreshToken = (0, auth_cookies_1.readRefreshCookie)(req) ?? body?.refreshToken;
        if (!refreshToken) {
            return { message: 'Missing refresh token' };
        }
        const session = await this.auth.refreshSession(refreshToken);
        (0, auth_cookies_1.setAuthCookies)(res, { accessToken: session.accessToken, refreshToken }, this.cookieOpts(req));
        return session;
    }
    async logout(req, res, body) {
        const refreshToken = (0, auth_cookies_1.readRefreshCookie)(req) ?? body?.refreshToken;
        await this.auth.logout(refreshToken);
        (0, auth_cookies_1.clearAuthCookies)(res);
        return { ok: true };
    }
    sessions(user) {
        return this.auth.listSessions(user.userId);
    }
    revokeSession(user, id) {
        return this.auth.revokeSession(user.userId, id);
    }
    revokeOthers(user, req, body) {
        const refreshToken = (0, auth_cookies_1.readRefreshCookie)(req) ?? body?.refreshToken;
        if (!refreshToken)
            return { ok: false };
        return this.auth.revokeOtherSessions(user.userId, refreshToken);
    }
    applyAuthCookies(req, res, session) {
        if (session.refreshToken) {
            (0, auth_cookies_1.setAuthCookies)(res, { accessToken: session.accessToken, refreshToken: session.refreshToken }, this.cookieOpts(req));
        }
    }
    cookieOpts(req) {
        const secure = process.env.NODE_ENV === 'production' || req.secure;
        return { secure, sameSite: 'lax' };
    }
    requestLoginCode(dto) {
        return this.auth.requestLoginCode(dto);
    }
    async verifyLoginCode(dto, req, res) {
        const session = await this.auth.verifyLoginCode(dto);
        this.applyAuthCookies(req, res, session);
        return session;
    }
    oauthGoogle(next) {
        return { next };
    }
    async oauthGoogleCallback(req, res, next) {
        return await this.finishOAuth('google', req, res, next);
    }
    oauthMicrosoft(next) {
        return { next };
    }
    async oauthMicrosoftCallback(req, res, next) {
        return await this.finishOAuth('microsoft', req, res, next);
    }
    oauthFacebook(next) {
        return { next };
    }
    async oauthFacebookCallback(req, res, next) {
        return await this.finishOAuth('facebook', req, res, next);
    }
    oauthLinkedIn(next) {
        return { next };
    }
    async oauthLinkedInCallback(req, res, next) {
        return await this.finishOAuth('linkedin', req, res, next);
    }
    async finishOAuth(provider, req, res, next) {
        const oauthUser = req.user;
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
        if (next)
            callbackUrl.searchParams.set('next', next);
        res.redirect(callbackUrl.toString());
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('verify-email/otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_email_otp_dto_1.VerifyEmailOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmailOtp", null);
__decorate([
    (0, common_1.Post)('verify-email/token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_email_token_dto_1.VerifyEmailTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmailToken", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resend_verification_dto_1.ResendVerificationDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('check-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "checkEmail", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sessions", null);
__decorate([
    (0, common_1.Post)('sessions/:id/revoke'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Post)('sessions/revoke-others'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revokeOthers", null);
__decorate([
    (0, common_1.Post)('login/code/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_login_code_dto_1.RequestLoginCodeDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestLoginCode", null);
__decorate([
    (0, common_1.Post)('login/code/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_login_code_dto_1.VerifyLoginCodeDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyLoginCode", null);
__decorate([
    (0, common_1.Get)('oauth/google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "oauthGoogle", null);
__decorate([
    (0, common_1.Get)('oauth/google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthGoogleCallback", null);
__decorate([
    (0, common_1.Get)('oauth/microsoft'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('microsoft')),
    __param(0, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "oauthMicrosoft", null);
__decorate([
    (0, common_1.Get)('oauth/microsoft/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('microsoft')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthMicrosoftCallback", null);
__decorate([
    (0, common_1.Get)('oauth/facebook'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('facebook')),
    __param(0, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "oauthFacebook", null);
__decorate([
    (0, common_1.Get)('oauth/facebook/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('facebook')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthFacebookCallback", null);
__decorate([
    (0, common_1.Get)('oauth/linkedin'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('linkedin')),
    __param(0, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "oauthLinkedIn", null);
__decorate([
    (0, common_1.Get)('oauth/linkedin/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('linkedin')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('next')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthLinkedInCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map