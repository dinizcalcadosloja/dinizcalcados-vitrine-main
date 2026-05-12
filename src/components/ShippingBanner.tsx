import { Truck } from "lucide-react";

export function ShippingBanner() {
  return (
    <div className="bg-slate-900 text-white py-2.5 px-4 overflow-hidden relative w-full">
      <div className="flex items-center justify-center gap-2 animate-fade-in relative z-10 max-w-full">
        <Truck className="h-4 w-4 text-emerald-400" />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-center">
          Enviamos para todo o Brasil 🇧🇷
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
    </div>
  );
}
