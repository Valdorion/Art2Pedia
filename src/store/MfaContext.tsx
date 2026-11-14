import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  confirmDeviceKey,
  disableMfa,
  enableDeviceKey,
  enableTotp,
  generateTotpSecret,
  getConfig,
  loadConfigs,
  trustDevice,
  verifyTotpCode,
} from '../services/mfaStore';
import type { MfaConfig } from '../utils/mfa';

type MfaContextValue = {
  hydrated: boolean;
  configs: Record<string, MfaConfig>;
  configFor: (accountId: string) => MfaConfig | null;
  newTotpSecret: () => Promise<string>;
  enableTotp: (accountId: string, secretB32: string) => Promise<void>;
  verifyTotp: (accountId: string, code: string) => Promise<boolean>;
  enableDeviceKey: (accountId: string) => Promise<void>;
  confirmDeviceKey: (accountId: string) => Promise<boolean>;
  disableMfa: (accountId: string) => Promise<void>;
  trustDevice: (accountId: string) => Promise<void>;
};

const MfaContext = createContext<MfaContextValue | null>(null);

export function MfaProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [configs, setConfigs] = useState<Record<string, MfaConfig>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = await loadConfigs();
      if (!alive) return;
      setConfigs(c);
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async (accountId: string) => {
    const cfg = await getConfig(accountId);
    setConfigs((prev) => {
      const next = { ...prev };
      if (cfg) next[accountId] = cfg;
      else delete next[accountId];
      return next;
    });
  }, []);

  const configFor = useCallback((accountId: string) => configs[accountId] ?? null, [configs]);

  const enableTotpAction = useCallback(
    async (accountId: string, secretB32: string) => {
      await enableTotp(accountId, secretB32);
      await refresh(accountId);
    },
    [refresh],
  );

  const enableDeviceKeyAction = useCallback(
    async (accountId: string) => {
      await enableDeviceKey(accountId);
      await refresh(accountId);
    },
    [refresh],
  );

  const disableMfaAction = useCallback(
    async (accountId: string) => {
      await disableMfa(accountId);
      await refresh(accountId);
    },
    [refresh],
  );

  const trustDeviceAction = useCallback(
    async (accountId: string) => {
      await trustDevice(accountId);
      await refresh(accountId);
    },
    [refresh],
  );

  return (
    <MfaContext.Provider
      value={{
        hydrated,
        configs,
        configFor,
        newTotpSecret: generateTotpSecret,
        enableTotp: enableTotpAction,
        verifyTotp: (accountId, code) => verifyTotpCode(accountId, code),
        enableDeviceKey: enableDeviceKeyAction,
        confirmDeviceKey: (accountId) => confirmDeviceKey(accountId),
        disableMfa: disableMfaAction,
        trustDevice: trustDeviceAction,
      }}
    >
      {children}
    </MfaContext.Provider>
  );
}

export function useMfa(): MfaContextValue {
  const ctx = useContext(MfaContext);
  if (!ctx) throw new Error('useMfa must be used inside MfaProvider');
  return ctx;
}
