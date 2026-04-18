// ============================================================
// src/api/mes.ts
// Camada MES — Ordens de Produção via banco em memória local
// Contrato de retorno idêntico ao anterior — App.tsx inalterado
// ============================================================
import { getDb } from '../lib/localDb'
import { insertAuditLog, getCurrentUser } from '../lib/authService'

// -----------------------------------------------------------
// Tipo de saída do MES — interface que o App.tsx consome
// -----------------------------------------------------------
export interface ProductionOrder {
  opNumber: string
  title: string
  productType: string
  mvaClass: string | null
  kvClass: string | null
  sector: string | null
  status: string
  pdfUrl: string | null
  glbUrl: string | null
  documentId: string | null
  documentTitle: string | null
  revision: string | null
}

// -----------------------------------------------------------
// getProductionOrder — busca OP + documento Released
// -----------------------------------------------------------
export const getProductionOrder = async (
  opNumber: string
): Promise<ProductionOrder> => {
  const db = await getDb()

  const order = db.orders.find(o => o.op_number === opNumber)
  if (!order) {
    throw new Error(`OP "${opNumber}" não encontrada.`)
  }

  const doc = db.documents.find(
    d => d.production_order_id === order.id && d.status === 'Released'
  ) ?? null

  // Para arquivos locais no futuro: coloque PDFs em /public/assets/
  const pdfUrl = doc?.storage_path
    ? `/assets/${doc.storage_path}`
    : null

  const glbUrl = doc?.storage_path_3d
    ? `/assets/${doc.storage_path_3d}`
    : null

  // Audit log (fire-and-forget)
  const currentUser = getCurrentUser()
  void insertAuditLog({
    factory_user_id: currentUser?.id ?? null,
    production_order_id: order.id,
    document_id: doc?.id ?? null,
    action: 'op_opened',
    metadata: { op_number: opNumber, document_revision: doc?.revision ?? null },
  })

  return {
    opNumber: order.op_number,
    title: order.product_title,
    productType: order.product_type,
    mvaClass: order.mva_class,
    kvClass: order.kv_class,
    sector: order.sector,
    status: order.status,
    pdfUrl,
    glbUrl,
    documentId: doc?.id ?? null,
    documentTitle: doc?.title ?? null,
    revision: doc?.revision ?? null,
  }
}

// -----------------------------------------------------------
// getProductionOrderById — por UUID (para QR Code)
// -----------------------------------------------------------
export const getProductionOrderById = async (id: string): Promise<ProductionOrder> => {
  const db = await getDb()
  const order = db.orders.find(o => o.id === id)
  if (!order) throw new Error(`ID de OP inválido: ${id}`)
  return getProductionOrder(order.op_number)
}

// -----------------------------------------------------------
// listSectorOrders — todas as OPs para o painel de seleção
// -----------------------------------------------------------
export interface OrderSummary {
  id: string
  op_number: string
  product_title: string
  product_type: string
  mva_class: string | null
  kv_class: string | null
  sector: string
  status: string
  hasDocument: boolean
}

export const listSectorOrders = async (
  sectorFilter?: string
): Promise<OrderSummary[]> => {
  const db = await getDb()
  let orders = db.orders
  if (sectorFilter) {
    orders = orders.filter(o => o.sector === sectorFilter)
  }
  return orders.map(o => ({
    id:            o.id,
    op_number:     o.op_number,
    product_title: o.product_title,
    product_type:  o.product_type,
    mva_class:     o.mva_class,
    kv_class:      o.kv_class,
    sector:        o.sector,
    status:        o.status,
    hasDocument:   db.documents.some(d => d.production_order_id === o.id && d.status === 'Released'),
  }))
}

