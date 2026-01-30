import { useCallback } from 'react'

export type RibbonMainTab = 'architecture' | 'requirements' | 'traceability' | 'flows' | 'decisions' | 'simulation'

interface RibbonProps {
  activeTab: RibbonMainTab
  onTabChange: (tab: RibbonMainTab) => void
  onNew: () => void
  onLoadYaml: (yaml: string) => void
  onSaveYaml: () => void
  onExportAdr: () => void
  onExportDecisionLog?: () => void
  onExportPdf: () => void
  onExportJson: () => void
  onExportMermaid: () => void
  onExportTraceabilityGraph: () => void
  onExportConsolidated: () => void
  onExportCosts: () => void
  onValidateConflicts: () => void
  onRunSimulation: () => void
  simulationStatus: { success?: boolean; error?: string } | null
  viewMode: 'technical' | 'simple'
  onViewModeChange: (mode: 'technical' | 'simple') => void
  onCompareCloud?: () => void
}

const TABS: { id: RibbonMainTab; label: string }[] = [
  { id: 'architecture', label: 'Arquitetura' },
  { id: 'requirements', label: 'Requisitos' },
  { id: 'traceability', label: 'Rastreabilidade' },
  { id: 'flows', label: 'Fluxos' },
  { id: 'decisions', label: 'Decisoes' },
  { id: 'simulation', label: 'Simulacao' },
]

export function Ribbon({
  activeTab,
  onTabChange,
  onNew,
  onLoadYaml,
  onSaveYaml,
  onExportAdr,
  onExportDecisionLog,
  onExportPdf,
  onExportJson,
  onExportMermaid,
  onExportTraceabilityGraph,
  onExportConsolidated,
  onExportCosts,
  onValidateConflicts,
  onRunSimulation,
  simulationStatus,
  viewMode,
  onViewModeChange,
  onCompareCloud,
}: RibbonProps) {
  const handleLoad = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yaml,.yml'
    input.onchange = () => {
      const f = input.files?.[0]
      if (f) {
        const reader = new FileReader()
        reader.onload = () => onLoadYaml((reader.result as string) ?? '')
        reader.readAsText(f)
      }
    }
    input.click()
  }, [onLoadYaml])

  return (
    <div className="ribbon">
      <div className="ribbon-row ribbon-primary">
        <div className="ribbon-brand">
          <span className="ribbon-logo">SimArch</span>
          <span className="ribbon-subtitle">Arquitetura de Software</span>
        </div>
        <div className="ribbon-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ribbon-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ribbon-row ribbon-commands">
        <div className="ribbon-group">
          <span className="ribbon-group-label">Arquivo</span>
          <div className="ribbon-group-buttons">
            <button type="button" className="ribbon-btn" onClick={onNew}>
              Novo
            </button>
            <button type="button" className="ribbon-btn" onClick={handleLoad}>
              Abrir
            </button>
            <button type="button" className="ribbon-btn primary" onClick={onSaveYaml}>
              Salvar
            </button>
          </div>
        </div>
        {activeTab === 'architecture' && (
          <div className="ribbon-group">
            <span className="ribbon-group-label">Vista</span>
            <div className="ribbon-group-buttons">
              <button
                type="button"
                className={`ribbon-btn ${viewMode === 'technical' ? 'primary' : ''}`}
                onClick={() => onViewModeChange('technical')}
              >
                Tecnica
              </button>
              <button
                type="button"
                className={`ribbon-btn ${viewMode === 'simple' ? 'primary' : ''}`}
                onClick={() => onViewModeChange('simple')}
              >
                Simple
              </button>
            </div>
          </div>
        )}
        {activeTab === 'simulation' && (
          <div className="ribbon-group">
            <span className="ribbon-group-label">Executar</span>
            <div className="ribbon-group-buttons">
              <button type="button" className="ribbon-btn primary" onClick={onRunSimulation}>
                Simular
              </button>
            </div>
          </div>
        )}
        <div className="ribbon-group ribbon-group-dropdown">
          <span className="ribbon-group-label">Exportar</span>
          <div className="ribbon-dropdown">
            <button type="button" className="ribbon-btn">
              Exportar
            </button>
            <div className="ribbon-dropdown-menu">
              <button type="button" onClick={onExportAdr}>Resumo arquitetura (ADR)</button>
              {onExportDecisionLog && (
                <button type="button" onClick={onExportDecisionLog}>Decision Log (ADRs)</button>
              )}
              <button type="button" onClick={onExportPdf}>PDF</button>
              <button type="button" onClick={onExportJson}>JSON</button>
              <button type="button" onClick={onExportMermaid}>Mermaid (sequencia)</button>
              <button type="button" onClick={onExportTraceabilityGraph}>Grafo rastreabilidade</button>
              <button type="button" onClick={onExportConsolidated}>Relatorio consolidado</button>
              <button type="button" onClick={onExportCosts}>Custos (FinOps)</button>
            </div>
          </div>
        </div>
        {onCompareCloud && (
          <div className="ribbon-group">
            <button type="button" className="ribbon-btn" onClick={onCompareCloud} title="Comparar mesma estrutura em outra nuvem (simulacao e custos)">
              Comparar em outra nuvem
            </button>
          </div>
        )}
        <div className="ribbon-group">
          <button type="button" className="ribbon-btn" onClick={onValidateConflicts} title="Validar conflitos entre constraints">
            Validar conflitos
          </button>
        </div>
        {simulationStatus && (
          <div className={`ribbon-status ${simulationStatus.success ? 'ok' : 'error'}`}>
            {simulationStatus.success ? 'Simulacao OK' : simulationStatus.error ?? 'Erro'}
          </div>
        )}
      </div>
    </div>
  )
}
