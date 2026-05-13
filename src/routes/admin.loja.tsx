import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/loja")({
  component: StoreSettings,
});

function StoreSettings() {
  const { user } = useAuth();
  const { data: store, refetch } = useQuery({
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

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (store) setForm(store);
  }, [store]);

  if (!form) return <p className="text-muted-foreground">Carregando…</p>;

  function normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    // Validar slug
    if (!form.slug || form.slug.trim() === "") {
      toast.error("O slug não pode estar vazio");
      return;
    }

    // Verificar se o slug já existe (se foi alterado)
    if (store && form.slug !== store.slug) {
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", form.slug)
        .neq("id", form.id)
        .maybeSingle();

      if (existingStore) {
        toast.error("Este slug já está em uso por outra loja");
        return;
      }
    }

    const { error } = await supabase
      .from("stores")
      .update({
        name: form.name,
        slug: form.slug,
        description: form.description,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        logo_url: form.logo_url,
        banner_url: form.banner_url,
        theme_color: form.theme_color,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
      })
      .eq("id", form.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Loja atualizada");
      refetch();
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Minha Loja</h1>
      <form onSubmit={save} className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageUpload
              value={form.logo_url}
              onChange={(u) => setForm({ ...form, logo_url: u })}
              label="Logo"
            />
          </div>
          <div className="space-y-2">
            <Label>Banner</Label>
            <ImageUpload
              value={form.banner_url}
              onChange={(u) => setForm({ ...form, banner_url: u })}
              label="Banner"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="font-medium">Endereço</h3>
          <div className="space-y-2">
            <Label>Rua e número</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Rua Exemplo, 123"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={form.city ?? ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={form.state ?? ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={form.zip_code ?? ""}
                onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                placeholder="12345-678"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="font-medium">Redes Sociais e Contato</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>WhatsApp (com DDD)</Label>
              <Input
                value={form.whatsapp ?? ""}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="11999998888"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={form.instagram ?? ""}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@sualoja ou https://instagram.com/sualoja"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do tema</Label>
          <Input
            type="color"
            value={form.theme_color ?? "#0f172a"}
            onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
          />
        </div>
        <Button type="submit">Salvar alterações</Button>
      </form>
    </div>
  );
}
