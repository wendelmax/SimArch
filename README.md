# SimArch

SimArch e uma ferramenta de modelagem e simulacao arquitetural que permite desenhar sistemas distribuidos, definir fluxos, requisitos, rastreabilidade e executar simulacoes de carga e falha antes de codificar.

> **"No SimArch, voce nao testa codigo. Voce testa decisoes."**

## Funcionalidades

### Modelagem
- **Diagrama de arquitetura** – Canvas visual com componentes cloud (AWS, Azure, GCP, Oracle, generico)
- **Triggers** – User Traffic, Scheduler, Webhook, Event Source, Error (disponiveis em todas as nuvens)
- **Fluxos** – Definicao de passos com fallback e injecao de falha
- **Requisitos e rastreabilidade** – Matriz de rastreabilidade, gap analysis
- **ADRs** – Architectural Decision Records
- **FinOps** – Custos por hora/mes por servico, visualizacao consolidada

### Simulacao
- **Engine** – Eventos discretos com circuit breaker, timeout, retry, bulkhead, queue
- **Controles** – Duracao, taxa, ramp-up, taxa de falha
- **Cenarios prontos** – Normal, Pico, Black Friday, Falha Regional
- **Comparacao** – Cenarios A vs B, simulacao em outra nuvem

### Interface
- **Paineis retráteis** – Esquerdo (navegacao), direito (propriedades/controles), inferior (timeline/log)
- **Validacao de conflitos** – Checa constraints arquiteturais
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
├── samples/                  # Projetos exemplo YAML (arquivos avulsos)
├── docs/
│   ├── BACKEND-RESPONSABILIDADES.md
│   └── MODULAR-MONOLITH.md
└── docker-compose.yml
```

## Projetos exemplo

Use **Exemplos** no menu para carregar (agrupados por nuvem):

### Generico
- **E-commerce Order e Pagamento** – Fluxo completo com custos, triggers, fallbacks, rastreabilidade e ADRs
- **Pipeline Event-Driven** – Scheduler, Webhook, Event Bus com cenarios assincronos
- **Checkout Simples** – Fluxo basico com custos e requisitos

### AWS
- **API Serverless** – Lambda, API Gateway, DynamoDB, S3 com custos e fluxos
- **Event-Driven AWS** – EventBridge, SQS, SNS e Lambda

### Azure
- **App Enterprise** – Functions, App Service, Cosmos DB, Service Bus, Key Vault

### GCP
- **Data Pipeline** – Cloud Run, Pub/Sub, BigQuery com fluxos de ingestao e analise

### Oracle
- **Enterprise** – OKE, Autonomous DB, Streaming, Load Balancer

### Multicloud
- **DR Multicloud (AWS + Azure + GCP)** – Zonas por nuvem com failover e ADRs
- **Geo-Distribuido** – Zonas AWS, Azure e GCP com trafego por regiao

## Modelo YAML

Exemplo com custos:

```yaml
name: Meu Sistema
projectType: single
primaryCloud: generic
services:
  - id: gateway
    name: API Gateway
    component: generic-api-gateway
    slaMs: 100
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
  - id: payment
    name: Payment Service
    component: generic-service
    slaMs: 200
    fallback: wallet
    costPerHour: 0.12
    costPerMonth: 87
    currency: USD
  - id: wallet
    name: Wallet Fallback
    component: generic-service
    slaMs: 500
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
flows:
  - id: main
    name: Main Flow
    steps:
      - from: User
        to: gateway
      - from: gateway
        to: payment
        onFailure: wallet
requirements:
  - id: REQ-001
    text: Checkout em ate 500ms (P95)
    priority: high
    type: non-functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: gateway
```

## Licenca

Projeto privado / interno.
