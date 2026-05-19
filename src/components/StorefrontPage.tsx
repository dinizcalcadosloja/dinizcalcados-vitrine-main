import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useRef } from "react";
import { useStore } from "@/lib/store-context";
import { useSearchMenu } from "@/lib/search-context";
import { useFilterMenu } from "@/lib/filter-context";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  User as UserIcon,
  Sparkles,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductCard } from "@/components/ProductCard";
import { StoreBanner } from "@/components/StoreBanner";
import { StoreFilters } from "@/components/StoreFilters";

export function StorefrontPage() {
  const store = useStore();
  const [q, setQ] = useState("");
  const { isOpen: isSearchOpen, setIsOpen: setIsSearchOpen } = useSearchMenu();
  const { activeDept, setActiveDept, activeCat, setActiveCat } = useFilterMenu();
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
          .select("id,name,parent_id,position")
          .eq("store_id", store.id)
          .order("position", { ascending: true })
          .order("name", { ascending: true })
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
    <>
      {/* ── Mobile search overlay (< 1024px) — triggered by header search icon ── */}
      {isSearchOpen && (
        <div className="lg:hidden fixed top-16 sm:top-20 inset-x-0 bottom-0 z-[99] flex flex-col animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />
          {/* Search panel */}
          <div className="relative bg-white px-4 pt-5 pb-5 shadow-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 h-14 bg-slate-50 rounded-2xl border border-slate-200 px-5 focus-within:shadow-md focus-within:border-slate-300 transition-all">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você está procurando?"
                className="flex-1 bg-transparent outline-none text-base placeholder:text-slate-400 text-slate-900 min-w-0"
                onKeyDown={(e) => e.key === "Escape" && setIsSearchOpen(false)}
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="mt-4 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors py-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50/30 pb-20 font-sans overflow-x-hidden w-full">
        <main className="w-full">
          <StoreBanner />

          <StoreFilters
            categories={cats as any[]}
            activeDept={activeDept}
            setActiveDept={setActiveDept}
            activeCat={activeCat}
            setActiveCat={setActiveCat}
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
            {/* Search Bar — desktop only */}
            <div className="hidden lg:block max-w-2xl mx-auto mb-10 sm:mb-16 w-full">
              <div className="flex items-center gap-2 h-14 sm:h-16 bg-white rounded-full shadow-sm border border-slate-100 px-5 focus-within:shadow-xl focus-within:border-slate-300 transition-all">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  id="store-search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="O que você está procurando hoje?"
                  className="flex-1 bg-transparent outline-none text-base sm:text-lg placeholder:text-slate-400 text-slate-900 min-w-0"
                />
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
                  {Array.from(productsByCategory.entries()).map(
                    ([categoryId, categoryProducts]) => {
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
                              onClick={() =>
                                setViewAllCategory({ id: categoryId, name: categoryName })
                              }
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
                    },
                  )}
                </div>
              )}
            </section>
          </div>

          <Dialog
            open={!!viewAllCategory}
            onOpenChange={(open) => !open && setViewAllCategory(null)}
          >
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 lg:gap-10">
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
    </>
  );
}
