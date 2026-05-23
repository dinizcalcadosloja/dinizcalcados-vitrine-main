-- Adiciona coluna type à tabela categories para distinguir
-- departamento, categoria e marca sem alterar a estrutura de parent_id.
alter table categories
  add column if not exists type text not null default 'category';

-- Valores válidos: 'department' | 'category' | 'brand'
-- Os registros existentes ficam com 'category' por padrão.
-- Raízes (parent_id IS NULL) são tipicamente 'department';
-- pode-se atualizar manualmente quando necessário.
