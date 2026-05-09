export type OAuthProvider = 'google' | 'microsoft' | 'facebook' | 'linkedin';

export type OAuthUser = {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  displayName?: string;
};

