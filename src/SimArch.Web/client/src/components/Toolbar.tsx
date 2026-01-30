import { useCallback } from 'react'

interface ToolbarProps {
  onNew: () => void
  onLoadYaml: (yaml: string) => void
  onSaveYaml: () => void
  onRunSimulation: () => void
  onExportAdr: () => void
  onExportPdf: () => void
  onExportJson: () => void
  onExportMermaid: () => void
  onExportTraceabilityGraph: () => void
  onExportConsolidated: () => void
  onValidateConflicts: () => void
  simulationResult: { success?: boolean; error?: string } | null
  viewMode: 'technical' | 'simple'
  onViewModeChange: (mode: 'technical' | 'simple') => void
}

export function Toolbar({
  onNew,
  onLoadYaml,
  onSaveYaml,
  onRunSimulation,
  onExportAdr,
  onExportPdf,
  onExportJson,
  onExportMermaid,
  onExportTraceabilityGraph,
  onExportConsolidated,
  onValidateConflicts,
  simulationResult,
  viewMode,
  onViewModeChange,
}: ToolbarProps) {
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
    <div className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-logo">SimArch</span>
        <span className="toolbar-subtitle">BIM para Arquitetura de Software</span>
      </div>
      <div className="toolbar-actions">
        <button type="button" className="toolbar-btn" onClick={onNew}>
          Novo
        </button>
        <button type="button" className="toolbar-btn" onClick={handleLoad}>
          Abrir YAML
        </button>
        <button type="button" className="toolbar-btn primary" onClick={onSaveYaml}>
          Salvar YAML
        </button>
        <button type="button" className="toolbar-btn" onClick={onRunSimulation}>
          Simular
        </button>
        <div className="toolbar-view-toggle">
          <span className="toolbar-view-label">Vista:</span>
          <button
            type="button"
            className={`toolbar-btn ${viewMode === 'technical' ? 'primary' : ''}`}
            onClick={() => onViewModeChange('technical')}
          >
            Tecnica
          </button>
          <button
            type="button"
            className={`toolbar-btn ${viewMode === 'simple' ? 'primary' : ''}`}
            onClick={() => onViewModeChange('simple')}
          >
            Simple
          </button>
        </div>
        <div className="toolbar-dropdown">
          <button type="button" className="toolbar-btn">
            Exportar
          </button>
          <div className="toolbar-dropdown-menu">
            <button type="button" onClick={onExportAdr}>
              ADR
            </button>
            <button type="button" onClick={onExportPdf}>
              PDF
            </button>
            <button type="button" onClick={onExportJson}>
              JSON
            </button>
            <button type="button" onClick={onExportMermaid}>
              Mermaid (sequencia)
            </button>
            <button type="button" onClick={onExportTraceabilityGraph}>
              Grafo rastreabilidade
            </button>
            <button type="button" onClick={onExportConsolidated}>
              Relatorio consolidado
            </button>
          </div>
        </div>
        <button type="button" className="toolbar-btn" onClick={onValidateConflicts} title="Validar conflitos entre constraints">
          Validar conflitos
        </button>
      </div>
      {simulationResult && (
        <div className={`toolbar-status ${simulationResult.success ? 'ok' : 'error'}`}>
          {simulationResult.success ? 'Simulacao OK' : simulationResult.error ?? 'Erro'}
        </div>
      )}
    </div>
  )
}
