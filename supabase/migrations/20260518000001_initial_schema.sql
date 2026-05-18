-- =============================================================
-- ANAISA STORE — Schema completo
-- Gerado em 2026-05-18
-- Execute este script em um banco Supabase limpo.
-- =============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin');
  END IF;
END$$;

-- ============================================================
-- TABELAS (ordem respeitando dependências de FK)
-- ============================================================

-- ------------------------------------------------------------
-- 1. stores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  owner_id     UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  description  TEXT,
  whatsapp     TEXT,
  instagram    TEXT,
  logo_url     TEXT,
  banner_url   TEXT,
  address      TEXT,
  city         TEXT,
  state        TEXT,
  zip_code     TEXT,
  theme_color  TEXT
);

CREATE INDEX IF NOT EXISTS stores_owner_id_idx  ON public.stores (owner_id);
CREATE INDEX IF NOT EXISTS stores_slug_idx       ON public.stores (slug);

-- ------------------------------------------------------------
-- 2. categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  store_id   UUID        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  parent_id  UUID        REFERENCES public.categories (id) ON DELETE SET NULL,
  position   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS categories_store_id_idx  ON public.categories (store_id);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories (parent_id);

-- ------------------------------------------------------------
-- 3. products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  store_id         UUID        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  category_id      UUID        REFERENCES public.categories (id) ON DELETE SET NULL,
  name             TEXT        NOT NULL,
  description      TEXT,
  price            NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  active           BOOLEAN     NOT NULL DEFAULT TRUE,
  featured         BOOLEAN     NOT NULL DEFAULT FALSE,
  has_variations   BOOLEAN     NOT NULL DEFAULT FALSE,
  sku              TEXT,
  barcode          TEXT,
  stock            INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS products_store_id_idx    ON public.products (store_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_active_idx      ON public.products (active);

-- ------------------------------------------------------------
-- 4. product_images
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id UUID        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  position   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images (product_id);

-- ------------------------------------------------------------
-- 5. product_color_images
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_color_images (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id UUID        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  color      TEXT        NOT NULL,
  image_url  TEXT        NOT NULL,
  position   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS product_color_images_product_id_idx ON public.product_color_images (product_id);

-- ------------------------------------------------------------
-- 6. product_variants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id UUID        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  color      TEXT,
  size       TEXT,
  numbering  TEXT,
  sku        TEXT,
  stock      INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants (product_id);

-- ------------------------------------------------------------
-- 7. store_visit_counts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_visit_counts (
  store_id UUID NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  day      DATE NOT NULL DEFAULT CURRENT_DATE,
  count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (store_id, day)
);

CREATE INDEX IF NOT EXISTS store_visit_counts_store_id_idx ON public.store_visit_counts (store_id);

-- ------------------------------------------------------------
-- 8. user_roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id    UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  store_id   UUID        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  UNIQUE (user_id, store_id, role)
);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx  ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS user_roles_store_id_idx ON public.user_roles (store_id);

-- ============================================================
-- FUNÇÕES
-- ============================================================

-- has_store_role: verifica se um usuário tem determinado papel em uma loja
CREATE OR REPLACE FUNCTION public.has_store_role(
  _role     public.app_role,
  _store_id UUID,
  _user_id  UUID
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id  = _user_id
      AND store_id = _store_id
      AND role     = _role
  );
$$;

-- increment_store_visit: upsert do contador de visitas por dia
CREATE OR REPLACE FUNCTION public.increment_store_visit(
  p_store_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.store_visit_counts (store_id, day, count)
  VALUES (p_store_id, CURRENT_DATE, 1)
  ON CONFLICT (store_id, day)
  DO UPDATE SET count = store_visit_counts.count + 1;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.stores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_color_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_visit_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles         ENABLE ROW LEVEL SECURITY;

-- ---- stores ------------------------------------------------
CREATE POLICY "stores: leitura pública"
  ON public.stores FOR SELECT USING (TRUE);

CREATE POLICY "stores: owner pode inserir"
  ON public.stores FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "stores: owner pode atualizar"
  ON public.stores FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "stores: owner pode deletar"
  ON public.stores FOR DELETE
  USING (owner_id = auth.uid());

-- ---- categories --------------------------------------------
CREATE POLICY "categories: leitura pública"
  ON public.categories FOR SELECT USING (TRUE);

CREATE POLICY "categories: admin da loja pode inserir"
  ON public.categories FOR INSERT
  WITH CHECK (public.has_store_role('admin', store_id, auth.uid()));

CREATE POLICY "categories: admin da loja pode atualizar"
  ON public.categories FOR UPDATE
  USING (public.has_store_role('admin', store_id, auth.uid()));

CREATE POLICY "categories: admin da loja pode deletar"
  ON public.categories FOR DELETE
  USING (public.has_store_role('admin', store_id, auth.uid()));

-- ---- products ----------------------------------------------
CREATE POLICY "products: leitura pública de produtos ativos"
  ON public.products FOR SELECT USING (active = TRUE);

CREATE POLICY "products: admin vê todos os produtos da loja"
  ON public.products FOR SELECT
  USING (public.has_store_role('admin', store_id, auth.uid()));

CREATE POLICY "products: admin pode inserir"
  ON public.products FOR INSERT
  WITH CHECK (public.has_store_role('admin', store_id, auth.uid()));

CREATE POLICY "products: admin pode atualizar"
  ON public.products FOR UPDATE
  USING (public.has_store_role('admin', store_id, auth.uid()));

CREATE POLICY "products: admin pode deletar"
  ON public.products FOR DELETE
  USING (public.has_store_role('admin', store_id, auth.uid()));

-- ---- product_images ----------------------------------------
CREATE POLICY "product_images: leitura pública"
  ON public.product_images FOR SELECT USING (TRUE);

CREATE POLICY "product_images: admin pode inserir"
  ON public.product_images FOR INSERT
  WITH CHECK (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

CREATE POLICY "product_images: admin pode atualizar"
  ON public.product_images FOR UPDATE
  USING (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

CREATE POLICY "product_images: admin pode deletar"
  ON public.product_images FOR DELETE
  USING (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

-- ---- product_color_images ----------------------------------
CREATE POLICY "product_color_images: leitura pública"
  ON public.product_color_images FOR SELECT USING (TRUE);

CREATE POLICY "product_color_images: admin pode inserir"
  ON public.product_color_images FOR INSERT
  WITH CHECK (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

CREATE POLICY "product_color_images: admin pode atualizar"
  ON public.product_color_images FOR UPDATE
  USING (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

CREATE POLICY "product_color_images: admin pode deletar"
  ON public.product_color_images FOR DELETE
  USING (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

-- ---- product_variants --------------------------------------
CREATE POLICY "product_variants: leitura pública"
  ON public.product_variants FOR SELECT USING (TRUE);

CREATE POLICY "product_variants: admin pode inserir"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

CREATE POLICY "product_variants: admin pode atualizar"
  ON public.product_variants FOR UPDATE
  USING (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

CREATE POLICY "product_variants: admin pode deletar"
  ON public.product_variants FOR DELETE
  USING (
    public.has_store_role('admin',
      (SELECT store_id FROM public.products WHERE id = product_id),
      auth.uid())
  );

-- ---- store_visit_counts ------------------------------------
CREATE POLICY "store_visit_counts: leitura pública"
  ON public.store_visit_counts FOR SELECT USING (TRUE);

-- A escrita ocorre apenas via função SECURITY DEFINER (increment_store_visit)
-- Não é necessário policy de INSERT/UPDATE direto para o cliente.

-- ---- user_roles --------------------------------------------
CREATE POLICY "user_roles: usuário vê seus próprios papéis"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_roles: owner da loja pode gerenciar papéis"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET  (execute uma vez; ignore se já existir)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "store-assets: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');

CREATE POLICY "store-assets: autenticado pode upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

CREATE POLICY "store-assets: autenticado pode deletar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'store-assets' AND auth.role() = 'authenticated');
