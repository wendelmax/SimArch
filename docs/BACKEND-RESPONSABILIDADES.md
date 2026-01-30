# Responsabilidades do backend (SimArch.Api)

O backend concentra **todas** as simulacoes, processamentos, calculos, logicas e geracao de documentos. O frontend envia o modelo (YAML) e opcoes; o backend devolve resultados e conteudo. O frontend apenas exibe e dispara o download dos arquivos.

---

## Simulacao e processamento

| Responsabilidade | Backend | Endpoint / servico |
|------------------|---------|--------------------|
| Carregar e validar modelo (YAML) | Sim | `POST /api/model/load`, YamlModelLoader |
| Executar simulacao discreta | Sim | `POST /api/simulation/run`, DiscreteEventSimulationEngine |
| Comparar cenarios de simulacao | Sim | `POST /api/simulation/compare` |
| Avaliar decisao e constraints | Sim | `POST /api/decision/evaluate`, DecisionEngine |
| Perfil de qualidade arquitetural | Sim | `POST /api/quality/profile`, ArchitecturalQualityService |
| Validar conflitos entre constraints | Sim | `POST /api/validation/conflicts` |

---

## Exportacao e geracao de documentos

Todo o **conteudo** dos documentos e gerado no backend. O frontend chama a API, recebe o texto/binario e dispara o download (nome do arquivo, Blob, etc.).

| Documento / formato | Backend gera conteudo | Endpoint | Observacao |
|--------------------|------------------------|----------|------------|
| ADR (resumo arquitetura) | Sim | `POST /api/export/adr` | Markdown |
| Decision Log (ADRs) | Sim | `POST /api/export/decision-log` | Markdown |
| Markdown (tabelas) | Sim | `POST /api/export/markdown` | Markdown |
| JSON (modelo) | Sim | `POST /api/export/json` | JSON |
| Matriz rastreabilidade (MD) | Sim | `POST /api/export/traceability` | Markdown |
| Matriz rastreabilidade (CSV) | Sim | `POST /api/export/traceability-csv` | CSV |
| Mermaid (diagrama sequencia) | Sim | `POST /api/export/mermaid` | Texto Mermaid |
| Grafo rastreabilidade (Mermaid) | Sim | `POST /api/export/traceability-graph` | Texto Mermaid |
| Relatorio consolidado | Sim | `POST /api/export/consolidated` | Markdown (opcional com simulacao/decisao) |
| Custos FinOps (CSV) | Sim | `POST /api/export/costs-csv` | CSV |

**PDF**: ainda nao implementado. Quando for necessario, a geracao de PDF deve ser feita no backend (por exemplo, a partir do relatorio consolidado em Markdown/HTML, com biblioteca .NET para PDF). O frontend continuara apenas recebendo o binario e disparando o download.

---

## O que o frontend faz

- Montar o YAML do diagrama a partir do estado (nos, arestas, requisitos, ADRs, etc.).
- Chamar os endpoints do backend com esse YAML (e opcoes quando existirem).
- Exibir resultados (metricas, graficos, tabelas) e abrir/download de arquivos com o conteudo retornado.
- Nao realiza simulacao, avaliacao de constraints, nem geracao de conteudo de documentos; apenas orquestra chamadas e UI.

---

## Resumo

- **Simulacoes, processamentos, calculos e logicas**: todos no backend.
- **Exportacao de documentos**: conteudo gerado no backend (MD, JSON, CSV, Mermaid, etc.); download acionado no frontend.
- **PDF (e outros formatos futuros)**: a ser implementado no backend quando houver necessidade; o frontend so recebera o binario e fara o download.
