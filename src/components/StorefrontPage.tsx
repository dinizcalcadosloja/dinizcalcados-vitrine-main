import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useRef } from "react";
import { useStore } from "@/lib/store-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductCard } from "@/components/ProductCard";
import { StoreBanner } from "@/components/StoreBanner";
import { ShippingBanner } from "@/components/ShippingBanner";
import { StoreFilters } from "@/components/StoreFilters";

export function StorefrontPage() {
  const store = useStore();
  const [q, setQ] = useState("");
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [viewAllCategory, setViewAllCategory] = useState<{ id: string; name: string } | null>(null);

  const scrollContainerRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scroll = (key: string, direction: "left" | "right") => {
    const container = scrollContainerRef.current[key];
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const { data: products = [] } = useQuery({
    queryKey: ["public-products", store.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, price, compare_at_price, featured, category_id, product_images(url, position)",
        )
        .eq("store_id", store.id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: cats = [] } = useQuery({
    queryKey: ["public-cats", store.id],
    queryFn: async () =>
      (
        await supabase
          .from("categories")
          .select("id,name,parent_id")
          .eq("store_id", store.id)
          .order("position")
      ).data ?? [],
  });

  const departments = (cats as any[]).filter((c) => !c.parent_id);
  const subcats = (cats as any[]).filter((c) => c.parent_id === activeDept);
  const subcatIds = useMemo(() => new Set(subcats.map((c) => c.id)), [subcats]);

  const filtered = useMemo(() => {
    return products.filter((p: any) => {
      if (activeCat) {
        if (p.category_id !== activeCat) return false;
      } else if (activeDept) {
        if (!subcatIds.has(p.category_id)) return false;
      }
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [products, q, activeCat, activeDept, subcatIds]);

  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, any[]>();

    filtered.forEach((p: any) => {
      if (!p.category_id) {
        const uncategorized = grouped.get("uncategorized") || [];
        uncategorized.push(p);
        grouped.set("uncategorized", uncategorized);
      } else {
        const catProducts = grouped.get(p.category_id) || [];
        catProducts.push(p);
        grouped.set(p.category_id, catProducts);
      }
    });

    return grouped;
  }, [filtered]);

  const featured = products.filter((p: any) => p.featured).slice(0, 8);

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("masculino") || lowerName.includes("homem"))
      return <UserIcon className="h-4 w-4" />;
    if (lowerName.includes("feminino") || lowerName.includes("mulher"))
      return <Sparkles className="h-4 w-4" />;
    if (lowerName.includes("beleza") || lowerName.includes("cosmético"))
      return <Sparkles className="h-4 w-4" />;
    return <LayoutGrid className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20 font-sans overflow-x-hidden w-full">
      <main className="w-full">
        <ShippingBanner />
        <StoreBanner />

        <StoreFilters
          categories={cats as any[]}
          activeDept={activeDept}
          setActiveDept={setActiveDept}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
          {/* Search Bar - Pill Style */}
          <div className="max-w-2xl mx-auto mb-10 sm:mb-16 w-full">
            <div className="relative group w-full">
              <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você está procurando hoje?"
                className="h-14 sm:h-16 pl-14 pr-6 rounded-full border-slate-100 bg-white shadow-sm hover:shadow-md focus:shadow-xl focus:ring-slate-900 transition-all text-base sm:text-lg placeholder:text-slate-400 border-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button className="hidden sm:flex bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-slate-800 transition-colors font-bold text-sm h-10 items-center">
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Featured Carousel */}
          {featured.length > 0 && !q && !activeCat && !activeDept && (
            <section className="mb-20">
              <div className="mb-8 flex items-end justify-between px-2 sm:px-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 uppercase">
                    Em Destaque
                  </h2>
                  <div className="h-1.5 w-16 bg-slate-900 mt-2 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-full bg-white border-slate-100 shadow-sm hover:shadow-md"
                    onClick={() => scroll("featured", "left")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-full bg-white border-slate-100 shadow-sm hover:shadow-md"
                    onClick={() => scroll("featured", "right")}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div
                ref={(el) => {
                  scrollContainerRef.current["featured"] = el;
                }}
                className="flex gap-3 sm:gap-6 overflow-x-auto pb-8 pt-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
              >
                {featured.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex-none w-[46%] sm:w-[45%] md:w-[30%] lg:w-[23%] snap-start"
                  >
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            {filtered.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] shadow-sm border border-slate-100">
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-slate-300" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Ops! Nada por aqui.</h2>
                <p className="text-slate-500 max-w-xs mx-auto">
                  Tente ajustar sua busca ou mudar os filtros para encontrar o que procura.
                </p>
                <Button
                  variant="link"
                  className="mt-4 text-slate-900 font-bold"
                  onClick={() => {
                    setQ("");
                    setActiveCat(null);
                    setActiveDept(null);
                  }}
                >
                  Limpar todos os filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-24">
                {Array.from(productsByCategory.entries()).map(([categoryId, categoryProducts]) => {
                  const category = cats.find((c: any) => c.id === categoryId);
                  const categoryName = category?.name || "Sem categoria";

                  return (
                    <div key={categoryId}>
                      <div className="mb-8 flex items-end justify-between px-2 sm:px-0">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 uppercase">
                            {categoryName}
                          </h2>
                          <div className="h-1.5 w-16 bg-slate-900 mt-2 rounded-full" />
                        </div>
                        <button
                          onClick={() => setViewAllCategory({ id: categoryId, name: categoryName })}
                          className="group flex items-center gap-2 text-sm font-bold text-emerald-600 transition-all hover:gap-3 bg-emerald-50 px-4 py-2 rounded-full"
                        >
                          Ver todos{" "}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>

                      <div className="relative group">
                        <div
                          ref={(el) => {
                            scrollContainerRef.current[`cat-${categoryId}`] = el;
                          }}
                          className="flex gap-3 sm:gap-6 overflow-x-auto pb-8 pt-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
                        >
                          {categoryProducts.map((p: any) => (
                            <div
                              key={p.id}
                              className="flex-none w-[46%] sm:w-[45%] md:w-[30%] lg:w-[23%] snap-start"
                            >
                              <ProductCard p={p} />
                            </div>
                          ))}
                        </div>

                        {categoryProducts.length > 4 && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white border-slate-100 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex"
                              onClick={() => scroll(`cat-${categoryId}`, "left")}
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white border-slate-100 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex"
                              onClick={() => scroll(`cat-${categoryId}`, "right")}
                            >
                              <ChevronRight className="h-6 w-6" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <Dialog open={!!viewAllCategory} onOpenChange={(open) => !open && setViewAllCategory(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-[2.5rem] sm:rounded-[3rem] border-none shadow-2xl">
            <DialogHeader className="p-8 sm:p-12 border-b bg-white shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <DialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                    {viewAllCategory?.name}
                  </DialogTitle>
                  <p className="text-slate-500 text-base mt-2 font-medium">
                    Explore todos os produtos desta categoria
                  </p>
                </div>
                <div className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                  {viewAllCategory && productsByCategory.get(viewAllCategory.id)?.length} Itens
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-10">
                {viewAllCategory &&
                  productsByCategory
                    .get(viewAllCategory.id)
                    ?.map((p: any) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>

            <div className="p-6 border-t bg-white shrink-0 text-center lg:hidden">
              <Button
                variant="outline"
                className="w-full rounded-full h-14 font-black text-slate-900 border-slate-200 uppercase tracking-tight"
                onClick={() => setViewAllCategory(null)}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
