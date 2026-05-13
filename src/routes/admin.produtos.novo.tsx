import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiImageUpload } from "@/components/image-upload";
import {
  ChevronRight,
  Package,
  Save,
  Tag,
  BadgeDollarSign,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/produtos/novo")({
  component: NewProduct,
});

function NewProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([]);
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

          {/* Grade */}
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
                  ? "Você poderá adicionar variações após salvar o produto."
                  : "Este produto será vendido como item único."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {form.has_variations && (
                <p className="text-sm text-muted-foreground italic">
                  Opções de grade (cor/tamanho) ficarão disponíveis na tela de edição logo após a
                  criação.
                </p>
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
