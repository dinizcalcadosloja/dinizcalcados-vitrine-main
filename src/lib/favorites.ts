import { useEffect, useState, useCallback } from "react";

const key = (slug: string) => `favorites:${slug}`;

function read(slug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key(slug)) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites(slug: string) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteIds(read(slug));

    const onStorage = (e: StorageEvent) => {
      if (e.key === key(slug)) setFavoriteIds(read(slug));
    };

    const onFavoritesChange = (e: CustomEvent) => {
      if (e.detail.slug === slug) {
        setFavoriteIds(read(slug));
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites-updated", onFavoritesChange as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites-updated", onFavoritesChange as EventListener);
    };
  }, [slug]);

  const persist = useCallback(
    (next: string[]) => {
      localStorage.setItem(key(slug), JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("favorites-updated", { detail: { slug } }));
    },
    [slug],
  );

  const toggle = useCallback(
    (productId: string) => {
      setFavoriteIds((current) => {
        const isFavorite = current.includes(productId);
        const next = isFavorite 
          ? current.filter((id) => id !== productId) 
          : [...current, productId];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds],
  );

  return { favoriteIds, toggle, isFavorite, count: favoriteIds.length };
}
