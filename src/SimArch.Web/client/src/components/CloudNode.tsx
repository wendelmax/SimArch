import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeData } from '../utils/diagramToYaml'
import { providerColors, type CloudProvider } from '../data/cloudCatalog'
import { ComponentIcon, ProviderIcon } from '../data/componentIcons'

const providerColor = (p?: CloudProvider) => (p ? providerColors[p] ?? '#64748b' : '#64748b')

function CloudNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as NodeData
  const viewMode = d.viewMode ?? 'technical'
  const isError = d.componentId === 'generic-trigger-error'
  const isTrigger = d.isTrigger ?? d.category === 'Triggers'
  const color = isError ? '#ef4444' : providerColor(d.provider)
  const isSimple = viewMode === 'simple'
  return (
    <div
      className={`cloud-node ${isSimple ? 'cloud-node-simple' : ''} ${isTrigger ? 'cloud-node-trigger' : ''} ${isError ? 'cloud-node-error' : ''}`}
      style={{
        borderColor: color,
        boxShadow: selected ? `0 0 0 2px ${color}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} id="in" className="node-handle" />
      <div className="cloud-node-header" style={{ backgroundColor: color }}>
        <span className="cloud-node-header-icon">
          <ComponentIcon
            componentId={d.componentId}
            category={d.category}
            provider={d.provider}
            size={18}
            showProviderBadge={!isSimple && !!d.provider && d.provider !== 'generic'}
          />
        </span>
        <span className="cloud-node-header-label">{d.componentName || d.label || 'Service'}</span>
      </div>
      {!isSimple && (
        <div className="cloud-node-body">
          {d.provider && d.provider !== 'generic' && (
            <span className="cloud-node-provider-badge">
              <ProviderIcon provider={d.provider} size={14} />
              <span>{d.provider.toUpperCase()}</span>
            </span>
          )}
          {d.category && <span className="cloud-node-category">{d.category}</span>}
        </div>
      )}
      {!isError && (
        <>
          <Handle type="source" position={Position.Right} id="out" className="node-handle" />
          <Handle type="source" position={Position.Bottom} id="fallback" className="node-handle fallback-handle" />
        </>
      )}
    </div>
  )
}

export const CloudNode = memo(CloudNodeComponent)
