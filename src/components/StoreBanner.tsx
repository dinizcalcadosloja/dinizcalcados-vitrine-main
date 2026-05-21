import { useStore } from "@/lib/store-context";

export function StoreBanner() {
  const store = useStore();

  if (!store.banner_url) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 w-full">
      <div className="relative w-full overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-xl group sm:aspect-[3/1] lg:aspect-[21/7]">
        <img
          src={store.banner_url}
          alt={store.name}
          className="block w-full h-auto sm:absolute sm:inset-0 sm:h-full sm:w-full sm:object-cover sm:object-center transition-transform duration-1000 group-hover:scale-105"
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
