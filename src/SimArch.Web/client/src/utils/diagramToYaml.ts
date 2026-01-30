import type { Node, Edge } from '@xyflow/react'
import type { CloudProvider } from '../data/cloudCatalog'
import { mapComponentToCloud } from '../data/cloudMapping'

export type ViewMode = 'technical' | 'simple'

export interface NodeData extends Record<string, unknown> {
  label: string
  provider?: CloudProvider
  componentId?: string
  componentName?: string
  category?: string
  slaMs?: number
  fallback?: string
  viewMode?: ViewMode
  isBridge?: boolean
  isZone?: boolean
  isTrigger?: boolean
  costPerHour?: number
  costPerMonth?: number
  currency?: string
}

export interface RequirementDef {
  id: string
  text: string
  priority: string
  type: string
  standardRef?: string
}

export interface TraceabilityLinkDef {
  requirementId: string
  linkType: string
  elementType: string
  elementId: string
}

export interface ParametricConstraintDef {
  id: string
  metric: string
  operator: string
  value: number
}

export type AdrStatus = 'Proposed' | 'Accepted' | 'Rejected' | 'Superseded'

export interface AdrDef {
  id: string
  number: number
  title: string
  status: AdrStatus
  date?: string
  owner?: string
  stakeholders?: string[]
  context: string
  decision: string
  consequences: string
  alternativesConsidered?: string
  references?: string
  supersededBy?: string
}

export type ProjectType = 'single' | 'multicloud'

export interface DiagramYamlOptions {
  name?: string
  description?: string
  version?: string
  participants?: string[]
  projectType?: ProjectType
  primaryCloud?: CloudProvider
  requirements?: RequirementDef[]
  traceabilityLinks?: TraceabilityLinkDef[]
  constraints?: ParametricConstraintDef[]
  adrs?: AdrDef[]
}

function escapeYamlString(s: string): string {
  if (s.includes('\n') || s.includes(':') || s.includes('"') || s.includes('#')) return `"${s.replace(/"/g, '\\"')}"`
  return s
}

export function diagramToYaml(
  nodes: Node<NodeData>[],
  edges: Edge[],
  options: DiagramYamlOptions = {}
): string {
  const name = options.name ?? 'Architecture'
  const projectType = options.projectType ?? 'single'
  const primaryCloud = projectType === 'multicloud' ? 'multicloud' : (options.primaryCloud ?? 'generic')
  let projectMetaBlock = ''
  if (options.description != null && options.description !== '') projectMetaBlock += `description: ${escapeYamlString(options.description)}\n`
  if (options.version != null && options.version !== '') projectMetaBlock += `version: ${escapeYamlString(options.version)}\n`
  if (options.participants != null && options.participants.length > 0)
    projectMetaBlock += `participants:\n${options.participants.map((p) => `  - ${escapeYamlString(p)}`).join('\n')}\n`
  const services = nodes
    .filter((n) => (n.type === 'cloud' || n.type === 'service') && n.data && !(n.data as NodeData).isZone)
    .map((n, i) => {
      const d = n.data as NodeData
      const id = n.id.replace(/\s+/g, '-').toLowerCase() || `svc-${i + 1}`
      const nameSvc = d.label || n.id || id
      const fallbackEdge = edges.find((e) => e.source === n.id && e.sourceHandle === 'fallback')
      const fallback = fallbackEdge ? fallbackEdge.target : undefined
      let block = `  - id: ${id}\n    name: ${escapeYamlString(nameSvc)}\n`
      if (d.slaMs) block += `    slaMs: ${d.slaMs}\n`
      if (d.provider) block += `    provider: ${d.provider}\n`
      if (d.componentId) block += `    component: ${d.componentId}\n`
      if (fallback) block += `    fallback: ${fallback}\n`
      if (d.costPerHour != null) block += `    costPerHour: ${d.costPerHour}\n`
      if (d.costPerMonth != null) block += `    costPerMonth: ${d.costPerMonth}\n`
      if (d.currency) block += `    currency: ${escapeYamlString(d.currency)}\n`
      return block
    })
    .join('')

  const flowEdges = edges.filter((e) => e.sourceHandle !== 'fallback' && !e.sourceHandle?.includes('fallback'))
  const steps = flowEdges.map((e) => {
    const onFailure = edges.find((x) => x.source === e.source && x.sourceHandle === 'fallback')?.target
    return `      - from: ${e.source}\n        to: ${e.target}${onFailure ? `\n        onFailure: ${onFailure}` : ''}`
  })
  const flowsBlock =
    steps.length > 0
      ? `\nflows:\n  - id: main\n    name: Main Flow\n    steps:\n${steps.join('\n')}`
      : ''

  let reqBlock = ''
  if (options.requirements && options.requirements.length > 0) {
    reqBlock =
      '\nrequirements:\n' +
      options.requirements
        .map(
          (r) =>
            `  - id: ${r.id}\n    text: ${escapeYamlString(r.text)}\n    priority: ${r.priority}\n    type: ${r.type}` +
            (r.standardRef ? `\n    standardRef: ${escapeYamlString(r.standardRef)}` : '')
        )
        .join('\n')
  }

  let traceBlock = ''
  if (options.traceabilityLinks && options.traceabilityLinks.length > 0) {
    traceBlock =
      '\ntraceabilityLinks:\n' +
      options.traceabilityLinks
        .map(
          (t) =>
            `  - requirementId: ${t.requirementId}\n    linkType: ${t.linkType}\n    elementType: ${t.elementType}\n    elementId: ${t.elementId}`
        )
        .join('\n')
  }

  let constraintsBlock = ''
  if (options.constraints && options.constraints.length > 0) {
    constraintsBlock =
      '\nconstraints:\n' +
      options.constraints
        .map((c) => `  - id: ${c.id}\n    metric: ${c.metric}\n    operator: ${c.operator}\n    value: ${c.value}`)
        .join('\n')
  }

  let adrsBlock = ''
  if (options.adrs && options.adrs.length > 0) {
    adrsBlock =
      '\nadrs:\n' +
      options.adrs
        .map((a) => {
          let block =
            `  - id: ${escapeYamlString(a.id)}\n    number: ${a.number}\n    title: ${escapeYamlString(a.title)}\n    status: ${a.status}\n    context: ${escapeYamlString(a.context)}\n    decision: ${escapeYamlString(a.decision)}\n    consequences: ${escapeYamlString(a.consequences)}`
          if (a.date) block += `\n    date: ${escapeYamlString(a.date)}`
          if (a.owner) block += `\n    owner: ${escapeYamlString(a.owner)}`
          if (a.stakeholders && a.stakeholders.length > 0)
            block += `\n    stakeholders:\n${a.stakeholders.map((s) => `      - ${escapeYamlString(s)}`).join('\n')}`
          if (a.alternativesConsidered) block += `\n    alternativesConsidered: ${escapeYamlString(a.alternativesConsidered)}`
          if (a.references) block += `\n    references: ${escapeYamlString(a.references)}`
          if (a.supersededBy) block += `\n    supersededBy: ${escapeYamlString(a.supersededBy)}`
          return block
        })
        .join('\n')
  }

  return `name: ${escapeYamlString(name)}
${projectMetaBlock}projectType: ${projectType}
primaryCloud: ${primaryCloud}
services:
${services}${flowsBlock}${reqBlock}${traceBlock}${constraintsBlock}${adrsBlock}
`
}

const PROJECT_TYPE_RE = /projectType:\s*(\w+)/
const PRIMARY_CLOUD_RE = /primaryCloud:\s*(\w+)/

export function parseProjectFromYaml(yaml: string): { projectType: ProjectType; primaryCloud: CloudProvider | null } {
  const pt = yaml.match(PROJECT_TYPE_RE)?.[1]
  const pc = yaml.match(PRIMARY_CLOUD_RE)?.[1]
  const projectType: ProjectType = pt === 'multicloud' ? 'multicloud' : 'single'
  const primaryCloud: CloudProvider | null =
    projectType === 'multicloud' ? null : (pc && pc !== 'multicloud' && pc !== 'logical' ? (pc as CloudProvider) : 'generic')
  return { projectType, primaryCloud }
}

export function buildAlternateCloudYaml(
  nodes: Node<NodeData>[],
  edges: Edge[],
  options: DiagramYamlOptions,
  targetCloud: CloudProvider
): string {
  const serviceNodes = nodes.filter(
    (n) => (n.type === 'cloud' || n.type === 'service') && n.data && !(n.data as NodeData).isZone
  )
  const mappedNodes: Node<NodeData>[] = serviceNodes.map((n) => {
    const d = n.data as NodeData
    const category = d.category ?? 'Compute'
    const mapped = mapComponentToCloud(d.componentId ?? '', category, targetCloud)
    return {
      ...n,
      data: {
        ...d,
        provider: mapped.provider,
        componentId: mapped.id,
        componentName: mapped.name,
        label: d.label ?? mapped.name,
      } as NodeData,
    }
  })
  return diagramToYaml(mappedNodes, edges, {
    ...options,
    projectType: 'single',
    primaryCloud: targetCloud,
  })
}
