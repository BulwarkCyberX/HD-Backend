import { ConfigService } from '@nestjs/config';
import type { OAuthUser } from './oauth.types';
import type { Profile } from 'passport';
declare const MicrosoftStrategy_base: new (...args: any) => any;
export declare class MicrosoftStrategy extends MicrosoftStrategy_base {
    constructor(config: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: unknown, user?: OAuthUser) => void): void;
}
export {};
