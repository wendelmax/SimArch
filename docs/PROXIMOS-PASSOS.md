# Proximos passos – SimArch

Resumo do que foi implementado ate agora e do que priorizar em seguida (baseado em PLAN.md e GAP-VS-CONCORRENTES.md). Responsabilidades do backend (simulacoes, processamentos, exportacao de documentos): ver `docs/BACKEND-RESPONSABILIDADES.md`.

---

## Ja implementado (sessoes recentes)

- **Ribbon e canvas por aba** – Arquitetura, Requisitos, Rastreabilidade, Fluxos, Decisoes, Simulacao; quick links e indicador de vinculo (Matriz -> diagrama).
- **FinOps** – Custo por componente (moeda, custo/hora, custo/mes), painel de resumo, export CSV, vista Custo x metricas na simulacao.
- **Restricao por nuvem** – Escolha de cloud unica ou multi-cloud no Novo; paleta e drop restritos à nuvem; multi-cloud com zonas e pontes (gateway, fila, etc.).
- **Comparar em outra nuvem** – Botao no Ribbon (single-cloud); modal para escolher nuvem alvo; mesma estrutura mapeada por categoria; execucao de duas simulacoes e comparacao de metricas e custos.
- **Duas vistas na aba Simulacao** – Toggle Dashboard | Ao vivo; abstraidas em `SimulationTabContent` (ver abaixo).
- **Gestao de ADRs (Architecture Decision Records)** – Ciclo de vida (Proposed, Accepted, Rejected, Superseded), template (Contexto, Decisao, Consequencias, Alternativas), persistencia em YAML, aba Decisoes para listar/criar/editar, export Decision Log (MD) e inclusao no relatorio consolidado; alinhado a [Medium](https://medium.com/@jhonywalkeer/guia-completo-sobre-architecture-decision-records-adr-defini%C3%A7%C3%A3o-e-melhores-pr%C3%A1ticas-f63e66d33e6) e [AWS ADR process](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html).
- **Icones para componentes e nuvens** – Framework de icones (react-icons: Simple Icons + Font Awesome) para representar nuances da solucao: icones por categoria (Compute, Database, Storage, API, Messaging, etc.) e por provedor (AWS, Azure, GCP, Oracle); icones de produto onde existem (EC2, S3, DynamoDB, RDS, SQS, BigQuery, Pub/Sub, etc.). Aplicado nos nos do diagrama (CloudNode), zonas (ZoneNode) e paleta (abas de provedor e itens).
- **Metricas de qualidade arquitetural** – Perfil de qualidade que informa quais graus a solucao desenhada possui e quais nuances interferem no algoritmo de simulacao: graus de Resiliência (Alto/Medio/Baixo), Disponibilidade (meta a partir de SLA), Escalabilidade (Alto/Medio/Baixo), pontos unicos de falha; fatores que afetam a simulacao (Circuit Breaker, Fallback, Queue, Bulkhead, Timeout, FailureInjectionRate); indicadores por servico (SLA, Timeout, Circuit Breaker, Fallback, Retry, Bulkhead, Queue, Scaling). Opcao "Perfil + simulacao" para incluir disponibilidade efetiva, latencia media e taxa de falha apos uma amostra de simulacao. API: POST /api/quality/profile.

---

## Vistas da aba Simulacao (abstraidas)

A aba Simulacao expoe **duas vistas** sobre o mesmo resultado de simulacao (`result`), com responsabilidades distintas:

| Vista | Responsabilidade | Funcionalidades |
|-------|------------------|-----------------|
| **Dashboard** | Analise em tabelas e custos; decisao (constraints). | Metricas por servico (requisicoes, falhas, latencia, P95); secao Custo x metricas (quando ha custos); constraints PASS/FAIL; Vista por custo (ordena/prioriza custo); Exportar consolidado; Fechar. |
| **Ao vivo** | Visao de “simulacao em execucao”; diagrama + metricas + timeline + eventos. | Diagrama read-only (mesmos nos/arestas da Arquitetura); painel Metricas (tempo, latencia media, taxa de erro, throughput, requisicoes, falhas); Timeline (requisicoes e erros acumulados); Log de eventos (sintetizado das metricas); controles Velocidade (1x/5x/10x) e Cenario (Carga normal, Pico, Falha) para evolucao futura. |

- **Dados compartilhados**: `result` (elapsedSec, serviceMetrics, constraintResults), `nodes`, `edges`.
- **Acoes compartilhadas**: Executar simulacao, Fechar/limpar resultado.
- **Componente de abstração**: `SimulationTabContent` recebe `viewMode`, `result`, `nodes`, `edges` e callbacks; renderiza toolbar (toggle de vista, Run, Vista por custo) e, conforme o modo, `Dashboard` ou `SimulationLiveView`.

---

## Prioridade alta (diferenciacao e fechamento de ciclo)

| # | Item | Descricao | Status |
|---|------|-----------|--------|
| 1 | **UI para comparativo de cenarios** | Backend tem `POST /api/simulation/compare` (mesmo YAML, dois cenarios: rate, duration, seed diferentes). Tela para configurar cenario A vs B e exibir comparacao lado a lado (metricas por servico). | Implementado |
| 2 | **Grafo de rastreabilidade na UI** | Toggle Matriz / Grafo na aba Rastreabilidade; grafo interativo (ReactFlow) Requisito -> Elemento. | Implementado |
| 3 | **Viewpoints por vista** | Filtros na UI: Todos, Servicos, Fluxos, Requisitos, Constraints. Toolbar na aba Arquitetura para alternar o que aparece no canvas (opacidade/destaque). | Implementado |

---

## Prioridade media (requisitos e interoperabilidade)

| # | Item | Descricao |
|---|------|-----------|
| 4 | **Import de requisitos a partir de texto** | Endpoint/servico que analisa texto (doc, PDF ou cola) e detecta "shall"/"must"/"deve" sugerindo candidatos a requisito; UI para revisar e importar (estilo Accuristech). |
| 5 | **Export para RM/PLM** | CSV/JSON estruturado (ou ReqIF basico) para import em Jira, DOORS, Azure DevOps. Perfis de export configuráveis. |
| 6 | **Templates de documentacao** | Config (JSON/YAML) para secao e ordem do relatorio consolidado; opcional por projeto. |
| 7 | **Atributos extensiveis** | Tags, owner, costCenter em servico e requisito no DSL e na UI (propriedades do no e do requisito). |

---

## Prioridade menor (roadmap)

| # | Item | Descricao |
|---|------|-----------|
| 8 | **Mais componentes na paleta** | Observabilidade (Metricas), seguranca (WAF, IAM), mais servicos por provedor conforme demanda. |
| 9 | **Vista de sequencia/timeline na UI** | Diagrama de sequencia ou timeline de eventos a partir dos fluxos (e opcionalmente da simulacao). |
| 10 | **Export para IaC** | Terraform, Bicep ou CloudFormation a partir dos servicos e deploy (geracao de esqueleto por recurso). |
| 10b | **Export PDF** | Geracao de PDF no backend (relatorio consolidado ou outros) para download; ver `docs/BACKEND-RESPONSABILIDADES.md`. |
| 11 | **Vistas operacional / logico / fisico** | Formalizar no DSL e refletir na UI (filtros, labels por vista). |
| 12 | **Digital twin** | Comparar saida da simulacao com metricas reais (OpenTelemetry, Prometheus); desvio e alertas. |
| 13 | **Colaboracao e versionamento** | Diff de modelos (YAML), historico, opcional integracao com repo. |
| 14 | **BPMN/DMN** | Export de fluxos para BPMN; regras (retry/timeout) como DMN para ferramentas externas. |

---

## Ordem sugerida para os proximos passos

1. **UI comparativo de cenarios** – Aproveita o endpoint existente; valor direto para “e se eu mudar rate/duracao?”.
2. **Grafo de rastreabilidade na UI** – Complementa a matriz; importante para auditoria e apresentacao.
3. **Viewpoints por vista** – Melhora uso do canvas sem mudar backend.
4. Em seguida: import de requisitos, export RM/PLM, templates, atributos extensiveis, conforme prioridade do produto.

Se quiser, no proximo passo posso detalhar tarefas tecnicas (endpoints, componentes, estado) para um desses itens.
