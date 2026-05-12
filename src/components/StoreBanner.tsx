import { useStore } from "@/lib/store-context";

export function StoreBanner() {
  const store = useStore();

  if (!store.banner_url) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 w-full">
      <div className="relative h-[250px] sm:h-[400px] lg:h-[500px] w-full overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-xl group">
        <img
          src={store.banner_url}
          alt={store.name}
          className="h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12 max-w-2xl">
          {store.description && (
            <p className="text-white/90 text-sm sm:text-lg font-medium max-w-md drop-shadow-lg leading-relaxed mb-4">
              {store.description}
            </p>
          )}
          {/* Botão removido conforme solicitado */}
        </div>
      </div>
    </div>
  );
}
