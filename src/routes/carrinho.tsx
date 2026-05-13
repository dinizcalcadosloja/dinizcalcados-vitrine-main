import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreCtx, useStore } from "@/lib/store-context";
import { StoreHeader } from "@/components/store-header";
import { useCart, buildWhatsappMessage, whatsappLink } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { Minus, Plus, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const STORE_SLUG = "marianomenswear";

export const Route = createFileRoute("/carrinho")({
  component: CarrinhoRoot,
});

function CarrinhoRoot() {
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
        <CartContent />
        <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
          Powered by Amanda Miranda
        </footer>
      </div>
    </StoreCtx.Provider>
  );
}

function CartContent() {
  const store = useStore();
  const { items, updateQty, remove, total, clear } = useCart(store.slug);

  function checkout() {
    if (!store.whatsapp || store.whatsapp.trim() === "") {
      toast.error("Loja sem WhatsApp configurado");
      return;
    }
    const msg = buildWhatsappMessage(store.name, items, total);
    const link = whatsappLink(store.whatsapp, msg);
    const win = window.open(link, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = link;
    } else {
      toast.success("Abrindo WhatsApp...");
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Carrinho vazio</h1>
        <p className="mt-2 text-muted-foreground">Adicione produtos para continuar.</p>
        <Link to="/">
          <Button className="mt-6">Ver produtos</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold">Carrinho</h1>
      <div className="mt-6 divide-y rounded-2xl border border-border bg-card">
        {items.map((i) => (
          <div key={i.variantId} className="flex gap-3 p-4">
            {i.image && (
              <img src={i.image} alt={i.name} className="h-20 w-20 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{i.name}</h3>
              <p className="text-sm text-muted-foreground">{i.variantLabel}</p>
              <p className="mt-1 font-semibold">{formatBRL(i.price * i.qty)}</p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => remove(i.variantId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 rounded-full border border-border">
                <button
                  onClick={() => updateQty(i.variantId, i.qty - 1)}
                  className="grid h-7 w-7 place-items-center"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm">{i.qty}</span>
                <button
                  onClick={() => updateQty(i.variantId, i.qty + 1)}
                  className="grid h-7 w-7 place-items-center"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <span className="text-muted-foreground">Total</span>
        <span className="text-2xl font-bold">{formatBRL(total)}</span>
      </div>

      <Button
        onClick={checkout}
        size="lg"
        className="mt-4 w-full bg-[#25D366] text-white hover:bg-[#1ebd5b]"
      >
        <MessageCircle className="mr-2 h-5 w-5" /> Finalizar pelo WhatsApp
      </Button>
      <div className="mt-2 flex gap-2">
        <Link to="/" className="flex-1">
          <Button variant="outline" className="w-full">
            <ShoppingBag className="mr-2 h-4 w-4" /> Continuar comprando
          </Button>
        </Link>
        <Button
          onClick={clear}
          variant="outline"
          className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Esvaziar carrinho
        </Button>
      </div>
    </main>
  );
}
