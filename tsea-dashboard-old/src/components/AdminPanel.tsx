import { useState, useEffect } from 'react'
import { getDb, addUser, addProductionOrder, addDocument, derivePasswordFromUid, type DbUser, type DbProductionOrder, type DbDocument } from '../lib/localDb'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'operadores' | 'ops'>('ops')
  const [dbData, setDbData] = useState<{ users: DbUser[], orders: DbProductionOrder[], docs: DbDocument[] } | null>(null)

  // Form states - Usuário
  const [userBadge, setUserBadge] = useState('')
  const [userName, setUserName] = useState('')
  const [userReg, setUserReg] = useState('')
  const [userRole, setUserRole] = useState('operador')
  const [userSector, setUserSector] = useState('Montagem de Transformadores')

  // Form states - OP
  const [opNumber, setOpNumber] = useState('')
  const [opTitle, setOpTitle] = useState('')
  const [opMva, setOpMva] = useState('')
  const [opKv, setOpKv] = useState('')

  // Form states - Documento
  const [docOpId, setDocOpId] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [docRev, setDocRev] = useState('Rev A')
  const [docPdfPath, setDocPdfPath] = useState('')
  const [docGlbPath, setDocGlbPath] = useState('')

  const refreshData = async () => {
    const db = await getDb()
    setDbData({ users: db.users, orders: db.orders, docs: db.documents })
  }

  useEffect(() => {
    void refreshData()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userBadge || !userName || !userReg) return 

    const password_hash = await derivePasswordFromUid(userBadge)
    const newUser: DbUser = {
      id: `usr-${Date.now()}`,
      badge_uid: userBadge,
      name: userName,
      registration_number: userReg,
      role: userRole,
      sector: userSector,
      sector_code: userSector.substring(0,2).toUpperCase(),
      is_active: true,
      password_hash
    }
    
    await addUser(newUser)
    setUserBadge('')
    setUserName('')
    setUserReg('')
    void refreshData()
  }

  const handleCreateOp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opNumber || !opTitle) return

    const newOp: DbProductionOrder = {
      id: `op-${Date.now()}`,
      op_number: opNumber,
      product_title: opTitle,
      product_type: 'power_transformer',
      mva_class: opMva || null,
      kv_class: opKv || null,
      sector: 'Montagem de Transformadores',
      status: 'in_progress'
    }

    await addProductionOrder(newOp)
    setOpNumber('')
    setOpTitle('')
    setOpMva('')
    setOpKv('')
    void refreshData()
  }

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docOpId || !docTitle) return

    const newDoc: DbDocument = {
      id: `doc-${Date.now()}`,
      production_order_id: docOpId,
      title: docTitle,
      revision: docRev,
      status: 'Released',
      storage_path: docPdfPath || null,
      storage_path_3d: docGlbPath || null
    }

    await addDocument(newDoc)
    setDocTitle('')
    setDocPdfPath('')
    setDocGlbPath('')
    void refreshData()
  }

  return (
    <div className="admin-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 16 }}>
        <button 
          className={`op-filter-btn ${activeTab === 'ops' ? 'op-filter-active' : ''}`}
          onClick={() => setActiveTab('ops')}
        >
          Ordens & Documentos (3D)
        </button>
        <button 
          className={`op-filter-btn ${activeTab === 'operadores' ? 'op-filter-active' : ''}`}
          onClick={() => setActiveTab('operadores')}
        >
          Operadores
        </button>
      </div>

      <div className="admin-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 24 }}>
        
        {activeTab === 'operadores' && (
          <>
            <div className="admin-form-container" style={{ background: 'var(--color-surface-dark)', padding: 20, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
              <h2 style={{ fontSize: 16, marginBottom: 16, color: 'var(--color-text-primary)' }}>Novo Operador</h2>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>UID Crachá (Ex: AB12CD34)</label>
                  <input value={userBadge} onChange={e => setUserBadge(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Nome Completo</label>
                  <input value={userName} onChange={e => setUserName(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Matrícula</label>
                  <input value={userReg} onChange={e => setUserReg(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Setor de Lotação</label>
                  <input value={userSector} onChange={e => setUserSector(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Cargo</label>
                  <select value={userRole} onChange={e => setUserRole(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }}>
                    <option value="operador">Operador de Produção</option>
                    <option value="inspetor">Inspetor de Qualidade</option>
                    <option value="engenheiro">Engenheiro / Admin</option>
                  </select>
                </div>
                <button type="submit" className="industrial-btn btn-primary" style={{ marginTop: 8 }}>Cadastrar Usuário</button>
              </form>
            </div>

            <div className="admin-list-container" style={{ background: 'var(--color-surface-dark)', padding: 20, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
               <h2 style={{ fontSize: 16, marginBottom: 16, color: 'var(--color-text-primary)' }}>Operadores Ativos</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dbData?.users.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--color-bg-primary)', borderRadius: 4, border: '1px solid var(--color-border-subtle)' }}>
                       <div>
                         <div style={{ fontWeight: 'bold', fontSize: 14 }}>{u.name} <span style={{ fontSize: 11, color: 'var(--color-accent-blue)', marginLeft: 8 }}>{u.role.toUpperCase()}</span></div>
                         <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>UID: {u.badge_uid} | {u.sector}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </>
        )}

        {activeTab === 'ops' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Form OP */}
              <div className="admin-form-container" style={{ background: 'var(--color-surface-dark)', padding: 20, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, color: 'var(--color-text-primary)' }}>Nova OP</h2>
                <form onSubmit={handleCreateOp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Código da OP</label>
                    <input value={opNumber} onChange={e => setOpNumber(e.target.value)} placeholder="OP-2025-XXXX" required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Título do Produto</label>
                    <input value={opTitle} onChange={e => setOpTitle(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Classe MVA</label>
                      <input value={opMva} onChange={e => setOpMva(e.target.value)} placeholder="Ex: 50 MVA" style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Classe kV</label>
                      <input value={opKv} onChange={e => setOpKv(e.target.value)} placeholder="Ex: 138 kV" style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                    </div>
                  </div>
                  <button type="submit" className="industrial-btn btn-primary" style={{ marginTop: 8 }}>Criar Ordem</button>
                </form>
              </div>

              {/* Form Doc vinculando o 3D */}
              <div className="admin-form-container" style={{ background: 'var(--color-surface-dark)', padding: 20, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
                <h2 style={{ fontSize: 16, marginBottom: 16, color: 'var(--color-text-primary)' }}>Anexar Arquivos (PDF e 3D) a uma OP</h2>
                <form onSubmit={handleCreateDoc} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Vincular à OP</label>
                    <select value={docOpId} onChange={e => setDocOpId(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }}>
                      <option value="">-- Selecione uma OP --</option>
                      {dbData?.orders.map(o => (
                        <option key={o.id} value={o.id}>{o.op_number} - {o.product_title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Título do Documento</label>
                    <input value={docTitle} onChange={e => setDocTitle(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Revisão do Documento</label>
                    <input value={docRev} onChange={e => setDocRev(e.target.value)} placeholder="Ex: Rev A" style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Nome do arquivo PDF (em public/assets)</label>
                    <input value={docPdfPath} onChange={e => setDocPdfPath(e.target.value)} placeholder="ex: esquema-novo.pdf" style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Nome do Modelo 3D (arquivo .glb em public/assets)</label>
                    <input value={docGlbPath} onChange={e => setDocGlbPath(e.target.value)} placeholder="ex: trafo-core.glb" style={{ width: '100%', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 4, color: '#fff' }} />
                  </div>
                  <button type="submit" className="industrial-btn btn-primary" style={{ marginTop: 8 }}>Vincular Arquivos</button>
                </form>
              </div>
            </div>

            <div className="admin-list-container" style={{ background: 'var(--color-surface-dark)', padding: 20, borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
               <h2 style={{ fontSize: 16, marginBottom: 16, color: 'var(--color-text-primary)' }}>Relação OP x Arquivos Vinculados</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dbData?.orders.map(op => {
                    const linkedDocs = dbData.docs.filter(d => d.production_order_id === op.id)
                    return (
                      <div key={op.id} style={{ padding: 12, background: 'var(--color-bg-primary)', borderRadius: 4, border: '1px solid var(--color-border-subtle)' }}>
                         <div style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--color-accent-blue)' }}>{op.op_number}</div>
                         <div style={{ fontSize: 13, marginBottom: 8 }}>{op.product_title}</div>
                         
                         {linkedDocs.length === 0 ? (
                           <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Nenhum arquivo vinculado.</div>
                         ) : (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                             {linkedDocs.map(d => (
                               <div key={d.id} style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                                 <strong style={{ color: '#fff' }}>{d.title}</strong>
                                 <div style={{ color: 'var(--color-text-muted)' }}>📄 PDF: {d.storage_path || '---'}</div>
                                 <div style={{ color: 'var(--color-text-muted)' }}>🕋 3D: {d.storage_path_3d || '---'}</div>
                               </div>
                             ))}
                           </div>
                         )}
                      </div>
                    )
                  })}
               </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
