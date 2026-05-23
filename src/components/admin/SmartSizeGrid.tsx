import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

type Variant = {
  id?: string;
  size: string;
  color: string;
  numbering: string;
};

type SizeType = "calcados" | "roupas" | "personalizado";

const SIZE_PRESETS: Record<"calcados" | "roupas", { label: string; sizes: string[] }[]> = {
  calcados: [
    { label: "Feminino 33–39", sizes: ["33", "34", "35", "36", "37", "38", "39"] },
    { label: "Masculino 38–44", sizes: ["38", "39", "40", "41", "42", "43", "44"] },
    {
      label: "Infantil 20–34",
      sizes: Array.from({ length: 15 }, (_, i) => String(20 + i)),
    },
  ],
  roupas: [
    { label: "PP P M G GG", sizes: ["PP", "P", "M", "G", "GG"] },
    { label: "P M G GG XG", sizes: ["P", "M", "G", "GG", "XG"] },
  ],
};

const CLOTHES_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EXG", "Único"];

function sortSizes(sizes: string[]): string[] {
  const allNumeric = sizes.every((s) => /^\d+([.,]\d+)?$/.test(s));
  if (allNumeric) {
    return [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b));
  }
  const clothesSet = new Set(CLOTHES_ORDER);
  const allClothes = sizes.every((s) => clothesSet.has(s));
  if (allClothes) {
    return [...sizes].sort(
      (a, b) => (CLOTHES_ORDER.indexOf(a) ?? 99) - (CLOTHES_ORDER.indexOf(b) ?? 99),
    );
  }
  // Misto: numéricos primeiro em ordem crescente, depois os demais
  return [...sizes].sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    const aNum = !isNaN(na);
    const bNum = !isNaN(nb);
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    const ai = CLOTHES_ORDER.indexOf(a);
    const bi = CLOTHES_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    return a.localeCompare(b);
  });
}

function parseSizeInput(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  // Intervalo numérico: 35-44, 35–44 ou até invertido 44-35
  const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    let start = parseInt(rangeMatch[1], 10);
    let end = parseInt(rangeMatch[2], 10);
    if (start > end) [start, end] = [end, start]; // aceita intervalo invertido
    if (!isNaN(start) && !isNaN(end) && end - start <= 50) {
      return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
    }
  }
  // Separado por vírgula ou ponto-e-vírgula — ordena numéricos em ascendente
  const parts = trimmed
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const allNumeric = parts.every((s) => /^\d+$/.test(s));
  if (allNumeric) return parts.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  return parts;
}

export function SmartSizeGrid({
  color,
  sizeRows,
  toggleSize,
  addSizes,
}: {
  color: string;
  sizeRows: Variant[];
  toggleSize: (color: string, size: string) => void;
  addSizes: (color: string, sizes: string[]) => void;
}) {
  const [sizeType, setSizeType] = useState<SizeType>("calcados");
  const [manualInput, setManualInput] = useState("");

  const selectedSizes = sizeRows.map((r) => r.size).filter(Boolean);

  function applyPreset(sizes: string[]) {
    const toAdd = sizes.filter((s) => !selectedSizes.includes(s));
    if (toAdd.length) addSizes(color, toAdd);
  }

  function applyManual() {
    const parsed = parseSizeInput(manualInput);
    const toAdd = parsed.filter((s) => s && !selectedSizes.includes(s));
    if (toAdd.length) addSizes(color, toAdd);
    setManualInput("");
  }

  const presets = sizeType !== "personalizado" ? SIZE_PRESETS[sizeType] : [];

  return (
    <div className="space-y-4">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
        Tamanhos / Numeração
      </Label>

      {/* Tipo */}
      <div className="flex flex-wrap gap-4">
        {(["calcados", "roupas", "personalizado"] as SizeType[]).map((t) => (
          <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              name={`size-type-${color}`}
              checked={sizeType === t}
              onChange={() => setSizeType(t)}
              className="accent-primary h-4 w-4"
            />
            <span className="text-sm">
              {t === "calcados" ? "Calçados" : t === "roupas" ? "Roupas" : "Personalizado"}
            </span>
          </label>
        ))}
      </div>

      {/* Sugestões rápidas */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Sugestões rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => applyPreset(p.sizes)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input manual */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          Digite ou cole: <code className="bg-muted px-1 rounded text-xs">35-44</code>
          {" · "}
          <code className="bg-muted px-1 rounded text-xs">35,36,37</code>
          {" · "}
          <code className="bg-muted px-1 rounded text-xs">PP,P,M,G</code>
          {" · "}
          <code className="bg-muted px-1 rounded text-xs">Único</code>
        </p>
        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Ex: 35-44 ou PP,P,M,G"
            className="h-9 max-w-[240px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyManual();
              }
            }}
          />
          <Button type="button" variant="secondary" size="sm" className="h-9" onClick={applyManual}>
            Adicionar
          </Button>
        </div>
      </div>

      {/* Chips selecionados */}
      {selectedSizes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortSizes(sizeRows.filter((r) => r.size).map((r) => r.size)).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(color, size)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
            >
              {size}
              <span className="text-xs opacity-75">✓</span>
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Nenhum tamanho selecionado</p>
      )}
    </div>
  );
}
