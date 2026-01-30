import type { RibbonMainTab } from './Ribbon'

const TAB_LABELS: Record<RibbonMainTab, string> = {
  architecture: 'Arquitetura',
  requirements: 'Requisitos',
  traceability: 'Rastreabilidade',
  flows: 'Fluxos',
  decisions: 'Decisoes',
  simulation: 'Simulacao',
}

export interface LinkedFromInfo {
  tab: RibbonMainTab
  label: string
}

interface CanvasFrameProps {
  canvasTab: RibbonMainTab
  title?: string
  linkedFrom?: LinkedFromInfo | null
  onGoToTab?: (tab: RibbonMainTab) => void
  children: React.ReactNode
}

export function CanvasFrame({
  canvasTab,
  title,
  linkedFrom,
  onGoToTab,
  children,
}: CanvasFrameProps) {
  const displayTitle = title ?? TAB_LABELS[canvasTab]

  return (
    <div className="canvas-frame" data-canvas={canvasTab}>
      <header className="canvas-frame-header">
        <h2 className="canvas-frame-title">{displayTitle}</h2>
      </header>
      {linkedFrom && onGoToTab && (
        <div className="canvas-frame-linked">
          <span className="canvas-frame-linked-label">Vinculo:</span>
          <button
            type="button"
            className="canvas-frame-linked-btn"
            onClick={() => onGoToTab(linkedFrom.tab)}
          >
            {linkedFrom.label}
          </button>
        </div>
      )}
      <div className="canvas-frame-body">{children}</div>
    </div>
  )
}
