# Inspiracao: Enterprise Architect 15 (Sparx Systems)

Documento que mapeia capacidades do Enterprise Architect 15 da Sparx Systems (UML, SysML, simulacao, requisitos, documentacao, BPMN/DMN) e propoe o que o SimArch pode incorporar.

---

## 1. Enterprise Architect 15 em resumo

- **Visual e diagramas:** estilos de desenho customizados (formas, transparencias, cores, imagens); estilo "Simple" (minimalista, sem notacao tecnica) para executivos e negocio; diagramas facilmente entendidos por todos os stakeholders.
- **Governance e add-ins:** add-ins definidos no proprio modelo (JavaScript); resposta a eventos do repositorio; controle por grupos de seguranca; perspectivas e Ribbon por tecnologia; publicacao de add-ins em XMI.
- **Simulacao:** maquinas de estado executaveis; BPSim (processos com parametros operacionais); DMN (decisoes em processos); simulacao parametrica (SysML); integracao OpenModelica/Simulink para comportamento de sistemas; breakpoints, triggers, guards, effects.
- **Geracao de codigo:** Code Template Framework (CTF); geracao a partir de State Machine, Sequence, Activity; linguagens C(OO), C#, C++, Java, VB.Net, VHDL, SystemC, Verilog; MDA e templates customizaveis.
- **Requisitos:** Specification Manager (interface tipo editor de texto ou planilha para requisitos); janela de rastreabilidade; Relationship Matrix; Gap Analysis Matrix; diagramas de rastreabilidade (requisitos, use cases, classes, testes).
- **Documentacao:** geracao de documentos (RTF, Word-compatible); editor WYSIWYG; templates pre-definidos e customizaveis; estilos, sumario, capa; filtros e opcoes de conteudo.
- **Notacoes:** UML, SysML 1.5 (parametric diagrams, constraint blocks), BPMN, DMN; suporte a diagramas de sequencia, atividade, parametricos.

Foco: modelo unico com multiplas notacoes, simulacao executavel, rastreabilidade e documentacao profissional.

---

## 2. Capacidades EA 15 x SimArch

| Capacidade | Descricao EA 15 | Aplicavel ao SimArch |
|------------|-----------------|------------------------|
| **Estilo Simple / diagrama minimalista** | Diagrama sem notacao tecnica para executivos e negocio | **Modo de vista "Simple" na UI**: canvas com icones e labels simplificados (sem SLA/timeout/circuit breaker no desenho); toggle "Technical" vs "Simple" no toolbar |
| **Traceability Window / Relationship Matrix** | Visualizacao de conexoes entre elementos; matriz requisito x elemento | **Matriz de rastreabilidade** ja existe (export MD/CSV); **UI**: painel ou modal "Matriz" com tabela interativa requisito | satisfeito por | verificado por | status; clicavel para ir ao elemento no diagrama |
| **Gap Analysis Matrix** | Identifica lacunas na cobertura de requisitos | **Gap analysis**: requisitos sem link (nao rastreados) e requisitos sem verificacao; relatorio ou secao no export "Requisitos nao rastreados" e "Requisitos nao verificados" |
| **Specification Manager** | Interface tipo editor/planilha para requisitos | **Painel Requisitos na UI**: lista editavel (id, texto, prioridade, tipo); adicionar/remover/editar; botoes "Satisfeito por" e "Verificado por" para criar TraceabilityLink; opcional visao em tabela (spreadsheet-like) |
| **Simulacao parametrica + constraints** | SysML parametric diagrams; constraint blocks; simulacao com OpenModelica/Simulink | Ja temos **constraints** e **simulacao**; Decision avalia constraints apos simulacao (pass/fail). Reforcar: cenarios nomeados (baseline, stress) e comparativo de metricas entre cenarios |
| **BPMN/DMN** | Processos BPMN com decisões DMN simulaveis | Opcional: **fluxos como BPMN** (export para BPMN XML); regras de retry/timeout/fallback como **DMN** (tabela de decisao) para ferramentas externas; ou apenas documentar no ADR |
| **Geracao de codigo / MDA** | CTF, multiplas linguagens, MDA | Roadmap: **export para IaC** (Terraform, Bicep, CloudFormation) a partir de servicos e deploy; ou stubs de API (OpenAPI) a partir de fluxos |
| **Documentacao com templates** | RTF/Word, templates, estilos, sumario | **Relatorio consolidado** (MD/HTML) ja proposto (Bizzdesign); extensao: **templates** (cabecalho, secao ADR, secao requisitos, secao metricas) configuráveis por projeto ou global |
| **Add-ins e governance** | Add-ins no modelo, JavaScript, eventos do repositorio | Roadmap: **hooks ou validacoes** apos carregar modelo (regras custom via config ou script); opcional API para ferramentas externas dispararem validacao/export |
| **Diagramas de rastreabilidade** | Diagrama que mapeia requisitos -> use cases -> classes -> testes | **Diagrama de rastreabilidade visual**: grafo ou diagrama (Requisito -> Servico/Fluxo) na UI ou export (Mermaid/PlantUML) "requisito R1 --> servico S1" |
| **Perspectivas / Ribbon por tecnologia** | Usuario ve apenas ferramentas da sua perspectiva | **Viewpoints na UI**: filtro por vista (operacional, logico, fisico) ou por tipo (servicos, fluxos, requisitos, constraints); paleta e canvas filtrados |

---

## 3. Propostas concretas para o SimArch (inspirado em EA 15)

### 3.1 Vista "Simple" no canvas

- **Objetivo:** diagrama legivel para executivos e negocio, sem detalhes tecnicos (SLA, timeout, circuit breaker) nos nós.
- **Implementacao:** no React Flow, cada tipo de nó pode ter duas representacoes – "Technical" (atual) e "Simple" (icone + nome, opcionalmente provider). Toggle no toolbar "Vista: Tecnica | Simple".
- **DSL:** opcionalmente marcar servico com `presentation: simple` para forcar estilo em relatorios.

### 3.2 Painel Requisitos (estilo Specification Manager)

- **UI:** painel lateral ou aba "Requisitos" com lista de requisitos (id, texto, prioridade, tipo); botoes ou links "Satisfeito por" e "Verificado por" que abrem seletor (servico, fluxo, cenario) e criam TraceabilityLink.
- **Edicao:** adicionar, editar, remover requisito; sincronizar com modelo (YAML) ao salvar.
- **Opcional:** visao em tabela (grid) para edicao em lote.

### 3.3 Matriz de rastreabilidade interativa e Gap Analysis

- **Matriz na UI:** tabela requisito x elemento (satisfeito por, verificado por); celulas clicaveis para navegar ao elemento no diagrama; indicador visual (cor) para rastreado / nao rastreado / verificado.
- **Gap analysis:** secao ou relatorio "Requisitos nao rastreados" (sem TraceabilityLink) e "Requisitos nao verificados" (sem link verify ou sem cenario de simulacao). Export em MD/CSV ja pode incluir coluna "Status" (Rastreado / Nao rastreado); adicionar "Verificado" quando houver link verify.

### 3.4 Diagrama de rastreabilidade (grafo)

- **Conteudo:** nos = requisitos + servicos + fluxos; arestas = satisfy / verify (TraceabilityLink).
- **Formato:** export Mermaid ou PlantUML (grafo) "R1 --> S1 : satisfy"; ou visualizacao na UI (grafo colapsável).
- **Objetivo:** visao de caminho requisito -> design (equivalente aos traceability diagrams do EA).

### 3.5 Templates de documentacao

- **Conceito:** relatorio consolidado (ADR + requisitos + matriz + constraints + metricas) gerado a partir de um template configurável (cabecalho, ordem das secoes, inclusao ou nao de metricas).
- **Implementacao:** arquivo de config (JSON/YAML) com secao "reportTemplate" (sections, optionalSections); ou parametros na API/CLI (--sections adr,requirements,matrix,constraints,metrics).

### 3.6 Cenarios de simulacao e comparativo

- **Cenarios:** alem de "baseline", permitir nomes de cenario (ex. "stress", "failover") na chamada de simulacao; guardar ultimo resultado por cenario.
- **Comparativo:** endpoint ou relatorio que compara metricas (latencia, falhas) entre dois cenarios (ex. baseline vs stress); tabela ou grafico no dashboard.

### 3.7 Export para IaC (roadmap)

- **Entrada:** modelo (servicos, provider AWS/Azure/GCP, opcionalmente regiao).
- **Saida:** esqueleto Terraform, Bicep ou CloudFormation (recurso por servico, parametros de scaling/SLA como variaveis).
- **Objetivo:** ligar arquitetura SimArch a implementacao em nuvem.

---

## 4. Priorizacao sugerida

1. **Painel Requisitos na UI** (lista editavel, Satisfeito por / Verificado por, sincronizado com modelo).
2. **Gap analysis** (requisitos nao rastreados / nao verificados no export e opcionalmente na UI).
3. **Vista Simple no canvas** (toggle Tecnica | Simple).
4. **Matriz de rastreabilidade interativa na UI** (tabela clicavel, navegacao ao elemento).
5. **Diagrama de rastreabilidade** (export Mermaid/PlantUML grafo requisito -> servico/fluxo).
6. **Templates de documentacao** e **cenarios comparativos** em seguida.
7. Export IaC e add-ins/governance em fases posteriores.

---

## 5. Referencias

- Sparx Systems Enterprise Architect 15 (sparxsystems.com/products/ea/15/).
- EA 15 User Guide: Model Simulation, SysML, BPMN, DMN, Document Generation, Traceability.
- docs/INSPIRATION-RHAPSODY-CAPELLA.md (requisitos, constraints, vistas).
- docs/INSPIRATION-BIZZDESIGN.md (dashboards, relatorios).
- docs/INSPIRATION-ACCURISTECH.md (requisitos, normas).
- memoria.md (visao SimArch).
