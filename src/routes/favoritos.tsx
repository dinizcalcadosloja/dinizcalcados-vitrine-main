import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreCtx, useStore } from "@/lib/store-context";
import { StoreHeader } from "@/components/store-header";
import { useFavorites } from "@/lib/favorites";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const STORE_SLUG = "marianomenswear";

export const Route = createFileRoute("/favoritos")({
  component: FavoritosRoot,
});

function FavoritosRoot() {
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

  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        Carregando...
      </div>
    );
  if (error || !store)
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        Loja nao encontrada
      </div>
    );

  return (
    <StoreCtx.Provider value={store as any}>
      <div className="min-h-screen bg-background overflow-x-hidden w-full">
        <StoreHeader store={store} />
        <FavoritosContent />
        <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
          Powered by Amanda Miranda
        </footer>
      </div>
    </StoreCtx.Provider>
  );
}

function FavoritosContent() {
  const store = useStore();
  const { favoriteIds } = useFavorites(store.slug);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorite-products", store.id, [...favoriteIds].sort().join(",")],
    enabled: favoriteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, price, compare_at_price, featured, category_id, product_images(url, position)",
        )
        .eq("store_id", store.id)
        .eq("active", true)
        .in("id", favoriteIds);

      if (error) throw error;

      const byId = new Map((data ?? []).map((p: any) => [p.id, p]));
      return favoriteIds.map((id) => byId.get(id)).filter(Boolean) as any[];
    },
  });

  const hasFavorites = favoriteIds.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
      <div className="mb-8 sm:mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Sua selecao</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase">
            Favoritos
          </h1>
        </div>
        <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600">
          {favoriteIds.length} {favoriteIds.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {!hasFavorites ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Voce ainda nao favoritou produtos</h2>
          <p className="mt-2 text-slate-500">Toque no coracao dos itens para montar sua lista.</p>
          <Link to="/">
            <Button className="mt-6 rounded-full px-8">Explorar produtos</Button>
          </Link>
        </div>
      ) : isLoading ? (
        <div className="grid min-h-[280px] place-items-center text-muted-foreground">
          Carregando favoritos...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {favorites.map((p: any) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
