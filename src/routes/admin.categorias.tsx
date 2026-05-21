import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesPage,
});

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  store_id: string;
  position: number;
};

function CategoriesPage() {
  const { user } = useAuth();
  const [deptName, setDeptName] = useState("");
  const [orderedDepts, setOrderedDepts] = useState<Category[]>([]);

  const { data: store } = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("stores").select("*").eq("owner_id", user!.id).maybeSingle()).data,
  });

  const { data: cats, refetch } = useQuery({
    queryKey: ["categories", store?.id],
    enabled: !!store,
    queryFn: async () =>
      ((await supabase.from("categories").select("*").eq("store_id", store!.id).order("position"))
        .data ?? []) as Category[],
  });

  useEffect(() => {
    const depts = (cats ?? []).filter((c) => !c.parent_id);
    setOrderedDepts(depts);
  }, [cats]);

  const childrenOf = (id: string) =>
    (cats ?? []).filter((c) => c.parent_id === id).sort((a, b) => a.position - b.position);

  const deptSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDeptDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedDepts.findIndex((d) => d.id === active.id);
    const newIndex = orderedDepts.findIndex((d) => d.id === over.id);
    const newOrder = arrayMove(orderedDepts, oldIndex, newIndex);
    setOrderedDepts(newOrder);
    await Promise.all(
      newOrder.map((dept, idx) =>
        supabase.from("categories").update({ position: idx }).eq("id", dept.id),
      ),
    );
  }

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName.trim() || !store) return;
    const { error } = await supabase.from("categories").insert({
      store_id: store.id,
      name: deptName.trim(),
      parent_id: null,
      position: orderedDepts.length,
    });
    if (error) toast.error(error.message);
    else {
      setDeptName("");
      refetch();
    }
  }

  async function addSub(parentId: string, name: string) {
    if (!name.trim() || !store) return;
    const { data: inserted, error } = await supabase
      .from("categories")
      .insert({ store_id: store.id, name: name.trim(), parent_id: parentId })
      .select();
    if (error) {
      toast.error(error.message);
      return;
    }
    const currentSubs = childrenOf(parentId);
    const newPosition = currentSubs.length;
    await supabase
      .from("categories")
      .update({ position: newPosition })
      .eq("id", (inserted ?? [])[0]?.id);
    refetch();
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
          Crie departamentos (ex: Masculino, Feminino) e adicione subcategorias dentro deles (ex:
          Blusas, Shorts, Saias). Arraste para reordenar.
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
        {orderedDepts.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum departamento ainda.
          </p>
        )}
        <DndContext
          sensors={deptSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDeptDragEnd}
        >
          <SortableContext
            items={orderedDepts.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedDepts.map((dept) => (
              <SortableDepartmentCard
                key={dept.id}
                dept={dept}
                subs={childrenOf(dept.id)}
                onAddSub={(name) => addSub(dept.id, name)}
                onRemove={remove}
                onRename={rename}
              />
            ))}
          </SortableContext>
        </DndContext>
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onSave(val);
            setEditing(false);
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setVal(name);
            setEditing(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className={textClass}>{name}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setVal(name);
            setEditing(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SortableDepartmentCard(props: React.ComponentProps<typeof DepartmentCard>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.dept.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <DepartmentCard {...props} dragHandle={{ attributes, listeners }} />
    </div>
  );
}

function DepartmentCard({
  dept,
  subs,
  onAddSub,
  onRemove,
  onRename,
  dragHandle,
}: {
  dept: Category;
  subs: Category[];
  onAddSub: (name: string) => Promise<void>;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  dragHandle?: { attributes: any; listeners: any };
}) {
  const [val, setVal] = useState("");
  const [orderedSubs, setOrderedSubs] = useState<Category[]>([]);

  // Sync when subs prop changes (after refetch): preserve DB order
  useEffect(() => {
    setOrderedSubs([...subs]);
  }, [subs]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSubs.findIndex((s) => s.id === active.id);
    const newIndex = orderedSubs.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(orderedSubs, oldIndex, newIndex);
    setOrderedSubs(newOrder);

    // Save positions to DB
    await Promise.all(
      newOrder.map((sub, idx) =>
        supabase.from("categories").update({ position: idx }).eq("id", sub.id),
      ),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onAddSub(val);
    setVal("");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        {dragHandle && (
          <button
            {...dragHandle.attributes}
            {...dragHandle.listeners}
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0"
            aria-label="Arrastar departamento"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <EditableRow
            name={dept.name}
            textClass="text-lg font-semibold"
            onSave={(v) => onRename(dept.id, v)}
            onRemove={() => onRemove(dept.id)}
          />
        </div>
      </div>

      <div className="mt-4 divide-y rounded-xl border border-border">
        {orderedSubs.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma subcategoria.</p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={orderedSubs.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedSubs.map((s) => (
              <SortableSubRow
                key={s.id}
                sub={s}
                onSave={(v) => onRename(s.id, v)}
                onRemove={() => onRemove(s.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
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

function SortableSubRow({
  sub,
  onSave,
  onRemove,
}: {
  sub: Category;
  onSave: (v: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sub.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 px-4 py-2.5 bg-card">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing mr-1"
        aria-label="Arrastar para reordenar"
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <EditableRow name={sub.name} onSave={onSave} onRemove={onRemove} />
      </div>
    </div>
  );
}
