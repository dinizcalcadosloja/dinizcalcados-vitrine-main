import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoreHeader } from "@/components/store-header";
import { StoreCtx, useStore } from "@/lib/store-context";
import { WhatsAppButton } from "@/components/WhatsAppButton";

function FaviconUpdater({ logoUrl, storeName }: { logoUrl?: string | null; storeName?: string }) {
  useEffect(() => {
    if (!logoUrl) return;
    // Atualiza favicon
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logoUrl;
    link.type = "image/png";
    // Atualiza apple-touch-icon
    let apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!apple) {
      apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      document.head.appendChild(apple);
    }
    apple.href = logoUrl;
    // Atualiza título da aba
    if (storeName) document.title = `${storeName} - Loja Online`;
  }, [logoUrl, storeName]);
  return null;
}

export { useStore };

export const Route = createFileRoute("/loja/$slug")({
  component: StoreLayout,
});

function StoreLayout() {
  const { slug } = Route.useParams();
  const {
    data: store,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

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
      <FaviconUpdater logoUrl={(store as any).logo_url} storeName={store.name} />
      <div className="min-h-screen bg-background overflow-x-hidden w-full">
        <StoreHeader store={store} />
        <Outlet />
        <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
          Powered by Amanda Miranda
        </footer>
        <WhatsAppButton />
      </div>
    </StoreCtx.Provider>
  );
}
