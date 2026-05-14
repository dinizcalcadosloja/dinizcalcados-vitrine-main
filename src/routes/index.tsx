import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoreCtx } from "@/lib/store-context";
import { StoreHeader } from "@/components/store-header";
import { StorefrontPage } from "@/components/StorefrontPage";

const STORE_SLUG = "marianomenswear";

export const Route = createFileRoute("/")({
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
          Powered by Amanda
        </footer>
      </div>
    </StoreCtx.Provider>
  );
}
