export type ViewpointType = 'all' | 'services' | 'flows' | 'requirements' | 'constraints'

const VIEWPOINT_LABELS: Record<ViewpointType, string> = {
  all: 'Todos',
  services: 'Servicos',
  flows: 'Fluxos',
  requirements: 'Requisitos',
  constraints: 'Constraints',
}

interface ViewpointToolbarProps {
  viewpoint: ViewpointType
  onViewpointChange: (v: ViewpointType) => void
}

export function ViewpointToolbar({ viewpoint, onViewpointChange }: ViewpointToolbarProps) {
  return (
    <div className="viewpoint-toolbar">
      <span className="viewpoint-label">Vista</span>
      <div className="viewpoint-buttons">
        {(Object.keys(VIEWPOINT_LABELS) as ViewpointType[]).map((v) => (
          <button
            key={v}
            type="button"
            className={`toolbar-btn ${viewpoint === v ? 'primary' : ''}`}
            onClick={() => onViewpointChange(v)}
          >
            {VIEWPOINT_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  )
}
