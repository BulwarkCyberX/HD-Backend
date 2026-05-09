"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthStrategyProviders = void 0;
const config_1 = require("@nestjs/config");
const google_strategy_1 = require("./google.strategy");
const microsoft_strategy_1 = require("./microsoft.strategy");
const facebook_strategy_1 = require("./facebook.strategy");
const linkedin_strategy_1 = require("./linkedin.strategy");
exports.oauthStrategyProviders = [
    {
        provide: google_strategy_1.GoogleStrategy,
        useFactory: (config) => {
            const clientID = config.get('OAUTH_GOOGLE_CLIENT_ID')?.trim();
            const clientSecret = config.get('OAUTH_GOOGLE_CLIENT_SECRET')?.trim();
            if (!clientID || !clientSecret)
                return null;
            return new google_strategy_1.GoogleStrategy(config);
        },
        inject: [config_1.ConfigService],
    },
    {
        provide: microsoft_strategy_1.MicrosoftStrategy,
        useFactory: (config) => {
            const clientID = config.get('OAUTH_MICROSOFT_CLIENT_ID')?.trim();
            const clientSecret = config.get('OAUTH_MICROSOFT_CLIENT_SECRET')?.trim();
            if (!clientID || !clientSecret)
                return null;
            return new microsoft_strategy_1.MicrosoftStrategy(config);
        },
        inject: [config_1.ConfigService],
    },
    {
        provide: facebook_strategy_1.FacebookStrategy,
        useFactory: (config) => {
            const clientID = config.get('OAUTH_FACEBOOK_APP_ID')?.trim();
            const clientSecret = config.get('OAUTH_FACEBOOK_APP_SECRET')?.trim();
            if (!clientID || !clientSecret)
                return null;
            return new facebook_strategy_1.FacebookStrategy(config);
        },
        inject: [config_1.ConfigService],
    },
    {
        provide: linkedin_strategy_1.LinkedInStrategy,
        useFactory: (config) => {
            const clientID = config.get('OAUTH_LINKEDIN_CLIENT_ID')?.trim();
            const clientSecret = config.get('OAUTH_LINKEDIN_CLIENT_SECRET')?.trim();
            if (!clientID || !clientSecret)
                return null;
            return new linkedin_strategy_1.LinkedInStrategy(config);
        },
        inject: [config_1.ConfigService],
    },
];
//# sourceMappingURL=oauth-strategies.providers.js.map