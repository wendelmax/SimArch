import type { Node, Edge } from '@xyflow/react'
import { Dashboard } from './Dashboard'
import { SimulationLiveView } from './SimulationLiveView'

/**
 * Abstrai as duas vistas da aba Simulacao:
 * - Dashboard: tabelas de metricas/constraints, Custo x metricas, Vista por custo, export consolidado.
 * - Ao vivo: diagrama read-only + painel de metricas + timeline + log de eventos.
 * Ambas consomem o mesmo result (elapsedSec, serviceMetrics, constraintResults) e as mesmas acoes (run, clear).
 */
import type { NodeData } from '../utils/diagramToYaml'
import type { ServiceMetricsDto, ConstraintEvaluationDto } from '../api/client'

export type SimulationViewMode = 'dashboard' | 'live'

export interface SimulationResultData {
  elapsedSec: number
  serviceMetrics: ServiceMetricsDto[]
  constraintResults: ConstraintEvaluationDto[]
}

export interface SimulationTabContentProps {
  viewMode: SimulationViewMode
  onViewModeChange: (mode: SimulationViewMode) => void
  result: SimulationResultData | null
  onClearResult: () => void
  nodes: Node<NodeData>[]
  edges: Edge[]
  onRunSimulation: () => void
  onExportConsolidated: () => void
  isRunning: boolean
  costView: boolean
  onCostViewChange: (value: boolean) => void
  error?: string | null
  onDismissError?: () => void
  hideToolbar?: boolean
}

export function SimulationTabContent({
  viewMode,
  onViewModeChange,
  result,
  onClearResult,
  nodes,
  edges,
  onRunSimulation,
  onExportConsolidated,
  isRunning,
  costView,
  onCostViewChange,
  error,
  onDismissError,
  hideToolbar = false,
}: SimulationTabContentProps) {
  return (
    <div className="canvas-view-single simulation-view">
      {!hideToolbar && (
      <div className="simulation-view-toolbar">
        <div className="simulation-view-vista-toggle">
          <span className="simulation-view-vista-label">Vista</span>
          <button
            type="button"
            className={`toolbar-btn ${viewMode === 'dashboard' ? 'primary' : ''}`}
            onClick={() => onViewModeChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`toolbar-btn ${viewMode === 'live' ? 'primary' : ''}`}
            onClick={() => onViewModeChange('live')}
          >
            Ao vivo
          </button>
        </div>
        <button type="button" className="toolbar-btn primary simulation-view-run" onClick={onRunSimulation} disabled={isRunning}>
          {isRunning ? 'Executando...' : 'Executar simulacao'}
        </button>
        {viewMode === 'dashboard' && (
          <label className="simulation-view-cost-toggle">
            <input type="checkbox" checked={costView} onChange={(e) => onCostViewChange(e.target.checked)} />
            Vista por custo
          </label>
        )}
      </div>
      )}
      {error && (
        <div className="simulation-error-banner">
          <span>{error}</span>
          {onDismissError && (
            <button type="button" className="toolbar-btn" onClick={onDismissError}>
              Fechar
            </button>
          )}
        </div>
      )}
      {viewMode === 'dashboard' && (
        <>
          {result ? (
            <Dashboard
              elapsedSec={result.elapsedSec}
              serviceMetrics={result.serviceMetrics}
              constraintResults={result.constraintResults}
              onClose={onClearResult}
              onExportConsolidated={onExportConsolidated}
              embedded
              costNodes={nodes}
              showCostView={costView}
            />
          ) : (
            <p className="simulation-view-message">
              Clique em Executar simulacao (ou use o botao na faixa de opcoes) para ver metricas e constraints.
            </p>
          )}
        </>
      )}
      {viewMode === 'live' && (
        <SimulationLiveView
          nodes={nodes}
          edges={edges}
          elapsedSec={result?.elapsedSec ?? 0}
          serviceMetrics={result?.serviceMetrics ?? []}
          constraintResults={result?.constraintResults ?? []}
          onRunSimulation={onRunSimulation}
          onClose={onClearResult}
          isRunning={isRunning}
        />
      )}
    </div>
  )
}
