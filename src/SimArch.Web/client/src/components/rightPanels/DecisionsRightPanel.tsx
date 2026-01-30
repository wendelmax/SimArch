import type { AdrDef } from '../../utils/diagramToYaml'

interface DecisionsRightPanelProps {
  adrs: AdrDef[]
  onExportDecisionLog?: () => void
}

export function DecisionsRightPanel({ adrs, onExportDecisionLog }: DecisionsRightPanelProps) {
  const byStatus = { Proposed: 0, Accepted: 0, Rejected: 0, Superseded: 0 }
  adrs.forEach((a) => {
    if (a.status in byStatus) (byStatus as Record<string, number>)[a.status]++
  })

  return (
    <div className="right-panel-content">
      <div className="property-panel-title">Decisoes</div>
      <div className="right-panel-section">
        {onExportDecisionLog && (
          <button type="button" className="toolbar-btn primary right-panel-btn" onClick={onExportDecisionLog}>
            Exportar Decision Log (PDF)
          </button>
        )}
      </div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Estatisticas</label>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Total ADRs</span>
          <span className="right-panel-stat-value">{adrs.length}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Propostos</span>
          <span className="right-panel-stat-value">{byStatus.Proposed}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Aceitos</span>
          <span className="right-panel-stat-value">{byStatus.Accepted}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Rejeitados</span>
          <span className="right-panel-stat-value">{byStatus.Rejected}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Substituidos</span>
          <span className="right-panel-stat-value">{byStatus.Superseded}</span>
        </div>
      </div>
      <div className="right-panel-section">
        <p className="right-panel-hint">
          ADRs documentam decisoes arquiteturais relevantes. Use o formato Contexto, Decisao, Consequencias.
        </p>
      </div>
    </div>
  )
}
