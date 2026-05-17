import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Store,
  Package,
  Tags,
  LogOut,
  ExternalLink,
  Menu,
  X,
  LayoutDashboard,
  Settings,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: store } = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  const items = [
    { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
    { to: "/admin/produtos", label: "Produtos", icon: Package },
    { to: "/admin/categorias", label: "Categorias", icon: Tags },
    { to: "/admin/loja", label: "Configurações", icon: Settings },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <Link to="/admin" className="flex items-center gap-3 group">
          <img
            src="https://dhpsrhbxhaaprmotbabb.supabase.co/storage/v1/object/public/store-assets/923a30da-db7d-469e-bc36-511e4b0f2df5.png"
            alt="Mariano Mens Wear"
            className="h-10 w-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="font-black tracking-tighter text-foreground uppercase text-sm">
            Mariano Mens Wear
          </span>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Gerenciamento
        </p>
        <nav className="space-y-1">
          {items.map((it) => {
            const active = it.exact ? path === it.to : path.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 translate-x-1"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <it.icon className={`h-4.5 w-4.5 ${active ? "opacity-100" : "opacity-70"}`} />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 mt-auto">
        <div className="rounded-2xl bg-muted/50 p-4 border border-border/50">
          {store && (
            <a
              href="https://www.marianomenswear.com.br"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between group mb-4"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Sua Loja</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  marianomenswear.com.br
                </span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 px-2 h-9"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="text-xs font-medium">Sair da conta</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#FAFAFA] font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 shrink-0 border-r border-border/60 bg-white md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/60 bg-white/80 px-4 backdrop-blur-md md:hidden">
        <Link to="/admin" className="flex items-center gap-2 font-bold tracking-tight">
          <img
            src="https://dhpsrhbxhaaprmotbabb.supabase.co/storage/v1/object/public/store-assets/923a30da-db7d-469e-bc36-511e4b0f2df5.png"
            alt="Mariano Mens Wear"
            className="h-8 w-8 rounded-full object-cover shadow-sm shrink-0"
          />
          <span>Mariano Mens Wear</span>
        </Link>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pl-72 md:pt-0">
        <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-10 md:py-12">
          {/* Breadcrumbs for desktop */}
          <nav className="mb-6 hidden items-center gap-1.5 text-xs font-medium text-muted-foreground md:flex">
            <Link to="/admin" className="hover:text-foreground">
              Admin
            </Link>
            {path !== "/admin" && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground capitalize">{path.split("/").pop()}</span>
              </>
            )}
          </nav>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
