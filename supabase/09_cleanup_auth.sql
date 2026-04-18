-- ============================================================
-- Limpeza FASE 1: Remover as inserções brutas corrompidas
-- ============================================================
-- Este script deleta os usuários afetados pelo erro 500 para
-- que a API do Supabase gere-os de forma 100% estável.

DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@tsea.internal'
);

DELETE FROM auth.users WHERE email LIKE '%@tsea.internal';

UPDATE public.factory_users SET auth_user_id = NULL;
