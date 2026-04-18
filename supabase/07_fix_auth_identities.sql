-- ============================================================
-- Correção de Injeção Nativa Supabase Auth (auth.identities)
-- ============================================================
-- O Supabase (GoTrue) exige que todo usuário criado manualmente
-- na tabela 'auth.users' tenha um registro correspondente na
-- tabela 'auth.identities' mapeando o provedor de e-mail.
-- Sem isso, o login joga erro 500 (Database error querying schema).

DO $$ 
DECLARE 
  rec RECORD;
  new_identity_id uuid;
BEGIN
  -- Percorre todos os usuários de teste TSEA que foram injetados
  FOR rec IN SELECT * FROM auth.users WHERE email LIKE '%@tsea.internal' LOOP
    
    -- Verifica se já possui identidade
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = rec.id) THEN
      new_identity_id := gen_random_uuid();
      
      -- Insere o provider do GoTrue forçado
      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        new_identity_id,
        rec.id::text, -- Para 'email', o provider_id costuma ser o próprio UUID do user convertido pra texto
        rec.id, 
        format('{"sub": "%s", "email": "%s", "email_verified": false, "phone_verified": false}', rec.id, rec.email)::jsonb, 
        'email', 
        now(), now(), now()
      );
      
      -- Força o mapeamento do raw_app_meta_data no user se não tiver
      UPDATE auth.users 
      SET raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
          raw_user_meta_data = '{}'::jsonb
      WHERE id = rec.id;
      
    END IF;
  END LOOP;
END $$;
