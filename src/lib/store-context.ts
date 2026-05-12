import { createContext, useContext } from "react";

export type StoreCtxValue = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  theme_color: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

export const StoreCtx = createContext<StoreCtxValue | null>(null);

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("StoreCtx missing");
  return v;
}
