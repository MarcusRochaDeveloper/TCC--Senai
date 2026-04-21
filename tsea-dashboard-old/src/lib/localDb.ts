// ============================================================
// src/lib/localDb.ts
// Banco de dados persistente via localStorage
// Autenticação RFID, Ordens de Produção, Documentos Técnicos
// ============================================================

// -----------------------------------------------------------
// Salt para derivação de senha RFID (espelha o .env)
// -----------------------------------------------------------
const RFID_SALT = (import.meta.env.VITE_RFID_SALT as string) || 'tsea-rfid-default-salt'

// -----------------------------------------------------------
// Derivação de senha idêntica ao useRfidReader.ts (PBKDF2)
// -----------------------------------------------------------
export async function derivePasswordFromUid(uid: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(uid.toUpperCase()),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(RFID_SALT), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// -----------------------------------------------------------
// Tipos internos do banco local
// -----------------------------------------------------------
export interface DbUser {
  id: string
  badge_uid: string
  name: string
  registration_number: string
  role: string
  sector: string
  sector_code: string
  is_active: boolean
  password_hash: string
}

export interface DbProductionOrder {
  id: string
  op_number: string
  product_title: string
  product_type: string
  mva_class: string | null
  kv_class: string | null
  sector: string
  status: string
}

export interface DbDocument {
  id: string
  production_order_id: string
  title: string
  revision: string
  status: string
  storage_path: string | null
  storage_path_3d: string | null
}

export interface DbAuditEntry {
  id: string
  factory_user_id: string | null
  document_id: string | null
  production_order_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
}

// -----------------------------------------------------------
// Dados iniciais — operadores, OPs e documentos
// -----------------------------------------------------------
const INITIAL_ORDERS: DbProductionOrder[] = [
  {
    id: 'op-9982',
    op_number: 'OP-2025-9982',
    product_title: 'Transformador de Potência 40 MVA',
    product_type: 'power_transformer',
    mva_class: '40 MVA',
    kv_class: '138 kV',
    sector: 'Montagem de Transformadores',
    status: 'in_progress',
  },
  {
    id: 'op-9983',
    op_number: 'OP-2025-9983',
    product_title: 'Regulador de Tensão 15 MVA',
    product_type: 'voltage_regulator',
    mva_class: '15 MVA',
    kv_class: '69 kV',
    sector: 'Bobinagem',
    status: 'in_progress',
  },
  {
    id: 'op-9984',
    op_number: 'OP-2025-9984',
    product_title: 'Transformador de Potência 80 MVA',
    product_type: 'power_transformer',
    mva_class: '80 MVA',
    kv_class: '230 kV',
    sector: 'Montagem de Transformadores',
    status: 'on_hold',
  },
]

const INITIAL_DOCUMENTS: DbDocument[] = [
  {
    id: 'doc-001',
    production_order_id: 'op-9982',
    title: 'Esquema de Montagem Principal',
    revision: 'Rev C',
    status: 'Released',
    storage_path: 'esquema-montagem-40mva.pdf',
    storage_path_3d: null,
  },
  {
    id: 'doc-002',
    production_order_id: 'op-9983',
    title: 'Procedimento de Bobinagem',
    revision: 'Rev A',
    status: 'Released',
    storage_path: 'procedimento-bobinagem-15mva.pdf',
    storage_path_3d: null,
  },
]

// -----------------------------------------------------------
// Banco em memória — inicializado uma única vez
// -----------------------------------------------------------
export interface LocalDatabase {
  users: DbUser[]
  orders: DbProductionOrder[]
  documents: DbDocument[]
  auditLog: DbAuditEntry[]
}

let _db: LocalDatabase | null = null
let _initPromise: Promise<LocalDatabase> | null = null

async function buildDatabase(): Promise<LocalDatabase> {
  // Derivar hashes PBKDF2 para os operadores pré-cadastrados
  const initialUsers = [
    { id: 'usr-carlos', badge: 'A3F2B1C0', name: 'Carlos Alvarenga', reg: 'TS-001', role: 'operador', sector: 'Montagem de Transformadores', sector_code: 'MT-01' },
    { id: 'usr-mariana', badge: 'FF01A2B3', name: 'Mariana Couto', reg: 'TS-002', role: 'inspetor', sector: 'Bobinagem', sector_code: 'BO-02' },
    { id: 'usr-jose', badge: 'CC9944DD', name: 'José Ferreira', reg: 'TS-003', role: 'engenheiro', sector: 'Testes Elétricos', sector_code: 'TE-03' },
  ]

  const users: DbUser[] = await Promise.all(
    initialUsers.map(async u => ({
      id: u.id,
      badge_uid: u.badge,
      name: u.name,
      registration_number: u.reg,
      role: u.role,
      sector: u.sector,
      sector_code: u.sector_code,
      is_active: true,
      password_hash: await derivePasswordFromUid(u.badge),
    }))
  )

  // Tenta carregar do localStorage primeiro
  const savedData = localStorage.getItem('tsea_db')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      console.log('[TSEA LocalDB] Banco restaurado do localStorage')
      return parsed as LocalDatabase
    } catch {
      console.error('[TSEA LocalDB] Erro ao carregar do localStorage, recriando banco')
    }
  }

  // Primeira execução — persiste dados iniciais no localStorage
  const dbConfig: LocalDatabase = {
    users,
    orders: INITIAL_ORDERS,
    documents: INITIAL_DOCUMENTS,
    auditLog: [],
  }

  localStorage.setItem('tsea_db', JSON.stringify(dbConfig))
  console.log('[TSEA LocalDB] Banco de dados inicializado')

  return dbConfig
}

// -----------------------------------------------------------
// Persistência síncrona
// -----------------------------------------------------------
export async function saveDb(db: LocalDatabase) {
  _db = db
  localStorage.setItem('tsea_db', JSON.stringify(db))
}

// -----------------------------------------------------------
// getDb — retorna singleton, inicializa se necessário
// -----------------------------------------------------------
export async function getDb(): Promise<LocalDatabase> {
  if (_db) return _db
  if (_initPromise) return _initPromise

  _initPromise = buildDatabase().then(db => {
    _db = db
    return db
  })

  return _initPromise
}

// -----------------------------------------------------------
// API de Mutação (Admin Panel CRUD)
// -----------------------------------------------------------
export async function addUser(user: DbUser): Promise<void> {
  const db = await getDb()
  db.users.push(user)
  await saveDb(db)
}

export async function addProductionOrder(order: DbProductionOrder): Promise<void> {
  const db = await getDb()
  db.orders.push(order)
  await saveDb(db)
}

export async function addDocument(doc: DbDocument): Promise<void> {
  const db = await getDb()
  db.documents.push(doc)
  await saveDb(db)
}
