import { useState } from 'react'
import { TraceabilityMatrixPanel } from './TraceabilityMatrixPanel'
import { TraceabilityGraphView } from './TraceabilityGraphView'
import type { RequirementDef, TraceabilityLinkDef } from '../utils/diagramToYaml'

export type TraceabilityViewMode = 'matrix' | 'graph'

interface TraceabilityContentProps {
  requirements: RequirementDef[]
  traceabilityLinks: TraceabilityLinkDef[]
  onSelectElement?: (elementId: string) => void
  viewMode?: TraceabilityViewMode
  onViewModeChange?: (mode: TraceabilityViewMode) => void
}

export function TraceabilityContent({
  requirements,
  traceabilityLinks,
  onSelectElement,
  viewMode: viewModeProp,
  onViewModeChange,
}: TraceabilityContentProps) {
  const [internalViewMode, setInternalViewMode] = useState<TraceabilityViewMode>('matrix')
  const viewMode = viewModeProp ?? internalViewMode
  const setViewMode = onViewModeChange ?? setInternalViewMode
  const showToolbar = onViewModeChange == null

  return (
    <div className="traceability-content">
      {showToolbar && (
        <div className="traceability-content-toolbar">
          <div className="traceability-view-toggle">
            <span className="traceability-view-label">Vista</span>
            <button
              type="button"
              className={`toolbar-btn ${viewMode === 'matrix' ? 'primary' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              Matriz
            </button>
            <button
              type="button"
              className={`toolbar-btn ${viewMode === 'graph' ? 'primary' : ''}`}
              onClick={() => setViewMode('graph')}
            >
              Grafo
            </button>
          </div>
        </div>
      )}
      <div className="traceability-content-body">
        {viewMode === 'matrix' && (
          <TraceabilityMatrixPanel
            requirements={requirements}
            traceabilityLinks={traceabilityLinks}
            onSelectElement={onSelectElement}
          />
        )}
        {viewMode === 'graph' && (
          <TraceabilityGraphView
            requirements={requirements}
            traceabilityLinks={traceabilityLinks}
            onSelectElement={onSelectElement}
          />
        )}
      </div>
    </div>
  )
}
