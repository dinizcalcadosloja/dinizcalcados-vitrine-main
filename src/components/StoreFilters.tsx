import { LayoutGrid, Sparkles, User as UserIcon } from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface StoreFiltersProps {
  categories: Category[];
  activeDept: string | null;
  setActiveDept: (id: string | null) => void;
  activeCat: string | null;
  setActiveCat: (id: string | null) => void;
  activeBrand: string | null;
  setActiveBrand: (id: string | null) => void;
}

export function StoreFilters({
  categories,
  activeDept,
  setActiveDept,
  activeCat,
  setActiveCat,
  activeBrand,
  setActiveBrand,
}: StoreFiltersProps) {
  const departments = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subcats = useMemo(
    () => categories.filter((c) => c.parent_id === activeDept),
    [categories, activeDept],
  );
  // Brands = children of the selected subcategory
  const brands = useMemo(
    () => (activeCat ? categories.filter((c) => c.parent_id === activeCat) : []),
    [categories, activeCat],
  );

  const deptScrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("masculino") || lower.includes("homem"))
      return <UserIcon className="h-4 w-4 shrink-0" />;
    if (lower.includes("feminino") || lower.includes("mulher"))
      return <Sparkles className="h-4 w-4 shrink-0" />;
    if (lower.includes("beleza") || lower.includes("cosmético"))
      return <Sparkles className="h-4 w-4 shrink-0" />;
    return <LayoutGrid className="h-4 w-4 shrink-0" />;
  };

  return (
    <>
      {/* ── Desktop (≥ 1024px): sticky horizontal pill tabs — hidden on mobile ── */}
      <div
        className={`hidden lg:block sticky top-[72px] z-40 w-full border-b border-slate-100 transition-all duration-300 overflow-x-hidden ${
          isScrolled ? "sticky-filters-active py-2" : "bg-white py-4"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4 w-full">
          {/* Department pill tabs */}
          <div className="relative">
            <div
              ref={deptScrollRef}
              className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none pb-1"
            >
              <button
                onClick={() => {
                  setActiveDept(null);
                  setActiveCat(null);
                  setActiveBrand(null);
                }}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                  !activeDept
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Todos
              </button>
              {departments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setActiveDept(d.id);
                    setActiveCat(null);
                    setActiveBrand(null);
                  }}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    activeDept === d.id
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {getCategoryIcon(d.name)}
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory chips (desktop only) */}
          {activeDept && subcats.length > 0 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none pb-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => {
                  setActiveCat(null);
                  setActiveBrand(null);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  !activeCat
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 scale-105"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                Todas
              </button>
              {subcats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCat(c.id);
                    setActiveBrand(null);
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    activeCat === c.id
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 scale-105"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Brand chips — 3rd level (desktop only) */}
          {activeCat && brands.length > 0 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none pb-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => setActiveBrand(null)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  !activeBrand
                    ? "bg-slate-700 text-white shadow-sm scale-105"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                Todas as marcas
              </button>
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBrand(b.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    activeBrand === b.id
                      ? "bg-slate-700 text-white shadow-sm scale-105"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
