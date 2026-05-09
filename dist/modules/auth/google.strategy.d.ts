import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-google-oauth20';
import type { OAuthUser } from './oauth.types';
import type { Profile } from 'passport';
declare const GoogleStrategy_base: new (...args: [options: import("passport-google-oauth20").StrategyOptionsWithRequest] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    constructor(config: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: unknown, user?: OAuthUser) => void): void;
}
export {};
