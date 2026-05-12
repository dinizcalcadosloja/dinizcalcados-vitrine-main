import { useEffect, useState, useCallback } from "react";

export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  price: number;
  image?: string;
  qty: number;
};

const key = (slug: string) => `cart:${slug}`;

function read(slug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key(slug)) || "[]");
  } catch {
    return [];
  }
}

export function useCart(slug: string) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read(slug));

    // Listener para mudanças em outras abas
    const onStorage = (e: StorageEvent) => {
      if (e.key === key(slug)) setItems(read(slug));
    };

    // Listener customizado para mudanças na mesma aba
    const onCartChange = (e: CustomEvent) => {
      if (e.detail.slug === slug) {
        setItems(read(slug));
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart-updated", onCartChange as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart-updated", onCartChange as EventListener);
    };
  }, [slug]);

  const persist = useCallback(
    (next: CartItem[]) => {
      localStorage.setItem(key(slug), JSON.stringify(next));
      // Dispara evento customizado para atualizar outros componentes na mesma aba
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { slug } }));
    },
    [slug],
  );

  const add = useCallback(
    (item: CartItem) => {
      setItems((current) => {
        const idx = current.findIndex((i) => i.variantId === item.variantId);
        const next =
          idx >= 0
            ? current.map((i, index) => (index === idx ? { ...i, qty: i.qty + item.qty } : i))
            : [...current, item];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateQty = useCallback(
    (variantId: string, qty: number) => {
      setItems((current) => {
        const next = current
          .map((i) => (i.variantId === variantId ? { ...i, qty } : i))
          .filter((i) => i.qty > 0);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const remove = useCallback(
    (variantId: string) => {
      setItems((current) => {
        const next = current.filter((i) => i.variantId !== variantId);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clear = useCallback(() => {
    setItems([]);
    persist([]);
  }, [persist]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, add, updateQty, remove, clear, total, count };
}

export function buildWhatsappMessage(storeName: string, items: CartItem[], total: number) {
  const lines = [
    `Olá! Tenho interesse nos seguintes produtos da *${storeName}*:`,
    "",
    ...items.map((i) => {
      const unitPrice = i.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const subtotal = (i.price * i.qty).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      return `*${i.name}*\n   - Variação: ${i.variantLabel}\n   - Quantidade: ${i.qty} ${i.qty > 1 ? `x ${unitPrice}` : ""}\n   - Subtotal: ${subtotal}`;
    }),
    "",
    "────────────────────",
    `*TOTAL: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}*`,
    "────────────────────",
  ];
  return lines.join("\n");
}

export function whatsappLink(phone: string, message: string) {
  let clean = phone.replace(/\D/g, "");
  // Se o número começa com 0, remove
  if (clean.startsWith("0")) clean = clean.substring(1);
  // Se não tem código do país e tem 10 ou 11 dígitos, adiciona código do Brasil (55)
  if (clean.length === 10 || clean.length === 11) {
    clean = "55" + clean;
  }
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`;
}
