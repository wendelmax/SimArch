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
  adrId?: string
}

export type AdrStatus = 'Draft' | 'Proposed' | 'UnderReview' | 'Accepted' | 'Rejected' | 'Implemented' | 'Superseded' | 'Deprecated'

export interface AdrOptionDef {
  option: string
  pros: string[]
  cons: string[]
}

export interface AdrAmendmentDef {
  date: string
  text: string
}

export interface AdrAppliesToDef {
  elementType: string
  elementId: string
}

export interface AdrDef {
  id: string
  number: number
  title: string
  slug?: string
  template?: 'simarch' | 'nygard' | 'madr' | 'business'
  status: AdrStatus
  date?: string
  owner?: string
  stakeholders?: string[]
  proposedBy?: string
  reviewedBy?: string
  approvedBy?: string
  targetDate?: string
  reviewDate?: string
  context: string
  decision: string
  consequences: string
  alternativesConsidered?: string
  options?: AdrOptionDef[]
  references?: string
  supersededBy?: string
  amendments?: AdrAmendmentDef[]
  linkedConstraintIds?: string[]
  appliesTo?: AdrAppliesToDef[]
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
        .map(
          (c) =>
            `  - id: ${c.id}\n    metric: ${c.metric}\n    operator: ${c.operator}\n    value: ${c.value}` +
            (c.adrId ? `\n    adrId: ${escapeYamlString(c.adrId)}` : '')
        )
        .join('\n')
  }

  function slugify(s: string): string {
    if (!s?.trim()) return 'untitled'
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  let adrsBlock = ''
  if (options.adrs && options.adrs.length > 0) {
    adrsBlock =
      '\nadrs:\n' +
      options.adrs
        .map((a) => {
          const slug = a.slug ?? slugify(a.title)
          let block =
            `  - id: ${escapeYamlString(a.id)}\n    number: ${a.number}\n    title: ${escapeYamlString(a.title)}\n    slug: ${escapeYamlString(slug)}\n    template: ${a.template ?? 'simarch'}\n    status: ${a.status}\n    context: ${escapeYamlString(a.context)}\n    decision: ${escapeYamlString(a.decision)}\n    consequences: ${escapeYamlString(a.consequences)}`
          if (a.date) block += `\n    date: ${escapeYamlString(a.date)}`
          if (a.owner) block += `\n    owner: ${escapeYamlString(a.owner)}`
          if (a.stakeholders && a.stakeholders.length > 0)
            block += `\n    stakeholders:\n${a.stakeholders.map((s) => `      - ${escapeYamlString(s)}`).join('\n')}`
          if (a.proposedBy) block += `\n    proposedBy: ${escapeYamlString(a.proposedBy)}`
          if (a.reviewedBy) block += `\n    reviewedBy: ${escapeYamlString(a.reviewedBy)}`
          if (a.approvedBy) block += `\n    approvedBy: ${escapeYamlString(a.approvedBy)}`
          if (a.targetDate) block += `\n    targetDate: ${escapeYamlString(a.targetDate)}`
          if (a.reviewDate) block += `\n    reviewDate: ${escapeYamlString(a.reviewDate)}`
          if (a.alternativesConsidered) block += `\n    alternativesConsidered: ${escapeYamlString(a.alternativesConsidered)}`
          if (a.options && a.options.length > 0)
            block +=
              '\n    options:\n' +
              a.options
                .map((o) => {
                  const pros = (o.pros ?? []).length > 0 ? (o.pros ?? []).map((p) => `          - ${escapeYamlString(p)}`).join('\n') : '          []'
                  const cons = (o.cons ?? []).length > 0 ? (o.cons ?? []).map((c) => `          - ${escapeYamlString(c)}`).join('\n') : '          []'
                  return `      - option: ${escapeYamlString(o.option)}\n        pros:\n${pros}\n        cons:\n${cons}`
                })
                .join('\n')
          if (a.references) block += `\n    references: ${escapeYamlString(a.references)}`
          if (a.supersededBy) block += `\n    supersededBy: ${escapeYamlString(a.supersededBy)}`
          if (a.amendments && a.amendments.length > 0)
            block += '\n    amendments:\n' + a.amendments.map((m) => `      - date: ${escapeYamlString(m.date)}\n        text: ${escapeYamlString(m.text)}`).join('\n')
          if (a.linkedConstraintIds && a.linkedConstraintIds.length > 0)
            block += `\n    linkedConstraintIds:\n${a.linkedConstraintIds.map((id) => `      - ${escapeYamlString(id)}`).join('\n')}`
          if (a.appliesTo && a.appliesTo.length > 0)
            block += '\n    appliesTo:\n' + a.appliesTo.map((t) => `      - elementType: ${t.elementType}\n        elementId: ${t.elementId}`).join('\n')
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
