# Roadmap — TSEA Digital Factory Dashboard

## FASE 1: Fundação do Cliente e Tecnologias Base (Concluída)
*Milestones 1 ao 8 (Arquivados). Trataram a concepção visual da interface industrial, integração de motores gráficos independentes do lado do cliente e implementações offline (PWA, IndexedDB). O backend customizado Node foi abandonado em favor de uma arquitetura orientada a dados locais expandível para BaaS.*

---

## FASE 2: BaaS Supabase (Tentativa — Suspensa por bloqueio de Auth)
*Milestones 9 ao 13. Schema PostgreSQL, RLS, RFID via PBKDF2 e Supabase Auth foram implementados com sucesso no front-end. O seed de usuários falhou por bug estrutural do GoTrue ao injetar registros diretamente no auth.users sem a service_role key. Decisão: suspender Supabase e avançar com banco local para não bloquear o desenvolvimento do TCC.*

---

## FASE 3: Experiência e Conteúdo (FASE ATIVA)

### Milestone 14: Local-First + UX LockScreen + Modelos 3D Reais
*Objetivo: sistema completamente funcional localmente para demonstração do TCC, com dados reais de engenharia (modelos 3D da parte ativa) e experiência de autenticação industrial polida.*

**14.4 — UX de Digitação na LockScreen**
- Exibir visualmente o buffer RFID sendo digitado (caracteres mascarados "• • • • • • • •")
- Estado "digitando" com cor azul enquanto acumula caracteres
- Estado "autenticando" com spinner integrado ao campo
- Estado "erro" com vermelho + shake animation + mensagem abaixo do campo
- Estado "sucesso" com verde + checkmark antes de redirecionar

**14.5 — Substituição de Emojis por SVGs**
- LockScreen: ícones de crachá, NFC waves, erro, sucesso — todos SVG inline
- ErrorBoundary: ícone de alerta SVG
- Header: status dots já são SVG (manter)
- Remover quaisquer caracteres Unicode emoji (⚠️ ✅ ❌ etc.) da UI visível

**14.6 — Importação de Modelos 3D da Parte Ativa**
- Converter/exportar modelos GLB da parte ativa (núcleo, bobina HV/LV, bucha)
- Estrutura: `/public/models/{op-number}/active-part.glb`
- Compressão DRACO obrigatória para reduzir tamanho (já suportada pelo ThreeDViewer)
- Vincular ao seed do localDb: campo `storage_path_3d` aponta para o path local

**14.7 — Carregamento Conjunto PDF + 3D**
- Quando o usuário abre uma OP (via QR Code ou seleção), os dois painéis carregam simultaneamente
- PdfViewer e ThreeDViewer recebem a mesma `ProductionOrder` como fonte de verdade
- Se só existe PDF (sem GLB): ThreeDViewer exibe placeholder "Modelo 3D não disponível para esta revisão"
- Se só existe GLB (sem PDF): PdfViewer exibe placeholder "Documento técnico em aprovação"
- Nunca um painel fica em branco por falta de dado — sempre feedback informativo

---

## FASE 4: Integração Supabase Produção (Pós-TCC)

### Milestone 15: Reconexão ao Supabase com service_role
- Migrar banco em memória de volta para Supabase (com service_role key)
- Upload de PDFs e GLBs reais para bucket `tsea-documents`
- Re-ativar Signed URLs e cache Dexie para Offline-First
- E2E Testing em hardware real (leitor RFID USB + kiosk touch 24")
- Deploy e homologação na fábrica TSEA Energia

### Milestone 16: Funcionalidades Avançadas (Backlog)
- Inspeção visual: anotações sobre o modelo 3D (THREE.js raycasting)
- Checklist digital integrado ao documento (marcação por operador autenticado)
- Dashboard supervisor: visão consolidada de todas as OPs abertas em tempo real
- Notificações Push via Supabase Realtime quando um documento muda de status
