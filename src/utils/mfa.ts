export type MfaConfig = {
  accountId: string;
  totpEnabled: boolean;
  deviceKeyEnabled: boolean;
  trustedUntil: string | null;
};

export const TRUST_DAYS = 30;
export const MFA_ISSUER = 'Art2Dex';

export function mfaEnabled(cfg: MfaConfig | null | undefined): boolean {
  return !!cfg && (cfg.totpEnabled || cfg.deviceKeyEnabled);
}

export function trustUntilFrom(now: Date, days: number = TRUST_DAYS): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function isDeviceTrusted(cfg: MfaConfig | null | undefined, now: Date = new Date()): boolean {
  if (!cfg || !cfg.trustedUntil) return false;
  const t = new Date(cfg.trustedUntil).getTime();
  return !Number.isNaN(t) && t > now.getTime();
}

export function mfaGateRequired(cfg: MfaConfig | null | undefined, now: Date = new Date()): boolean {
  return mfaEnabled(cfg) && !isDeviceTrusted(cfg, now);
}
