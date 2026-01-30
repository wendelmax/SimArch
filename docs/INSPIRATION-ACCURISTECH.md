# Inspiracao: Accuristech (Accuris Thread e Engineering Workbench)

Documento que mapeia capacidades do Accuristech (extracao de requisitos, rastreabilidade com normas, workflows digitais) e propoe o que o SimArch pode incorporar.

---

## 1. Accuristech em resumo

- **Accuris Thread:** extracao automatica de requisitos a partir de documentos (PDF, texto). Identifica indicadores como "shall", "must", "required", "mandatory"; processa multiplos documentos; analise de similaridade; export para ferramentas de requisitos e PLM. Integracao com Engineering Workbench; deteccao de referencias a normas no texto e criacao de hyperlinks. Planejado: deteccao de conflitos entre requisitos, metadata customizavel.
- **Engineering Workbench (EWB):** acesso a milhoes de normas (SDOs); rastreabilidade entre normas, requisitos internos e documentacao; vinculos dinamicos quando um requisito referencia uma norma (ex. "deve atender ISO X"); pesquisa e conformidade centralizadas.
- **Goldfire:** busca semantica profunda em fontes tecnicas.

Foco: conectar requisitos a workflows de engenharia digital, reduzir esforco manual e melhorar rastreabilidade com normas e padroes.

---

## 2. Capacidades Accuristech x SimArch

| Capacidade | Descricao Accuristech | Aplicavel ao SimArch |
|------------|------------------------|------------------------|
| **Extracao automatica de requisitos** | Thread extrai requisitos de documentos (shall, must, required); processa em minutos; objetos digitais estruturados | **Import de texto/PDF**: detectar frases com "shall", "must", "deve", "obrigatorio" e gerar entidades Requirement; preencher id, texto, prioridade (default); opcional tipo (funcional/não-funcional) por heuristica |
| **Referencias a normas/padroes** | EWB detecta referencias a normas no texto e cria hyperlinks; rastreabilidade requisito -> norma | **Requisito referencia norma**: campo opcional em Requirement (ex. `standardRef: "ISO 27001"` ou `standardRef: "SLA 99.9%"`); export (ADR, matriz) inclui link ou citacao; na UI exibir e clicavel se houver URL base |
| **Rastreabilidade requisito -> design** | Vinculos digitais entre normas, requisitos e documentacao de design | Ja temos **TraceabilityLink** (requisito -> servico/fluxo); reforcar export e UI para "requisito satisfeito por X" e "requisito verificado por cenario/simulacao" |
| **Export para RM/PLM** | Requisitos extraidos exportados para ferramentas de requisitos e PLM | **Export em formato interoperavel**: ReqIF basico, ou CSV/JSON com estrutura fixa (id, text, priority, type, standardRef, links) para import em Jira, DOORS, etc. |
| **Conflito entre requisitos** | Thread planeja deteccao de conflitos | **Deteccao de conflitos**: dois requisitos contraditorios (ex. "latencia < 100ms" vs "latencia < 50ms" em escopos sobrepostos); ou requisito vs constraint; reportar no Decision ou em painel "Requisitos" |
| **Metadata customizavel** | Thread planeja campos de metadata customizados | **Atributos extensíveis em Requirement**: alem de id, text, priority, type, permitir tags, sourceDocument, owner, standardRef; DSL e UI aceitam chave-valor opcional |
| **Similaridade entre documentos** | Thread faz analise de similaridade entre docs | Roadmap: **similaridade entre requisitos** (texto) para sugerir duplicatas ou requisitos derivados; opcional na UI |
| **Busca semantica (Goldfire)** | Busca profunda em fontes tecnicas | Roadmap: busca no modelo (requisitos, servicos, fluxos) por texto ou conceito; ou integracao com ferramenta externa |

---

## 3. Propostas concretas para o SimArch (inspirado em Accuristech)

### 3.1 Import de requisitos a partir de texto

- **Entrada:** texto plano ou Markdown (colado ou arquivo). Opcional: PDF (exige biblioteca de extracao de texto).
- **Regras:** detectar frases que contenham "shall", "must", "have to", "deve", "obrigatorio", "required", "mandatory", "needed" (e variantes).
- **Saida:** lista de candidatos a requisito (texto da frase, posicao); usuario confirma ou edita; gerar seccao `requirements` em YAML ou objeto Requirement para API.
- **Implementacao:** servico ou endpoint `POST /api/requirements/extract-from-text` com body `{ "text": "..." }` retornando `{ "candidates": [ { "text", "index" } ] }`; opcionalmente aceitar "accept" e devolver YAML fragment ou lista de requisitos.

### 3.2 Referencia a normas no requisito

- **Dominio:** em `Requirement` adicionar propriedade opcional `StandardRef` (string) ou `StandardRefs` (lista), ex. "ISO 27001", "SLA 99.9%".
- **DSL:** no YAML, ex. `requirements: - id: R1; text: "..."; standardRef: "ISO 27001"`.
- **Export:** ADR e matriz de rastreabilidade incluem coluna ou linha "Norma referenciada"; se houver URL base configurável, gerar link.
- **UI:** no painel de requisitos, exibir e permitir editar referencia a norma.

### 3.3 Deteccao de conflitos entre requisitos/constraints

- **Regras:** comparar requisitos/constraints que mencionem mesma metrica ou criterio (ex. latencia, disponibilidade) e verificar se valores sao compativeis (ex. um "latencia < 100" e outro "latencia > 200" para o mesmo escopo).
- **Saida:** relatorio "Conflitos" no Decision ou em export: lista de pares (requisito/constraint A, B, descricao do conflito).
- **Implementacao:** apos carregar modelo, opcao "Validate conflicts"; ou incluir no relatorio consolidado (estilo Bizzdesign).

### 3.4 Export interoperavel para ferramentas de requisitos

- **Formatos:** CSV com colunas fixas (id, text, priority, type, standardRef, satisfiedBy, verifiedBy); ou JSON schema simples; ou ReqIF basico (se viável).
- **Objetivo:** import em Jira, DOORS, Azure DevOps, ou outras ferramentas de RM sem perda de estrutura.

### 3.5 Metadata extensivel em requisitos

- **DSL:** alem de id, text, priority, type, permitir `metadata: { sourceDocument: "SRS-v2.pdf", owner: "Team X" }` ou lista de pares.
- **Dominio:** `Requirement` com dicionario ou lista de atributos opcionais (sem quebrar serializacao existente).
- **UI:** exibir e editar metadata no painel de requisitos.

---

## 4. Priorizacao sugerida

1. **Referencia a norma em Requirement** (standardRef no dominio, DSL, export, UI).
2. **Import de candidatos a requisito a partir de texto** (endpoint ou servico que detecta shall/must/deve e retorna candidatos).
3. **Metadata extensivel em requisitos** (tags, sourceDocument, owner).
4. **Export CSV/JSON estruturado** para RM (colunas id, text, priority, type, standardRef, links).
5. **Deteccao de conflitos** entre requisitos/constraints (regras simples por metrica).
6. Similaridade entre requisitos e ReqIF em fases posteriores.

---

## 5. Referencias

- Accuristech (accuristech.com): Engineering Intelligence Suite.
- Accuris Thread: extracao de requisitos, integracao com EWB, export para RM/PLM.
- Engineering Workbench: normas, rastreabilidade requisito-norma, hyperlinks dinamicos.
- docs/INSPIRATION-RHAPSODY-CAPELLA.md (requisitos, rastreabilidade).
- docs/INSPIRATION-BIZZDESIGN.md (relatorios, dashboards).
- memoria.md (visao SimArch).
