import { useCallback } from 'react'
import type { Node } from '@xyflow/react'
import type { NodeData } from '../utils/diagramToYaml'

interface PropertyPanelProps {
  selectedNode: Node<NodeData> | null
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void
}

export function PropertyPanel({ selectedNode, onUpdate }: PropertyPanelProps) {
  const data = selectedNode?.data as unknown as NodeData | undefined
  const update = useCallback(
    (field: keyof NodeData, value: string | number | undefined) => {
      if (selectedNode) onUpdate(selectedNode.id, { [field]: value })
    },
    [selectedNode, onUpdate]
  )

  if (!selectedNode || !data) {
    return (
      <div className="property-panel">
        <div className="property-panel-title">Propriedades</div>
        <div className="property-panel-empty">Selecione um no no canvas</div>
      </div>
    )
  }

  return (
    <div className="property-panel">
      <div className="property-panel-title">Propriedades</div>
      <div className="property-panel-section">
        <label>Nome</label>
        <input
          type="text"
          value={data.label ?? ''}
          onChange={(e) => update('label', e.target.value)}
        />
      </div>
      <div className="property-panel-section">
        <label>SLA (ms)</label>
        <input
          type="number"
          min={0}
          value={data.slaMs ?? ''}
          onChange={(e) => update('slaMs', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
      <div className="property-panel-section">
        <label>Fallback (id do no)</label>
        <input
          type="text"
          value={data.fallback ?? ''}
          onChange={(e) => update('fallback', e.target.value)}
          placeholder="id do servico fallback"
        />
      </div>
      <div className="property-panel-section">
        <label>Custos (FinOps) – Moeda</label>
        <input
          type="text"
          value={data.currency ?? ''}
          onChange={(e) => update('currency', e.target.value)}
          placeholder="USD, BRL"
          maxLength={6}
        />
      </div>
      <div className="property-panel-section">
        <label>Custo/hora</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={data.costPerHour ?? ''}
          onChange={(e) => update('costPerHour', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="0.00"
        />
      </div>
      <div className="property-panel-section">
        <label>Custo/mes</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={data.costPerMonth ?? ''}
          onChange={(e) => update('costPerMonth', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="0.00"
        />
      </div>
      {data.provider && (
        <div className="property-panel-section">
          <label>Provedor</label>
          <span className="property-readonly">{data.provider}</span>
        </div>
      )}
      {data.componentId && (
        <div className="property-panel-section">
          <label>Componente</label>
          <span className="property-readonly">{data.componentId}</span>
        </div>
      )}
    </div>
  )
}
