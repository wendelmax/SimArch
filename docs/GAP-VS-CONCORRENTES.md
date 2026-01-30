# Pendências para SimArch como escolha definitiva vs concorrentes

Visão consolidada do que já temos, do que falta em **componentes** (paleta/UI) e **features** (produto), e do que priorizar para competir com EA 15, Bizzdesign, Accuristech, Capella/Rhapsody.

---

## 1. Diferenciais atuais (o que já nos coloca na frente)

| Diferencial | Concorrentes típicos |
|-------------|----------------------|
| **Simulação integrada** (discrete event: SLA, retry, circuit breaker, timeout, bulkhead, queue) com métricas por serviço | EA/Bizzdesign simulam BPMN/DMN ou state machines; poucos simulam “arquitetura de serviços” com esses parâmetros |
| **Decision Engine** que avalia constraints após simulação (pass/fail) | Restrições paramétricas em EA/SysML existem; avaliação automática pós-simulação é rara |
| **DSL YAML** editável e versionável (git-friendly) | Modelos em repo proprietário ou XML; YAML legível é diferencial |
| **Export consolidado** (ADR + rastreabilidade + constraints + métricas) em uma chamada | Relatórios costumam ser separados ou exigir configuração manual |
| **Dashboard pós-simulação** na UI (métricas + constraints) | Dashboards em Horizzon/EA são mais genéricos; nosso foco é “resultado da simulação” |
| **Paleta por provedor + lógico**, agrupada por categoria e filtro por tipo | Paletas costumam ser por tecnologia (UML/ArchiMate) ou flat |
| **Vista Simple** no canvas (diagrama para executivos) | Estilo “Simple” no EA 15; nós minimalistas são valorizados |

Ou seja: **simulação de arquitetura + decisão baseada em constraints + relatório único + UX de paleta** já nos diferenciam. Para virar **escolha definitiva**, faltam fechar lacunas de requisitos, colaboração e interoperabilidade.

---

## 2. Pendências críticas (sem isso fica difícil ser “a” escolha)

### 2.1 Componentes / UI [OK]

| Pendência | Status |
|-----------|--------|
| **Painel Requisitos** (Fase 5) | OK – Painel Requisitos com lista editável, Satisfeito por / Verificado por (select por elemento do diagrama), standardRef, add/edit/remove; requisitos e links incluídos no YAML ao salvar. |
| **Matriz de rastreabilidade na UI** | OK – Aba “Matriz” no painel direito com tabela interativa; clicar no elemento seleciona o nó no canvas. |
| **Carregar modelo completo no load** | OK – API load retorna requirements, traceabilityLinks, constraints; frontend guarda e exibe nos painéis. |

### 2.2 Features de produto [OK]

| Pendência | Status |
|-----------|--------|
| **Requisitos e links no YAML gerado** | OK – diagramToYaml aceita options (requirements, traceabilityLinks, constraints); Salvar YAML inclui essas seções a partir do estado da UI. |
| **Referência a norma em requisito** (standardRef) | OK – Requirement.StandardRef no domínio; DSL (YAML); export (ADR, matriz, CSV); UI no painel Requisitos. |

Sem esses itens, SimArch continua forte em “desenhar + simular + decidir”, mas fraco em **ciclo de vida de requisitos** e **rastreabilidade acionável na UI**, que são critérios de compra em frente a EA/Bizzdesign.

---

## 3. Pendências importantes (diferenciação forte)

### 3.1 Componentes / UX

| Pendência | Status |
|-----------|--------|
| **Diagrama de rastreabilidade** | OK – Export grafo Mermaid (`ExportTraceabilityGraph`); endpoint `POST /api/export/traceability-graph`; botão "Grafo rastreabilidade" no dropdown Exportar. |
| **Viewpoints por vista** | Filtro na UI por “vista”: só serviços, só fluxos, só requisitos, só constraints (além da vista Simple já existente) |
| **Comparativo de cenários** | OK – Endpoint `POST /api/simulation/compare` com body `{ yaml, scenarioA, scenarioB }`; retorna métricas de ambos e array `comparison` (por serviço: avgLatencyA/B, p95A/B, failureCountA/B). |

### 3.2 Features de produto

| Pendência | Descrição |
|-----------|------------|
| **Import de requisitos a partir de texto** | Endpoint/serviço que detecta “shall”/“must”/“deve” e devolve candidatos a requisito (estilo Accuris Thread) |
| **Export para RM/PLM** | CSV/JSON estruturado (ou ReqIF básico) para import em Jira, DOORS, Azure DevOps |
| **Deteção de conflitos** | OK – Endpoint `POST /api/validation/conflicts`; detecta pares de constraints na mesma métrica com intervalos incompatíveis (ex.: lt 100 vs gt 200); botão "Validar conflitos" na toolbar. |
| **Templates de documentação** | Configurar seções e ordem do relatório consolidado (por projeto ou global) |
| **Atributos extensíveis** | Tags, owner, costCenter em serviço e requisito (DSL + UI) |

Esses itens aproximam o SimArch do que as organizações esperam de **EA/Bizzdesign (relatórios, requisitos, vistas)** e **Accuristech (requisitos, normas, export)**.

---

## 4. Pendências desejáveis (roadmap)

### 4.1 Componentes

| Pendência | Descrição |
|-----------|------------|
| **Mais componentes na paleta** | Observabilidade (ex.: “Métricas”), segurança (WAF, IAM), mais serviços por provedor conforme demanda |
| **Vista de sequência/timeline na UI** | Diagrama de sequência ou timeline de eventos a partir dos fluxos e (opcional) da simulação |

### 4.2 Features

| Pendência | Descrição |
|-----------|------------|
| **Export para IaC** | Terraform, Bicep ou CloudFormation a partir de serviços e deploy (EA tem geração de código; nós para infra) |
| **Vistas operacional / lógico / físico** | Formalizar no DSL (operational, logical, physical) e refletir na UI (filtros, labels) |
| **Digital twin** | Comparar modelo (simulação) com métricas reais (OpenTelemetry, Prometheus); desvio e alertas |
| **Colaboração e versionamento** | Diff de modelos (YAML), histórico, opcional integração com repo |
| **BPMN/DMN** | Export de fluxos para BPMN; regras (retry/timeout) como DMN para ferramentas externas |

---

## 5. Resumo: o que priorizar para “escolha definitiva”

**Para ser escolha definitiva frente aos concorrentes:**

1. **Fechar ciclo requisitos na UI**  
   Painel Requisitos + matriz interativa + load/save com requirements/traceabilityLinks (e constraints) no YAML.

2. **Requisitos e links no YAML gerado**  
   Salvar YAML deve incluir tudo que a UI edita (requisitos, links, opcionalmente constraints).

3. **Referência a norma (standardRef)**  
   Domínio, DSL, export e UI; baixo esforço, alto valor em compliance.

4. **Matriz de rastreabilidade interativa**  
   Tabela na UI com navegação para o elemento no diagrama.

5. **Diagrama de rastreabilidade (export)**  
   Grafo requisito -> elemento para apresentação e auditoria.

Na sequência: import de requisitos a partir de texto, export para RM, detecção de conflitos, templates e atributos extensíveis. Depois: comparativo de cenários, viewpoints, IaC, digital twin e colaboração.

**Componentes de paleta:** o que temos (lógico + 4 nuvens, agrupado por tipo e filtro) já cobre bem “componentes”. O que falta para competir é menos “mais blocos” e mais **gestão de requisitos na UI**, **matriz clicável** e **relatórios/export** alinhados a EA/Bizzdesign/Accuristech.
