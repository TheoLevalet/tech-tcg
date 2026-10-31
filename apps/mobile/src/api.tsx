import { type ApiClient, createApiClient } from "@tech-tcg/shared";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useAuth } from "./auth/auth-context.ts";

export const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ baseUrl, children }: { baseUrl: string; children: ReactNode }) {
  const { getIdToken } = useAuth();
  const client = useMemo(() => createApiClient({ baseUrl, getIdToken }), [baseUrl, getIdToken]);
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const value = useContext(ApiContext);
  if (!value) throw new Error("useApi doit être utilisé sous ApiProvider");
  return value;
}
