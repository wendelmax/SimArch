import { useMemo } from 'react'
import type { ServiceMetricsDto, ConstraintEvaluationDto } from '../api/client'

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
      events.push({ time: formatTime(i * step), message: `${m.serviceId}: ${m.failureCount} falhas`, isError: true })
    }
    if (m.avgLatencyMs > 500) {
      events.push({ time: formatTime(i * step + step * 0.5), message: `${m.serviceId}: latencia media ${m.avgLatencyMs.toFixed(0)} ms` })
    }
  })
  constraintResults.filter((c) => !c.passed).forEach((c, i) => {
    events.push({ time: formatTime(elapsedSec * 0.8 + i * 0.2), message: `Constraint ${c.constraintId}: FAIL`, isError: true })
  })
  events.sort((a, b) => a.time.localeCompare(b.time))
  return events.slice(0, 20)
}

export interface SimulationBottomPanelProps {
  elapsedSec: number
  serviceMetrics: ServiceMetricsDto[]
  constraintResults: ConstraintEvaluationDto[]
}

export function SimulationBottomPanel({ elapsedSec, serviceMetrics, constraintResults }: SimulationBottomPanelProps) {
  const totalRequests = useMemo(() => serviceMetrics.reduce((s, m) => s + m.requestCount, 0), [serviceMetrics])
  const totalFailures = useMemo(() => serviceMetrics.reduce((s, m) => s + m.failureCount, 0), [serviceMetrics])
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
  )
}
