import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiImageUpload } from "@/components/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Copy,
  ExternalLink,
  ChevronRight,
  Package,
  Image as ImageIcon,
  Settings,
  Tag,
  BadgeDollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: ProductEditor,
});

type Variant = {
  id?: string;
  size: string;
  color: string;
  numbering: string;
};

function ProductEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const {
    data: product,
    refetch,
    isLoading: loadingProduct,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*), product_variants(*), product_color_images(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: store } = useQuery({
    queryKey: ["admin-store", product?.store_id],
    enabled: !!product?.store_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", product!.store_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: cats } = useQuery({
    queryKey: ["cats-for-product", product?.store_id],
    enabled: !!product?.store_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,parent_id")
        .eq("store_id", product!.store_id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [deptOverride, setDeptOverride] = useState<string>("");
  const departments = (cats ?? []).filter((c: any) => !c.parent_id);
  const selectedCat = (cats ?? []).find((c: any) => c.id === form?.category_id);
  const departmentId = deptOverride || selectedCat?.parent_id || "";
  const subcategories = (cats ?? []).filter((c: any) => c.parent_id === departmentId);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        compare_at_price: product.compare_at_price ?? "",
        category_id: product.category_id ?? "",
        featured: product.featured,
        active: product.active,
        has_variations: product.has_variations,
      });
      setImages(
        (product.product_images ?? [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((i: any) => i.url),
      );
      setVariants(
        (product.product_variants ?? []).map((v: any) => ({
          id: v.id,
          size: v.size ?? "",
          color: v.color ?? "",
          numbering: v.numbering ?? "",
        })),
      );
      const ci: Record<string, string[]> = {};
      const sorted = [...((product as any).product_color_images ?? [])].sort(
        (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0),
      );
      for (const c of sorted) {
        ci[c.color] = ci[c.color] ? [...ci[c.color], c.image_url] : [c.image_url];
      }
      setColorImages(ci);
    }
  }, [product]);

  if (loadingProduct || !form) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Carregando detalhes do produto...</p>
      </div>
    );
  }

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        compare_at_price: form.compare_at_price === "" ? null : Number(form.compare_at_price),
        category_id: form.category_id || null,
        featured: form.featured,
        active: form.active,
        has_variations: form.has_variations,
      })
      .eq("id", id);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }

    // Sync images: delete all then insert
    await supabase.from("product_images").delete().eq("product_id", id);
    if (images.length) {
      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(images.map((url, i) => ({ product_id: id, url, position: i })));

      if (imagesError) {
        setBusy(false);
        return toast.error(`Erro ao salvar imagens: ${imagesError.message}`);
      }
    }

    // Sync variants
    await supabase.from("product_variants").delete().eq("product_id", id);
    const validVariants = variants.filter((v) => v.size || v.color || v.numbering);
    if (validVariants.length) {
      const { error: variantsError } = await supabase.from("product_variants").insert(
        validVariants.map((v) => ({
          product_id: id,
          size: v.size || null,
          color: v.color || null,
          numbering: v.numbering || null,
        })),
      );

      if (variantsError) {
        setBusy(false);
        return toast.error(`Erro ao salvar variações: ${variantsError.message}`);
      }
    }

    // Sync color images
    await supabase.from("product_color_images").delete().eq("product_id", id);
    const colorRows: { product_id: string; color: string; image_url: string; position: number }[] =
      [];
    for (const [color, urls] of Object.entries(colorImages)) {
      if (!color) continue;
      urls.forEach((image_url, position) => {
        if (image_url) colorRows.push({ product_id: id, color, image_url, position });
      });
    }
    if (colorRows.length) {
      const { error: colorImagesError } = await supabase
        .from("product_color_images")
        .insert(colorRows);

      if (colorImagesError) {
        setBusy(false);
        return toast.error(`Erro ao salvar imagens de cores: ${colorImagesError.message}`);
      }
    }

    setBusy(false);
    toast.success("Produto atualizado com sucesso!");
    await refetch();
  }

  async function remove() {
    if (!confirm("Excluir produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Excluído");
    navigate({ to: "/admin/produtos" });
  }

  async function duplicate() {
    setShowDuplicateDialog(false);
    setBusy(true);

    // Criar cópia do produto
    if (!product) return;

    const { data: newProduct, error: productError } = await supabase
      .from("products")
      .insert({
        store_id: product.store_id,
        name: `${form.name} (Cópia)`,
        description: form.description,
        price: Number(form.price) || 0,
        compare_at_price: form.compare_at_price === "" ? null : Number(form.compare_at_price),
        category_id: form.category_id || null,
        featured: false, // Não deixar em destaque por padrão
        active: false, // Deixar inativo inicialmente
        has_variations: form.has_variations,
      })
      .select()
      .single();

    if (productError || !newProduct) {
      setBusy(false);
      return toast.error("Erro ao duplicar produto");
    }

    // Copiar imagens
    if (images.length) {
      await supabase
        .from("product_images")
        .insert(images.map((url, i) => ({ product_id: newProduct.id, url, position: i })));
    }

    // Copiar variantes
    const validVariants = variants.filter((v) => v.size || v.color || v.numbering);
    if (validVariants.length) {
      await supabase.from("product_variants").insert(
        validVariants.map((v) => ({
          product_id: newProduct.id,
          size: v.size || null,
          color: v.color || null,
          numbering: v.numbering || null,
        })),
      );
    }

    // Copiar imagens de cores
    const colorRows: { product_id: string; color: string; image_url: string; position: number }[] =
      [];
    for (const [color, urls] of Object.entries(colorImages)) {
      if (!color) continue;
      urls.forEach((image_url, position) => {
        if (image_url) colorRows.push({ product_id: newProduct.id, color, image_url, position });
      });
    }
    if (colorRows.length) {
      await supabase.from("product_color_images").insert(colorRows);
    }

    setBusy(false);
    toast.success("Produto duplicado com sucesso!");
    navigate({ to: "/admin/produtos/$id", params: { id: newProduct.id } });
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/admin/produtos" className="hover:text-foreground">
              Produtos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Editar Produto</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{form.name || "Sem nome"}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDuplicateDialog(true)}
            disabled={busy}
            className="hidden sm:flex"
          >
            <Copy className="mr-2 h-4 w-4" /> Duplicar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={remove}
            disabled={busy}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
          <Button size="sm" onClick={save} disabled={busy}>
            <Save className="mr-2 h-4 w-4" /> {busy ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso criará uma cópia completa deste produto. O novo produto ficará como rascunho por
              padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={duplicate}>Duplicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Informações Básicas
              </CardTitle>
              <CardDescription>Nome e descrição principal do produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do produto</Label>
                <Input
                  id="name"
                  placeholder="Ex: Camiseta Oversized Algodão"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Textarea
                  id="desc"
                  placeholder="Descreva os detalhes do seu produto..."
                  rows={6}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Imagens do Produto
              </CardTitle>
              <CardDescription>A primeira imagem será a capa da vitrine</CardDescription>
            </CardHeader>
            <CardContent>
              <MultiImageUpload values={images} onChange={setImages} />
            </CardContent>
          </Card>

          {/* Grade e Variações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Grade de Cores e Tamanhos
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="has_variations" className="text-xs font-normal">
                    Possui variações?
                  </Label>
                  <Switch
                    id="has_variations"
                    checked={form.has_variations}
                    onCheckedChange={(c) => setForm({ ...form, has_variations: c })}
                  />
                </div>
              </CardTitle>
              <CardDescription>
                {form.has_variations
                  ? "Gerencie as cores e tamanhos disponíveis para este produto"
                  : "Este produto será vendido como item único"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {form.has_variations ? (
                <VariantsEditor
                  variants={variants}
                  setVariants={setVariants}
                  colorImages={colorImages}
                  setColorImages={setColorImages}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  O produto será exibido sem opções de escolha para o cliente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Preço e Estoque */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-primary" />
                Preço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preço de venda (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço comparativo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.compare_at_price}
                  onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                  placeholder="Ex: 199.90"
                />
                <p className="text-[10px] text-muted-foreground">
                  Exibe o preço riscado (promoção)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Organização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Organização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={departmentId || "none"}
                  onValueChange={(v) => {
                    const next = v === "none" ? "" : v;
                    setDeptOverride(next);
                    if (selectedCat && selectedCat.parent_id !== next) {
                      setForm({ ...form, category_id: "" });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem departamento</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category_id || "none"}
                  onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}
                  disabled={!departmentId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={departmentId ? "Selecione" : "Escolha um departamento"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {subcategories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Status e Visibilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Publicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativo</Label>
                  <p className="text-xs text-muted-foreground">Visível na vitrine</p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(c) => setForm({ ...form, active: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Destaque</Label>
                  <p className="text-xs text-muted-foreground">Topo da página inicial</p>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(c) => setForm({ ...form, featured: c })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ver na loja */}
          {product && (
            <Button variant="outline" className="w-full" asChild>
              <a
                href={`/loja/${store?.slug}/produto/${product.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Ver na vitrine
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const COMMON_SIZES = ["PP", "P", "M", "G", "GG", "XG"];

function VariantsEditor({
  variants,
  setVariants,
  colorImages,
  setColorImages,
}: {
  variants: Variant[];
  setVariants: (v: Variant[]) => void;
  colorImages: Record<string, string[]>;
  setColorImages: (v: Record<string, string[]>) => void;
}) {
  const [newColorAdded, setNewColorAdded] = useState<string | null>(null);
  const colorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // group by color
  const colors = Array.from(new Set(variants.map((v) => (v.color ?? "").trim()).filter(Boolean)));

  useEffect(() => {
    if (newColorAdded && colorRefs.current[newColorAdded]) {
      colorRefs.current[newColorAdded]?.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = colorRefs.current[newColorAdded]?.querySelector("input");
      if (input) (input as HTMLInputElement).focus();
      setNewColorAdded(null);
    }
  }, [newColorAdded, colors]);

  function addColor(name: string) {
    const color = name.trim();
    if (!color || colors.includes(color)) return;
    setVariants([...variants, { size: "", color, numbering: "" }]);
    setNewColorAdded(color);
  }

  function removeColor(color: string) {
    setVariants(variants.filter((v) => v.color !== color));
    const nextImages = { ...colorImages };
    delete nextImages[color];
    setColorImages(nextImages);
  }

  function renameColor(oldName: string, newName: string) {
    const next = newName.trim();
    if (!next || next === oldName) return;
    setVariants(variants.map((v) => (v.color === oldName ? { ...v, color: next } : v)));

    if (colorImages[oldName]) {
      const nextImages = { ...colorImages };
      nextImages[next] = nextImages[oldName];
      delete nextImages[oldName];
      setColorImages(nextImages);
    }
  }

  function updateRow(target: Variant, patch: Partial<Variant>) {
    setVariants(variants.map((v) => (v === target ? { ...v, ...patch } : v)));
  }

  function removeRow(target: Variant) {
    setVariants(variants.filter((v) => v !== target));
  }

  function toggleSize(color: string, size: string) {
    const existing = variants.find((v) => v.color === color && v.size === size);
    if (existing) {
      setVariants(variants.filter((v) => v !== existing));
    } else {
      setVariants([...variants, { color, size, numbering: "" }]);
    }
  }

  function addNumberingRow(color: string) {
    setVariants([...variants, { color, size: "", numbering: "" }]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Cores e Grade</Label>
      </div>

      <AddColorInput onAdd={addColor} existing={colors} />

      {colors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Cadastre as cores disponíveis. Para cada cor, escolha os tamanhos da grade.
        </p>
      )}

      <div className="space-y-6">
        {colors.map((color) => {
          const rows = variants.filter((v) => v.color === color);
          const sizeRows = rows.filter((r) => r.size);
          const numberingRows = rows.filter((r) => !r.size);
          return (
            <div
              key={color}
              ref={(el) => {
                colorRefs.current[color] = el;
              }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                    <Input
                      defaultValue={color}
                      onBlur={(e) => renameColor(color, e.target.value)}
                      className="h-8 max-w-[200px] font-bold bg-transparent border-none focus-visible:ring-0 px-0 text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColor(color)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Imagens da Cor */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Fotos desta cor
                  </Label>
                  <MultiImageUpload
                    values={colorImages[color] ?? []}
                    onChange={(urls) => {
                      const next = { ...colorImages };
                      if (urls.length) next[color] = urls;
                      else delete next[color];
                      setColorImages(next);
                    }}
                  />
                </div>

                <Separator />

                {/* Tamanhos */}
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Grade de Tamanhos
                  </Label>

                  <div className="flex flex-wrap gap-2">
                    {COMMON_SIZES.map((s) => {
                      const active = sizeRows.some((r) => r.size === s);
                      return (
                        <Button
                          key={s}
                          type="button"
                          variant={active ? "default" : "outline"}
                          size="sm"
                          className="min-w-[40px]"
                          onClick={() => toggleSize(color, s)}
                        >
                          {s}
                        </Button>
                      );
                    })}
                  </div>

                  {sizeRows.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sizeRows.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/10"
                        >
                          <span className="w-8 h-8 flex items-center justify-center rounded bg-muted text-xs font-bold">
                            {v.size}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => removeRow(v)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {numberingRows.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Numeração Personalizada</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {numberingRows.map((v, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/10"
                          >
                            <Input
                              placeholder="Nº"
                              value={v.numbering}
                              className="h-8"
                              onChange={(e) => updateRow(v, { numbering: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() => removeRow(v)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full border-dashed border-2 hover:border-solid"
                    onClick={() => addNumberingRow(color)}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Adicionar numeração personalizada
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddColorInput({ onAdd, existing }: { onAdd: (s: string) => void; existing: string[] }) {
  const [val, setVal] = useState("");
  function submit() {
    const v = val.trim();
    if (v && !existing.includes(v)) onAdd(v);
    setVal("");
  }
  return (
    <div className="flex gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Adicionar cor (ex: Preto)"
        className="h-10 max-w-[240px]"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button type="button" size="default" onClick={submit} className="h-10">
        <Plus className="mr-2 h-4 w-4" /> Adicionar Cor
      </Button>
    </div>
  );
}

// Removing ColorImagesEditor as it's now integrated into VariantsEditor
