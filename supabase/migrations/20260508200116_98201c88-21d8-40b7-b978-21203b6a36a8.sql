ALTER TABLE public.products 
ADD COLUMN has_variations BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN sku TEXT,
ADD COLUMN barcode TEXT,
ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;

-- Update existing products to have variants if they have entries in product_variants
UPDATE public.products p
SET has_variations = TRUE
WHERE EXISTS (
    SELECT 1 FROM public.product_variants v 
    WHERE v.product_id = p.id 
    AND (v.size IS NOT NULL OR v.color IS NOT NULL OR v.numbering IS NOT NULL)
);
