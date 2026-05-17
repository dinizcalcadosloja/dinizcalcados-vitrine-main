import { useTopProducts } from "@/hooks/use-top-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Eye, PackageSearch } from "lucide-react";
import { Link } from "@tanstack/react-router";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { TopProductData as TopProduct } from "@/hooks/use-top-products";

interface TopProductsCardProps {
  storeId: string;
}

// ─── Rank styles ──────────────────────────────────────────────────────────────

const RANK_STYLE = [
  "bg-amber-500/10 text-amber-600",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
] as const;

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
        <PackageSearch className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TopProductsCard({ storeId }: TopProductsCardProps) {
  const { data: products, isLoading } = useTopProducts(storeId, 3);

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-amber-500" />
          Produtos Mais Vistos
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-3">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : !products || products.length === 0 ? (
          <EmptyState />
        ) : (
          products.map((product, index) => (
            <Link
              key={product.productId}
              to="/admin/produtos/$id"
              params={{ id: product.productId }}
              className="flex items-center gap-3 group/row"
            >
              {/* Thumbnail */}
              <div className="h-9 w-9 rounded-lg border border-border/60 bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate group-hover/row:text-primary transition-colors">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {product.views !== null ? (
                    <>
                      <Eye className="inline h-3 w-3 mr-0.5 -mt-px" />
                      {product.views.toLocaleString("pt-BR")} views
                    </>
                  ) : (
                    "rastreamento em breve"
                  )}
                </p>
              </div>

              {/* Rank badge */}
              <span
                className={`text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${RANK_STYLE[index]}`}
              >
                {index === 0 ? "🔥" : `#${index + 1}`}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
