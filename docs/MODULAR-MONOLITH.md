# SimArch - Monolito modular

Estrutura do monolito modular conforme a memoria do sistema (BIM de Software).

## Visao geral

```
SimArch.App (host)
       |
       +-- SimArch.Domain (kernel compartilhado)
       +-- SimArch.DSL (Architecture DSL Engine - modelo unico)
       +-- SimArch.Simulation (Simulation Engine - tempo, carga, falha)
       +-- SimArch.Decision (Decision Engine - impacto e trade-offs)
       +-- SimArch.Export (Export/Integration - ADR, IaC, Docs)
```

## Modulos

| Modulo | Responsabilidade | Dependencias |
|--------|------------------|--------------|
| **SimArch.Domain** | Entidades, value objects (ServiceDefinition, FlowDefinition, Sla, RetryPolicy, etc.) | Nenhuma |
| **SimArch.DSL** | Carregar e interpretar modelo a partir de YAML/DSL; modelo unico executavel | Domain |
| **SimArch.Simulation** | Simulacao de eventos discretos, carga, falhas, latencia | Domain, DSL |
| **SimArch.Decision** | Avaliar impacto e trade-offs de decisoes arquiteturais | Domain, DSL |
| **SimArch.Export** | Exportar para ADR, Markdown, (futuro: IaC) | Domain, DSL |
| **SimArch.App** | Composicao dos modulos; CLI | Todos |
| **SimArch.Api** | Backend: API HTTP (modelo, simulacao, decisao, export) | Todos |
| **SimArch.Web** | Frontend: SPA React (canvas BIM-like, paleta AWS/Azure/GCP/Oracle, propriedades, YAML/simulacao) | Nenhuma |
| **SimArch.Gateway** | Gateway Ocelot: roteamento /api -> Api, / -> Web | Nenhuma |

## Regras do monolito modular

- Cada modulo e um projeto (assembly) com fronteira clara.
- Domain nao referencia outros modulos.
- DSL e o unico que traduz fonte (YAML/DSL) em ArchitectureModel (Domain).
- Simulation, Decision e Export dependem apenas de Domain e, se necessario, do modelo ja carregado (nao do DSL diretamente para execucao).
- App orquestra: carrega modelo via DSL, passa para Simulation/Decision/Export.

## Como executar

CLI (console):

```bash
dotnet run --project src/SimArch.App
```

Frontend web com Gateway (recomendado para subir):

Subir os tres processos (em terminais separados ou em paralelo):

```bash
dotnet run --project src/SimArch.Api
dotnet run --project src/SimArch.Web
dotnet run --project src/SimArch.Gateway
```

- **SimArch.Api**: backend na porta 5044 (sem UI).
- **SimArch.Web**: SPA na porta 5080 (apenas arquivos estaticos).
- **SimArch.Gateway**: Ocelot na porta 5000; roteia `/api/*` para a Api e `/*` para a Web.

Abrir no navegador: `http://localhost:5000`. O cliente acessa apenas o Gateway; as chamadas `/api/...` sao encaminhadas ao backend. A configuracao das rotas esta em `src/SimArch.Gateway/ocelot.json`. Em deploy, altere `DownstreamHostAndPorts` (ou use variaveis de ambiente) para os hosts/portas reais da Api e da Web.

Docker Compose (sobe Api, Web e Gateway):

```bash
docker compose up -d --build
```

Acessar: `http://localhost:5000`. Os containers `api` e `web` ficam na rede interna; apenas o `gateway` expoe a porta 5000. O Gateway usa `ocelot.Docker.json` (hosts `api:80` e `web:80`).

Com modelo em arquivo e opcoes de simulacao:

```bash
dotnet run --project src/SimArch.App -- --model samples/checkout-flow.yaml --duration 5 --rate 100 --failure-rate 0.1 --export-adr docs/adr.md --export-json out.json
```

Argumentos: `--model` / `-m` (caminho YAML), `--duration` / `-d` (segundos), `--rate` / `-r` (requisicoes/segundo), `--failure-rate` / `-f` (0-1), `--seed` / `-s`, `--export-adr`, `--export-md`, `--export-json`.

## Capacidades implementadas

- **Domain**: Sla, ScalingPolicy, RetryPolicy, CircuitBreakerPolicy, TimeoutPolicy, BulkheadPolicy, QueuePolicy; ServiceDefinition, FlowDefinition, ArchitectureModel.
- **DSL**: YAML camelCase com services/flows; circuitBreaker, timeoutMs, bulkhead, queue; validacao de referencias (fallback e steps).
- **Simulation**: Tempo simulado; fila por servico (backpressure); circuit breaker (closed/open/half-open); timeout; bulkhead (concorrencia); fallback e onFailure no fluxo.
- **Decision**: Impacto de SLA, timeout, circuit breaker, bulkhead, queue, fallback.
- **Export**: ADR, Markdown, JSON.

## Proximos passos (memoria)

1. UI de grafo + timeline (Visual Modeler).
2. Case demo completo (e-commerce com mais fluxos).
3. Integracao IaC (Terraform/OpenAPI).
