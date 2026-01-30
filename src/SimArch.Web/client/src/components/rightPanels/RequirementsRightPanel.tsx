import type { RequirementDef, TraceabilityLinkDef } from '../../utils/diagramToYaml'

interface RequirementsRightPanelProps {
  requirements: RequirementDef[]
  traceabilityLinks: TraceabilityLinkDef[]
  elementIds: string[]
}

export function RequirementsRightPanel({ requirements, traceabilityLinks, elementIds }: RequirementsRightPanelProps) {
  const byPriority = { high: 0, medium: 0, low: 0 }
  const byType = { functional: 0, 'non-functional': 0 }
  requirements.forEach((r) => {
    if (r.priority in byPriority) (byPriority as Record<string, number>)[r.priority]++
    if (r.type in byType) (byType as Record<string, number>)[r.type]++
  })

  const tracedReqIds = new Set(traceabilityLinks.map((l) => l.requirementId))
  const untracedCount = requirements.filter((r) => !tracedReqIds.has(r.id)).length

  return (
    <div className="right-panel-content">
      <div className="property-panel-title">Requisitos</div>
      <div className="right-panel-section">
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Total</span>
          <span className="right-panel-stat-value">{requirements.length}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Alta prioridade</span>
          <span className="right-panel-stat-value">{byPriority.high}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Media prioridade</span>
          <span className="right-panel-stat-value">{byPriority.medium}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Baixa prioridade</span>
          <span className="right-panel-stat-value">{byPriority.low}</span>
        </div>
      </div>
      <div className="right-panel-section">
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Funcionais</span>
          <span className="right-panel-stat-value">{byType.functional}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Nao funcionais</span>
          <span className="right-panel-stat-value">{byType['non-functional']}</span>
        </div>
      </div>
      <div className="right-panel-section">
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Rastreados</span>
          <span className="right-panel-stat-value">{requirements.length - untracedCount}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Sem rastreio</span>
          <span className="right-panel-stat-value">{untracedCount}</span>
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Elementos</span>
          <span className="right-panel-stat-value">{elementIds.length}</span>
        </div>
      </div>
    </div>
  )
}
