# SimArch

SimArch e uma ferramenta de modelagem e simulacao arquitetural que permite desenhar sistemas distribuidos, definir fluxos, requisitos, rastreabilidade e executar simulacoes de carga e falha antes de codificar.

> **"No SimArch, voce nao testa codigo. Voce testa decisoes."**

## Funcionalidades

- **Diagrama de arquitetura** – Canvas visual com componentes cloud (AWS, Azure, GCP, Oracle, generico)
- **Triggers** – User Traffic, Scheduler, Webhook, Event Source, Error
- **Fluxos** – Definicao de passos com fallback e injecao de falha
- **Requisitos e rastreabilidade** – Matriz de rastreabilidade, gap analysis
- **ADRs** – Architectural Decision Records
- **Simulacao** – Engine de eventos discretos com circuit breaker, timeout, retry, bulkhead, queue
- **Controles de simulacao** – Duracao, taxa, ramp-up, taxa de falha, cenarios prontos (Normal, Pico, Black Friday, Falha Regional)
- **Export** – PDF (ADR, relatorio, consolidado, decision log), JSON, Mermaid, FinOps CSV

## Requisitos

- .NET 10
- Node.js 18+
- npm ou yarn

## Execucao local

### 1. API (backend)

```bash
cd src/SimArch.Api
dotnet run
```

API em `http://localhost:5044`

### 2. Frontend

```bash
cd src/SimArch.Web/client
npm install
npm run dev
```

Interface em `http://localhost:5173` (Vite proxy `/api` para 5044)

### 3. Via SimArch.Web (produção)

O SimArch.Web serve o frontend e usa YARP para fazer proxy de `/api` para a API:

```bash
# Terminal 1: API
cd src/SimArch.Api && dotnet run

# Terminal 2: Build do frontend e Web
cd src/SimArch.Web/client && npm run build
cd .. && dotnet run
```

Interface em `http://localhost:5080`

## Docker

```bash
docker-compose up --build
```

- Gateway em `http://localhost:5000`
- Servicos: api, web, gateway

## Estrutura do projeto

```
SimArch/
├── src/
│   ├── SimArch.Api/          # API REST (modelo, simulacao, decisao, export)
│   ├── SimArch.Web/          # Host ASP.NET + frontend React (wwwroot)
│   │   └── client/           # React + Vite + ReactFlow + Mermaid
│   ├── SimArch.Gateway/      # Gateway (Docker)
│   ├── SimArch.Domain/       # Entidades e modelos
│   ├── SimArch.DSL/          # YAML loader (YamlModelLoader)
│   ├── SimArch.Simulation/   # Engine de simulacao discreta
│   ├── SimArch.Decision/     # Motor de decisao arquitetural
│   ├── SimArch.Export/       # Export ADR, Mermaid, consolidado, etc.
│   └── SimArch.App/          # Aplicacao standalone
├── samples/                  # Projetos exemplo YAML
│   ├── ecommerce-order-payment.yaml
│   ├── checkout-flow.yaml
│   └── checkout-with-requirements.yaml
├── docs/                     # Documentacao
└── docker-compose.yml
```

## Projetos exemplo

Use **Exemplos** no menu para carregar:

- **E-commerce Order e Pagamento** – Fluxo completo com User Traffic, API Gateway, Auth, Order, Payment, Message Queue, Fallback e Error
- **Checkout Flow** – Fluxo simples (User, Gateway, Payment, Wallet)
- **Checkout com Requisitos** – Mesmo fluxo com requisitos e rastreabilidade

## Modelo YAML

Exemplo minimo:

```yaml
name: Meu Sistema
projectType: single
primaryCloud: generic
services:
  - id: gateway
    name: API Gateway
    component: generic-api-gateway
    slaMs: 100
  - id: payment
    name: Payment Service
    component: generic-service
    fallback: wallet
  - id: wallet
    name: Wallet Fallback
    component: generic-service
flows:
  - id: main
    name: Main Flow
    steps:
      - from: User
        to: gateway
      - from: gateway
        to: payment
        onFailure: wallet
```

## Licenca

Projeto privado / interno.
