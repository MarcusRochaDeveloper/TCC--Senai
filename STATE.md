# STATE.md — TSEA Digital Factory Dashboard
> Arquivo de rastreamento de estado vivo. Atualizado ao fim de cada etapa.

---

## Status Atual
**Fase:** FASE 3 — Experiência e Conteúdo (UX Polish + Modelos 3D Reais)
**Milestone Ativo:** 14 — Sistema Local SQLite + UX da LockScreen + Modelos 3D da Parte Ativa
**Última Atualização:** 2026-04-18
**Próximo Passo:** Implementar Milestone 14 (ver ROADMAP.md)

---

## O Que Já Existe (Fase 1+2 Concluídas — tsea-dashboard-old)

### Stack Instalada (package.json)
- React 19 + TypeScript strict mode + Vite 8
- TailwindCSS v4
- TanStack Query v5
- Zustand v5
- `pdfjs-dist` v5 (PDF viewer com Web Workers)
- `@react-three/fiber` v9 + `@react-three/drei` v10 (3D WebGL)
- `dexie` v4 (IndexedDB — Offline-First)
- `html5-qrcode` v2 (QR Code scanner)
- `vite-plugin-pwa` (PWA/Service Worker)

### Componentes Existentes (src/components/)
| Arquivo | Status |
|---|---|
| `Header.tsx` | Funcional — exibe OP ativa, nome do operador, setor |
| `LockScreen.tsx` | Funcional — tela de bloqueio aguardando RFID (emojis a substituir por SVGs) |
| `PdfViewer.tsx` | Funcional — renderiza PDF com Web Workers |
| `ThreeDViewer.tsx` | Funcional — renderiza .glb com OrbitControls + DRACO |
| `QrScanner.tsx` | Funcional — scanner QR via câmera/html5-qrcode |
| `FlashFeedback.tsx` | Funcional — CSS flash de sucesso/erro |
| `ErrorBoundary.tsx` | Funcional — captura erros React (emojis a substituir por SVGs) |

### Camada de Dados Local (Fase 3 — migrado de Supabase)
| Arquivo | Status |
|---|---|
| `src/lib/localDb.ts` | Banco em memória — seed 3 operadores, 3 OPs, 2 docs |
| `src/lib/authService.ts` | Auth local RFID via PBKDF2 — signIn/signOut/auditLog |
| `src/api/mes.ts` | Queries no banco em memória (sem Supabase) |
| `src/api/supabaseClient.ts` | Stub vazio — Supabase removido |
| `src/stores/authStore.ts` | Migrado — setOperatorFromBadge() local |
| `src/hooks/useRfidReader.ts` | Migrado — usa signInWithBadge() local |

### Configuração
- `.vscode/settings.json` — suprime warning @theme do Tailwind v4
- Vite rodando OK em http://localhost:5173
- tsc --noEmit: 0 erros

---

## Decisões de Arquitetura (Registradas)

1. **Backend local:** Banco em memória puro JS (sem WASM, sem SQL) — Supabase retorna na entrega final do TCC para produção.
2. **Auth RFID:** Keyboard Wedge → PBKDF2-SHA256 sobre UID → comparação com hash armazenado no banco local.
3. **Vinculação 3D+PDF:** Cada OP carrega simultaneamente o documento PDF e o modelo 3D pela chave `production_order_id` — nunca um sem o outro.
4. **Estrutura de assets 3D:** Modelos GLB da parte ativa ficam em `/public/models/` e são referenciados no seed do localDb pelo campo `storage_path_3d`.
5. **UX LockScreen:** Campo visual de digitação — buffer RFID exibido como "••••••••" com feedback de cor (verde OK / vermelho erro) e contador de caracteres.
6. **Sem emojis no código:** Toda iconografia é SVG inline ou componente React — sem caracteres Unicode emoji em UI crítica industrial.
7. **Timeout:** 5 minutos inatividade → logout automático (useInactivityTimeout.ts).
8. **Offline:** Dexie.js como cache de arquivos binários (preparado para quando Supabase retornar).

---

## Checklist de Desenvolvimento — Fase 3

### Milestone 14: SQLite Local + UX LockScreen + Modelos Reais (ATIVO)
- [x] **14.1** — Migração completa do Supabase para banco em memória local
- [x] **14.2** — seed com 3 operadores RFID (PBKDF2), 3 OPs, 2 docs
- [x] **14.3** — authStore/useRfidReader/mes.ts/ErrorBoundary desacoplados do Supabase
- [ ] **14.4** — LockScreen: exibir buffer RFID em tempo real (campo visual de digitação com máscara)
- [ ] **14.5** — LockScreen: feedback de cor para estado (aguardando / digitando / autenticando / erro)
- [ ] **14.6** — Substituir todos os emojis por SVGs inline (LockScreen, ErrorBoundary, consoleLogs mantidos)
- [ ] **14.7** — Importar modelos 3D reais da Parte Ativa (formato .glb) em `/public/models/`
- [ ] **14.8** — Vincular modelos ao seed: quando uma OP abre, PDF e GLB carregam juntos
- [ ] **14.9** — Validar abertura conjunta: PdfViewer + ThreeDViewer sincronizados pela mesma OP ativa
- [ ] **14.10** — Atualizar seed do localDb com os caminhos reais dos modelos importados

### Milestone 15: Integração Supabase Produção (Futuro — pós-TCC ou final)
- [ ] **15.1** — Migrar banco em memória de volta para Supabase (service_role key em mãos)
- [ ] **15.2** — Upload de PDFs e GLBs reais para o bucket `tsea-documents`
- [ ] **15.3** — Re-ativar Signed URLs e cache Dexie para Offline-First
- [ ] **15.4** — E2E Testing em hardware real (leitor RFID USB + kiosk touch)
- [ ] **15.5** — Deploy e homologação na fábrica TSEA
