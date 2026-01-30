# Inspiracao: Bizzdesign Enterprise Studio e Horizzon

Documento que mapeia capacidades do Bizzdesign (Enterprise Studio, ArchiMate, Horizzon) e propoe o que o SimArch pode incorporar.

---

## 1. Bizzdesign em resumo

- **Enterprise Studio:** modelagem de arquitetura empresarial com ArchiMate, BPMN, ERD/UML, metamodelo customizavel (Metamodeler), multiplas vistas, portfolio analysis, Team Server (colaboracao), scripting, import/export Excel.
- **Horizzon:** publicacao e dashboards para executivos; KPIs e metricas ligadas ao modelo; analytics e decisao baseada em dados; padroes abertos (ArchiMate, C4, BPMN).

Foco: comunicar arquitetura para negocio e lideranca, com vistas e dashboards orientados a decisao.

---

## 2. Capacidades Bizzdesign x SimArch

| Capacidade | Descricao Bizzdesign | Aplicavel ao SimArch |
|------------|----------------------|------------------------|
| **ArchiMate / vistas por camada** | Camadas Motivation, Strategy, Business, Application, Technology, Physical; viewpoints por stakeholder | Alinhar nossas **vistas** (operacional, logica, fisica) a conceitos ArchiMate: Motivation/Strategy = drivers/requisitos; Application = servicos/fluxos; Technology/Physical = deploy/cloud |
| **Viewpoints** | Perspectiva por audiência (estratégico, tático, operacional) | **Filtros de vista na UI**: mesmo modelo, diagramas diferentes (só serviços, só fluxos, só requisitos, só constraints) |
| **Dashboards e KPIs** | Metricas e graficos a partir do modelo; dashboards para executivos | **Dashboard pos-simulacao**: latencia, falhas, custo, pass/fail de constraints; graficos (latencia P95, throughput) na UI ou export |
| **Publicacao para decisao** | Horizzon publica resultados acionaveis para stakeholders | **Relatorios consolidados**: ADR + matriz rastreabilidade + resultado de constraints + metricas de simulacao em um unico artefato (PDF/MD) |
| **Portfolio analysis** | Analise de portfolio com metricas customizadas | **Impact report + constraint results** como “portfolio” do modelo: por servico (custo, risco, SLA) e por constraint (pass/fail) |
| **Metamodeler / atributos custom** | Perfis e atributos customizados no modelo | **Extensibilidade na DSL**: atributos opcionais por servico/fluxo (tags, owner, costCenter) sem quebrar o core |
| **Colaboracao (Team Server)** | Multi-usuario, versionamento, merge de pacotes | Roadmap: **versionamento e diff de modelos** (YAML); opcional integracao com repo |
| **Excel import/export** | Dados do modelo em planilhas | **Export/import em tabelas**: matriz de rastreabilidade CSV ja existe; extensao: import de requisitos ou constraints a partir de Excel/CSV |
| **Scripting e automacao** | Automatizar consultas e relatorios | **API ja existe**; extensao: scripts (CLI ou externos) que chamam API para simular, exportar, avaliar constraints em pipeline |
| **BPMN** | Processos de negocio executaveis | Nossos **fluxos** sao lineares (steps); opcional: expressar fluxos como BPMN e exportar para ferramentas BPMN |

---

## 3. Propostas concretas para o SimArch (inspirado em Bizzdesign)

### 3.1 Viewpoints e filtros por camada

- Manter **vistas** operacional, logica, fisica (estilo Arcadia, compativeis com Application/Technology do ArchiMate).
- Na **UI**: filtro por “viewpoint” – ex. “Apenas servicos”, “Servicos + fluxos”, “Requisitos + rastreabilidade”, “Constraints + resultado”.
- No **YAML/DSL**: opcionalmente marcar elementos com `layer` ou `view` (operational, logical, physical) para gerar vistas filtradas.

### 3.2 Dashboard pos-simulacao

- Apos rodar simulacao + decisao, exibir **resumo visual**: tabela ou cards com latencia media/P95 por servico, falhas, custo (se modelado), e lista de constraints (PASS/FAIL).
- **Export**: relatorio unificado (MD/HTML) com metricas + constraints + trecho de ADR, para “publicacao” interna (estilo Horizzon leve).

### 3.3 Relatorio consolidado para decisao

- Um único **artefato** gerado sob demanda: titulo do modelo, lista de servicos (resumo), fluxos, requisitos e matriz de rastreabilidade, constraints e resultado da avaliacao, metricas da ultima simulacao (se houver).
- Formatos: Markdown (ja proximo disso com ADR + traceability + Decision); opcional HTML/PDF para apresentacao.

### 3.4 Atributos extensíveis (estilo Metamodeler)

- Na DSL: permitir **propriedades opcionais** por servico/fluxo/requisito (ex.: `owner`, `costCenter`, `tags`, `priority`).
- Sem alterar o core do dominio: dicionario ou lista de pares key-value que a UI e os exports podem exibir/exportar.

### 3.5 Integracao com planilhas

- **Import**: CSV/Excel com colunas (requisito, texto, prioridade) ou (constraint, metric, operator, value) para popular requisitos ou constraints no modelo.
- **Export**: ja temos CSV da matriz de rastreabilidade; adicionar export de “constraints” e “metricas de simulacao” em CSV para analise em Excel.

### 3.6 Scripting e pipeline

- Documentar uso da **API** e do **CLI** em pipelines: carregar YAML, rodar simulacao, avaliar decisao, exportar ADR/Mermaid/CSV.
- Opcional: modo “batch” no CLI (multiplos arquivos YAML) ou endpoint que recebe lista de cenarios e retorna comparativo.

---

## 4. Priorizacao sugerida

1. **Dashboard pos-simulacao na UI** – metricas + constraints PASS/FAIL na tela apos Simulate.
2. **Relatorio consolidado** – um export (MD ou HTML) que junta ADR + rastreabilidade + constraints + metricas.
3. **Viewpoints/filtros na UI** – abas ou filtros por “vista” (servicos, fluxos, requisitos, constraints).
4. **Atributos extensíveis** – tags/owner/costCenter na DSL e na UI.
5. **Import CSV/Excel** para requisitos/constraints e export de metricas/constraints em CSV.
6. Colaboracao e BPMN em fases posteriores.

---

## 5. Referencias

- Bizzdesign Enterprise Studio (ArchiMate, BPMN, Metamodeler, Team Server).
- Bizzdesign Horizzon (dashboards, KPIs, publicacao para executivos).
- ArchiMate 3.x (camadas Motivation, Strategy, Business, Application, Technology, Physical).
- docs/INSPIRATION-RHAPSODY-CAPELLA.md (vistas operacional/logica/fisica, requisitos, constraints).
- memoria.md (visao SimArch).
