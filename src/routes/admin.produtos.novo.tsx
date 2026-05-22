import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiImageUpload, ImageUpload } from "@/components/image-upload";
import {
  ChevronRight,
  Package,
  Save,
  Tag,
  BadgeDollarSign,
  Settings,
  Image as ImageIcon,
  Plus,
  Trash2,
  CopyPlus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SmartSizeGrid } from "@/components/admin/SmartSizeGrid";

export const Route = createFileRoute("/admin/produtos/novo")({
  component: NewProduct,
});

type Variant = {
  id?: string;
  size: string;
  color: string;
  numbering: string;
};

function NewProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});
  const [colorActive, setColorActive] = useState<Record<string, boolean>>({});
  const [varTypes, setVarTypes] = useState({ cores: true, tamanhos: true, numeracao: true });
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "0",
    compare_at_price: "",
    category_id: "",
    active: true,
    featured: false,
    has_variations: false,
  });

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

  const { data: cats } = useQuery({
    queryKey: ["cats-for-new-product", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,parent_id")
        .eq("store_id", store!.id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [deptId, setDeptId] = useState("");
  const departments = (cats ?? []).filter((c: any) => !c.parent_id);
  const subcategories = (cats ?? []).filter((c: any) => c.parent_id === deptId);

  async function create() {
    if (!store) return;
    if (!form.name) return toast.error("O nome do produto é obrigatório");

    setBusy(true);
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        store_id: store.id,
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        compare_at_price: form.compare_at_price === "" ? null : Number(form.compare_at_price),
        category_id: form.category_id || null,
        active: form.active,
        featured: form.featured,
        has_variations: form.has_variations,
      })
      .select()
      .single();

    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }

    // Salvar imagens
    if (images.length > 0) {
      await supabase
        .from("product_images")
        .insert(images.map((url, i) => ({ product_id: product.id, url, position: i })));
    }

    // Salvar variações
    if (form.has_variations) {
      const validVariants = variants.filter((v) => v.size || v.color || v.numbering);
      if (validVariants.length) {
        await supabase.from("product_variants").insert(
          validVariants.map((v) => ({
            product_id: product.id,
            size: v.size || null,
            color: v.color || null,
            numbering: v.numbering || null,
            is_active: colorActive[(v.color ?? "").trim()] ?? true,
          })),
        );
      }

      // Salvar imagens das cores
      const colorRows: {
        product_id: string;
        color: string;
        image_url: string;
        position: number;
      }[] = [];
      for (const [color, urls] of Object.entries(colorImages)) {
        if (!color) continue;
        urls.forEach((image_url, position) => {
          if (image_url) colorRows.push({ product_id: product.id, color, image_url, position });
        });
      }
      if (colorRows.length) {
        await supabase.from("product_color_images").insert(colorRows);
      }
    }

    toast.success("Produto criado com sucesso!");
    navigate({ to: "/admin/produtos" });
  }

  if (!store) return null;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/admin/produtos" className="hover:text-foreground">
              Produtos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Novo Produto</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Criar Produto</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/produtos" })}>
            Cancelar
          </Button>
          <Button size="sm" onClick={create} disabled={busy}>
            <Save className="mr-2 h-4 w-4" /> {busy ? "Criando..." : "Criar produto"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Informações Básicas
              </CardTitle>
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

          {/* Grade e Variações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Grade de Cores e Tamanhos
              </CardTitle>
              <CardDescription>
                Configure as variações disponíveis para este produto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Passo 1: Possui variações? */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Este produto possui variações?</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="has_variations_novo"
                      checked={!form.has_variations}
                      onChange={() => setForm({ ...form, has_variations: false })}
                      className="accent-primary h-4 w-4"
                    />
                    <span className="text-sm">Não</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="has_variations_novo"
                      checked={!!form.has_variations}
                      onChange={() => setForm({ ...form, has_variations: true })}
                      className="accent-primary h-4 w-4"
                    />
                    <span className="text-sm">Sim</span>
                  </label>
                </div>
              </div>

              {!form.has_variations && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 w-fit">
                  <span className="text-green-600 text-sm">✓</span>
                  <span className="text-sm text-green-700 font-medium">
                    Produto simples (sem variações)
                  </span>
                </div>
              )}

              {!!form.has_variations && (
                <div className="space-y-6">
                  {/* Passo 2: Quais variações? */}
                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-semibold">Quais variações deseja cadastrar?</p>
                    <div className="flex flex-wrap gap-5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={varTypes.cores}
                          onCheckedChange={(c) => setVarTypes({ ...varTypes, cores: !!c })}
                        />
                        <span className="text-sm">Cores</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={varTypes.tamanhos || varTypes.numeracao}
                          onCheckedChange={(c) =>
                            setVarTypes({ ...varTypes, tamanhos: !!c, numeracao: !!c })
                          }
                        />
                        <span className="text-sm">Tamanhos / Numeração</span>
                      </label>
                    </div>
                  </div>

                  <VariantsEditor
                    variants={variants}
                    setVariants={setVariants}
                    colorImages={colorImages}
                    setColorImages={setColorImages}
                    colorActive={colorActive}
                    setColorActive={setColorActive}
                    varTypes={varTypes}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Imagens do Produto
              </CardTitle>
              <CardDescription>
                {form.has_variations
                  ? "Imagem de capa do produto (cada cor terá suas próprias fotos)"
                  : "A primeira imagem será a capa da vitrine"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {form.has_variations ? (
                <ImageUpload
                  value={images[0] ?? null}
                  onChange={(url) => setImages(url ? [url, ...images.slice(1)] : images.slice(1))}
                  label="Capa do produto"
                />
              ) : (
                <MultiImageUpload values={images} onChange={setImages} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
                  placeholder="Opcional"
                />
              </div>
            </CardContent>
          </Card>

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
                  value={deptId || "none"}
                  onValueChange={(v) => {
                    setDeptId(v === "none" ? "" : v);
                    setForm({ ...form, category_id: "" });
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
                  disabled={!deptId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={deptId ? "Selecione" : "Escolha um departamento"} />
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Publicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativo</Label>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(c) => setForm({ ...form, active: c })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Destaque</Label>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(c) => setForm({ ...form, featured: c })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const COMMON_SIZES = ["PP", "P", "M", "G", "GG", "XG", "Único"];

function VariantsEditor({
  variants,
  setVariants,
  colorImages,
  setColorImages,
  colorActive,
  setColorActive,
  varTypes,
}: {
  variants: Variant[];
  setVariants: (v: Variant[]) => void;
  colorImages: Record<string, string[]>;
  setColorImages: (v: Record<string, string[]>) => void;
  colorActive: Record<string, boolean>;
  setColorActive: (v: Record<string, boolean>) => void;
  varTypes: { cores: boolean; tamanhos: boolean; numeracao: boolean };
}) {
  const [newColorAdded, setNewColorAdded] = useState<string | null>(null);
  const colorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const colors = Array.from(new Set(variants.map((v) => (v.color ?? "").trim()).filter(Boolean)));

  useEffect(() => {
    if (newColorAdded && colorRefs.current[newColorAdded]) {
      colorRefs.current[newColorAdded]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const input = colorRefs.current[newColorAdded]?.querySelector("input");
      if (input) (input as HTMLInputElement).focus();
      setNewColorAdded(null);
    }
  }, [newColorAdded, colors]);

  function addColor(name: string) {
    const color = name.trim();
    if (!color || colors.includes(color)) return;
    setVariants([{ size: "", color, numbering: "" }, ...variants]);
    setColorActive({ ...colorActive, [color]: true });
    setNewColorAdded(color);
  }

  function removeColor(color: string) {
    setVariants(variants.filter((v) => v.color !== color));
    const nextImages = { ...colorImages };
    delete nextImages[color];
    setColorImages(nextImages);
    const nextActive = { ...colorActive };
    delete nextActive[color];
    setColorActive(nextActive);
  }

  function duplicateColor(color: string) {
    let newName = `${color} (Cópia)`;
    let counter = 2;
    while (colors.includes(newName)) {
      newName = `${color} (Cópia ${counter++})`;
    }
    const rows = variants.filter((v) => v.color === color);
    const duplicatedRows = rows.map((v) => ({ ...v, id: undefined, color: newName }));
    setVariants([...variants, ...duplicatedRows]);
    setColorActive({ ...colorActive, [newName]: colorActive[color] ?? true });
    if (colorImages[color]) {
      setColorImages({ ...colorImages, [newName]: [...colorImages[color]] });
    }
    setNewColorAdded(newName);
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
    const nextActive = { ...colorActive };
    if (oldName in nextActive) {
      nextActive[next] = nextActive[oldName];
      delete nextActive[oldName];
    }
    setColorActive(nextActive);
  }

  function toggleColorActive(color: string, active: boolean) {
    setColorActive({ ...colorActive, [color]: active });
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
              className={cn(
                "rounded-xl border border-border bg-card overflow-hidden transition-opacity",
                colorActive[color] === false && "opacity-50",
              )}
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
                    {colorActive[color] === false && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={colorActive[color] !== false}
                      onCheckedChange={(checked) => toggleColorActive(color, checked)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateColor(color)}
                      title="Duplicar cor"
                    >
                      <CopyPlus className="h-4 w-4" />
                    </Button>
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
              </div>

              <div className="p-4 space-y-6">
                {/* Imagens da Cor — visível só se "Cores" selecionado */}
                {varTypes.cores && (
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
                )}

                {/* Separador só se há imagens E tamanhos/numeração */}
                {varTypes.cores && (varTypes.tamanhos || varTypes.numeracao) && <Separator />}

                {/* Tamanhos / Numeração — grade inteligente */}
                {(varTypes.tamanhos || varTypes.numeracao) && (
                  <SmartSizeGrid
                    color={color}
                    sizeRows={sizeRows}
                    toggleSize={toggleSize}
                  />
                )}
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
