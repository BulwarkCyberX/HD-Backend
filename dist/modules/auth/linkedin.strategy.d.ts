import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-linkedin-oauth2';
import type { OAuthUser } from './oauth.types';
import type { Profile } from 'passport';
import type { StrategyOption } from 'passport-linkedin-oauth2';
declare const LinkedInStrategy_base: new (...args: [options: StrategyOption] | [options: import("passport-linkedin-oauth2").StrategyOptionWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LinkedInStrategy extends LinkedInStrategy_base {
    constructor(config: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: unknown, user?: OAuthUser) => void): void;
}
export {};
