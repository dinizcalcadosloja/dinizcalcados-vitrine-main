import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  p: any;
  slug: string;
}

export function ProductCard({ p, slug }: ProductCardProps) {
  const { toggle, isFavorite } = useFavorites(slug);
  const favorited = isFavorite(p.id);

  const cover = p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url;
  const price = Number(p.price);
  const comparePrice = p.compare_at_price ? Number(p.compare_at_price) : null;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-[1.2rem] sm:rounded-[2rem] p-2 sm:p-3 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-2 border border-slate-100/50 overflow-hidden w-full max-w-full">
      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(p.id);
        }}
        className={cn(
          "absolute right-2 top-2 sm:right-5 sm:top-5 z-10 p-1.5 sm:p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-slate-100 transition-all duration-300",
          favorited
            ? "text-rose-500 border-rose-100 bg-rose-50/50 scale-110"
            : "text-slate-400 hover:text-rose-500 hover:scale-110",
        )}
        title={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart
          className={cn(
            "h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300",
            favorited && "fill-current animate-in zoom-in-75 duration-300",
          )}
        />
      </button>

      {/* Image Container */}
      <Link
        to="/loja/$slug/produto/$productId"
        params={{ slug, productId: p.id }}
        className="aspect-[3/4] overflow-hidden bg-slate-50/50 rounded-[0.8rem] sm:rounded-[1.5rem] flex items-center justify-center relative mb-2 sm:mb-4"
      >
        {cover ? (
          <img
            src={cover}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-contain p-2 sm:p-4 transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground bg-slate-100/50">
            Sem imagem
          </div>
        )}

        {/* Cart Button overlay - only on hover/desktop or always on mobile? User says "canto inferior da imagem" */}
        <div className="absolute bottom-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg border-none"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </Link>

      {/* Info Container */}
      <div className="px-1 pb-2 flex flex-col flex-1">
        <Link
          to="/loja/$slug/produto/$productId"
          params={{ slug, productId: p.id }}
          className="hover:text-emerald-600 transition-colors"
        >
          <h3 className="line-clamp-2 text-[0.85rem] sm:text-[0.95rem] font-semibold text-slate-800 leading-tight mb-1 sm:mb-2">
            {p.name}
          </h3>
        </Link>

        <div className="mt-auto flex flex-col gap-0.5">
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through decoration-slate-300 font-medium">
              {formatBRL(comparePrice)}
            </span>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
              {formatBRL(price)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-100/50">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
