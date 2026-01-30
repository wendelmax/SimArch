interface FlowsRightPanelProps {
  onExportMermaid: () => void
  onOpenMermaidLive?: () => void
}

export function FlowsRightPanel({ onExportMermaid, onOpenMermaidLive }: FlowsRightPanelProps) {
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
        <label className="right-panel-section-label">Visualizacao externa</label>
        {onOpenMermaidLive && (
          <button type="button" className="toolbar-btn right-panel-btn" onClick={onOpenMermaidLive}>
            Abrir no Mermaid Live
          </button>
        )}
        <p className="right-panel-hint">
          O codigo Mermaid e gerado a partir da arquitetura. Use o Mermaid Live para editar e compartilhar.
        </p>
      </div>
    </div>
  )
}
