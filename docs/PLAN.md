# Plano de implementacao SimArch

Plano detalhado baseado nos documentos de inspiracao (Rhapsody/Capella, Bizzdesign, Accuristech, EA 15). Itens ja implementados estao marcados como [OK].

---

## Estado atual (ja implementado)

- [OK] Requisitos e TraceabilityLink no dominio e DSL
- [OK] Matriz de rastreabilidade (export MD/CSV)
- [OK] Restricoes parametricas no modelo e DSL
- [OK] Decision Engine avalia constraints apos simulacao (pass/fail)
- [OK] Export Mermaid (diagrama de sequencia a partir dos fluxos)
- [OK] API: load, simulation, decision, export (ADR, MD, JSON, traceability, traceability-csv, mermaid)

---

## Fase 1 – Backend: Relatorio consolidado e decisao com resultado da simulacao [OK]

**Objetivo:** Um unico artefato de relatorio (ADR + rastreabilidade + constraints + metricas) e API de decisao que aceita resultado da simulacao para retornar constraint results.

| # | Tarefa | Status |
|---|--------|--------|
| 1.1 | Relatorio consolidado | OK – `ExportConsolidatedReport(model)` retorna ADR + Matriz + secao Constraints. |
| 1.2 | Endpoint export/consolidated | OK – `POST /api/export/consolidated` com `includeSimulationAndDecision`; quando true roda simulacao e decisao e anexa Metricas + Constraint Results. |
| 1.3 | Decision API com simulationResult | OK – body aceita `simulationResult` opcional; backend monta SimulationResult e retorna constraintResults. |

---

## Fase 2 – Frontend: Dashboard pos-simulacao [OK]

**Objetivo:** Apos Simulate, exibir metricas por servico e resultados de constraints (PASS/FAIL) em painel.

| # | Tarefa | Status |
|---|--------|--------|
| 2.1 | Fluxo Simulate + Evaluate | OK – Simulate chama runSimulation depois evaluateDecision com simulationResult; estado dashboardData com metricas e constraintResults. |
| 2.2 | Painel Dashboard | OK – Modal Dashboard com tabelas de metricas e constraints, botoes Fechar e Exportar consolidado. |
| 2.3 | Toolbar: Export Mermaid e Consolidado | OK – Dropdown Exportar inclui Mermaid (sequencia) e Relatorio consolidado. |

---

## Fase 3 – Gap analysis (rastreabilidade) [OK]

**Objetivo:** Identificar requisitos nao rastreados e nao verificados no export e no relatorio consolidado.

| # | Tarefa | Status |
|---|--------|--------|
| 3.1 | Secao Gap no export rastreabilidade | OK – `ExportTraceabilityMatrix` inclui secao "Gap Analysis" com "Requisitos nao rastreados" e "Requisitos nao verificados". |
| 3.2 | Incluir gap no relatorio consolidado | OK – Consolidado usa matriz com gap; secao ja incluida. |

---

## Fase 4 – Vista Simple no canvas (EA 15) [OK]

**Objetivo:** Toggle "Vista: Tecnica | Simple" para diagrama minimalista (icone + nome, sem detalhes de SLA/timeout no no).

| # | Tarefa | Status |
|---|--------|--------|
| 4.1 | Estado viewMode | OK – Estado viewMode em App; Toolbar com botoes Vista: Tecnica | Simple. |
| 4.2 | CloudNode por viewMode | OK – viewMode em NodeData; CloudNode em modo simple oculta body (provider/category). |

---

## Fase 5 – Painel Requisitos na UI (EA 15 / Specification Manager)

**Objetivo:** Painel lateral ou aba com lista de requisitos editavel e links Satisfeito por / Verificado por.

| # | Tarefa | Detalhes |
|---|--------|----------|
| 5.1 | Modelo carrega requisitos e links | API load retorna ja requirements e traceabilityLinks (se existirem no YAML). Frontend guarda em estado (requirements, traceabilityLinks). |
| 5.2 | Painel Requisitos | Aba ou painel "Requisitos": lista (id, texto, prioridade, tipo); botao "Satisfeito por" / "Verificado por" abre seletor (servico ou fluxo do diagrama); ao salvar YAML, incluir requirements e traceabilityLinks no YAML gerado. |
| 5.3 | diagramToYaml inclui requirements | Funcao diagramToYaml (ou modelo completo) deve aceitar requirements e traceabilityLinks e incluir no YAML de saida. |

---

## Fase 6 – Melhorias adicionais (prioridade menor)

| # | Tarefa | Detalhes |
|---|--------|----------|
| 6.1 | Referencia a norma em Requirement (Accuristech) | Campo opcional standardRef em Requirement (dominio, DSL, export, UI). |
| 6.2 | Atributos extensíveis (Bizzdesign) | Tags/owner em servico e requisito na DSL e UI. |
| 6.3 | Templates de documentacao | Config de secao do relatorio consolidado (ordem, opcionais). |
| 6.4 | Diagrama de rastreabilidade (grafo) | Export Mermaid grafo Requisito -> Servico/Fluxo. |

---

## Ordem de execucao

1. Fase 1 (backend) – relatorio consolidado + decision com simulationResult
2. Fase 2 (frontend) – dashboard pos-simulacao + exports na toolbar
3. Fase 3 – gap analysis
4. Fase 4 – vista Simple
5. Fase 5 – painel Requisitos
6. Fase 6 conforme prioridade
