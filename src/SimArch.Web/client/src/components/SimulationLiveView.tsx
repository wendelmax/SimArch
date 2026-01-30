import { useMemo, useState } from 'react'
import { ReactFlowProvider, ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { CloudNode } from './CloudNode'
import { ZoneNode } from './ZoneNode'
import type { NodeData } from '../utils/diagramToYaml'
import type { ServiceMetricsDto, ConstraintEvaluationDto } from '../api/client'

const nodeTypes = { cloud: CloudNode, zone: ZoneNode }

interface SimulationLiveViewProps {
  nodes: Node<NodeData>[]
  edges: Edge[]
  elapsedSec: number
  serviceMetrics: ServiceMetricsDto[]
  constraintResults: ConstraintEvaluationDto[]
  onRunSimulation: () => void
  onClose: () => void
  isRunning?: boolean
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function buildTimelinePoints(elapsedSec: number, totalRequests: number, totalFailures: number): { t: number; requests: number; errors: number }[] {
  const points: { t: number; requests: number; errors: number }[] = []
  const steps = Math.max(2, Math.min(20, Math.floor(elapsedSec * 2)))
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * elapsedSec
    const r = (i / steps) * totalRequests
    const e = (i / steps) * totalFailures
    points.push({ t, requests: r, errors: e })
  }
  return points
}

function buildEventLog(serviceMetrics: ServiceMetricsDto[], constraintResults: ConstraintEvaluationDto[], elapsedSec: number): { time: string; message: string; isError?: boolean }[] {
  const events: { time: string; message: string; isError?: boolean }[] = []
  const step = elapsedSec / Math.max(1, serviceMetrics.length + constraintResults.length)
  serviceMetrics.forEach((m, i) => {
    if (m.failureCount > 0) {
      events.push({
        time: formatTime(i * step),
        message: `${m.serviceId}: ${m.failureCount} falhas`,
        isError: true,
      })
    }
    if (m.avgLatencyMs > 500) {
      events.push({
        time: formatTime(i * step + step * 0.5),
        message: `${m.serviceId}: latencia media ${m.avgLatencyMs.toFixed(0)} ms`,
      })
    }
  })
  constraintResults.filter((c) => !c.passed).forEach((c, i) => {
    events.push({
      time: formatTime(elapsedSec * 0.8 + i * 0.2),
      message: `Constraint ${c.constraintId}: FAIL`,
      isError: true,
    })
  })
  events.sort((a, b) => a.time.localeCompare(b.time))
  return events.slice(0, 20)
}

function LiveViewInner({
  nodes,
  edges,
  elapsedSec,
  serviceMetrics,
  constraintResults,
  onRunSimulation,
  onClose,
  isRunning = false,
}: SimulationLiveViewProps) {
  const [speed, setSpeed] = useState<1 | 5 | 10>(1)
  const [scenario, setScenario] = useState<string>('normal')

  const totalRequests = useMemo(() => serviceMetrics.reduce((s, m) => s + m.requestCount, 0), [serviceMetrics])
  const totalFailures = useMemo(() => serviceMetrics.reduce((s, m) => s + m.failureCount, 0), [serviceMetrics])
  const throughput = elapsedSec > 0 ? Math.round(totalRequests / elapsedSec) : 0
  const errorRate = totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0
  const avgLatencyMs = useMemo(() => {
    if (serviceMetrics.length === 0) return 0
    const sum = serviceMetrics.reduce((s, m) => s + m.avgLatencyMs * m.requestCount, 0)
    return totalRequests > 0 ? sum / totalRequests : 0
  }, [serviceMetrics, totalRequests])

  const timelinePoints = useMemo(
    () => buildTimelinePoints(elapsedSec, totalRequests, totalFailures),
    [elapsedSec, totalRequests, totalFailures]
  )
  const eventLog = useMemo(
    () => buildEventLog(serviceMetrics, constraintResults, elapsedSec),
    [serviceMetrics, constraintResults, elapsedSec]
  )

  const maxR = Math.max(1, totalRequests, totalFailures)
  const chartW = 400
  const chartH = 120

  return (
    <div className="simulation-live">
      <div className="simulation-live-header">
        <div className="simulation-live-controls">
          <button
            type="button"
            className={`toolbar-btn ${isRunning ? 'simulation-live-pause' : 'primary'}`}
            onClick={onRunSimulation}
          >
            {isRunning ? 'Executando...' : 'Executar simulacao'}
          </button>
          <span className="simulation-live-speed-label">Velocidade</span>
          <div className="simulation-live-speed">
            <button type="button" className={`toolbar-btn simulation-live-speed-btn ${speed === 1 ? 'primary' : ''}`} onClick={() => setSpeed(1)}>1x</button>
            <button type="button" className={`toolbar-btn simulation-live-speed-btn ${speed === 5 ? 'primary' : ''}`} onClick={() => setSpeed(5)}>5x</button>
            <button type="button" className={`toolbar-btn simulation-live-speed-btn ${speed === 10 ? 'primary' : ''}`} onClick={() => setSpeed(10)}>10x</button>
          </div>
          <span className="simulation-live-scenario-label">Cenario</span>
          <select className="simulation-live-scenario-select" value={scenario} onChange={(e) => setScenario(e.target.value)}>
            <option value="normal">Carga normal</option>
            <option value="peak">Pico de trafego</option>
            <option value="failure">Falha de servico</option>
          </select>
        </div>
        <button type="button" className="toolbar-btn" onClick={onClose}>
          Fechar
        </button>
      </div>
      <div className="simulation-live-body">
        <div className="simulation-live-diagram">
          {nodes.filter((n) => n.type === 'cloud' || n.type === 'service').length === 0 ? (
            <div className="simulation-live-diagram-empty">
              Desenhe a arquitetura na aba Arquitetura para ver o diagrama aqui.
            </div>
          ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} color="#334155" />
            <Controls className="canvas-controls" />
            <MiniMap className="canvas-minimap" nodeColor="#475569" maskColor="rgba(15,23,42,0.8)" />
          </ReactFlow>
          )}
        </div>
        <div className="simulation-live-metrics-panel">
          <h4 className="simulation-live-panel-title">Metricas</h4>
          <div className="simulation-live-kpis">
            <div className="simulation-live-kpi">
              <span className="simulation-live-kpi-label">Tempo</span>
              <span className="simulation-live-kpi-value">{formatTime(elapsedSec)}</span>
            </div>
            <div className="simulation-live-kpi">
              <span className="simulation-live-kpi-label">Latencia media</span>
              <span className="simulation-live-kpi-value">{avgLatencyMs.toFixed(0)} ms</span>
            </div>
            <div className="simulation-live-kpi">
              <span className="simulation-live-kpi-label">Taxa de erro</span>
              <span className={`simulation-live-kpi-value ${errorRate > 10 ? 'simulation-live-kpi-error' : ''}`}>
                {errorRate.toFixed(1)}%
              </span>
            </div>
            <div className="simulation-live-kpi">
              <span className="simulation-live-kpi-label">Throughput</span>
              <span className="simulation-live-kpi-value">{throughput} req/s</span>
            </div>
            <div className="simulation-live-kpi">
              <span className="simulation-live-kpi-label">Requisicoes</span>
              <span className="simulation-live-kpi-value">{totalRequests}</span>
            </div>
            <div className="simulation-live-kpi">
              <span className="simulation-live-kpi-label">Falhas</span>
              <span className={`simulation-live-kpi-value ${totalFailures > 0 ? 'simulation-live-kpi-error' : ''}`}>
                {totalFailures}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="simulation-live-bottom">
        <div className="simulation-live-timeline-panel">
          <h4 className="simulation-live-panel-title">Timeline</h4>
          <div className="simulation-live-timeline-chart">
            <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
              {timelinePoints.length >= 2 && (
                <>
                  <polyline
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    points={timelinePoints.map((p) => `${(p.t / elapsedSec) * chartW},${chartH - (p.requests / maxR) * (chartH - 20)}`).join(' ')}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--error)"
                    strokeWidth="2"
                    points={timelinePoints.map((p) => `${(p.t / elapsedSec) * chartW},${chartH - (p.errors / maxR) * (chartH - 20)}`).join(' ')}
                  />
                </>
              )}
            </svg>
          </div>
          <div className="simulation-live-timeline-legend">
            <span className="simulation-live-legend-item" style={{ color: 'var(--accent)' }}>Requisicoes</span>
            <span className="simulation-live-legend-item" style={{ color: 'var(--error)' }}>Erros</span>
          </div>
        </div>
        <div className="simulation-live-events-panel">
          <h4 className="simulation-live-panel-title">Log de eventos</h4>
          <div className="simulation-live-events">
            {eventLog.length === 0 && (
              <div className="simulation-live-events-empty">Execute a simulacao para ver eventos.</div>
            )}
            {eventLog.map((ev, i) => (
              <div key={i} className={`simulation-live-event ${ev.isError ? 'simulation-live-event-error' : ''}`}>
                <span className="simulation-live-event-time">{ev.time}</span>
                <span className="simulation-live-event-msg">{ev.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SimulationLiveView(props: SimulationLiveViewProps) {
  return (
    <ReactFlowProvider>
      <LiveViewInner {...props} />
    </ReactFlowProvider>
  )
}
