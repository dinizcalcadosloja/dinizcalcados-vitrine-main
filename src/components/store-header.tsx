import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { ShoppingBag, Info, MessageCircle, MapPin, Instagram, Heart, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function StoreHeader({ store }: { store: any }) {
  const { count: cartCount } = useCart(store.slug);
  const { count: favCount } = useFavorites(store.slug);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-2 w-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-3 group min-w-0">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-9 w-9 sm:h-12 sm:w-12 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <span className="grid h-9 w-9 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-full bg-slate-900 text-white font-black text-lg group-hover:scale-105 transition-transform">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
              <h1 className="text-lg sm:text-2xl font-black tracking-tighter text-slate-900 uppercase truncate">
                {store.name}
              </h1>
            </Link>

            {/* Right Icons */}
            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
              {searchOpen ? (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 h-10 sm:h-11 shadow-sm">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    autoFocus
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Pesquisar..."
                    className="bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 w-36 sm:w-48"
                  />
                  <button onClick={() => { setSearchOpen(false); setSearchQ(""); }} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 sm:h-11 sm:w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Pesquisar"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}

              {store.instagram && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openInstagram}
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 sm:h-11 sm:w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-10 w-10 sm:h-11 sm:w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                    title="Informações"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl">
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
