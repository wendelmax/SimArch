interface FlowsRightPanelProps {
  onExportMermaid: () => void
}

export function FlowsRightPanel({ onExportMermaid }: FlowsRightPanelProps) {
  return (
    <div className="right-panel-content">
      <div className="property-panel-title">Fluxos</div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Exportar</label>
        <button type="button" className="toolbar-btn primary right-panel-btn" onClick={onExportMermaid}>
          Exportar Mermaid
        </button>
      </div>
      <div className="right-panel-section">
        <p className="right-panel-hint">
          O codigo Mermaid e gerado a partir da arquitetura.
        </p>
      </div>
    </div>
  )
}
