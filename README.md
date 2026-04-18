# TSEA Digital Factory — Painel Industrial de Chão de Fábrica

> **TCC · SENAI · Tecnologia em Sistemas para Internet**  
> Aluno: Marcus Rocha · Orientador: [Nome do orientador]  
> Empresa parceira: [TSEA Energia](https://www.tseaenergia.com.br/) — Contagem, MG

---

## O Problema Real

A TSEA Energia opera uma das maiores fábricas de transformadores de potência do Brasil — 32.000 m² em Contagem (MG), produzindo até 200 transformadores/ano de até **500 MVA / 500 kV**, além de 3.500 reguladores de tensão.

Toda essa produção depende hoje de **documentação técnica em papel**. O problema:

- Papel absorve óleo isolante, rasga com luvas industriais e acumula poeira de aço silício condutivo
- **"Desvio de versão"** — operadores usam revisões obsoletas de desenhos porque o recolhimento manual de plantas espalhadas por 32.000 m² é falho
- Uma tentativa anterior de digitalização com totem fracassou por **fricção de autenticação** (login com teclado virtual + luvas = impossível) e **desorganização de arquivos** (explorador de pastas sem controle de versão)
- Retrabalho em peças de alto custo (núcleo de aço silício, bobinas de alta tensão) gera centenas de horas de custo por incidente

---

## A Solução: TSEA Digital Factory

Um **painel industrial PWA** (Progressive Web App) de chão de fábrica que entrega:

| Funcionalidade | Descrição |
|---|---|
| **Autenticação RFID Frictionless** | Operador encostar o crachá → login instantâneo, sem teclado, sem senha |
| **Documento técnico sempre atualizado** | PDF do desenho liberado (`Revnn Released`) carregado diretamente da OP ativa |
| **Modelo 3D interativo** | Visualizador WebGL da parte ativa (núcleo, bobinas HV/LV, bucha) com modo wireframe e exploded view |
| **Carregamento conjunto** | PDF e modelo 3D abrem simultaneamente vinculados à mesma Ordem de Produção |
| **QR Code de rastreamento** | Leitura de QR Code no componente físico abre instantaneamente a OP e documentação |
| **Timeout de inatividade** | Sessão encerra após 5 min sem interação — kiosk sempre pronto para o próximo operador |
| **Audit Trail ISO 9001** | Registro de quem abriu qual documento e quando (rastreabilidade para auditoria) |

---

## Stack Tecnológica

```
Frontend (PWA Kiosk)
├── React 19 + TypeScript (strict mode)
├── Vite 8 + vite-plugin-pwa (Service Worker + offline)
├── TailwindCSS v4
├── Zustand v5 (state management)
├── TanStack Query v5 (data fetching)
├── PDF.js v5 via pdfjs-dist (renderização de PDF com Web Workers)
├── React Three Fiber v9 + Drei v10 (WebGL 3D — DRACO decompression)
├── Dexie v4 (IndexedDB — cache offline de binários)
└── html5-qrcode v2 (QR Code scanner via câmera)

Autenticação
└── RFID Keyboard Wedge → PBKDF2-SHA256 (Web Crypto API) → banco local

Dados (fase de desenvolvimento)
└── Banco em memória (JS puro) — seed com operadores, OPs e documentos
    → Preparado para migração para Supabase (PostgreSQL + Auth + Storage)
```

---

## Arquitetura de Segurança

- **Zero Trust RFID**: o UID do crachá nunca é armazenado em texto puro — apenas o hash PBKDF2 (100.000 iterações, SHA-256 + salt por ambiente)
- **Sessão em memória**: logout/refresh da página encerra a sessão (comportamento correto para kiosk)
- **Kiosk mode**: browser fullscreen, sem barra de endereços, sem acesso ao sistema de arquivos
- **Audit log**: toda abertura de documento gera um registro com usuário + timestamp

---

## Como Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/MarcusRochaDeveloper/TCC--Senai.git
cd TCC--Senai/tsea-dashboard-old

# Instale as dependências
npm install

# Configure o ambiente (copie e edite)
cp .env.example .env
# Edite VITE_RFID_SALT com um salt seguro

# Rode o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:5173
```

### UIDs de teste (seed)

| UID | Operador | Função |
|---|---|---|
| `A3F2B1C0` | Carlos Alvarenga | Operador — Montagem de Transformadores |
| `FF01A2B3` | Mariana Couto | Inspetora — Bobinagem |
| `CC9944DD` | José Ferreira | Engenheiro — Testes Elétricos |

> **Como usar:** com a tela de LockScreen aberta, digit o UID no teclado e pressione `Enter` (simula a leitura do leitor RFID USB).

---

## Estrutura do Projeto

```
TCC--Senai/
├── tsea-dashboard-old/          # Aplicação principal (frontend PWA)
│   ├── src/
│   │   ├── api/
│   │   │   ├── mes.ts           # Camada MES — lógica de busca de OPs e documentos
│   │   │   └── supabaseClient.ts # Stub vazio (Supabase desativado em dev)
│   │   ├── components/
│   │   │   ├── LockScreen.tsx   # Tela de autenticação RFID com buffer visual
│   │   │   ├── PdfViewer.tsx    # Visualizador de PDF (PDF.js + Web Workers)
│   │   │   ├── ThreeDViewer.tsx # Visualizador 3D WebGL (Three.js + DRACO)
│   │   │   ├── Header.tsx       # Header industrial com info do operador e OP
│   │   │   ├── QrScanner.tsx    # Scanner de QR Code
│   │   │   └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useRfidReader.ts        # Interceptor de teclado RFID (Keyboard Wedge)
│   │   │   └── useInactivityTimeout.ts # Logout automático por inatividade
│   │   ├── lib/
│   │   │   ├── localDb.ts       # Banco em memória (seed de operadores, OPs, docs)
│   │   │   └── authService.ts   # Auth local — PBKDF2, signIn, signOut, auditLog
│   │   └── stores/
│   │       └── authStore.ts     # Estado global de sessão (Zustand)
│   ├── public/
│   │   ├── draco/               # Decodificador DRACO para modelos 3D comprimidos
│   │   └── models/              # (futuro) Modelos .glb da parte ativa por OP
│   ├── vite.config.ts
│   └── package.json
├── supabase/                    # Scripts SQL (schema, seed, triggers)
│   └── *.sql
├── ROADMAP.md                   # Roadmap de desenvolvimento por fase e milestone
├── STATE.md                     # Estado atual do projeto (atualizado por sessão)
├── REQUIREMENTS.md              # Requisitos funcionais e não-funcionais
└── projeto.md                   # Documento de arquitetura tecnológica (TCC)
```

---

## Roadmap

### Fase 1 — Fundação (Concluída)
Estrutura visual industrial, split-screen PDF+3D, PWA, IndexedDB, autenticação RFID local.

### Fase 2 — BaaS Supabase (Suspenso em dev, retoma na produção)
Schema PostgreSQL, RLS, Supabase Auth — suspenso por bloqueio de GoTrue em ambiente local. Retoma na entrega final do TCC com `service_role` key.

### Fase 3 — UX + Conteúdo Real (Em andamento)
- [x] Migração para banco em memória local (sem WASM, sem dependência de rede)
- [x] Autenticação RFID totalmente funcional offline
- [x] LockScreen com buffer visual de digitação em tempo real (dots mascarados, estados de cor, shake no erro)
- [x] Todos os emojis substituídos por SVGs inline
- [ ] Importação dos modelos 3D reais da parte ativa (GLB + DRACO)
- [ ] Vinculação completa PDF + 3D por OP

### Fase 4 — Produção (Pós-TCC)
Deploy em kiosk industrial (Panel PC fanless IP65+), hardware RFID real, Supabase em produção, testes em campo na fábrica TSEA.

---

## Contexto Acadêmico

Este projeto é o **Trabalho de Conclusão de Curso** do curso Técnico em Desenvolvimento de Sistemas do SENAI. Propõe uma solução real para um problema industrial identificado em visita técnica à TSEA Energia — uma empresa que:

- Fabrica transformadores de até 500 MVA e 500 kV
- Emprega centenas de operadores em ambiente hostil (poeira de aço silício, névoa de óleo)
- Sofre com retrabalho por uso de documentos técnicos em versão obsoleta
- Tentou e falhou com digitalização anterior por má usabilidade

O sistema proposto elimina a fricção de autenticação via RFID Tap-and-Go, garante que apenas documentos com status `Released` cheguem ao operador, e injeta rastreabilidade ISO 9001 sem nenhuma interação adicional do usuário.

---

## Licença

Projeto acadêmico — todos os direitos reservados. Desenvolvido como TCC para o SENAI.  
Os dados da TSEA Energia utilizados são de caráter público ou foram anonimizados para fins educacionais.
