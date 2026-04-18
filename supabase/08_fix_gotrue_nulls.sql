-- ============================================================
-- Correção de Injeção Nativa Supabase Auth (NULL tokens)
-- ============================================================
-- O Supabase (GoTrue) v2 mudou o parser interno em Go.
-- Se um usuário criado manualmente (via SQL) contiver NULL
-- nas colunas de tokens (confirmation_token, recovery_token, etc),
-- o GoTrue entra em pânico (converting NULL to string) e
-- devolve o famigerado erro 500 "Database error querying schema".
--
-- Este script limpa os NULLs transformando-os em strings vazias ('').

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone = COALESCE(phone, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  banned_until = COALESCE(banned_until, null),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_sso_user = COALESCE(is_sso_user, false),
  deleted_at = COALESCE(deleted_at, null)
WHERE email LIKE '%@tsea.internal';
