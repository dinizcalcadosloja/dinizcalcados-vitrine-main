// Frontend analytics tracking — runs only in the browser

const PRODUCT_VIEW_DEBOUNCE_MS = 30_000; // 30 seconds

/**
 * Tracks a product page view.
 * Debounced via localStorage — ignores repeated views within 30s.
 */
export function trackProductView(storeId: string, productId: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = `pv_${storeId}_${productId}`;
    const last = localStorage.getItem(key);
    const now = Date.now();
    if (last && now - Number(last) < PRODUCT_VIEW_DEBOUNCE_MS) return;
    localStorage.setItem(key, String(now));
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, productId, type: "product_view" }),
    }).catch(() => {});
  } catch {
    // silently fail
  }
}

/**
 * Tracks a page visit for a store.
 * Uses localStorage to detect unique visitors per day.
 * Sends POST /api/analytics without blocking page render.
 */
export function trackVisit(storeId: string): void {
  if (typeof window === "undefined") return;

  try {
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `visited_${storeId}_${today}`;
    const isNewVisitor = !localStorage.getItem(storageKey);

    if (isNewVisitor) {
      localStorage.setItem(storageKey, "1");
    }

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, isNewVisitor }),
    }).catch(() => {
      // silently fail — analytics should never break the store
    });
  } catch {
    // silently fail
  }
}
