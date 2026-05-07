"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAccessTokenGetter, type BackendRole } from "@/lib/api";
import {
  acceptInviteSession,
  createOrganizationInvite,
  loginUser,
  refreshAuthSession,
  registerFoundationUser,
} from "@/lib/auth";
import type { AuthUser, Organization } from "@/types";

const STORAGE_USER_KEY = "derin-auth-user";
const STORAGE_TOKEN_KEY = "derin-auth-token";

type AuthContextValue = {
  user: AuthUser | null;
  organization: Organization | null;
  accessToken: string | null;
  /** True after reading storage + restoring /auth/me */
  hydrated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  registerFoundation: (payload: {
    organizationName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  acceptInvite: (payload: { token: string; password: string }) => Promise<void>;
  createInvite: (payload: { email: string; role?: BackendRole }) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const applySession = useCallback(
    (next: {
      accessToken: string;
      user: AuthUser;
      organization: Organization | null;
    }) => {
      setAccessToken(next.accessToken);
      setUser(next.user);
      setOrganization(next.organization ?? null);
      try {
        sessionStorage.setItem(STORAGE_TOKEN_KEY, next.accessToken);
        sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(next.user));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setOrganization(null);
    setAccessToken(null);
    try {
      sessionStorage.removeItem(STORAGE_USER_KEY);
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    try {
      const token = sessionStorage.getItem(STORAGE_TOKEN_KEY);
      if (!token) {
        setHydrated(true);
        return;
      }
      const rawUser = sessionStorage.getItem(STORAGE_USER_KEY);
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as unknown;
        if (parsed && typeof parsed === "object" && "email" in parsed) {
          setUser(parsed as AuthUser);
        }
      }
      setAccessToken(token);
      refreshAuthSession(token)
        .then((session) => {
          if (cancelled) return;
          applySession(session);
        })
        .catch(() => {
          if (cancelled) return;
          logout();
        })
        .finally(() => {
          if (!cancelled) {
            setHydrated(true);
          }
        });
      return () => {
        cancelled = true;
      };
    } catch {
      logout();
      setHydrated(true);
    }
  }, [applySession, logout]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const session = await loginUser(credentials);
      applySession(session);
    },
    [applySession]
  );

  const registerFoundation = useCallback(
    async (payload: {
      organizationName: string;
      email: string;
      password: string;
    }) => {
      const session = await registerFoundationUser(payload);
      applySession(session);
    },
    [applySession]
  );

  const acceptInvite = useCallback(
    async (payload: { token: string; password: string }) => {
      const session = await acceptInviteSession(payload);
      applySession(session);
    },
    [applySession]
  );

  const createInvite = useCallback(
    async (payload: { email: string; role?: BackendRole }) => {
      if (!accessToken) {
        throw new Error("No active session");
      }
      await createOrganizationInvite(payload, accessToken);
    },
    [accessToken]
  );

  const refreshSession = useCallback(async () => {
    if (!accessToken) return;
    const session = await refreshAuthSession(accessToken);
    applySession(session);
  }, [accessToken, applySession]);

  const value = useMemo(
    () => ({
      user,
      organization,
      accessToken,
      hydrated,
      login,
      registerFoundation,
      acceptInvite,
      createInvite,
      refreshSession,
      logout,
    }),
    [
      user,
      organization,
      accessToken,
      hydrated,
      login,
      registerFoundation,
      acceptInvite,
      createInvite,
      refreshSession,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
