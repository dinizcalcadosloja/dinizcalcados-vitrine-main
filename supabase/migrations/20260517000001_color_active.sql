-- Add is_active column to product_variants
-- Allows hiding a color variant from the storefront without deleting it
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
