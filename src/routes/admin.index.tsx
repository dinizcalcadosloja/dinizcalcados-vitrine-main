import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Package,
  Tags,
  Settings,
  ArrowUpRight,
  ShoppingBag,
  ExternalLink,
  Users,
  TrendingUp,
  Image as ImageIcon,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function AdminHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const {
    data: store,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id);

      const { count: activeProductsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .eq("active", true);

      const { count: categoriesCount } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id);

      const { data: visitData } = await supabase
        .from("store_visit_counts")
        .select("count")
        .eq("store_id", store!.id)
        .gte("day", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

      const visits = (visitData ?? []).reduce((sum: number, r: any) => sum + (r.count || 0), 0);

      return {
        products: productsCount || 0,
        activeProducts: activeProductsCount || 0,
        categories: categoriesCount || 0,
        visits,
      };
    },
  });

  async function createStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name"));
    const slug = slugify(String(fd.get("slug") || name));
    const { data, error } = await supabase
      .from("stores")
      .insert({ owner_id: user!.id, name, slug, whatsapp: String(fd.get("whatsapp") || "") })
      .select()
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Loja criada!");
    await refetch();
    navigate({ to: "/admin/loja" });
    void data;
  }

  if (isLoading) return null;

  if (!store) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-2xl mb-4">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Comece sua Jornada</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Em poucos segundos você terá uma vitrine digital profissional pronta para vender.
          </p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/[0.03] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
            <CardTitle>Configuração Inicial</CardTitle>
            <CardDescription>
              Estes dados aparecerão para seus clientes na sua vitrine.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={createStore} className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Nome da Loja
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Ex: Boutique Glamour"
                  className="h-11 rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="slug" className="text-sm font-semibold">
                  URL da sua Vitrine
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pr-1 pointer-events-none border-r border-border/40 bg-muted/30 group-focus-within:bg-muted/50 rounded-l-xl transition-colors">
                    <span className="text-xs font-medium text-muted-foreground">
                      vitrina.app/loja/
                    </span>
                  </div>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="minha-loja"
                    className="h-11 pl-[125px] rounded-xl border-border/60"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="whatsapp" className="text-sm font-semibold">
                  WhatsApp para Pedidos
                </Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  placeholder="Ex: 11999998888"
                  className="h-11 rounded-xl border-border/60"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 ml-1">
                  <TrendingUp className="h-3 w-3" />
                  Seus clientes enviarão o carrinho diretamente para este número.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={busy}
              >
                Criar Minha Loja Agora
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{store.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 py-0 text-[10px] font-bold uppercase tracking-wider"
            >
              Online
            </Badge>
            <a
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              href={`/loja/${store.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              vitrina.app/loja/{store.slug}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Button asChild size="sm" className="hidden sm:flex rounded-xl font-semibold">
          <Link to="/admin/produtos/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-sm overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
              <h3 className="text-2xl font-bold tracking-tight">{stats?.products || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Tags className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Categorias Ativas</p>
              <h3 className="text-2xl font-bold tracking-tight">{stats?.categories || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Visitas (30 dias)</p>
              <h3 className="text-2xl font-bold tracking-tight">{stats?.visits || 0}</h3>
              <p className="text-xs text-muted-foreground/70">acessos à vitrine</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Acesso Rápido
            </h2>
          </div>
          <div className="grid gap-3">
            <Link
              to="/admin/produtos"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border/60 hover:border-primary/40 hover:shadow-md hover:shadow-primary/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted/50 rounded-xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <Package className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Gerenciar Produtos</h4>
                  <p className="text-xs text-muted-foreground">
                    Adicione, edite e controle estoque.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <Link
              to="/admin/categorias"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border/60 hover:border-primary/40 hover:shadow-md hover:shadow-primary/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted/50 rounded-xl flex items-center justify-center group-hover:bg-amber-500/5 transition-colors">
                  <Tags className="h-6 w-6 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Organizar Categorias</h4>
                  <p className="text-xs text-muted-foreground">
                    Crie departamentos e subcategorias.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <Link
              to="/admin/loja"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border/60 hover:border-primary/40 hover:shadow-md hover:shadow-primary/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted/50 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/5 transition-colors">
                  <Settings className="h-6 w-6 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Configurações da Loja</h4>
                  <p className="text-xs text-muted-foreground">WhatsApp, Logo, Banner e Redes.</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </section>

        <Card className="border-border/60 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Dicas de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
              <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h5 className="text-sm font-bold">Fotos de Qualidade</h5>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Produtos com fotos claras e bem iluminadas vendem até 70% mais via WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-3 rounded-xl bg-amber-500/[0.03] border border-amber-500/10">
              <div className="h-10 w-10 shrink-0 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h5 className="text-sm font-bold">Descrições Vendedoras</h5>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Detalhe materiais, medidas e benefícios para reduzir dúvidas dos clientes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-3 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10">
              <div className="h-10 w-10 shrink-0 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h5 className="text-sm font-bold">Compartilhe sua Vitrine</h5>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Coloque o link da sua vitrine na bio do Instagram e no status do WhatsApp.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
