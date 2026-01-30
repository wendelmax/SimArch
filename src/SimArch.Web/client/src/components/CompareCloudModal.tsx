import { useState, useCallback } from 'react'
import type { CloudProvider } from '../data/cloudCatalog'
import { providerLabels } from '../data/cloudCatalog'
import { getCompareTargetClouds } from '../data/cloudMapping'
import type { NodeData } from '../utils/diagramToYaml'
import type { Node } from '@xyflow/react'
import * as api from '../api/client'
import type { ServiceMetricsDto } from '../api/client'

interface CompareCloudModalProps {
  primaryCloud: CloudProvider | null
  getYaml: () => string
  getAlternateYaml: (targetCloud: CloudProvider) => string
  nodes: Node<NodeData>[]
  onClose: () => void
}

function costTotal(nodes: Node<NodeData>[]): { month: number; hour: number; currency: string } {
  const withCost = nodes.filter((n) => {
    const d = n.data as NodeData
    return (n.type === 'cloud' || n.type === 'service') && ((d.costPerMonth ?? 0) > 0 || (d.costPerHour ?? 0) > 0)
  })
  const month = withCost.reduce((s, n) => s + ((n.data as NodeData).costPerMonth ?? 0), 0)
  const hour = withCost.reduce((s, n) => s + ((n.data as NodeData).costPerHour ?? 0), 0)
  const currency = (withCost[0]?.data as NodeData)?.currency ?? 'USD'
  return { month, hour, currency }
}

export function CompareCloudModal({
  primaryCloud,
  getYaml,
  getAlternateYaml,
  nodes,
  onClose,
}: CompareCloudModalProps) {
  const targets = getCompareTargetClouds(primaryCloud ?? 'generic')
  const [targetCloud, setTargetCloud] = useState<CloudProvider>(targets[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultA, setResultA] = useState<{
    elapsedSec: number
    serviceMetrics: ServiceMetricsDto[]
  } | null>(null)
  const [resultB, setResultB] = useState<{
    elapsedSec: number
    serviceMetrics: ServiceMetricsDto[]
  } | null>(null)

  const costA = costTotal(nodes)
  const hasCostA = costA.month > 0 || costA.hour > 0

  const runCompare = useCallback(async () => {
    setError(null)
    setResultA(null)
    setResultB(null)
    setLoading(true)
    try {
      const yamlA = getYaml()
      const yamlB = getAlternateYaml(targetCloud)
      const { resA, resB } = await api.runSimulationCompare({ yamlA, yamlB, durationSec: 5, rate: 50 })
      if (!resA.success || !resA.serviceMetrics) {
        setError(resA.error ?? 'Erro na simulacao A')
        return
      }
      if (!resB.success || !resB.serviceMetrics) {
        setError(resB.error ?? 'Erro na simulacao B')
        return
      }
      setResultA({ elapsedSec: resA.elapsed ?? 0, serviceMetrics: resA.serviceMetrics })
      setResultB({ elapsedSec: resB.elapsed ?? 0, serviceMetrics: resB.serviceMetrics })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao comparar')
    } finally {
      setLoading(false)
    }
  }, [getYaml, getAlternateYaml, targetCloud])

  const labelA = primaryCloud ? providerLabels[primaryCloud] : 'Atual'
  const labelB = providerLabels[targetCloud]

  return (
    <div className="project-setup-overlay">
      <div className="compare-cloud-modal">
        <h2 className="project-setup-title">Comparar mesma estrutura em outra nuvem</h2>
        <p className="project-setup-desc">
          Gera a mesma arquitetura com componentes equivalentes na nuvem alvo e executa simulacao em ambos para comparar metricas e custos.
        </p>
        <div className="project-setup-cloud">
          <label htmlFor="compare-target-cloud" className="project-setup-cloud-label">
            Nuvem alvo
          </label>
          <select
            id="compare-target-cloud"
            className="project-setup-cloud-select"
            value={targetCloud}
            onChange={(e) => setTargetCloud(e.target.value as CloudProvider)}
            disabled={loading}
          >
            {targets.map((p) => (
              <option key={p} value={p}>
                {providerLabels[p]}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="compare-cloud-error">{error}</div>}
        <div className="project-setup-actions">
          <button type="button" className="toolbar-btn" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="toolbar-btn primary" onClick={runCompare} disabled={loading}>
            {loading ? 'Executando...' : 'Comparar simulacao e custos'}
          </button>
        </div>
        {resultA && resultB && (
          <div className="compare-cloud-results">
            <h3 className="compare-cloud-results-title">Resultados</h3>
            <div className="compare-cloud-columns">
              <div className="compare-cloud-column">
                <h4 className="compare-cloud-column-title">{labelA}</h4>
                {hasCostA && (
                  <div className="compare-cloud-cost">
                    <span className="compare-cloud-cost-label">Custo/mes</span>
                    <span className="compare-cloud-cost-value">
                      {costA.currency} {costA.month.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="compare-cloud-cost-label">Custo/hora</span>
                    <span className="compare-cloud-cost-value">
                      {costA.currency} {costA.hour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="compare-cloud-metrics">
                  <span className="compare-cloud-meta">Tempo: {resultA.elapsedSec.toFixed(1)}s</span>
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Servico</th>
                        <th>Req</th>
                        <th>Falhas</th>
                        <th>Lat. media</th>
                        <th>P95</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultA.serviceMetrics.map((m) => (
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
              </div>
              <div className="compare-cloud-column">
                <h4 className="compare-cloud-column-title">{labelB}</h4>
                <div className="compare-cloud-cost">
                  <span className="compare-cloud-cost-label">Custos</span>
                  <span className="compare-cloud-cost-value compare-cloud-cost-na">
                    Defina custos na nuvem alvo (propriedades dos componentes) para comparar.
                  </span>
                </div>
                <div className="compare-cloud-metrics">
                  <span className="compare-cloud-meta">Tempo: {resultB.elapsedSec.toFixed(1)}s</span>
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Servico</th>
                        <th>Req</th>
                        <th>Falhas</th>
                        <th>Lat. media</th>
                        <th>P95</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultB.serviceMetrics.map((m) => (
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
