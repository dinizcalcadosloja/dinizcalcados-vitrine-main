import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopProductData {
  productId: string;
  name: string;
  imageUrl: string | null;
  /** null = sem dados de rastreamento ainda (fallback Supabase) */
  views: number | null;
}

/**
 * Retorna os produtos mais vistos para uma loja.
 *
 * Fluxo:
 * 1. Busca rankings no endpoint de analytics (Cloudflare KV).
 * 2. Se houver dados, enriquece com nome + imagem do Supabase.
 * 3. Se ainda não houver dados (loja nova ou sem visitas), cai para os
 *    produtos em destaque do Supabase com views: null.
 */
export function useTopProducts(storeId: string, limit = 3) {
  return useQuery<TopProductData[]>({
    queryKey: ["top-products-analytics", storeId, limit],
    enabled: !!storeId,
    staleTime: 60_000,
    queryFn: async (): Promise<TopProductData[]> => {
      // 1. Analytics endpoint
      let analyticsItems: { productId: string; views: number }[] = [];
      try {
        const res = await fetch(`/api/analytics/products/top?storeId=${storeId}&limit=${limit}`);
        if (res.ok) {
          analyticsItems = (await res.json()) as { productId: string; views: number }[];
        }
      } catch {
        // silently fail — fallback to Supabase
      }

      // 2. If analytics has data, enrich with Supabase names + images
      if (analyticsItems.length > 0) {
        const ids = analyticsItems.map((i) => i.productId);
        const { data } = await supabase
          .from("products")
          .select(
            "id, name, product_color_images(image_url, position), product_images(url, position)",
          )
          .in("id", ids);

        const productMap = new Map((data ?? []).map((p) => [p.id, p]));

        return analyticsItems.map((item) => {
          const p = productMap.get(item.productId);
          const colorImgs = (
            (p?.product_color_images ?? []) as { image_url: string; position: number }[]
          ).sort((a, b) => a.position - b.position);
          const genericImgs = (
            (p?.product_images ?? []) as { url: string; position: number }[]
          ).sort((a, b) => a.position - b.position);
          return {
            productId: item.productId,
            name: p?.name ?? "Produto",
            imageUrl: colorImgs[0]?.image_url ?? genericImgs[0]?.url ?? null,
            views: item.views,
          };
        });
      }

      // 3. Fallback: featured products from Supabase, views unknown
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, featured, product_color_images(image_url, position), product_images(url, position)",
        )
        .eq("store_id", storeId)
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data ?? []).map((p) => {
        const colorImgs = (
          (p.product_color_images ?? []) as { image_url: string; position: number }[]
        ).sort((a, b) => a.position - b.position);
        const genericImgs = ((p.product_images ?? []) as { url: string; position: number }[]).sort(
          (a, b) => a.position - b.position,
        );
        return {
          productId: p.id,
          name: p.name,
          imageUrl: colorImgs[0]?.image_url ?? genericImgs[0]?.url ?? null,
          views: null,
        };
      });
    },
  });
}
