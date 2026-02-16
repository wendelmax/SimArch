import type { AdrDef } from '../../utils/diagramToYaml'

interface DecisionsRightPanelProps {
  adrs: AdrDef[]
  onExportDecisionLog?: () => void
}

const ALL_STATUSES = ['Draft', 'Proposed', 'UnderReview', 'Accepted', 'Rejected', 'Implemented', 'Superseded', 'Deprecated'] as const

export function DecisionsRightPanel({ adrs, onExportDecisionLog }: DecisionsRightPanelProps) {
  const byStatus: Record<string, number> = {}
  ALL_STATUSES.forEach((s) => { byStatus[s] = 0 })
  adrs.forEach((a) => {
    if (a.status in byStatus) byStatus[a.status]++
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
        {ALL_STATUSES.map((s) => (
          <div key={s} className="right-panel-stat-row">
            <span className="right-panel-stat-label">{s}</span>
            <span className="right-panel-stat-value">{byStatus[s] ?? 0}</span>
          </div>
        ))}
      </div>
      <div className="right-panel-section">
        <p className="right-panel-hint">
          ADRs documentam decisoes arquiteturais relevantes. Use o formato Contexto, Decisao, Consequencias.
        </p>
      </div>
    </div>
  )
}
