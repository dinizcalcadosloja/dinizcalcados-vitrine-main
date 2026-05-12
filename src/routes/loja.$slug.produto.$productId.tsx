import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { useCart, buildWhatsappMessage, whatsappLink } from "@/lib/cart";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, MessageCircle, X } from "lucide-react";
import { colorToCss } from "@/lib/color-map";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/loja/$slug/produto/$productId")({
  component: ProductPage,
});

function ProductPage() {
  const { productId, slug } = Route.useParams();
  const store = useStore();
  const cart = useCart(slug);
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["public-product", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), product_variants(*), product_color_images(*)")
        .eq("id", productId)
        .eq("active", true)
        .maybeSingle();
      return data;
    },
  });

  const images = useMemo(
    () => (product?.product_images ?? []).sort((a: any, b: any) => a.position - b.position),
    [product],
  );
  const variants: any[] = product?.product_variants ?? [];
  const hasVariations = product?.has_variations;
  const variantsAvailable = hasVariations && variants.length > 0;
  const colorImageMap = useMemo(() => {
    const m = new Map<string, string[]>();
    const sorted = [...((product as any)?.product_color_images ?? [])].sort(
      (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0),
    );
    for (const c of sorted) {
      const cur = m.get(c.color) ?? [];
      cur.push(c.image_url);
      m.set(c.color, cur);
    }
    return m;
  }, [product]);
  const colorImages = selectedColor ? (colorImageMap.get(selectedColor) ?? []) : [];

  // Gallery: when a color is selected, show only the color's images; otherwise all product images
  const gallery = useMemo(() => {
    if (selectedColor && colorImages.length > 0) {
      return colorImages.map((url, i) => ({ id: `color-${selectedColor}-${i}`, url }));
    }
    return images.map((i: any) => ({ id: i.id, url: i.url }));
  }, [images, colorImages, selectedColor]);

  // Reset image index when color changes
  useEffect(() => {
    setImgIdx(0);
  }, [selectedColor]);

  // Distinct colors with stock info
  const colors = useMemo(() => {
    const map = new Map<string, { color: string }>();
    for (const v of variants) {
      const c = (v.color ?? "").trim();
      if (!c) continue;
      const cur = map.get(c) ?? { color: c };
      map.set(c, cur);
    }
    return Array.from(map.values());
  }, [variants]);

  const hasColors = colors.length > 0;

  // Auto-select first color on load
  useEffect(() => {
    if (hasColors && !selectedColor && colors.length > 0) {
      setSelectedColor(colors[0].color);
    }
  }, [colors, hasColors, selectedColor]);

  // Sizes (ou numerações) disponíveis para a cor selecionada
  const sizesForColor = useMemo(() => {
    const list = hasColors
      ? variants.filter((v) => (v.color ?? "").trim() === selectedColor)
      : variants;
    return list
      .map((v) => ({
        key: v.id,
        label: v.size || v.numbering || "Único",
      }))
      .filter((s) => s.label);
  }, [variants, selectedColor, hasColors]);

  const selectedVariant = variants.find((v) => {
    const colorOk = hasColors ? (v.color ?? "").trim() === selectedColor : true;
    const sizeOk = (v.size || v.numbering || "Único") === selectedSize;
    return colorOk && sizeOk;
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Carregando…</div>;
  if (!product)
    return <div className="p-12 text-center text-muted-foreground">Produto não encontrado</div>;

  function variantLabel(v: any) {
    return [v.size && `Tam ${v.size}`, v.color, v.numbering && `Nº ${v.numbering}`]
      .filter(Boolean)
      .join(" • ");
  }

  function addToCart(then?: "cart") {
    if (!product) return;
    if (hasVariations) {
      if (hasColors && !selectedColor) {
        toast.error("Selecione uma cor");
        return;
      }
      if (sizesForColor.length > 0 && !selectedSize) {
        toast.error("Selecione um tamanho");
        return;
      }
      if (!selectedVariant) {
        toast.error("Combinação indisponível");
        return;
      }
    }
    const v = selectedVariant ?? {
      id: `single-${product.id}`,
      size: null,
      color: null,
      numbering: null,
    };
    cart.add({
      productId: product.id,
      variantId: v.id,
      name: product.name,
      variantLabel: hasVariations ? variantLabel(v) : "Único",
      price: Number(product.price),
      image: images[0]?.url,
      qty: 1,
    });
    toast.success("Adicionado ao carrinho");
    if (then === "cart") navigate({ to: "/loja/$slug/carrinho", params: { slug } });
  }

  function buyNow() {
    if (!store.whatsapp || store.whatsapp.trim() === "") {
      toast.error("Loja sem WhatsApp configurado");
      return;
    }
    if (!product) return;
    if (hasVariations) {
      if (hasColors && !selectedColor) {
        toast.error("Selecione uma cor");
        return;
      }
      if (sizesForColor.length > 0 && !selectedSize) {
        toast.error("Selecione um tamanho");
        return;
      }
      if (!selectedVariant) {
        toast.error("Combinação indisponível");
        return;
      }
    }
    // Abre o dialog de confirmação
    setShowBuyDialog(true);
  }

  function confirmBuyOnly() {
    setShowBuyDialog(false);
    if (!product || !store.whatsapp) return;

    const v = selectedVariant ?? {
      id: `single-${product.id}`,
      size: null,
      color: null,
      numbering: null,
    };
    const item = {
      productId: product.id,
      variantId: v.id,
      name: product.name,
      variantLabel: hasVariations ? variantLabel(v) : "Único",
      price: Number(product.price),
      image: images[0]?.url,
      qty: 1,
    };
    const msg = buildWhatsappMessage(store.name, [item], item.price);
    const link = whatsappLink(store.whatsapp, msg);

    // Tenta abrir em nova aba, se falhar usa location.href
    const win = window.open(link, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      // Popup bloqueado, abre na mesma aba
      window.location.href = link;
    } else {
      toast.success("Abrindo WhatsApp...");
    }
  }

  function confirmAddAndContinue() {
    setShowBuyDialog(false);
    addToCart();
    toast.success("Produto adicionado! Continue comprando");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Link
        to="/loja/$slug"
        params={{ slug }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white flex items-center justify-center">
            {gallery[imgIdx] ? (
              <img
                src={gallery[imgIdx].url}
                alt={product.name}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((img: any, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setImgIdx(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white flex items-center justify-center ${imgIdx === i ? "border-foreground" : "border-border"}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
          <div className="mt-3 flex flex-col gap-1">
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
                  {formatBRL(Number(product.compare_at_price))}
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                  {Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)}% OFF
                </span>
              </div>
            )}
            <span className="text-3xl font-bold text-foreground">
              {formatBRL(Number(product.price))}
            </span>
          </div>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-muted-foreground">{product.description}</p>
          )}

          {hasColors && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Cores disponíveis:</p>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => {
                  const css = colorToCss(c.color);
                  const photo = colorImageMap.get(c.color)?.[0];
                  const active = selectedColor === c.color;
                  return (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.color);
                        setSelectedSize(null);
                      }}
                      title={c.color}
                      className={`flex flex-col items-center gap-1`}
                    >
                      <span
                        className={`grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 transition ${
                          active
                            ? "border-foreground ring-2 ring-foreground/20"
                            : "border-border hover:border-foreground"
                        }`}
                        style={!photo && css ? { backgroundColor: css } : undefined}
                      >
                        {photo ? (
                          <img src={photo} alt={c.color} className="h-full w-full object-contain" />
                        ) : !css ? (
                          <span className="text-[10px] font-medium">{c.color.slice(0, 3)}</span>
                        ) : null}
                      </span>
                      <span className="max-w-16 truncate text-[11px] text-muted-foreground">
                        {c.color}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasVariations && (hasColors ? selectedColor : true) && sizesForColor.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {sizesForColor.map((s) => {
                  const active = selectedSize === s.label;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSelectedSize(s.label)}
                      className={`min-w-14 rounded-md border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button 
              onClick={() => addToCart()} 
              variant="outline" 
              className="flex-1"
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> 
              Adicionar
            </Button>
            <Button 
              onClick={buyNow} 
              className="flex-1 bg-[#25D366] hover:bg-[#1ebd5b]"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Comprar agora
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação de compra */}
      <AlertDialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <AlertDialogContent className="w-[95vw] max-w-lg overflow-hidden rounded-2xl">
          <button
            onClick={() => setShowBuyDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja comprar apenas este produto ou continuar adicionando mais itens ao carrinho?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 sm:flex-row sm:gap-3">
            <Button variant="outline" onClick={confirmAddAndContinue} className="w-full sm:flex-1">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continuar comprando
            </Button>
            <Button
              onClick={confirmBuyOnly}
              className="w-full bg-[#25D366] hover:bg-[#1ebd5b] sm:flex-1"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Comprar agora
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
