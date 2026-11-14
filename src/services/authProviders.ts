import type { DiscoveryDocument } from 'expo-auth-session';
import type { AuthIdentity, AuthProviderId } from '../types';

export type ProviderDiscovery = Pick<DiscoveryDocument, 'authorizationEndpoint' | 'tokenEndpoint'> & {
  userInfoEndpoint?: string;
  revocationEndpoint?: string;
};

export type ProviderDef = {
  id: AuthProviderId;
  label: string;
  brandColor: string;
  clientIdEnvKey: string;
  clientSecretEnvKey?: string;
  scopes: string[];
  discovery: ProviderDiscovery;
  profileSource: 'userinfo' | 'idToken';
};

export type AuthClient = { clientId: string; clientSecret?: string };

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'google',
    label: 'Google',
    brandColor: '#FFFFFF',
    clientIdEnvKey: 'EXPO_PUBLIC_GOOGLE_CLIENT_ID',
    scopes: ['openid', 'profile', 'email'],
    discovery: {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    },
    profileSource: 'userinfo',
  },
  {
    id: 'apple',
    label: 'Apple',
    brandColor: '#000000',
    clientIdEnvKey: 'EXPO_PUBLIC_APPLE_WEB_CLIENT_ID',
    clientSecretEnvKey: 'EXPO_PUBLIC_APPLE_CLIENT_SECRET',
    scopes: ['name', 'email'],
    discovery: {
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      tokenEndpoint: 'https://appleid.apple.com/auth/token',
      revocationEndpoint: 'https://appleid.apple.com/auth/revoke',
    },
    profileSource: 'idToken',
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    brandColor: '#00A4EF',
    clientIdEnvKey: 'EXPO_PUBLIC_MICROSOFT_CLIENT_ID',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
    discovery: {
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoEndpoint: 'https://graph.microsoft.com/oidc/userinfo',
    },
    profileSource: 'userinfo',
  },
  {
    id: 'discord',
    label: 'Discord',
    brandColor: '#5865F2',
    clientIdEnvKey: 'EXPO_PUBLIC_DISCORD_CLIENT_ID',
    clientSecretEnvKey: 'EXPO_PUBLIC_DISCORD_CLIENT_SECRET',
    scopes: ['openid', 'identify', 'email'],
    discovery: {
      authorizationEndpoint: 'https://discord.com/oauth2/authorize',
      tokenEndpoint: 'https://discord.com/api/oauth2/token',
      userInfoEndpoint: 'https://discord.com/api/users/@me',
      revocationEndpoint: 'https://discord.com/api/oauth2/token/revoke',
    },
    profileSource: 'userinfo',
  },
  {
    id: 'twitch',
    label: 'Twitch',
    brandColor: '#9146FF',
    clientIdEnvKey: 'EXPO_PUBLIC_TWITCH_CLIENT_ID',
    scopes: ['openid', 'user:read:email'],
    discovery: {
      authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
      tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
      userInfoEndpoint: 'https://id.twitch.tv/oauth2/userinfo',
      revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
    },
    profileSource: 'userinfo',
  },
];

export function getProvider(id: AuthProviderId): ProviderDef {
  const def = PROVIDERS.find((p) => p.id === id);
  if (!def) throw new Error(`unknown auth provider: ${id}`);
  return def;
}

export function resolveAuthClients(env: Record<string, string | undefined>): Record<AuthProviderId, AuthClient> {
  const out = {} as Record<AuthProviderId, AuthClient>;
  for (const p of PROVIDERS) {
    out[p.id] = {
      clientId: env[p.clientIdEnvKey] ?? '',
      clientSecret: p.clientSecretEnvKey ? env[p.clientSecretEnvKey] : undefined,
    };
  }
  return out;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

export function normalizeProfile(provider: AuthProviderId, raw: Record<string, unknown>, fallbackName?: string | null): AuthIdentity | null {
  switch (provider) {
    case 'google': {
      const id = str(raw.sub);
      if (!id) return null;
      return { provider, providerUserId: id, displayName: str(raw.name) ?? str(raw.email) ?? id, email: str(raw.email), avatarUrl: str(raw.picture) };
    }
    case 'microsoft': {
      const id = str(raw.sub);
      if (!id) return null;
      return {
        provider,
        providerUserId: id,
        displayName: str(raw.name) ?? str(raw.preferred_username) ?? id,
        email: str(raw.email) ?? str(raw.preferred_username),
        avatarUrl: str(raw.picture),
      };
    }
    case 'discord': {
      const id = str(raw.id);
      if (!id) return null;
      const username = str(raw.username) ?? id;
      const avatar = str(raw.avatar);
      return {
        provider,
        providerUserId: id,
        displayName: str(raw.global_name) ?? username,
        email: str(raw.email),
        avatarUrl: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
      };
    }
    case 'twitch': {
      const id = str(raw.sub);
      if (!id) return null;
      return {
        provider,
        providerUserId: id,
        displayName: str(raw.preferred_username) ?? str(raw.login) ?? str(raw.display_name) ?? id,
        email: str(raw.email),
        avatarUrl: str(raw.picture),
      };
    }
    case 'apple': {
      const id = str(raw.sub) ?? str(raw.user);
      if (!id) return null;
      const email = str(raw.email);
      return { provider, providerUserId: id, displayName: fallbackName ?? email ?? 'Compte Apple', email, avatarUrl: null };
    }
  }
}
