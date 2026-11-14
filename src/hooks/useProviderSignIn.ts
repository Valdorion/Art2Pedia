import * as AppleAuthentication from 'expo-apple-authentication';
import { exchangeCodeAsync, fetchUserInfoAsync, makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { getProvider, normalizeProfile, resolveAuthClients } from '../services/authProviders';
import type { AuthIdentity, AuthProviderId, AuthTokens } from '../types';
import { decodeJwtPayload } from '../utils/jwt';

export type SignInResult = { identity: AuthIdentity; tokens: AuthTokens };

export type ProviderSignIn = {
  signIn: () => Promise<SignInResult | null>;
  busy: boolean;
  configured: boolean;
  available: boolean;
  error: string | null;
};

export function useProviderSignIn(providerId: AuthProviderId): ProviderSignIn {
  const def = getProvider(providerId);
  const clients = useMemo(() => resolveAuthClients(process.env), []);
  const clientId = clients[providerId].clientId;
  const clientSecret = clients[providerId].clientSecret;
  const redirectUri = useMemo(() => makeRedirectUri(), []);
  const nativeApple = providerId === 'apple' && Platform.OS === 'ios';
  const configured = nativeApple || clientId.length > 0;
  const [appleAvailable, setAppleAvailable] = useState(true);

  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: clientId || 'unconfigured',
      redirectUri,
      scopes: def.scopes,
      responseType: ResponseType.Code,
      usePKCE: true,
    },
    def.discovery,
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nativeApple) return;
    let alive = true;
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (alive) setAppleAvailable(ok);
      })
      .catch(() => {
        if (alive) setAppleAvailable(false);
      });
    return () => {
      alive = false;
    };
  }, [nativeApple]);

  const signIn = useCallback(async (): Promise<SignInResult | null> => {
    setError(null);
    if (nativeApple && !appleAvailable) {
      setError('Sign in with Apple indisponible (build de développement requis hors Expo Go).');
      return null;
    }
    if (!configured) {
      setError(`Client ID non configuré (${def.clientIdEnvKey} dans .env).`);
      return null;
    }
    setBusy(true);
    try {
      if (nativeApple) {
        const cred = await AppleAuthentication.signInAsync({
          requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        });
        const payload = cred.identityToken ? decodeJwtPayload(cred.identityToken) ?? {} : {};
        const fullName = cred.fullName ? AppleAuthentication.formatFullName(cred.fullName) : null;
        const identity = normalizeProfile('apple', { ...payload, email: cred.email ?? payload.email }, fullName);
        if (!identity) throw new Error('Profil Apple illisible.');
        return { identity, tokens: { accessToken: cred.authorizationCode ?? '', idToken: cred.identityToken ?? undefined } };
      }
      if (!request) throw new Error('Requête OAuth pas encore prête, réessaie.');
      const res = await promptAsync();
      if (res.type === 'cancel' || res.type === 'dismiss' || res.type === 'opened' || res.type === 'locked') return null;
      if (res.type === 'error') throw new Error(res.error?.description ?? res.error?.message ?? "Échec de l'authentification.");
      if (res.type !== 'success') return null;
      const code = res.params.code;
      if (!code) throw new Error('Code d’autorisation manquant.');
      const tokenResponse = await exchangeCodeAsync(
        {
          clientId,
          clientSecret,
          code,
          redirectUri,
          extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
        },
        def.discovery,
      );
      let raw: Record<string, unknown> = {};
      if (def.profileSource === 'idToken') {
        raw = decodeJwtPayload(tokenResponse.idToken ?? '') ?? {};
      } else if (def.discovery.userInfoEndpoint) {
        raw = await fetchUserInfoAsync({ accessToken: tokenResponse.accessToken }, def.discovery);
      }
      const identity = normalizeProfile(providerId, raw);
      if (!identity) throw new Error('Profil renvoyé illisible.');
      const tokens: AuthTokens = {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        idToken: tokenResponse.idToken,
        expiresAt: tokenResponse.expiresIn ? new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString() : null,
      };
      return { identity, tokens };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
      return null;
    } finally {
      setBusy(false);
    }
  }, [appleAvailable, clientId, clientSecret, configured, def, nativeApple, promptAsync, providerId, redirectUri, request]);

  return { signIn, busy, configured, available: !nativeApple || appleAvailable, error };
}
