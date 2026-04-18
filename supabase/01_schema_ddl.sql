-- ============================================================
-- TSEA Digital Factory — Supabase DDL Schema
-- Milestone 9.1 | Executar no Supabase SQL Editor
-- ============================================================
-- INSTRUÇÕES: Cole este script inteiro no SQL Editor do Supabase
-- e clique em "Run". Ele cria todas as tabelas, habilita RLS
-- e aplica as policies de segurança.
-- ============================================================

-- -----------------------------------------------------------
-- 1. EXTENSÕES (garantir uuid)
-- -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------
-- 2. TABELA: roles
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  permissions text[] NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE public.roles IS 'Papéis RBAC do sistema (operador, inspetor, engenheiro, supervisor)';

-- -----------------------------------------------------------
-- 3. TABELA: sectors
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sectors (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  area_code text NOT NULL UNIQUE
);

COMMENT ON TABLE public.sectors IS 'Setores físicos do chão de fábrica TSEA';

-- -----------------------------------------------------------
-- 4. TABELA: factory_users
-- Vincula o usuário Supabase Auth ao perfil industrial
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.factory_users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id             uuid NOT NULL REFERENCES public.roles(id),
  sector_id           uuid NOT NULL REFERENCES public.sectors(id),
  name                text NOT NULL,
  badge_uid           text NOT NULL UNIQUE,     -- UID do chip RFID do crachá
  registration_number text NOT NULL UNIQUE,     -- Matrícula interna TSEA
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.factory_users IS 'Operadores industriais com vínculo RFID e Supabase Auth';
COMMENT ON COLUMN public.factory_users.badge_uid IS 'UID hexadecimal lido pelo leitor RFID (ex: A3F2B1C0)';

-- -----------------------------------------------------------
-- 5. TABELA: production_orders
-- Ordens de Produção — contexto central do sistema
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.production_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_number     text NOT NULL UNIQUE,
  product_title text NOT NULL,
  product_type  text NOT NULL DEFAULT 'power_transformer', -- 'power_transformer' | 'voltage_regulator'
  mva_class     text,
  kv_class      text,
  sector_id     uuid REFERENCES public.sectors(id),
  status        text NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'on_hold'
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,

  CONSTRAINT chk_product_type CHECK (product_type IN ('power_transformer', 'voltage_regulator')),
  CONSTRAINT chk_status CHECK (status IN ('in_progress', 'completed', 'on_hold'))
);

COMMENT ON TABLE public.production_orders IS 'Ordens de Produção — contexto raiz de cada documento técnico';

-- -----------------------------------------------------------
-- 6. TABELA: documents
-- PDM simulado — controle de revisão e status de liberação
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  document_type       text NOT NULL DEFAULT 'engineering_drawing', -- 'engineering_drawing' | 'sop' | 'inspection_report'
  title               text NOT NULL,
  revision            text NOT NULL DEFAULT 'Rev A',
  status              text NOT NULL DEFAULT 'WIP', -- 'WIP' | 'Released' | 'Obsolete'
  storage_path        text,     -- caminho no bucket tsea-documents (PDF)
  storage_path_3d     text,     -- caminho no bucket tsea-documents (GLB)
  uploaded_by         uuid REFERENCES public.factory_users(id),
  released_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_doc_type CHECK (document_type IN ('engineering_drawing', 'sop', 'inspection_report')),
  CONSTRAINT chk_doc_status CHECK (status IN ('WIP', 'Released', 'Obsolete'))
);

COMMENT ON TABLE public.documents IS 'Documentos técnicos com ciclo de vida PDM (WIP → Released → Obsolete)';
COMMENT ON COLUMN public.documents.status IS 'REGRA CRÍTICA: apenas Released é visível ao operador (RLS)';

-- -----------------------------------------------------------
-- 7. TABELA: audit_log
-- Trilha de auditoria ISO 9001 — quem acessou o quê e quando
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_user_id     uuid REFERENCES public.factory_users(id),
  document_id         uuid REFERENCES public.documents(id),
  production_order_id uuid REFERENCES public.production_orders(id),
  action              text NOT NULL, -- 'login' | 'logout' | 'op_opened' | 'document_viewed' | 'session_timeout'
  metadata            jsonb DEFAULT '{}'::jsonb, -- { "device": "Panel-PC-03", "badge_uid": "A3F2" }
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_log IS 'Trilha de auditoria ISO 9001 — rastreabilidade completa de acessos';
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(factory_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_op ON public.audit_log(production_order_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- -----------------------------------------------------------
-- 8. ROW LEVEL SECURITY — Habilitar em todas as tabelas
-- -----------------------------------------------------------
ALTER TABLE public.roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- 9. RLS POLICIES
-- -----------------------------------------------------------

-- roles: qualquer usuário autenticado pode ler
CREATE POLICY "authenticated_read_roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- sectors: qualquer usuário autenticado pode ler
CREATE POLICY "authenticated_read_sectors"
  ON public.sectors FOR SELECT
  TO authenticated
  USING (true);

-- factory_users: operador vê apenas o próprio perfil
CREATE POLICY "user_sees_own_profile"
  ON public.factory_users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- factory_users: supervisor vê todos (via role)
CREATE POLICY "supervisor_sees_all_users"
  ON public.factory_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.factory_users fu
      JOIN public.roles r ON fu.role_id = r.id
      WHERE fu.auth_user_id = auth.uid()
        AND r.name IN ('supervisor', 'engenheiro')
    )
  );

-- production_orders: operador vê OPs do seu setor
CREATE POLICY "user_sees_own_sector_ops"
  ON public.production_orders FOR SELECT
  TO authenticated
  USING (
    sector_id = (
      SELECT sector_id FROM public.factory_users
      WHERE auth_user_id = auth.uid()
        AND is_active = true
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.factory_users fu
      JOIN public.roles r ON fu.role_id = r.id
      WHERE fu.auth_user_id = auth.uid()
        AND r.name IN ('supervisor', 'engenheiro')
    )
  );

-- documents: POLÍTICA CRÍTICA — apenas documentos Released são visíveis
CREATE POLICY "only_released_docs_visible"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    status = 'Released'
    OR EXISTS (
      SELECT 1 FROM public.factory_users fu
      JOIN public.roles r ON fu.role_id = r.id
      WHERE fu.auth_user_id = auth.uid()
        AND r.name IN ('supervisor', 'engenheiro')
    )
  );

-- documents: engenheiro/supervisor pode inserir e atualizar
CREATE POLICY "engineer_can_manage_docs"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.factory_users fu
      JOIN public.roles r ON fu.role_id = r.id
      WHERE fu.auth_user_id = auth.uid()
        AND r.name IN ('supervisor', 'engenheiro')
    )
  );

CREATE POLICY "engineer_can_update_docs"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.factory_users fu
      JOIN public.roles r ON fu.role_id = r.id
      WHERE fu.auth_user_id = auth.uid()
        AND r.name IN ('supervisor', 'engenheiro')
    )
  );

-- audit_log: usuário vê apenas seus próprios logs
CREATE POLICY "user_sees_own_audit"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (factory_user_id = (
    SELECT id FROM public.factory_users WHERE auth_user_id = auth.uid() LIMIT 1
  ));

-- audit_log: qualquer autenticado pode inserir (registro de acesso)
CREATE POLICY "authenticated_can_insert_audit"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- audit_log: supervisor vê tudo
CREATE POLICY "supervisor_sees_all_audit"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.factory_users fu
      JOIN public.roles r ON fu.role_id = r.id
      WHERE fu.auth_user_id = auth.uid()
        AND r.name = 'supervisor'
    )
  );

-- -----------------------------------------------------------
-- 10. FUNÇÃO HELPER: get_current_factory_user()
-- Retorna o perfil industrial do usuário autenticado atual
-- Usada internamente pelas policies e pelo backend
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_factory_user()
RETURNS public.factory_users
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.factory_users
  WHERE auth_user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$;

-- -----------------------------------------------------------
-- DDL CONCLUÍDO
-- Execute o script 02_seed.sql em seguida para inserir dados
-- -----------------------------------------------------------
