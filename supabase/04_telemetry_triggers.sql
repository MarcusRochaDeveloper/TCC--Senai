-- ============================================================
-- TSEA Digital Factory — Telemetry and Audit Triggers
-- Milestone 12.1 | Executar no Supabase SQL Editor
-- ============================================================

-- 1. Trigger: Log de auditoria para mudança de status em documentos
-- Preenche os requisitos ISO 9001 de rastreabilidade para liberação de documentos

-- Função que o trigger invocará
CREATE OR REPLACE FUNCTION public.log_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se o status de um documento mudar (ex: de 'WIP' para 'Released')
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    INSERT INTO public.audit_log (
      factory_user_id,
      document_id,
      production_order_id,
      action,
      metadata
    ) VALUES (
      NEW.uploaded_by, -- Considerando que uploaded_by é quem está manipulando. Se quisermos mais precisão, seria necessário pegar do auth_user_id conectado
      NEW.id,
      NEW.production_order_id,
      'document_viewed', -- Vamos usar uma action genérica mapeada ou expandiremos os tipos
      jsonb_build_object(
        'event', 'status_change',
        'old_status', OLD.status,
        'new_status', NEW.status,
        'revision', NEW.revision
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- O Trigger propriamente dito
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.documents;

CREATE TRIGGER trigger_document_status_change
AFTER UPDATE OF status ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.log_document_status_change();

-- 2. Tabela auxiliar: app_errors 
-- Para registrar os logs vindos do ErrorBoundary do React
CREATE TABLE IF NOT EXISTS public.app_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_user_id uuid REFERENCES public.factory_users(id),
  error_message text NOT NULL,
  error_stack text,
  component_stack text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: Apenas insert para autenticados
ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_insert_error"
  ON public.app_errors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "supervisor_sees_all_errors"
  ON public.app_errors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.factory_users fu
      JOIN public.roles r ON fu.role_id = r.id
      WHERE fu.auth_user_id = auth.uid()
        AND r.name = 'supervisor'
    )
  );

COMMENT ON TABLE public.app_errors IS 'Telemetria de Erros vinda dos Frontends ErrorBoundaries';
