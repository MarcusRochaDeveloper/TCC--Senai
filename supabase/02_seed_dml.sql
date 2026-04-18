-- ============================================================
-- TSEA Digital Factory — Supabase DML Seed
-- Milestone 9.2 | Executar APÓS o script 01_schema_ddl.sql
-- ============================================================
-- ATENÇÃO: Os usuários Supabase Auth (na tabela auth.users)
-- devem ser criados PRIMEIRO via Dashboard → Authentication →
-- Users → "Add User". Depois substitua os UUIDs abaixo.
-- ============================================================

-- -----------------------------------------------------------
-- 1. ROLES
-- -----------------------------------------------------------
INSERT INTO public.roles (id, name, permissions) VALUES
  ('11111111-0000-0000-0000-000000000001', 'operador',   ARRAY['view_documents', 'view_op']),
  ('11111111-0000-0000-0000-000000000002', 'inspetor',   ARRAY['view_documents', 'view_op', 'validate_step']),
  ('11111111-0000-0000-0000-000000000003', 'engenheiro', ARRAY['view_documents', 'view_op', 'upload_documents', 'manage_revisions']),
  ('11111111-0000-0000-0000-000000000004', 'supervisor', ARRAY['*'])
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------
-- 2. SECTORS (Setores TSEA Energia)
-- -----------------------------------------------------------
INSERT INTO public.sectors (id, name, area_code) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Corte de Núcleo',     'NC-01'),
  ('22222222-0000-0000-0000-000000000002', 'Bobinagem AT',         'BOB-AT-02'),
  ('22222222-0000-0000-0000-000000000003', 'Caldeiraria / Tanque', 'CALD-03'),
  ('22222222-0000-0000-0000-000000000004', 'Montagem Parte Ativa', 'MONT-04'),
  ('22222222-0000-0000-0000-000000000005', 'Inspeção QA',          'QA-05'),
  ('22222222-0000-0000-0000-000000000006', 'Vapor Phase / Secagem','VP-06')
ON CONFLICT (area_code) DO NOTHING;

-- -----------------------------------------------------------
-- 3. FACTORY_USERS
-- IMPORTANTE: Substitua os auth_user_id pelos UUIDs reais
-- dos usuários criados no Supabase Auth Dashboard.
-- 
-- Para criar via SQL (simplificado para TCC):
-- Os emails seguem o padrão: {badge_uid}@tsea.internal
-- -----------------------------------------------------------

-- Usuário 1: Operador de corte
-- auth_user_id: Substituir pelo UUID gerado no Supabase Auth
INSERT INTO public.factory_users (
  id, auth_user_id, role_id, sector_id,
  name, badge_uid, registration_number, is_active
) VALUES (
  '33333333-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001', -- << SUBSTITUIR pelo UUID real do auth.users
  '11111111-0000-0000-0000-000000000001', -- role: operador
  '22222222-0000-0000-0000-000000000001', -- sector: Corte de Núcleo
  'Carlos Alvarenga',
  'A3F2B1C0',                             -- UID do crachá RFID (simula o crachá físico)
  'TSEA-2024-0042',
  true
) ON CONFLICT (badge_uid) DO NOTHING;

-- Usuário 2: Engenheiro (acesso amplo)
INSERT INTO public.factory_users (
  id, auth_user_id, role_id, sector_id,
  name, badge_uid, registration_number, is_active
) VALUES (
  '33333333-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002', -- << SUBSTITUIR pelo UUID real do auth.users
  '11111111-0000-0000-0000-000000000003', -- role: engenheiro
  '22222222-0000-0000-0000-000000000005', -- sector: Inspeção QA
  'Mariana Couto',
  'FF01A2B3',                             -- UID do crachá RFID (simula o crachá físico)
  'TSEA-2023-0017',
  true
) ON CONFLICT (badge_uid) DO NOTHING;

-- Usuário 3: Operador de bobinagem
INSERT INTO public.factory_users (
  id, auth_user_id, role_id, sector_id,
  name, badge_uid, registration_number, is_active
) VALUES (
  '33333333-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003', -- << SUBSTITUIR pelo UUID real do auth.users
  '11111111-0000-0000-0000-000000000001', -- role: operador
  '22222222-0000-0000-0000-000000000002', -- sector: Bobinagem AT
  'José Ferreira',
  'CC9944DD',
  'TSEA-2025-0103',
  true
) ON CONFLICT (badge_uid) DO NOTHING;

-- -----------------------------------------------------------
-- 4. PRODUCTION_ORDERS (OPs de Demonstração)
-- -----------------------------------------------------------
INSERT INTO public.production_orders (
  id, op_number, product_title, product_type,
  mva_class, kv_class, sector_id, status, started_at
) VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    'OP-2025-9982',
    'Transformador de Potência 150 MVA — Usina Hidrelétrica Itumbiara',
    'power_transformer',
    '150 MVA', '138 kV',
    '22222222-0000-0000-0000-000000000004', -- Montagem Parte Ativa
    'in_progress',
    now() - interval '5 days'
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    'OP-2025-9983',
    'Regulador de Tensão 10 MVA — Compesa Recife',
    'voltage_regulator',
    '10 MVA', '13.8 kV',
    '22222222-0000-0000-0000-000000000002', -- Bobinagem AT
    'in_progress',
    now() - interval '2 days'
  ),
  (
    '44444444-0000-0000-0000-000000000003',
    'OP-2025-9984',
    'Transformador de Potência 500 MVA — Subestação Xingú',
    'power_transformer',
    '500 MVA', '500 kV',
    '22222222-0000-0000-0000-000000000001', -- Corte de Núcleo
    'in_progress',
    now() - interval '1 day'
  )
ON CONFLICT (op_number) DO NOTHING;

-- -----------------------------------------------------------
-- 5. DOCUMENTS (Documentos técnicos — PDM simulado)
-- NOTA: storage_path aponta para o Supabase Storage bucket.
-- Os arquivos devem ser carregados manualmente no Storage
-- antes de usar a aplicação em modo real.
-- Para o TCC, os paths são placeholders.
-- -----------------------------------------------------------
INSERT INTO public.documents (
  id, production_order_id, document_type, title,
  revision, status, storage_path, storage_path_3d,
  uploaded_by, released_at
) VALUES
  -- OP-9982 — Desenho de engenharia (Rev C — Released)
  (
    '55555555-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000001',
    'engineering_drawing',
    'Desenho Técnico — Parte Ativa 150 MVA — Rev C',
    'Rev C', 'Released',
    'ops/OP-2025-9982/drawing-rev-c.pdf',
    'ops/OP-2025-9982/model-rev-c.glb',
    '33333333-0000-0000-0000-000000000002', -- uploaded by Mariana (engenheira)
    now() - interval '3 days'
  ),
  -- OP-9982 — Revisão anterior (Rev B — Obsolete — invisível ao operador via RLS)
  (
    '55555555-0000-0000-0000-000000000002',
    '44444444-0000-0000-0000-000000000001',
    'engineering_drawing',
    'Desenho Técnico — Parte Ativa 150 MVA — Rev B',
    'Rev B', 'Obsolete',
    'ops/OP-2025-9982/drawing-rev-b.pdf',
    NULL,
    '33333333-0000-0000-0000-000000000002',
    now() - interval '10 days'
  ),
  -- OP-9982 — SOP de montagem (Released)
  (
    '55555555-0000-0000-0000-000000000003',
    '44444444-0000-0000-0000-000000000001',
    'sop',
    'Instrução de Trabalho — Montagem do Núcleo Magnético',
    'Rev A', 'Released',
    'ops/OP-2025-9982/sop-montagem-nucleo.pdf',
    NULL,
    '33333333-0000-0000-0000-000000000002',
    now() - interval '4 days'
  ),
  -- OP-9983 — Desenho Released
  (
    '55555555-0000-0000-0000-000000000004',
    '44444444-0000-0000-0000-000000000002',
    'engineering_drawing',
    'Desenho Técnico — Bobinagem AT 10 MVA — Rev A',
    'Rev A', 'Released',
    'ops/OP-2025-9983/drawing-rev-a.pdf',
    'ops/OP-2025-9983/model-rev-a.glb',
    '33333333-0000-0000-0000-000000000002',
    now() - interval '1 day'
  ),
  -- OP-9984 — Documento ainda WIP (invisível ao operador via RLS)
  (
    '55555555-0000-0000-0000-000000000005',
    '44444444-0000-0000-0000-000000000003',
    'engineering_drawing',
    'Desenho Técnico — Corte de Núcleo 500 MVA — Rev A DRAFT',
    'Rev A', 'WIP',
    NULL,
    NULL,
    '33333333-0000-0000-0000-000000000002',
    NULL -- ainda não liberado
  )
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- SEED CONCLUÍDO
-- Verificação: execute as queries abaixo para confirmar
-- -----------------------------------------------------------
-- SELECT * FROM public.roles;
-- SELECT * FROM public.sectors;
-- SELECT * FROM public.factory_users;
-- SELECT * FROM public.production_orders;
-- SELECT * FROM public.documents WHERE status = 'Released';
-- -----------------------------------------------------------
