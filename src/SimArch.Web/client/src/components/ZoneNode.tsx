import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { NodeData } from '../utils/diagramToYaml'
import { providerColors, providerLabels, type CloudProvider } from '../data/cloudCatalog'
import { ProviderIcon } from '../data/componentIcons'

const ZONE_PROVIDERS: CloudProvider[] = ['aws', 'azure', 'gcp', 'oracle']

function ZoneNodeComponent({ data, id }: NodeProps) {
  const d = data as unknown as NodeData & { zoneProvider?: CloudProvider; label: string }
  const zoneProvider = (d.zoneProvider ?? (ZONE_PROVIDERS.includes(id.replace('zone-', '') as CloudProvider) ? id.replace('zone-', '') : 'aws')) as CloudProvider
  const color = providerColors[zoneProvider] ?? '#64748b'
  const label = d.label ?? providerLabels[zoneProvider] ?? id

  return (
    <div
      className="zone-node"
      style={{
        borderColor: color,
        backgroundColor: `${color}12`,
      }}
    >
      <div className="zone-node-header" style={{ backgroundColor: color }}>
        <span className="zone-node-header-icon">
          <ProviderIcon provider={zoneProvider} size={22} />
        </span>
        <span className="zone-node-header-label">{label}</span>
      </div>
      <div className="zone-node-body">
        Arraste componentes desta nuvem para esta area.
      </div>
    </div>
  )
}

export const ZoneNode = memo(ZoneNodeComponent)
