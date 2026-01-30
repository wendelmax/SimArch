import type { TraceabilityViewMode } from '../TraceabilityContent'
import type { RequirementDef, TraceabilityLinkDef } from '../../utils/diagramToYaml'

interface TraceabilityRightPanelProps {
  requirements: RequirementDef[]
  traceabilityLinks: TraceabilityLinkDef[]
  viewMode: TraceabilityViewMode
  onViewModeChange: (mode: TraceabilityViewMode) => void
}

export function TraceabilityRightPanel({
  requirements,
  traceabilityLinks,
  viewMode,
  onViewModeChange,
}: TraceabilityRightPanelProps) {
  const tracedReqIds = new Set(traceabilityLinks.map((l) => l.requirementId))
  const untracedCount = requirements.filter((r) => !tracedReqIds.has(r.id)).length

  return (
    <div className="right-panel-content">
      <div className="property-panel-title">Rastreabilidade</div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Visualizacao</label>
        <div className="right-panel-tabs-compact">
          <button
            type="button"
            className={`right-panel-tab-compact ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => onViewModeChange('matrix')}
          >
            Matriz
          </button>
          <button
            type="button"
            className={`right-panel-tab-compact ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => onViewModeChange('graph')}
          >
            Grafo
          </button>
        </div>
      </div>
      <div className="right-panel-section">
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Vinculos</span>
          <span className="right-panel-stat-value">{traceabilityLinks.length}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Requisitos rastreados</span>
          <span className="right-panel-stat-value">{requirements.length - untracedCount}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Requisitos sem rastreio</span>
          <span className="right-panel-stat-value">{untracedCount}</span>
        </div>
      </div>
    </div>
  )
}
