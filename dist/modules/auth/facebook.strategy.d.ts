import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-facebook';
import type { OAuthUser } from './oauth.types';
import type { Profile } from 'passport';
declare const FacebookStrategy_base: new (...args: [options: import("passport-facebook").StrategyOptionsWithRequest] | [options: import("passport-facebook").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class FacebookStrategy extends FacebookStrategy_base {
    constructor(config: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: unknown, user?: OAuthUser) => void): void;
}
export {};
