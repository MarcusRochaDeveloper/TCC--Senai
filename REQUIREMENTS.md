# Requisitos Técnicos e Arquitetura - TSEA Digital Factory (Production Grade c/ Supabase)

## 1. Stack Tecnológico e Arquitetura BaaS
- **Core:** React 18+ com TypeScript (modo `strict: true` ativado para zero tolerância a tipagem implícita). Build via Vite.
- **Backend as a Service (BaaS):** Supabase (Substituindo o antigo backend em Node.js).
  - **Banco de Dados:** Supabase PostgreSQL (Armazenamento de OPs, Rastreabilidade).
  - **Autenticação:** Supabase Auth interligado à leitura do hardware RFID.
  - **Armazenamento de Arquivos:** Supabase Storage (Hospedagem restrita de arquivos `.pdf` e `.glb`).
- **Data Fetching:** `@supabase/supabase-js` em conjunto com **TanStack Query (React Query)** para chamadas e cache em memória.
- **Gerenciamento de Estado Global:** Uso exclusivo do **Zustand** para orquestrar o payload autenticado e as lógicas de view.
- **Estilização:** TailwindCSS v4. Componentização estrita em `src/components`.

## 2. Interface, UX e Acessibilidade Industrial
- **Layout Split-Screen Responsivo:**
  - Painel Esquerdo (40%): `react-pdf` utilizando Web Workers dedicados (evitando gargalos na main thread).
  - Painel Direito (60%): `@react-three/fiber` renderizando um `<canvas>`.
- **Modo Industrial Extremo:** 
  - Tema *Dark Mode* imutável. Escala de cores baseada na paleta institucional (fundos de tela escuros anti-fadiga e auto-contraste).
- **Frictionless UI:** Todos os elementos clicáveis devem possuir alvos de toque grandes (`min-h-[48px]`), homologados para uso de luvas (Norma Industrial).
- **Feedback Sensorial:** Flashes puros em CSS de sucesso/erro integrados logicamente às repostas do Supabase.

## 3. Motor Gráfico e Gêmeo Digital (WebGL)
- **Compressão e Performance:** Obrigatório o uso do **DRACOLoader** para descompressão.
- **Gerenciamento de Memória (Crucial):** O componente 3D deve forçar o `dispose()` de geometrias e buffers nativos do Three.js para limpar a memória RAM do Panel PC em cada troca de OP.
- **Interatividade Constrita:** Uso de `<OrbitControls>` com limitadores fixos para evitar colapso visual do viewport 3D pelo operador.

## 4. Hardware Interfacing (RFID e QR Code)
- **Integração RFID (Tap-and-Go com Auth Supabase):** 
  - Sistema reativo de *Keyboard Wedge* intercepta o código crachá e o converte numa Mutation do Supabase Auth (Sistema customizado de Auth).
- **Rastreabilidade Óptica (GS1):** 
  - Scanner local (`html5-qrcode`) cruza as chaves do QR Code e consulta o PostgreSQL PDM (via API Supabase).

## 5. Offline-First e Resiliência Kiosk
- **PWA/Workbox:** O Kiosk Chrome OS/Windows carregará a casca visual offline via Service Worker.
- **Cache Local:** **Dexie.js (IndexedDB)** interceptará blobs do Supabase Storage. Se o Wi-Fi da fábrica sofrer queda na área de "Vapor Phase", a inspeção de uma OP previamente carregada continua ativa.
- **Modo Quiosque (Kiosk Mode):** API Fullscreen nativa (`document.documentElement.requestFullscreen()`) acionada via restrições do Frontend.

## 6. Segurança Zero-Trust e RLS (Row Level Security)
- **Nível de Linha (RLS - Supabase):** Nenhuma OP ou documento estará acessível publicamente no Bucket ou no DB. As *Policies* (RLS) do Supabase restringirão a leitura apenas à sessão injetada.
- **CORS e Autorização:** O frontend não detém poder de fogo. Operações não autenticadas no Supabase Storage serão dropadas pelo servidor da nuvem (Error 401/403).
- **Inactivity Timeout:** Ocrrendo ausência mecânica/interacional de 5 minutos, o React comanda o `supabase.auth.signOut(),` limpando a sessão.

## 7. Rastreabilidade (ISO 9001) e Telemetria
- **Audit Trails:** Todo cruzamento relacional e carregamento documental será logado indiretamente no banco de dados para trilhas de auditoria (Conformidade ISO 9001 de controle de revisão operacional).




O APLICATIVO DEVE SER PENSANDO INTERIAMENTE EM PRODUCAO, USE O GET SHIT DONE COMO PARAMETRO PARA NAO ALUCIONAR, LEIA SEMPRE O PROJETO.MD, E ANOTE SUAS COISAS NO STATE ITEM OBRIGATORIO
