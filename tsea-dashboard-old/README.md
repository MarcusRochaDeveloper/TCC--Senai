# TSEA Digital Factory — Industrial Dashboard

Painel WebGL interativo (Production-Grade) para chão de fábrica da **TSEA Energia**, desenhado para rodar em hardware industrial (Panel PCs / Tablets Kiosk).

## 🚀 Tecnologias

- **Vite** + **React 18** + **TypeScript**
- **Three.js** + **@react-three/fiber** (Visualização 3D de alta performance)
- **PDF.js** (Renderização de documentos em Web Workers)
- **Zustand** (Manipulação de estado global leve)
- **Tailwind CSS** (Design System com Dark Mode industrial imutável)
- **html5-qrcode** (Scanner de GS1 vía WebRTC)

## 📦 Setup & Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de Produção
npm run build
```

## 🏭 Features Industriais

- **Frictionless Login (Tap-and-Go):** Integração com leitores USB de Crachá RFID/NFC via buffer de `keydown` do _Keyboard Wedge_.
- **Kiosk Mode Nativo:** Bloqueio de cliques direitos, dragging e ativação da Fullscreen API no primeiro toque.
- **GS1 Barcoding:** Câmera ativada via navegador para interpretar `Part Numbers` e OPs formatados no padrão de rastreabilidade do chão de fábrica.
- **Memory Zero-Leak:** O motor webGL destrói sumariamente geometrias e materiais da RAM (`.dispose()`) após a troca de Ordem de Produção (evitando crashes por falta de memória).
- **Tratamento de Anomalias:** _Boundary de Erros_ robusto substitui a temida "White Screen" do React em caso de falha sistêmica.

## 👥 Acessibilidade e Telemetria

Toda a área de cliques de interface atende à usabilidade de operação **com luvas de raspa** industriais, garantindo botões maiores que `48x48px`. Animações e _flashbacks_ de status reportam erros críticos (login negado) ativando a borda da tela com _CSS-transitions_ para rápida leitura sob luminosidade variável de estufas/salas brancas.
