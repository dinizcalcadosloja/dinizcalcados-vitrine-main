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
}

export function StoreFilters({
  categories,
  activeDept,
  setActiveDept,
  activeCat,
  setActiveCat,
}: StoreFiltersProps) {
  const departments = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subcats = useMemo(
    () => categories.filter((c) => c.parent_id === activeDept),
    [categories, activeDept],
  );

  const deptScrollRef = useRef<HTMLDivElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div
      className={`sticky top-[72px] z-40 w-full transition-all duration-300 border-b border-slate-100 overflow-x-hidden ${
        isScrolled ? "sticky-filters-active py-2" : "bg-white py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4 w-full">
        {/* Departments - Pill Tabs */}
        <div
          ref={deptScrollRef}
          className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <button
            onClick={() => {
              setActiveDept(null);
              setActiveCat(null);
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

        {/* Subcategories - Modern Chips */}
        {activeDept && subcats.length > 0 && (
          <div
            ref={catScrollRef}
            className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <button
              onClick={() => setActiveCat(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                !activeCat
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas Categorias
            </button>
            {subcats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  activeCat === c.id
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
