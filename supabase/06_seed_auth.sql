
-- ============================================================
-- Script Gerado Automaticamente para Contornar Rate Limits
-- Este script injeta os usuários de teste diretamente no auth.users
-- usando o hash bcrypt sobre o nosso hash PBKDF2, e depois
-- os vincula na factory_users de uma só vez.
-- ============================================================


-- Criando usuário Carlos Alvarenga (A3F2B1C0)
DO $$ 
DECLARE 
  new_id uuid;
BEGIN
  -- Se não existir, insere
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'a3f2b1c0@tsea.internal') THEN
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 'a3f2b1c0@tsea.internal',
      crypt('1ef0981dd44e97a74bf440435b31c173b1ca83fb01e88caa43826c6cbee3c478', gen_salt('bf')), -- Supabase usa bcrypt em cima do nosso password recebido
      now(), now(), now()
    );
    -- E vincula
    UPDATE public.factory_users SET auth_user_id = new_id WHERE badge_uid = 'A3F2B1C0';
  END IF;
END $$;

-- Criando usuário Mariana Couto (FF01A2B3)
DO $$ 
DECLARE 
  new_id uuid;
BEGIN
  -- Se não existir, insere
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ff01a2b3@tsea.internal') THEN
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 'ff01a2b3@tsea.internal',
      crypt('b29ec6beab9cd5296bdead9cbe6ee7f8f86be1199d3a8fb8507901f6f8d232d6', gen_salt('bf')), -- Supabase usa bcrypt em cima do nosso password recebido
      now(), now(), now()
    );
    -- E vincula
    UPDATE public.factory_users SET auth_user_id = new_id WHERE badge_uid = 'FF01A2B3';
  END IF;
END $$;

-- Criando usuário José Ferreira (CC9944DD)
DO $$ 
DECLARE 
  new_id uuid;
BEGIN
  -- Se não existir, insere
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cc9944dd@tsea.internal') THEN
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 'cc9944dd@tsea.internal',
      crypt('547a4f4cc0fceff5e723b8ade9204c4002a843a1489d35922576be9066bf46c8', gen_salt('bf')), -- Supabase usa bcrypt em cima do nosso password recebido
      now(), now(), now()
    );
    -- E vincula
    UPDATE public.factory_users SET auth_user_id = new_id WHERE badge_uid = 'CC9944DD';
  END IF;
END $$;
