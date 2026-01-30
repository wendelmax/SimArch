import type { Node } from '@xyflow/react'
import type { NodeData } from '../utils/diagramToYaml'

interface FinOpsSummaryProps {
  nodes: Node<NodeData>[]
}

function formatCost(value: number, currency: string): string {
  return `${currency || 'USD'} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function FinOpsSummary({ nodes }: FinOpsSummaryProps) {
  const serviceNodes = nodes.filter((n) => n.type === 'cloud' || n.type === 'service')
  const withCost = serviceNodes.filter((n) => {
    const d = n.data as NodeData
    return (d.costPerMonth != null && d.costPerMonth > 0) || (d.costPerHour != null && d.costPerHour > 0)
  })

  const totalPerMonth = withCost.reduce((sum, n) => sum + ((n.data as NodeData).costPerMonth ?? 0), 0)
  const totalPerHour = withCost.reduce((sum, n) => sum + ((n.data as NodeData).costPerHour ?? 0), 0)
  const currency = (withCost[0]?.data as NodeData)?.currency ?? 'USD'

  return (
    <div className="finops-summary">
      <div className="property-panel-title">Visao de custos (FinOps)</div>
      {withCost.length === 0 ? (
        <div className="property-panel-empty finops-empty">
          Defina custo/hora ou custo/mes nas propriedades de cada componente.
        </div>
      ) : (
        <>
          <div className="finops-totals">
            <div className="finops-total-row">
              <span className="finops-total-label">Total/mes</span>
              <span className="finops-total-value">{formatCost(totalPerMonth, currency)}</span>
            </div>
            <div className="finops-total-row">
              <span className="finops-total-label">Total/hora</span>
              <span className="finops-total-value">{formatCost(totalPerHour, currency)}</span>
            </div>
          </div>
          <div className="finops-table-wrap">
            <table className="finops-table">
              <thead>
                <tr>
                  <th>Componente</th>
                  <th>Custo/mes</th>
                  <th>Custo/hora</th>
                </tr>
              </thead>
              <tbody>
                {withCost.map((n) => {
                  const d = n.data as NodeData
                  const month = d.costPerMonth ?? 0
                  const hour = d.costPerHour ?? 0
                  const curr = d.currency ?? currency
                  return (
                    <tr key={n.id}>
                      <td className="finops-cell-name">{d.label || n.id}</td>
                      <td>{month > 0 ? formatCost(month, curr) : '-'}</td>
                      <td>{hour > 0 ? formatCost(hour, curr) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
