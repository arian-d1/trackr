import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  ready: boolean;
  token: string | null;
  user: { username: string; displayName?: string } | null;
  setAuth: (t: string, u: { username: string; displayName?: string }) => void;
  clearAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; displayName?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync("trackr_token");
        const u = await SecureStore.getItemAsync("trackr_user");
        if (t) {
          setToken(t);
          (globalThis as any).__TRACKR_TOKEN__ = t;
        }
        if (u) setUser(JSON.parse(u));
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setAuth = (t: string, u: { username: string; displayName?: string }) => {
    setToken(t);
    setUser(u);
    (globalThis as any).__TRACKR_TOKEN__ = t;
    SecureStore.setItemAsync("trackr_token", t).catch(() => {});
    SecureStore.setItemAsync("trackr_user", JSON.stringify(u)).catch(() => {});
  };

  const clearAuth = async () => {
    setToken(null);
    setUser(null);
    (globalThis as any).__TRACKR_TOKEN__ = null;
    await SecureStore.deleteItemAsync("trackr_token");
    await SecureStore.deleteItemAsync("trackr_user");
  };

  return (
    <AuthContext.Provider value={{ ready, token, user, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


