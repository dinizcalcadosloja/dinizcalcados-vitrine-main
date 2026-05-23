import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoreCtx } from "@/lib/store-context";
import { StoreHeader } from "@/components/store-header";
import { StorefrontPage } from "@/components/StorefrontPage";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { trackVisit } from "@/lib/analytics";

const STORE_SLUG = import.meta.env.VITE_STORE_SLUG as string;

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    dept: (search.dept as string | undefined) ?? undefined,
    cat: (search.cat as string | undefined) ?? undefined,
    brand: (search.brand as string | undefined) ?? undefined,
  }),
  component: StoreRoot,
});

function StoreRoot() {
  const recorded = useRef(false);

  const {
    data: store,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["store", STORE_SLUG],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", STORE_SLUG)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  useEffect(() => {
    if (store && !recorded.current) {
      recorded.current = true;
      supabase.rpc("increment_store_visit", { p_store_id: store.id }).then(() => {});
      trackVisit(store.id);
    }
    if (store?.logo_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = store.logo_url;
      link.type = "image/png";
      let apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
      if (!apple) {
        apple = document.createElement("link");
        apple.rel = "apple-touch-icon";
        document.head.appendChild(apple);
      }
      apple.href = store.logo_url;
      if (store.name) document.title = `${store.name} - Loja Online`;
    }
  }, [store]);

  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>
    );
  if (error || !store)
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        Loja não encontrada
      </div>
    );

  return (
    <StoreCtx.Provider value={store as any}>
      <div className="min-h-screen bg-background overflow-x-hidden w-full">
        <StoreHeader store={store} />
        <StorefrontPage />
        <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
          Powered by Amanda Miranda
        </footer>
        <WhatsAppButton />
      </div>
    </StoreCtx.Provider>
  );
}
