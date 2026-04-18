import fs from 'fs'

// Extrair env vars do arquivo .env sem pacote dotenv
const envStr = fs.readFileSync('.env', 'utf-8')
const envConfig = envStr.split('\n').reduce((acc, line) => {
  const [key, ...values] = line.split('=')
  if (key && values.length > 0 && !key.startsWith('#')) {
    acc[key.trim()] = values.join('=').trim()
  }
  return acc
}, {})

const salt = envConfig.VITE_RFID_SALT || 'tsea-rfid-default-salt'

// Lista de usuários base do seed
const seedUsers = [
  { name: 'Carlos Alvarenga', uid: 'A3F2B1C0' },
  { name: 'Mariana Couto', uid: 'FF01A2B3' },
  { name: 'José Ferreira', uid: 'CC9944DD' }
]

// -----------------------------------------------------------
// Derivação de senha idêntica ao Frontend (PBKDF2 WebCrypto em Node)
// -----------------------------------------------------------
async function derivePasswordFromUid(uid) {
  const encoder = new TextEncoder()
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(uid.toUpperCase()),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// -----------------------------------------------------------
// Função principal: Criação de SQL Injection Nativo
// -----------------------------------------------------------
async function run() {
  console.log('🤖 Gerando Script SQL para injeção nativa no Supabase Auth...')

  let sqlStatements = `
-- ============================================================
-- Script Gerado Automaticamente para Contornar Rate Limits
-- Este script injeta os usuários de teste diretamente no auth.users
-- usando o hash bcrypt sobre o nosso hash PBKDF2, e depois
-- os vincula na factory_users de uma só vez.
-- ============================================================

`

  for (const u of seedUsers) {
    const email = `${u.uid.toLowerCase()}@tsea.internal`
    const password = await derivePasswordFromUid(u.uid) // Retorna o Hash de 64 chars

    sqlStatements += `
-- Criando usuário ${u.name} (${u.uid})
DO $$ 
DECLARE 
  new_id uuid;
BEGIN
  -- Se não existir, insere
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '${email}') THEN
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', '${email}',
      crypt('${password}', gen_salt('bf')), -- Supabase usa bcrypt em cima do nosso password recebido
      now(), now(), now()
    );
    -- E vincula
    UPDATE public.factory_users SET auth_user_id = new_id WHERE badge_uid = '${u.uid}';
  END IF;
END $$;
`
  }

  const outPath = '../supabase/06_seed_auth.sql'
  fs.writeFileSync(outPath, sqlStatements)
  console.log(`\n✅ Script ${outPath} gerado com sucesso!`)
  console.log('Copie e rode ele no SQL Editor do Supabase para injetar a autenticação inteira de uma vez e logar no sistema.')
}

run().catch(console.error)
