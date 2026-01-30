import type { Node } from '@xyflow/react'
import type { ServiceMetricsDto, ConstraintEvaluationDto } from '../api/client'
import type { NodeData } from '../utils/diagramToYaml'

interface DashboardProps {
  elapsedSec: number
  serviceMetrics: ServiceMetricsDto[]
  constraintResults: ConstraintEvaluationDto[]
  onClose: () => void
  onExportConsolidated: () => void
  embedded?: boolean
  costNodes?: Node<NodeData>[]
  showCostView?: boolean
}

function formatCost(value: number, currency: string): string {
  return `${currency || 'USD'} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function Dashboard({
  elapsedSec,
  serviceMetrics,
  constraintResults,
  onClose,
  onExportConsolidated,
  embedded = false,
  costNodes = [],
  showCostView = false,
}: DashboardProps) {
  const costByServiceId = new Map<string | undefined, { costPerMonth: number; costPerHour: number; currency: string }>()
  costNodes.forEach((n) => {
    const d = n.data as NodeData
    const month = d.costPerMonth ?? 0
    const hour = d.costPerHour ?? 0
    if (month > 0 || hour > 0) costByServiceId.set(n.id, { costPerMonth: month, costPerHour: hour, currency: d.currency ?? 'USD' })
  })
  const hasCostView = costByServiceId.size > 0 && serviceMetrics.length > 0
  const costMetricsRows = hasCostView
    ? serviceMetrics.map((m) => {
        const cost = costByServiceId.get(m.serviceId)
        return {
          serviceId: m.serviceId,
          costPerMonth: cost?.costPerMonth ?? 0,
          costPerHour: cost?.costPerHour ?? 0,
          currency: cost?.currency ?? 'USD',
          requestCount: m.requestCount,
          failureCount: m.failureCount,
          avgLatencyMs: m.avgLatencyMs,
          p95LatencyMs: m.p95LatencyMs,
        }
      })
    : []

  const costMetricsSection = hasCostView ? (
    <section className="dashboard-section dashboard-section-cost">
      <h3 className="dashboard-section-title">Custo x metricas</h3>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Servico</th>
              <th>Custo/mes</th>
              <th>Custo/hora</th>
              <th>Requisicoes</th>
              <th>Falhas</th>
              <th>Latencia media (ms)</th>
              <th>P95 (ms)</th>
            </tr>
          </thead>
          <tbody>
            {costMetricsRows.map((r) => (
              <tr key={r.serviceId}>
                <td>{r.serviceId}</td>
                <td>{r.costPerMonth > 0 ? formatCost(r.costPerMonth, r.currency) : '-'}</td>
                <td>{r.costPerHour > 0 ? formatCost(r.costPerHour, r.currency) : '-'}</td>
                <td>{r.requestCount}</td>
                <td>{r.failureCount}</td>
                <td>{r.avgLatencyMs.toFixed(1)}</td>
                <td>{r.p95LatencyMs.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dashboard-cost-bars">
        {costMetricsRows
          .filter((r) => r.costPerMonth > 0)
          .sort((a, b) => b.costPerMonth - a.costPerMonth)
          .slice(0, 10)
          .map((r) => {
            const maxCost = Math.max(...costMetricsRows.map((x) => x.costPerMonth), 1)
            const pct = (r.costPerMonth / maxCost) * 100
            return (
              <div key={r.serviceId} className="dashboard-cost-bar-row">
                <span className="dashboard-cost-bar-label">{r.serviceId}</span>
                <div className="dashboard-cost-bar-track">
                  <div className="dashboard-cost-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="dashboard-cost-bar-value">{formatCost(r.costPerMonth, r.currency)}</span>
              </div>
            )
          })}
      </div>
    </section>
  ) : null

  const content = (
    <div className={embedded ? 'dashboard-panel dashboard-panel-embedded' : 'dashboard-panel'}>
        <div className="dashboard-header">
          <h2 className="dashboard-title">Resultados da simulacao</h2>
          <div className="dashboard-actions">
            <button type="button" className="toolbar-btn" onClick={onExportConsolidated}>
              Exportar consolidado
            </button>
            <button type="button" className="toolbar-btn primary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
        <div className="dashboard-body">
          <p className="dashboard-meta">Tempo simulado: {elapsedSec.toFixed(1)}s</p>
          {showCostView && costMetricsSection}
          <section className="dashboard-section">
            <h3 className="dashboard-section-title">Metricas por servico</h3>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Servico</th>
                    <th>Requisicoes</th>
                    <th>Falhas</th>
                    <th>Latencia media (ms)</th>
                    <th>P95 (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceMetrics.map((m) => (
                    <tr key={m.serviceId}>
                      <td>{m.serviceId}</td>
                      <td>{m.requestCount}</td>
                      <td>{m.failureCount}</td>
                      <td>{m.avgLatencyMs.toFixed(1)}</td>
                      <td>{m.p95LatencyMs.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {!showCostView && costMetricsSection}
          {constraintResults.length > 0 && (
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Constraints</h3>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Constraint</th>
                      <th>Metrica</th>
                      <th>Operador</th>
                      <th>Esperado</th>
                      <th>Atual</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constraintResults.map((c) => (
                      <tr key={c.constraintId}>
                        <td>{c.constraintId}</td>
                        <td>{c.metric}</td>
                        <td>{c.operator}</td>
                        <td>{c.expectedValue}</td>
                        <td>{c.actualValue != null ? c.actualValue.toFixed(1) : '-'}</td>
                        <td>
                          <span className={c.passed ? 'dashboard-pass' : 'dashboard-fail'}>
                            {c.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
  )
  if (embedded) return content
  return <div className="dashboard-overlay">{content}</div>
}
