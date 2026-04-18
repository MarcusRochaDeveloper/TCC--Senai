-- ============================================================
-- TSEA Digital Factory — Supabase Storage & RLS Setup
-- Milestone 11.1 e 11.3 | Executar no SQL Editor do Supabase
-- ============================================================

-- 1. Criar o Bucket Privado
-- Garante que o bucket 'tsea-documents' exista e NÃO seja público.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tsea-documents', 'tsea-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS na tabela de objetos do Storage
-- (Geralmente já vem habilitado por padrão em projetos novos, mas é bom garantir)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Criar Política RLS (Row Level Security)
-- Apenas usuários autenticados no Supabase Auth podem realizar SELECT (download/view)
-- dos objetos dentro do bucket 'tsea-documents'.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Autenticados podem ler documentos'
  ) THEN
    CREATE POLICY "Autenticados podem ler documentos"
    ON storage.objects FOR SELECT TO authenticated
    USING ( bucket_id = 'tsea-documents' );
  END IF;
END $$;

-- NOTA: O upload (INSERT) será feito manualmente pelo Supabase Studio
-- por administradores/engenheiros. Portanto, não criamos uma policy de
-- INSERT para os operadores do chão de fábrica neste momento.
