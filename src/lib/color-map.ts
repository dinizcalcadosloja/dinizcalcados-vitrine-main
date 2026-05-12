// Map common (PT-BR) color names to CSS colors used as a tint overlay.
const MAP: Record<string, string> = {
  preto: "#111111",
  branco: "#f5f5f5",
  cinza: "#9ca3af",
  chumbo: "#4b5563",
  bege: "#d8c8a8",
  nude: "#e3c4a8",
  marrom: "#6b3f1d",
  caramelo: "#a05a2c",
  vermelho: "#dc2626",
  vinho: "#7f1d1d",
  rosa: "#ec4899",
  pink: "#ec4899",
  "rosa claro": "#fbcfe8",
  "rosa bebe": "#fbcfe8",
  laranja: "#f97316",
  amarelo: "#facc15",
  mostarda: "#ca8a04",
  verde: "#16a34a",
  "verde claro": "#86efac",
  "verde escuro": "#166534",
  oliva: "#65a30d",
  azul: "#2563eb",
  "azul claro": "#7dd3fc",
  "azul marinho": "#1e3a8a",
  marinho: "#1e3a8a",
  turquesa: "#14b8a6",
  roxo: "#7c3aed",
  lilas: "#c4b5fd",
  violeta: "#8b5cf6",
  dourado: "#d4af37",
  prata: "#c0c0c0",
  off: "#efe7d8",
  creme: "#f5ecd6",
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function colorToCss(name?: string | null): string | null {
  if (!name) return null;
  const n = normalize(name);
  if (MAP[n]) return MAP[n];
  // try first matching key as a substring
  for (const k of Object.keys(MAP)) {
    if (n.includes(k)) return MAP[k];
  }
  // fallback: try CSS native color name
  return n;
}
