import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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

type CategoryType = "department" | "category" | "brand";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  store_id: string;
  position: number;
  type: CategoryType;
};

const TYPE_LABELS: Record<CategoryType, string> = {
  department: "Departamento",
  category: "Categoria",
  brand: "Marca",
};

const TYPE_COLORS: Record<CategoryType, string> = {
  department: "bg-slate-900 text-white",
  category: "bg-emerald-100 text-emerald-800",
  brand: "bg-blue-100 text-blue-800",
};

/** Flattens the category tree depth-first for use in dropdowns. */
function flattenTree(
  cats: Category[],
  parentId: string | null = null,
  depth = 0,
): Array<{ cat: Category; depth: number }> {
  return cats
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.position - b.position)
    .flatMap((c) => [{ cat: c, depth }, ...flattenTree(cats, c.id, depth + 1)]);
}

function CategoriesPage() {
  const { user } = useAuth();
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<string>("__root__");
  const [newType, setNewType] = useState<CategoryType>("category");

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

  const allCats = cats ?? [];
  const flatList = flattenTree(allCats);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !store) return;
    const parentId = newParentId === "__root__" ? null : newParentId;
    const siblings = allCats.filter((c) => c.parent_id === parentId);
    const { error } = await supabase.from("categories").insert({
      store_id: store.id,
      name: newName.trim(),
      parent_id: parentId,
      position: siblings.length,
      type: newType,
    });
    if (error) toast.error(error.message);
    else {
      setNewName("");
      refetch();
    }
  }

  async function remove(id: string) {
    const hasChildren = allCats.some((c) => c.parent_id === id);
    const msg = hasChildren
      ? "Excluir esta categoria e todas as subcategorias/marcas filhas?"
      : "Excluir esta categoria?";
    if (!confirm(msg)) return;
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

  async function changeType(id: string, type: CategoryType) {
    const { error } = await supabase.from("categories").update({ type }).eq("id", id);
    if (error) toast.error(error.message);
    else refetch();
  }

  async function handleDragEnd(event: DragEndEvent, siblings: Category[]) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = siblings.findIndex((s) => s.id === active.id);
    const newIndex = siblings.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(siblings, oldIndex, newIndex);
    await Promise.all(
      newOrder.map((c, idx) =>
        supabase.from("categories").update({ position: idx }).eq("id", c.id),
      ),
    );
    refetch();
  }

  const roots = allCats.filter((c) => !c.parent_id).sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie departamentos, categorias e marcas com hierarquia ilimitada via pai → filho. Arraste
          para reordenar dentro do mesmo nível.
        </p>
      </div>

      {/* ── Add form ── */}
      <form
        onSubmit={addCategory}
        className="rounded-2xl border border-border bg-card p-5 space-y-4"
      >
        <p className="text-sm font-semibold">Nova categoria</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Nome (ex: Adidas, Tênis Esportivos…)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Select value={newType} onValueChange={(v) => setNewType(v as CategoryType)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Departamento</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
              <SelectItem value="brand">Marca</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={newParentId} onValueChange={setNewParentId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Categoria pai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__root__">— Raiz (sem pai)</SelectItem>
              {flatList.map(({ cat, depth }) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {"\u00a0\u00a0".repeat(depth) + (depth > 0 ? "└\u00a0" : "") + cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!newName.trim()}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </form>

      {/* ── Tree ── */}
      {roots.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma categoria ainda. Use o formulário acima para começar.
        </p>
      ) : (
        <CategoryLevel
          cats={allCats}
          siblings={roots}
          depth={0}
          onRename={rename}
          onRemove={remove}
          onChangeType={changeType}
          onDragEnd={handleDragEnd}
          store={store}
          refetch={refetch}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Recursive level renderer with per-level DnD
───────────────────────────────────────────────── */

function CategoryLevel({
  cats,
  siblings,
  depth,
  onRename,
  onRemove,
  onChangeType,
  onDragEnd,
  store,
  refetch,
}: {
  cats: Category[];
  siblings: Category[];
  depth: number;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onChangeType: (id: string, type: CategoryType) => void;
  onDragEnd: (event: DragEndEvent, siblings: Category[]) => void;
  store: any;
  refetch: () => void;
}) {
  const [ordered, setOrdered] = useState<Category[]>(siblings);

  useEffect(() => {
    setOrdered([...siblings]);
  }, [siblings]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((c) => c.id === active.id);
    const newIndex = ordered.findIndex((c) => c.id === over.id);
    const newOrder = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(newOrder);
    await Promise.all(
      newOrder.map((c, idx) =>
        supabase.from("categories").update({ position: idx }).eq("id", c.id),
      ),
    );
    refetch();
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
      <SortableContext items={ordered.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div
          className={depth > 0 ? "ml-6 border-l border-border pl-4 space-y-2 mt-2" : "space-y-3"}
        >
          {ordered.map((cat) => (
            <SortableCategoryNode
              key={cat.id}
              cat={cat}
              cats={cats}
              depth={depth}
              onRename={onRename}
              onRemove={onRemove}
              onChangeType={onChangeType}
              onDragEnd={onDragEnd}
              store={store}
              refetch={refetch}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCategoryNode(props: React.ComponentProps<typeof CategoryNode>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.cat.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <CategoryNode {...props} dragHandle={{ attributes, listeners }} />
    </div>
  );
}

function CategoryNode({
  cat,
  cats,
  depth,
  onRename,
  onRemove,
  onChangeType,
  onDragEnd,
  store,
  refetch,
  dragHandle,
}: {
  cat: Category;
  cats: Category[];
  depth: number;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onChangeType: (id: string, type: CategoryType) => void;
  onDragEnd: (event: DragEndEvent, siblings: Category[]) => void;
  store: any;
  refetch: () => void;
  dragHandle?: { attributes: any; listeners: any };
}) {
  const children = cats
    .filter((c) => c.parent_id === cat.id)
    .sort((a, b) => a.position - b.position);
  const hasChildren = children.length > 0;

  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(cat.name);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [childType, setChildType] = useState<CategoryType>(
    cat.type === "department" ? "category" : "brand",
  );

  async function addChild(e: React.FormEvent) {
    e.preventDefault();
    if (!childName.trim() || !store) return;
    const { error } = await supabase.from("categories").insert({
      store_id: store.id,
      name: childName.trim(),
      parent_id: cat.id,
      position: children.length,
      type: childType,
    });
    if (error) toast.error(error.message);
    else {
      setChildName("");
      setShowAddChild(false);
      refetch();
    }
  }

  const wrapClass =
    depth === 0
      ? "rounded-2xl border border-border bg-card p-4"
      : "rounded-xl border border-border bg-muted/30 p-3";

  const nameClass = depth === 0 ? "font-semibold text-base" : "font-medium text-sm";

  const catType: CategoryType = cat.type ?? "category";

  return (
    <div className={wrapClass}>
      {/* Header row */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Drag handle */}
        {dragHandle && (
          <button
            {...dragHandle.attributes}
            {...dragHandle.listeners}
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0"
            aria-label="Arrastar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={expanded ? "Recolher" : "Expandir"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Name */}
        {editing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Input
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              autoFocus
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onRename(cat.id, editVal);
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setEditVal(cat.name);
                  setEditing(false);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                onRename(cat.id, editVal);
                setEditing(false);
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                setEditVal(cat.name);
                setEditing(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <span className={`flex-1 truncate ${nameClass}`}>{cat.name}</span>
        )}

        {/* Type selector (compact badge-style) */}
        {!editing && (
          <Select value={catType} onValueChange={(v) => onChangeType(cat.id, v as CategoryType)}>
            <SelectTrigger className="h-6 px-1.5 border-0 bg-transparent w-auto gap-1 shrink-0 focus:ring-0">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${TYPE_COLORS[catType]}`}
              >
                {TYPE_LABELS[catType]}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Departamento</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
              <SelectItem value="brand">Marca</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Action buttons */}
        {!editing && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setEditVal(cat.name);
                setEditing(true);
              }}
              aria-label="Renomear"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowAddChild((v) => !v)}
              aria-label="Adicionar filho"
              title="Adicionar subcategoria/marca"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(cat.id)}
              aria-label="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Inline add-child form */}
      {showAddChild && (
        <form onSubmit={addChild} className="mt-3 flex flex-wrap gap-2 pl-10">
          <Input
            placeholder="Nome do filho"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            autoFocus
            className="h-8 text-sm flex-1 min-w-0"
          />
          <Select value={childType} onValueChange={(v) => setChildType(v as CategoryType)}>
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Departamento</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
              <SelectItem value="brand">Marca</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" className="h-8" disabled={!childName.trim()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setShowAddChild(false);
              setChildName("");
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}

      {/* Recursive children */}
      {hasChildren && expanded && (
        <CategoryLevel
          cats={cats}
          siblings={children}
          depth={depth + 1}
          onRename={onRename}
          onRemove={onRemove}
          onChangeType={onChangeType}
          onDragEnd={onDragEnd}
          store={store}
          refetch={refetch}
        />
      )}
    </div>
  );
}
