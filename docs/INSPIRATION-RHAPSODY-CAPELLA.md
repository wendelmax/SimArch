# Inspiracao: IBM Rhapsody, Capella e ferramentas de modelagem de arquitetura

Documento que mapeia capacidades de ferramentas como IBM Engineering Systems Design Rhapsody, Sparx Enterprise Architect, Eclipse Capella/Arcadia e alternativas, e propõe o que agregar ao SimArch.

---

## 1. IBM Engineering Systems Design Rhapsody

**Foco:** MBSE (Model-Based Systems Engineering), SysML/UML, prototipagem e execucao de modelos.

| Capacidade | Descricao | Aplicavel ao SimArch |
|------------|-----------|------------------------|
| SysML/UML | Requisitos, estrutura, comportamento em diagramas padrao | Alinhar nossa DSL/visoes a conceitos SysML (blocos, requisitos, parametros) |
| Requisitos rastreaveis | Requisitos ligados a elementos de design e testes | Adicionar **Requisitos** e **rastreabilidade** (requisito -> servico/fluxo) |
| Prototipar e simular | Executar e validar o modelo antes do codigo | Ja temos simulacao; ampliar para **cenarios executaveis** e validacao |
| Avaliacoes parametricas | Trade-offs arquiteturais (parametros, restricoes) | Reforcar **Decision Engine** com restricoes parametricas e what-if |
| Digital twin | Ligar modelo a dados reais (telemetria) | Roadmap: **comparar modelo vs realidade** (metricas reais) |
| Colaboracao | Revisao, comparacao e merge de modelos | Roadmap: versionamento e diff de modelos |

---

## 2. Arcadia / Eclipse Capella

**Foco:** Metodologia Arcadia com vistas operacional, logica e fisica; MBSE open source.

| Capacidade | Descricao | Aplicavel ao SimArch |
|------------|-----------|------------------------|
| **Vista operacional** | Missoes, capacidades, atividades, entidades operacionais | Nova **vista Operacional**: capacidades, missoes, atividades (antes dos servicos) |
| **Vista logica** | Componentes logicos, alocacao de funcoes | Nossa vista atual (servicos, fluxos) = **vista Logica**; nomear e documentar assim |
| **Vista fisica** | Componentes de implementacao, deploy, infra | Ja temos componentes cloud (AWS, Azure, etc.); formalizar como **vista Fisica** |
| Decomposicao em arvore | Breakdown de funcoes e componentes | **Diagrama de arvore** (paleta/canvas): decomposicao de capacidades em servicos |
| Dataflow entre vistas | Rastreio operacional -> logico -> fisico | **Rastreabilidade entre vistas**: capacidade -> servico -> componente cloud |
| Sequencia e cenarios | Diagramas de sequencia, cenarios de uso | **Vista de sequencia**: timeline ou diagrama de sequencia a partir dos fluxos |

---

## 3. Enterprise Architect / Papyrus (SysML, executavel)

| Capacidade | Descricao | Aplicavel ao SimArch |
|------------|-----------|------------------------|
| Modelo executavel | Gerar/simular comportamento a partir do modelo | Simulacao ja existe; padronizar **cenarios** (entrada/saida esperada) |
| Diagramas parametricos | Restricoes (ex.: latencia total < X) e simulacao | **Restricoes parametricas** no modelo e checagem na simulacao/Decision |
| Geracao de codigo | C, C#, Java, etc. | Roadmap: **export para IaC** (Terraform, Bicep) ou stubs de API |
| BPMN/DMN | Processos e regras executaveis | Opcional: fluxos como BPMN e regras (timeout, retry) como DMN |

---

## 4. Rastreabilidade de requisitos (MBSE)

| Conceito | Aplicavel ao SimArch |
|----------|------------------------|
| Requisitos como entidade | **Requisito**: id, texto, prioridade, tipo (funcional nao-funcional) |
| Satisfy | Ligacao requisito -> servico ou passo de fluxo que o satisfaz |
| Derive | Requisito derivado de outro (decomposicao) |
| Verify | Ligacao requisito -> cenario de teste ou simulacao |
| Matriz de rastreabilidade | Export (CSV/MD): requisito | satisfeito por | status |

---

## 5. Propostas concretas para o SimArch

### 5.1 Multiplas vistas (estilo Arcadia)

- **Operacional:** capacidades, missoes, atividades. Opcional: entidades (ator, sistema externo).
- **Logico:** servicos, fluxos, interfaces (o que ja temos).
- **Fisico:** deploy, componentes cloud (AWS, Azure, GCP, Oracle), regioes, nós.

Implementacao sugerida: no modelo (YAML/DSL) ter secoes `operational`, `logical` (ou manter atual como logico), `physical`. Na UI: abas ou paineis por vista; mesmo canvas com filtro por vista.

### 5.2 Requisitos e rastreabilidade

- Entidade **Requirement**: id, text, priority, type.
- Relacao **satisfy**: requirementId -> serviceId ou flowStepId.
- Relacao **verify**: requirementId -> scenarioId (simulacao ou teste).
- Export: **Matriz de rastreabilidade** (requisitos x elementos x status).
- Opcional: tela ou painel "Requisitos" com lista e ligacoes para elementos no diagrama.

### 5.3 Restricoes parametricas e trade-offs

- No modelo: **Constraints** (ex.: `totalLatencyMs < 500`, `availability > 99.9`).
- Decision Engine: alem de impacto, **avaliar restricoes** apos simulacao (passou/falhou).
- **What-if:** alterar parametro (ex.: SLA, numero de instancias) e re-simular/re-avaliar.

### 5.4 Vista de sequencia / timeline

- A partir do fluxo (steps) e da simulacao: gerar **sequencia** (quem chama quem, ordem).
- Na UI: **diagrama de sequencia** (estilo Mermaid/PlantUML) ou **timeline** de eventos.
- Export: Mermaid, PlantUML ou JSON para ferramentas externas.

### 5.5 Digital twin (roadmap)

- Importar metricas reais (OpenTelemetry, Prometheus).
- Comparar **modelo** (simulacao) vs **dados reais** (desvio, alertas).
- Ajustar parametros do modelo a partir de dados reais.

---

## 6. Priorizacao sugerida

1. **Requisitos + rastreabilidade** (requisitos no dominio, satisfy/verify, matriz de rastreabilidade) – **implementado**.
2. **Multiplas vistas** (operacional, logico, fisico) na DSL e na documentacao; opcional na UI.
3. **Restricoes parametricas** no modelo e na avaliacao (Decision + Simulacao).
4. **Vista de sequencia** a partir dos fluxos e da simulacao.
5. Digital twin e colaboracao em fases posteriores.

---

## 7. Implementado no SimArch (inspirado em Rhapsody/Capella/MBSE)

- **Requisitos:** entidade `Requirement` (id, text, priority, type). Secao YAML `requirements`.
- **Rastreabilidade:** entidade `TraceabilityLink` (requirementId, linkType, elementType, elementId). Secao YAML `traceabilityLinks`. LinkType: `satisfy` ou `verify`; elementType: `service`, `flow`, etc.
- **Matriz de rastreabilidade:** export Markdown (tabela requisito | texto | prioridade | tipo | link | elemento | status) e CSV (separador `;`).
- **API:** `POST /api/export/traceability` e `POST /api/export/traceability-csv` (body: `{ "yaml": "..." }`).
- **Exemplo:** `samples/checkout-with-requirements.yaml` com requisitos e links satisfy.

---

## 8. Referencias

- IBM Engineering Systems Design Rhapsody (MBSE, SysML, execucao).
- Eclipse Capella / Arcadia (vistas operacional, logica, fisica).
- Sparx Enterprise Architect (SysML, executavel, parametrico).
- Eclipse Papyrus (UML/SysML, Moka para execucao).
- Bizzdesign Enterprise Studio / Horizzon (ArchiMate, viewpoints, dashboards, publicacao): ver docs/INSPIRATION-BIZZDESIGN.md.
- Accuristech Accuris Thread / Engineering Workbench (extracao de requisitos, normas, rastreabilidade): ver docs/INSPIRATION-ACCURISTECH.md.
- Sparx Systems Enterprise Architect 15 (UML, SysML, simulacao, requisitos, documentacao, BPMN/DMN): ver docs/INSPIRATION-ENTERPRISE-ARCHITECT-15.md.
- memoria.md (visao SimArch: BIM de software, simulacao, decisao).
