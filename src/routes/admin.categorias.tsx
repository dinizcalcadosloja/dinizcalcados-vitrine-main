import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesPage,
});

type Category = { id: string; name: string; parent_id: string | null; store_id: string; position: number };

function CategoriesPage() {
  const { user } = useAuth();
  const [deptName, setDeptName] = useState("");

  const { data: store } = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("stores").select("*").eq("owner_id", user!.id).maybeSingle()).data,
  });

  const { data: cats, refetch } = useQuery({
    queryKey: ["categories", store?.id],
    enabled: !!store,
    queryFn: async () =>
      ((await supabase.from("categories").select("*").eq("store_id", store!.id).order("position")).data ?? []) as Category[],
  });

  const departments = (cats ?? []).filter((c) => !c.parent_id);
  const childrenOf = (id: string) => (cats ?? []).filter((c) => c.parent_id === id);

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName.trim() || !store) return;
    const { error } = await supabase.from("categories").insert({ store_id: store.id, name: deptName.trim(), parent_id: null });
    if (error) toast.error(error.message);
    else { setDeptName(""); refetch(); }
  }

  async function addSub(parentId: string, name: string) {
    if (!name.trim() || !store) return;
    const { error } = await supabase
      .from("categories")
      .insert({ store_id: store.id, name: name.trim(), parent_id: parentId });
    if (error) toast.error(error.message);
    else refetch();
  }

  async function remove(id: string) {
    if (!confirm("Excluir? Subcategorias também serão removidas.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refetch();
  }

  async function rename(id: string, name: string) {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", id);
    if (error) toast.error(error.message);
    else refetch();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie departamentos (ex: Masculino, Feminino) e adicione subcategorias dentro deles (ex: Blusas, Shorts, Saias).
        </p>
      </div>

      <form onSubmit={addDepartment} className="flex gap-2">
        <Input
          placeholder="Novo departamento (ex: Masculino)"
          value={deptName}
          onChange={(e) => setDeptName(e.target.value)}
        />
        <Button type="submit">
          <Plus className="mr-1 h-4 w-4" /> Departamento
        </Button>
      </form>

      <div className="space-y-4">
        {departments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum departamento ainda.
          </p>
        )}
        {departments.map((dept) => (
          <DepartmentCard
            key={dept.id}
            dept={dept}
            subs={childrenOf(dept.id)}
            onAddSub={(name) => addSub(dept.id, name)}
            onRemove={remove}
            onRename={rename}
          />
        ))}
      </div>
    </div>
  );
}

function EditableRow({
  name,
  onSave,
  onRemove,
  className = "",
  textClass = "text-sm",
}: {
  name: string;
  onSave: (v: string) => void;
  onRemove: () => void;
  className?: string;
  textClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);

  if (editing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
        <Button variant="ghost" size="icon" onClick={() => { onSave(val); setEditing(false); }}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { setVal(name); setEditing(false); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className={textClass}>{name}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setVal(name); setEditing(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DepartmentCard({
  dept,
  subs,
  onAddSub,
  onRemove,
  onRename,
}: {
  dept: Category;
  subs: Category[];
  onAddSub: (name: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [val, setVal] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAddSub(val);
    setVal("");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <EditableRow
        name={dept.name}
        textClass="text-lg font-semibold"
        onSave={(v) => onRename(dept.id, v)}
        onRemove={() => onRemove(dept.id)}
      />

      <div className="mt-4 divide-y rounded-xl border border-border">
        {subs.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma subcategoria.</p>}
        {subs.map((s) => (
          <EditableRow
            key={s.id}
            name={s.name}
            className="px-4 py-2.5"
            onSave={(v) => onRename(s.id, v)}
            onRemove={() => onRemove(s.id)}
          />
        ))}
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <Input
          placeholder="Nova subcategoria (ex: Blusas)"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </form>
    </div>
  );
}
