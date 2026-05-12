# Catálogo Digital SaaS — Plano

Aplicação SaaS multi-tenant onde lojistas criam sua loja, cadastram produtos com variações (tamanho, cor, numeração), e compartilham um link público com catálogo estilo Instagram. Clientes navegam, adicionam ao carrinho e finalizam pelo WhatsApp.

## Backend (Lovable Cloud)

**Tabelas:**
- `stores` — id, owner_id, slug (único, usado na URL pública), name, logo_url, banner_url, whatsapp, description, theme_color
- `categories` — id, store_id, name, position
- `products` — id, store_id, category_id, name, description, price, compare_at_price, featured (bool), active, created_at
- `product_images` — id, product_id, url, position
- `product_variants` — id, product_id, size, color, numbering, stock, sku
- `user_roles` — id, user_id, store_id, role (enum: admin)

**Storage:** bucket público `store-assets` (logos, banners, fotos de produto).

**Segurança:**
- RLS em tudo. Função `has_store_role(user_id, store_id, role)` SECURITY DEFINER.
- Leitura pública: stores/categories/products/variants/images (apenas onde `active=true`).
- Escrita: somente admin da loja.
- Carrinho 100% client-side (localStorage por slug da loja) — sem persistência.

## Rotas (TanStack Start)

Públicas:
- `/` — landing do SaaS (criar sua loja grátis)
- `/auth` — login/cadastro por email
- `/loja/$slug` — vitrine pública (hero, destaques, categorias, busca)
- `/loja/$slug/produto/$productId` — detalhe com galeria, seletor de variação, "Adicionar ao carrinho"
- `/loja/$slug/carrinho` — revisão e botão "Finalizar pelo WhatsApp" (gera mensagem com itens, variações e total, abre `wa.me`)

Admin (protegidas via `_authenticated`):
- `/admin` — onboarding/seleção da loja
- `/admin/loja` — dados da loja (nome, slug, logo, banner, WhatsApp, cor)
- `/admin/produtos` — listar/criar/editar produtos, imagens, variações, estoque, destaque
- `/admin/categorias` — CRUD categorias
- `/admin/pedidos` — registro local dos últimos pedidos enviados (informativo)

## Funcionalidades chave

- Catálogo público sem login, SSR-friendly por rota dedicada
- Busca client-side + filtro por categoria + seção "Destaques"
- Galeria de produto com swipe e thumbnails
- Seletor de variação que respeita estoque (desabilita esgotados)
- Carrinho persistente no localStorage por loja
- Geração de pedido WhatsApp: lista formatada com produto, variação, qtd, subtotal, total
- Upload múltiplo de imagens (Supabase Storage) com reordenar
- Painel responsivo com sidebar colapsável

## Design

Visual estilo Instagram Shop: minimalista, muito espaço em branco, cards quadrados com cantos suaves, tipografia moderna (Inter), foco mobile-first. Cor primária neutra escura por padrão, mas cada loja pode definir sua `theme_color`. Animações sutis, lazy-load de imagens, grid responsivo 2 col mobile / 4 col desktop.

## Entrega faseada (esta primeira versão)

1. Habilitar Lovable Cloud + schema completo + RLS + storage bucket
2. Auth (email) + guard `_authenticated`
3. Painel admin: loja, categorias, produtos com imagens e variações
4. Catálogo público: vitrine, detalhe, carrinho, checkout WhatsApp
5. Landing do SaaS

Pronto para implementar?
