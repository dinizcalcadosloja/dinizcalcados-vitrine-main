import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Smartphone, Zap, Layers, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vitrina — Catálogo digital com pedidos no WhatsApp" },
      {
        name: "description",
        content:
          "Monte sua loja online em minutos. Catálogo público, variações de produto, controle de estoque e checkout direto no WhatsApp.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <header className="border-b border-border/60 backdrop-blur overflow-x-hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 w-full">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              V
            </span>
            Vitrina
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <a
              href={`https://api.whatsapp.com/send?phone=5583994043126&text=${encodeURIComponent("Ola! Gostaria mais de saber sobre a plataforma de vitrine online!")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-2 hover:scale-105 transition-all duration-300">
                <MessageCircle className="h-4 w-4" />
                Fale Conosco
              </Button>
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28 w-full overflow-x-hidden">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            Catálogo digital • Pedidos no WhatsApp
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl break-words">
            Sua loja de roupas online,
            <br className="hidden sm:inline" />
            simples como o Instagram.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Cadastre produtos com cores, tamanhos e numeração. Compartilhe um link e receba pedidos
            direto no WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`https://api.whatsapp.com/send?phone=5583994043126&text=${encodeURIComponent("Ola! Gostaria mais de saber sobre a plataforma de vitrine online!")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="gap-2 px-8 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
              >
                <MessageCircle className="h-5 w-5" />
                Fale Conosco
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline">
                Como funciona
              </Button>
            </a>
          </div>
        </div>

        <div id="features" className="mt-24 grid gap-6 md:grid-cols-4">
          {[
            {
              icon: ShoppingBag,
              t: "Catálogo público",
              d: "Link único da sua loja, pronto para compartilhar.",
            },
            {
              icon: Layers,
              t: "Variações",
              d: "Tamanho, cor e numeração com estoque por variação.",
            },
            {
              icon: Smartphone,
              t: "Mobile-first",
              d: "Visual moderno em qualquer tela, leve e rápido.",
            },
            {
              icon: Zap,
              t: "Checkout WhatsApp",
              d: "Carrinho gera mensagem pronta com itens e total.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-6 w-6" />
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Vitrina
      </footer>
    </div>
  );
}
