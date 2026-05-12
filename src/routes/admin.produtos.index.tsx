import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Filter,
  Package,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { formatBRL } from "@/lib/format";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/produtos/")({
  component: ProductsList,
});

import { Switch } from "@/components/ui/switch";

function ProductsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const { data: categories } = useQuery({
    queryKey: ["admin-categories", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .eq("store_id", store!.id)
        .order("name");
      return data ?? [];
    },
  });

  const {
    data: productsData,
    refetch,
    isPlaceholderData,
    isLoading,
  } = useQuery({
    queryKey: [
      "admin-products",
      store?.id,
      page,
      pageSize,
      search,
      filterDept,
      filterCat,
      filterStatus,
    ],
    enabled: !!store,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, product_images(url, position), product_variants(id)", { count: "exact" })
        .eq("store_id", store!.id);

      // Filtros no servidor
      if (search) query = query.ilike("name", `%${search}%`);
      if (filterStatus === "active") query = query.eq("active", true);
      if (filterStatus === "inactive") query = query.eq("active", false);
      if (filterStatus === "featured") query = query.eq("featured", true);

      if (filterCat) {
        query = query.eq("category_id", filterCat);
      } else if (filterDept) {
        // Para filtrar por depto (parent_id) no servidor, precisaríamos de um join ou subquery
        // Como o Supabase permite filtros em relações, se category_id tivesse a relação carregada
        // mas aqui vamos manter o filtro de depto local por enquanto ou simplificar
        const catIds = (categories ?? [])
          .filter((c: any) => c.parent_id === filterDept)
          .map((c: any) => c.id);
        if (catIds.length > 0) {
          query = query.in("category_id", catIds);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { products: data ?? [], count: count ?? 0 };
    },
  });

  const products = productsData?.products ?? [];
  const totalCount = productsData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const departments = useMemo(() => {
    return (categories ?? []).filter((c: any) => !c.parent_id);
  }, [categories]);

  const subcategories = useMemo(() => {
    if (!filterDept) return [];
    return (categories ?? []).filter((c: any) => c.parent_id === filterDept);
  }, [categories, filterDept]);

  // Os produtos já vêm filtrados do backend agora
  const filteredProducts = products;

  async function createProduct() {
    if (!store) return;
    navigate({ to: "/admin/produtos/novo" });
  }

  async function deleteProduct(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    refetch();
  }

  async function duplicateProduct(product: any) {
    const { data: newProduct, error } = await supabase
      .from("products")
      .insert({
        store_id: store!.id,
        name: `${product.name} (Cópia)`,
        description: product.description,
        price: product.price,
        compare_at_price: product.compare_at_price,
        category_id: product.category_id,
        active: false,
      })
      .select()
      .single();

    if (error) return toast.error(error.message);

    // Copiar imagens
    if (product.product_images?.length) {
      await supabase.from("product_images").insert(
        product.product_images.map((img: any) => ({
          product_id: newProduct.id,
          url: img.url,
          position: img.position,
        })),
      );
    }

    toast.success("Produto duplicado");
    refetch();
    navigate({ to: "/admin/produtos/$id", params: { id: newProduct.id } });
  }

  async function toggleStatus(product: any) {
    const nextStatus = !product.active;
    const { error } = await supabase
      .from("products")
      .update({ active: nextStatus })
      .eq("id", product.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success(nextStatus ? "Produto ativado" : "Produto desativado");
    refetch();
  }

  if (!store && !user) return null; // Let AdminLayout handle auth redirect

  if (!store)
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
        Carregando loja…
      </div>
    );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-1 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 sm:px-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Produtos
          </h1>
          <p className="hidden sm:block text-sm text-muted-foreground mt-1">
            Gerencie seu inventário e catálogo de produtos.
          </p>
        </div>
        <Button
          onClick={createProduct}
          className="rounded-xl font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98] w-full sm:w-auto h-10 px-4 text-xs sm:text-sm"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo produto
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl border-0 sm:border">
        <CardContent className="p-0">
          <div className="flex flex-col border-b border-border/40 bg-muted/20 p-4 gap-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 h-10 w-full rounded-xl border-border/40 bg-white focus-visible:ring-primary/20 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[130px] h-10 rounded-xl border-border/40 bg-white text-xs sm:text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">
                      <SelectValue placeholder="Status" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-xl shadow-black/5">
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="featured">Em destaque</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterDept || "all"}
                onValueChange={(v) => {
                  setFilterDept(v === "all" ? "" : v);
                  setFilterCat("");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl border-border/40 bg-white text-xs sm:text-sm">
                  <span className="truncate">
                    <SelectValue placeholder="Depto" />
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-xl shadow-black/5">
                  <SelectItem value="all">Todos Deptos</SelectItem>
                  {departments.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterCat || "all"}
                onValueChange={(v) => {
                  setFilterCat(v === "all" ? "" : v);
                  setPage(1);
                }}
                disabled={!filterDept}
              >
                <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl border-border/40 bg-white text-xs sm:text-sm">
                  <span className="truncate">
                    <SelectValue placeholder={filterDept ? "Categoria" : "Escolha Depto"} />
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-xl shadow-black/5">
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {subcategories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterDept || filterCat || filterStatus !== "all" || search) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setFilterDept("");
                    setFilterCat("");
                    setFilterStatus("all");
                    setPage(1);
                  }}
                  className="h-10 px-3 text-[11px] font-bold text-muted-foreground hover:bg-muted/80 rounded-xl transition-colors col-span-2 sm:col-span-1"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-[80px] py-4 font-bold text-[11px] uppercase tracking-wider">
                    Imagem
                  </TableHead>
                  <TableHead className="py-4 font-bold text-[11px] uppercase tracking-wider">
                    Produto
                  </TableHead>
                  <TableHead className="w-[120px] py-4 font-bold text-[11px] uppercase tracking-wider">
                    Preço
                  </TableHead>
                  <TableHead className="w-[140px] py-4 font-bold text-[11px] uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="w-[80px] text-right py-4 font-bold text-[11px] uppercase tracking-wider">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-border/40 animate-pulse">
                      <TableCell colSpan={5} className="py-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-muted/50" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/3 rounded bg-muted/50" />
                            <div className="h-3 w-1/4 rounded bg-muted/50" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-2">
                          <Search className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="font-bold text-foreground/80">Nenhum produto encontrado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p: any) => (
                    <ProductRow
                      key={p.id}
                      p={p}
                      store={store}
                      navigate={navigate}
                      duplicateProduct={duplicateProduct}
                      deleteProduct={deleteProduct}
                      toggleStatus={toggleStatus}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border/40">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-xl bg-muted/50" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-2/3 rounded bg-muted/50" />
                      <div className="h-3 w-1/3 rounded bg-muted/50" />
                    </div>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            ) : (
              products.map((p: any) => (
                <ProductMobileCard
                  key={p.id}
                  p={p}
                  store={store}
                  navigate={navigate}
                  duplicateProduct={duplicateProduct}
                  deleteProduct={deleteProduct}
                  toggleStatus={toggleStatus}
                />
              ))
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 md:px-6 bg-muted/10 border-t border-border/40 gap-4">
              <div className="text-xs font-medium text-muted-foreground order-2 sm:order-1">
                Mostrando{" "}
                <span className="text-foreground">
                  {Math.min(totalCount, (page - 1) * pageSize + 1)}
                </span>{" "}
                até <span className="text-foreground">{Math.min(totalCount, page * pageSize)}</span>{" "}
                de <span className="text-foreground">{totalCount}</span> produtos
              </div>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs font-bold text-foreground">{page}</span>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-xs text-muted-foreground">{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>

                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] ml-2 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductRow({ p, store, navigate, duplicateProduct, deleteProduct, toggleStatus }: any) {
  const cover = p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url;
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    await toggleStatus(p);
    setLoading(false);
  };

  return (
    <TableRow className="border-border/40 hover:bg-muted/5 group transition-colors">
      <TableCell className="py-4">
        <div className="aspect-square w-12 overflow-hidden rounded-xl border border-border/40 bg-white p-1 shadow-sm group-hover:scale-105 transition-transform duration-300">
          {cover ? (
            <img src={cover} alt={p.name} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/30 rounded-lg">
              <Package className="h-5 w-5 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex flex-col max-w-[250px]">
          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {p.name}
          </span>
          {p.product_variants?.length > 0 && (
            <span className="text-[10px] font-medium text-emerald-600 mt-1">
              {p.product_variants.length} variações
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-4 w-[120px]">
        <span className="font-bold text-sm text-foreground whitespace-nowrap">
          {formatBRL(Number(p.price))}
        </span>
      </TableCell>
      <TableCell className="py-4 w-[140px]">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Switch
            checked={p.active}
            onCheckedChange={handleToggle}
            disabled={loading}
            className="data-[state=checked]:bg-emerald-500 shrink-0"
          />
          <span
            className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${p.active ? "text-emerald-600" : "text-slate-400"}`}
          >
            {loading ? "..." : p.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right py-4">
        <ProductActions
          p={p}
          store={store}
          navigate={navigate}
          duplicateProduct={duplicateProduct}
          deleteProduct={deleteProduct}
        />
      </TableCell>
    </TableRow>
  );
}

function ProductMobileCard({
  p,
  store,
  navigate,
  duplicateProduct,
  deleteProduct,
  toggleStatus,
}: any) {
  const cover = p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url;
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    await toggleStatus(p);
    setLoading(false);
  };

  return (
    <div className="p-3 sm:p-4 flex items-start justify-between gap-3 hover:bg-muted/5 transition-colors">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="aspect-square w-14 h-14 sm:w-16 sm:h-16 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-white p-1 shadow-sm mt-0.5">
          {cover ? (
            <img src={cover} alt={p.name} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/30 rounded-lg">
              <Package className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-bold text-sm text-foreground leading-tight line-clamp-2">
            {p.name}
          </span>
          <span className="font-bold text-xs text-muted-foreground mt-1">
            {formatBRL(Number(p.price))}
          </span>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2.5">
            <div className="flex items-center gap-2 bg-muted/40 rounded-full pl-2 pr-3 py-1 border border-border/10">
              <Switch
                checked={p.active}
                onCheckedChange={handleToggle}
                disabled={loading}
                className="scale-[0.8] origin-left data-[state=checked]:bg-emerald-500"
              />
              <span
                className={`text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest transition-colors ${p.active ? "text-emerald-600" : "text-slate-400"}`}
              >
                {p.active ? "Ativo" : "Inativo"}
              </span>
            </div>

            {p.featured && (
              <div className="flex items-center gap-1 bg-amber-50 rounded-full px-2 py-0.5 border border-amber-100">
                <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                <span className="text-[8px] sm:text-[9px] font-extrabold text-amber-600 uppercase tracking-widest">
                  Destaque
                </span>
              </div>
            )}

            {p.product_variants?.length > 0 && (
              <span className="text-[8px] sm:text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                {p.product_variants.length} var
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between items-end h-full py-0.5">
        <ProductActions
          p={p}
          store={store}
          navigate={navigate}
          duplicateProduct={duplicateProduct}
          deleteProduct={deleteProduct}
        />
      </div>
    </div>
  );
}

function ProductActions({ p, store, navigate, duplicateProduct, deleteProduct }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-muted/80">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[180px] rounded-xl border-border/40 shadow-xl shadow-black/5 p-1"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Ações
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        <DropdownMenuItem
          className="rounded-lg gap-2 cursor-pointer font-medium text-sm"
          onClick={() => navigate({ to: "/admin/produtos/$id", params: { id: p.id } })}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" /> Editar Produto
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-lg gap-2 cursor-pointer font-medium text-sm"
          onClick={() => duplicateProduct(p)}
        >
          <Copy className="h-4 w-4 text-muted-foreground" /> Duplicar Item
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-lg gap-2 cursor-pointer font-medium text-sm">
          <a href={`/loja/${store?.slug}/produto/${p.id}`} target="_blank" rel="noreferrer">
            <Eye className="h-4 w-4 text-muted-foreground" /> Ver na Vitrine
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/40" />
        <DropdownMenuItem
          className="rounded-lg gap-2 cursor-pointer font-medium text-sm text-destructive focus:text-destructive focus:bg-destructive/5"
          onClick={() => deleteProduct(p.id)}
        >
          <Trash2 className="h-4 w-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
