import { useMemo, useState, useEffect } from 'react'
import { cloudCatalog, providerLabels, providerColors, type CloudProvider, type CloudComponentDef } from '../data/cloudCatalog'
import { ComponentIcon, ProviderIcon } from '../data/componentIcons'

export type ProjectType = 'single' | 'multicloud'

const CATEGORY_ORDER: string[] = [
  'Triggers', 'Compute', 'Containers', 'API', 'Network', 'Storage', 'Database', 'Cache',
  'Messaging', 'Events', 'CDN', 'Security',
]

function groupByCategory(components: CloudComponentDef[]): [string, CloudComponentDef[]][] {
  const byCategory = new Map<string, CloudComponentDef[]>()
  for (const c of components) {
    const list = byCategory.get(c.category) ?? []
    list.push(c)
    byCategory.set(c.category, list)
  }
  const ordered: [string, CloudComponentDef[]][] = []
  for (const cat of CATEGORY_ORDER) {
    const list = byCategory.get(cat)
    if (list?.length) ordered.push([cat, list])
  }
  const rest = [...byCategory.entries()].filter(([cat]) => !CATEGORY_ORDER.includes(cat))
  return [...ordered, ...rest]
}

interface PaletteProps {
  onDragStart: (component: CloudComponentDef) => void
  projectType?: ProjectType
  primaryCloud?: CloudProvider | null
  selectedZone?: CloudProvider | null
  onZoneChange?: (zone: CloudProvider) => void
}

const ZONE_PROVIDERS: CloudProvider[] = ['aws', 'azure', 'gcp', 'oracle']

export function Palette({ onDragStart, projectType = 'single', primaryCloud = 'generic', selectedZone = 'aws', onZoneChange }: PaletteProps) {
  const [activeProvider, setActiveProvider] = useState<CloudProvider>(projectType === 'single' ? (primaryCloud ?? 'generic') : (selectedZone ?? 'aws'))
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  useEffect(() => {
    setActiveProvider(projectType === 'single' ? (primaryCloud ?? 'generic') : (selectedZone ?? 'aws'))
  }, [projectType, primaryCloud, selectedZone])

  const allowedProviders: CloudProvider[] = projectType === 'single' ? [primaryCloud ?? 'generic'] : ['generic', ...ZONE_PROVIDERS]
  const effectiveProvider = projectType === 'single' ? (primaryCloud ?? 'generic') : (selectedZone ?? activeProvider)
  const components = cloudCatalog[effectiveProvider] ?? []
  const categories = useMemo(() => {
    const set = new Set(components.map((c) => c.category))
    return ['', ...CATEGORY_ORDER.filter((c) => set.has(c)), ...[...set].filter((c) => !CATEGORY_ORDER.includes(c))]
  }, [components])

  const grouped = useMemo(() => {
    const list = categoryFilter ? components.filter((c) => c.category === categoryFilter) : components
    return groupByCategory(list)
  }, [components, categoryFilter])

  return (
    <div className="palette">
      <div className="palette-title">Componentes</div>
      {projectType === 'multicloud' && (
        <div className="palette-zone-label">Zona</div>
      )}
      <div className="palette-tabs">
        {allowedProviders.map((p) => (
          <button
            key={p}
            type="button"
            className={`palette-tab ${(projectType === 'multicloud' ? selectedZone === p : activeProvider === p) ? 'active' : ''}`}
            style={{ borderBottomColor: (projectType === 'multicloud' ? selectedZone === p : activeProvider === p) ? providerColors[p] : 'transparent' }}
            onClick={() => {
              if (projectType === 'multicloud') onZoneChange?.(p)
              else setActiveProvider(p)
            }}
          >
            <span className="palette-tab-icon"><ProviderIcon provider={p} size={16} /></span>
            {providerLabels[p]}
          </button>
        ))}
      </div>
      <div className="palette-filter-wrap">
        <label htmlFor="palette-category-filter" className="palette-filter-label">
          Tipo
        </label>
        <select
          id="palette-category-filter"
          className="palette-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {categories.filter((c) => c).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="palette-list">
        {grouped.map(([category, items]) => (
          <div key={category} className="palette-category">
            <div className="palette-category-title">{category}</div>
            {items.map((comp) => (
              <div
                key={comp.id}
                className="palette-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/simarch-component', JSON.stringify(comp))
                  e.dataTransfer.effectAllowed = 'move'
                  onDragStart(comp)
                }}
                style={{ borderLeftColor: providerColors[comp.provider] }}
              >
                <span className="palette-item-icon">
                  <ComponentIcon componentId={comp.id} category={comp.category} provider={comp.provider} size={18} />
                </span>
                <span className="palette-item-name">{comp.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
