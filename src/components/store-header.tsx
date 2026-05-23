import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import {
  ShoppingBag,
  MessageCircle,
  MapPin,
  Instagram,
  Heart,
  Menu,
  Search,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  User as UserIcon,
  X,
  Info,
} from "lucide-react";
import { useFilterMenu } from "@/lib/filter-context";
import { useSearchMenu } from "@/lib/search-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

type DrawerLevel = "departments" | "subcats";

export function StoreHeader({ store }: { store: any }) {
  const { count: cartCount } = useCart(store.slug);
  const { count: favCount } = useFavorites(store.slug);
  const {
    isOpen: isCategoryMenuOpen,
    setIsOpen: setCategoryMenuOpen,
    activeDept,
    setActiveDept,
    activeCat,
    setActiveCat,
    activeBrand,
    setActiveBrand,
  } = useFilterMenu();
  const { setIsOpen: openSearchMenu } = useSearchMenu();
  const navigate = useNavigate();
  const location = useLocation();

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

  const categories = cats as Category[];
  const departments = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const [drawerLevel, setDrawerLevel] = useState<DrawerLevel>("departments");
  const [drawerDept, setDrawerDept] = useState<Category | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  // Which subcats have their brand list expanded inline in the mobile panel
  const [expandedSubcats, setExpandedSubcats] = useState<Set<string>>(new Set());

  const drawerSubcats = useMemo(
    () => (drawerDept ? categories.filter((c) => c.parent_id === drawerDept.id) : []),
    [categories, drawerDept],
  );

  // Reset drawer navigation after the sheet close animation completes
  useEffect(() => {
    if (!isCategoryMenuOpen) {
      const t = setTimeout(() => {
        setDrawerLevel("departments");
        setDrawerDept(null);
        setExpandedSubcats(new Set());
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isCategoryMenuOpen]);

  // Navigate to the storefront route (preserves multi-store via /loja/$slug)
  function navigateToStorefront() {
    const path = location.pathname.startsWith("/loja/") ? `/loja/${store.slug}` : "/";
    if (location.pathname !== path) {
      navigate({ to: path });
    }
  }

  function selectDept(deptId: string | null) {
    setActiveDept(deptId);
    setActiveCat(null);
    setActiveBrand(null);
    setCategoryMenuOpen(false);
    navigateToStorefront();
  }

  function selectSubcat(deptId: string, catId: string | null) {
    setActiveDept(deptId);
    setActiveCat(catId);
    setActiveBrand(null);
    setCategoryMenuOpen(false);
    navigateToStorefront();
  }

  function selectBrand(deptId: string, catId: string, brandId: string) {
    setActiveDept(deptId);
    setActiveCat(catId);
    setActiveBrand(brandId);
    setCategoryMenuOpen(false);
    navigateToStorefront();
  }

  function toggleSubcatExpand(subcatId: string) {
    setExpandedSubcats((prev) => {
      const next = new Set(prev);
      if (next.has(subcatId)) next.delete(subcatId);
      else next.add(subcatId);
      return next;
    });
  }

  function openWhatsApp() {
    if (!store.whatsapp) return;
    let clean = store.whatsapp.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = clean.substring(1);
    if (clean.length === 10 || clean.length === 11) {
      clean = "55" + clean;
    }
    window.open(`https://api.whatsapp.com/send?phone=${clean}`, "_blank");
  }

  function openInstagram() {
    if (!store.instagram) return;
    let url = store.instagram.trim();
    if (url.startsWith("@")) {
      url = `https://instagram.com/${url.substring(1)}`;
    } else if (!url.startsWith("http")) {
      url = `https://instagram.com/${url}`;
    }
    window.open(url, "_blank");
  }

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

  const activeBtn = "bg-primary text-primary-foreground shadow-sm shadow-primary/20 translate-x-1";
  const inactiveBtn = "text-muted-foreground hover:bg-muted hover:text-foreground";
  const btnBase =
    "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
          <div className="relative flex h-16 sm:h-20 items-center w-full">
            {/* ── Left: mobile nav buttons / desktop logo ── */}
            <div className="flex items-center gap-0.5 z-10">
              {/* Mobile only: category menu */}
              <Sheet open={isCategoryMenuOpen} onOpenChange={setCategoryMenuOpen}>
                <Button
                  ref={hamburgerRef}
                  variant="ghost"
                  size="icon"
                  // Stop pointerdown from reaching Radix's DismissableLayer listener on document;
                  // otherwise it would dismiss the sheet right before our onClick toggles it back open.
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setCategoryMenuOpen((prev) => !prev)}
                  className="md:hidden rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  aria-label={
                    isCategoryMenuOpen ? "Fechar menu de categorias" : "Abrir menu de categorias"
                  }
                  aria-expanded={isCategoryMenuOpen}
                  aria-haspopup="dialog"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <SheetContent
                  side="left"
                  aria-describedby={undefined}
                  className="w-[85vw] max-w-[320px] p-0 gap-0 border-r shadow-2xl z-[999] flex flex-col [&>button]:hidden"
                >
                  {/* Sticky header: title (or back + dept name) + close X */}
                  <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background shrink-0">
                    {drawerLevel === "departments" ? (
                      <SheetTitle className="text-sm font-black tracking-tighter uppercase text-foreground px-2">
                        Categorias
                      </SheetTitle>
                    ) : (
                      <button
                        onClick={() => setDrawerLevel("departments")}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Voltar"
                      >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        <SheetTitle className="text-sm font-black tracking-tighter uppercase text-foreground truncate">
                          {drawerDept?.name ?? ""}
                        </SheetTitle>
                      </button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCategoryMenuOpen(false)}
                      className="h-9 w-9 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      aria-label="Fechar menu"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Sliding content panels */}
                  <div className="relative flex-1 overflow-hidden">
                    {/* Level 1: departments */}
                    <div
                      className={`absolute inset-0 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
                        drawerLevel === "departments" ? "translate-x-0" : "-translate-x-full"
                      }`}
                    >
                      {/* ── Scrollable categories area ── */}
                      <div className="flex-1 overflow-y-auto px-4 py-6">
                        <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          Filtrar por
                        </p>
                        <nav className="space-y-1" aria-label="Categorias">
                          <button
                            onClick={() => selectDept(null)}
                            className={`${btnBase} ${!activeDept ? activeBtn : inactiveBtn}`}
                          >
                            <LayoutGrid className="h-4 w-4 opacity-70 shrink-0" />
                            <span className="flex-1 text-left">Todos</span>
                          </button>

                          {departments.map((d) => {
                            const hasSubs = categories.some((c) => c.parent_id === d.id);
                            return (
                              <button
                                key={d.id}
                                onClick={() => {
                                  if (hasSubs) {
                                    setDrawerDept(d);
                                    setDrawerLevel("subcats");
                                  } else {
                                    selectDept(d.id);
                                  }
                                }}
                                className={`${btnBase} ${activeDept === d.id ? activeBtn : inactiveBtn}`}
                              >
                                {getCategoryIcon(d.name)}
                                <span className="flex-1 text-left">{d.name}</span>
                                {hasSubs && (
                                  <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
                                )}
                              </button>
                            );
                          })}
                        </nav>
                      </div>

                      {/* ── Footer fixo: informações da loja ── */}
                      <div className="shrink-0 border-t border-border px-4 pt-4 pb-4">
                        <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          Informações da loja
                        </p>
                        <div className="space-y-0.5">
                          {store.description && (
                            <div className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 cursor-default text-muted-foreground">
                              <Info className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                              <span className="flex-1 text-left text-sm leading-snug">
                                {store.description}
                              </span>
                            </div>
                          )}
                          {(store.address || store.city || store.state) && (
                            <button
                              onClick={() => {
                                const q = [store.address, store.city, store.state, store.zip_code]
                                  .filter(Boolean)
                                  .join(", ");
                                window.open(
                                  `https://maps.google.com/?q=${encodeURIComponent(q)}`,
                                  "_blank",
                                );
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200 hover:opacity-80"
                            >
                              <MapPin className="h-[18px] w-[18px] shrink-0 text-red-500" />
                              <span className="flex-1 text-left">
                                {[store.address, store.city, store.state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </button>
                          )}
                          {store.whatsapp && (
                            <button
                              onClick={openWhatsApp}
                              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200 hover:opacity-80"
                            >
                              <MessageCircle
                                className="h-[18px] w-[18px] shrink-0"
                                style={{ color: "#25D366" }}
                              />
                              <span className="flex-1 text-left">WhatsApp</span>
                            </button>
                          )}
                          {store.instagram && (
                            <button
                              onClick={openInstagram}
                              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200 hover:opacity-80"
                            >
                              <Instagram className="h-[18px] w-[18px] shrink-0 text-pink-500" />
                              <span className="flex-1 text-left">Instagram</span>
                            </button>
                          )}
                        </div>
                        <div className="border-t border-border mt-3 pt-3 px-2 space-y-0.5">
                          <p className="text-[10px] text-muted-foreground/40">
                            Powered by Amanda Miranda
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Level 2: subcategories */}
                    <div
                      className={`absolute inset-0 overflow-y-auto px-4 py-6 transition-transform duration-300 ease-in-out ${
                        drawerLevel === "subcats" ? "translate-x-0" : "translate-x-full"
                      }`}
                    >
                      <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Subcategorias
                      </p>
                      <nav className="space-y-1" aria-label="Subcategorias">
                        {/* "Todas" — selects the department itself */}
                        <button
                          onClick={() => drawerDept && selectSubcat(drawerDept.id, null)}
                          className={`${btnBase} ${
                            activeDept === drawerDept?.id && !activeCat && !activeBrand
                              ? activeBtn
                              : inactiveBtn
                          }`}
                        >
                          <LayoutGrid className="h-4 w-4 opacity-70 shrink-0" />
                          <span className="flex-1 text-left">Todas</span>
                        </button>

                        {drawerSubcats.map((c) => {
                          const brands = categories.filter((b) => b.parent_id === c.id);
                          const hasBrands = brands.length > 0;
                          const isExpanded = expandedSubcats.has(c.id);
                          const isSubcatActive =
                            (activeCat === c.id && !activeBrand) ||
                            brands.some((b) => b.id === activeBrand);

                          return (
                            <div key={c.id}>
                              <div className="flex items-center gap-1">
                                {/* Subcat name button — selects this subcat (shows all brands under it) */}
                                <button
                                  onClick={() => drawerDept && selectSubcat(drawerDept.id, c.id)}
                                  className={`${btnBase} flex-1 ${isSubcatActive ? activeBtn : inactiveBtn}`}
                                >
                                  {getCategoryIcon(c.name)}
                                  <span className="flex-1 text-left">{c.name}</span>
                                </button>

                                {/* Expand/collapse toggle for brands */}
                                {hasBrands && (
                                  <button
                                    onClick={() => toggleSubcatExpand(c.id)}
                                    className="flex-none flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    aria-label={isExpanded ? "Recolher marcas" : "Expandir marcas"}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Inline brand list */}
                              {hasBrands && isExpanded && (
                                <div className="ml-7 mt-0.5 space-y-0.5 animate-in fade-in duration-150">
                                  {brands.map((b) => (
                                    <button
                                      key={b.id}
                                      onClick={() =>
                                        drawerDept && selectBrand(drawerDept.id, c.id, b.id)
                                      }
                                      className={`${btnBase} text-xs py-2 ${
                                        activeBrand === b.id ? activeBtn : inactiveBtn
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                                      <span className="flex-1 text-left">{b.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              {/* Mobile only: search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Search UI lives on the storefront page (it filters the product grid).
                  // If we're somewhere else (cart, favorites, product), navigate there first.
                  const storefrontPath = location.pathname.startsWith("/loja/")
                    ? `/loja/${store.slug}`
                    : "/";
                  if (location.pathname !== storefrontPath) {
                    navigate({ to: storefrontPath });
                  }
                  openSearchMenu(true);
                }}
                className="md:hidden rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                aria-label="Pesquisar produtos"
              >
                <Search className="h-5 w-5" />
              </Button>
              {/* Desktop only: logo + store name */}
              <Link
                to="/"
                search={{ dept: undefined, cat: undefined, brand: undefined }}
                className="hidden md:flex items-center gap-3 group min-w-0"
              >
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="h-12 w-12 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0"
                  />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-900 text-white font-black text-lg group-hover:scale-105 transition-transform">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase truncate">
                  {store.name}
                </h1>
              </Link>
            </div>

            {/* ── Center: logo avatar (mobile only, truly centered via absolute) ── */}
            <Link
              to="/"
              search={{ dept: undefined, cat: undefined, brand: undefined }}
              className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center group"
              aria-label={store.name}
            >
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-9 w-9 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white font-black text-lg group-hover:scale-105 transition-transform">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>

            {/* ── Right: action icons (mobile and desktop) ── */}
            <div className="flex items-center gap-0.5 sm:gap-2 ml-auto shrink-0 z-10">
              {/* Desktop only: Instagram */}
              {store.instagram && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openInstagram}
                  className="hidden md:inline-flex rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 sm:h-11 sm:w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              )}

              {/* Desktop only: store info dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:inline-flex rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 sm:h-11 sm:w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                    title="Informações"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  aria-describedby={undefined}
                  className="sm:max-w-md rounded-[2rem] border-none shadow-2xl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                      Informações da Loja
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[1.5rem]">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="h-16 w-16 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-slate-900 text-white font-black text-2xl">
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">
                          {store.name}
                        </h3>
                        {store.description && (
                          <p className="text-sm text-slate-500 mt-1 font-medium">
                            {store.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {(store.address || store.city || store.state) && (
                      <div className="space-y-3 bg-slate-50/50 p-6 rounded-[1.5rem]">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                          Localização
                        </h4>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="text-sm text-slate-600 font-medium">
                            {store.address && (
                              <p className="text-slate-900 font-bold">{store.address}</p>
                            )}
                            {(store.city || store.state) && (
                              <p>
                                {[store.city, store.state].filter(Boolean).join(", ")}
                                {store.zip_code && ` - ${store.zip_code}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {(store.whatsapp || store.instagram) && (
                      <div className="flex flex-col gap-3">
                        {store.whatsapp && (
                          <Button
                            onClick={openWhatsApp}
                            className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-200"
                          >
                            <MessageCircle className="mr-2 h-5 w-5" />
                            Conversar no WhatsApp
                          </Button>
                        )}
                        {store.instagram && (
                          <Button
                            onClick={openInstagram}
                            variant="outline"
                            className="w-full h-14 rounded-full font-bold border-slate-200 hover:bg-slate-50"
                          >
                            <Instagram className="mr-2 h-5 w-5" />
                            Ver no Instagram
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Link to="/favoritos" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 sm:h-11 sm:w-11 relative cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Favoritos"
                  asChild
                >
                  <div>
                    <Heart className="h-5 w-5" />
                    {favCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white px-1 animate-in zoom-in-75">
                        {favCount}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>

              <Link to="/carrinho" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 sm:h-11 sm:w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Carrinho"
                  asChild
                >
                  <div>
                    <ShoppingBag className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-2 ring-white px-1 animate-in zoom-in-75">
                        {cartCount}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer keeps content from being hidden behind the fixed header */}
      <div className="h-16 sm:h-20" aria-hidden="true" />
    </>
  );
}
