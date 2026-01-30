import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { RequirementDef, TraceabilityLinkDef } from '../utils/diagramToYaml'

type TraceabilityNodeData = {
  label: string
  sublabel?: string
  kind: 'requirement' | 'element'
  [key: string]: unknown
}

function TraceabilityReqNode({ data }: { data: TraceabilityNodeData }) {
  return (
    <div className="traceability-graph-node traceability-graph-node-req">
      <Handle type="target" position={Position.Left} className="traceability-graph-handle" />
      <div className="traceability-graph-node-label">{data.label}</div>
      {data.sublabel && <div className="traceability-graph-node-sublabel">{data.sublabel}</div>}
      <Handle type="source" position={Position.Right} className="traceability-graph-handle" />
    </div>
  )
}

function TraceabilityElemNode({ data }: { data: TraceabilityNodeData }) {
  return (
    <div className="traceability-graph-node traceability-graph-node-elem">
      <Handle type="target" position={Position.Left} className="traceability-graph-handle" />
      <div className="traceability-graph-node-label">{data.label}</div>
      {data.sublabel && <div className="traceability-graph-node-sublabel">{data.sublabel}</div>}
      <Handle type="source" position={Position.Right} className="traceability-graph-handle" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  'trace-req': TraceabilityReqNode,
  'trace-elem': TraceabilityElemNode,
}

interface TraceabilityGraphViewProps {
  requirements: RequirementDef[]
  traceabilityLinks: TraceabilityLinkDef[]
  onSelectElement?: (elementId: string) => void
}

function buildGraph(
  requirements: RequirementDef[],
  traceabilityLinks: TraceabilityLinkDef[]
): { nodes: Node<TraceabilityNodeData>[]; edges: Edge[] } {
  const reqMap = new Map(requirements.map((r) => [r.id, r]))
  const elemIds = [...new Set(traceabilityLinks.map((l) => l.elementId))]
  const nodes: Node<TraceabilityNodeData>[] = []
  const edges: Edge[] = []

  const SPACING_Y = 70
  const LEFT_X = 80
  const RIGHT_X = 400

  requirements.forEach((r, i) => {
    nodes.push({
      id: `req-${r.id}`,
      type: 'trace-req',
      position: { x: LEFT_X, y: 40 + i * SPACING_Y },
      data: {
        label: r.id,
        sublabel: r.text.length > 40 ? r.text.slice(0, 40) + '...' : r.text,
        kind: 'requirement',
      },
    })
  })

  elemIds.forEach((eid, i) => {
    nodes.push({
      id: `elem-${eid}`,
      type: 'trace-elem',
      position: { x: RIGHT_X, y: 40 + i * SPACING_Y },
      data: {
        label: eid,
        sublabel: 'elemento',
        kind: 'element',
      },
    })
  })

  traceabilityLinks.forEach((link, idx) => {
    const from = `req-${link.requirementId}`
    const to = `elem-${link.elementId}`
    if (reqMap.has(link.requirementId) && elemIds.includes(link.elementId)) {
      edges.push({
        id: `edge-${link.requirementId}-${link.elementId}-${link.linkType}-${idx}`,
        source: from,
        target: to,
        label: link.linkType,
        type: 'smoothstep',
        labelStyle: { fill: 'var(--text-muted)', fontSize: 10 },
      })
    }
  })

  return { nodes, edges }
}

export function TraceabilityGraphView({
  requirements,
  traceabilityLinks,
}: TraceabilityGraphViewProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(requirements, traceabilityLinks),
    [requirements, traceabilityLinks]
  )

  const hasData = requirements.length > 0 || traceabilityLinks.length > 0

  if (!hasData) {
    return (
      <div className="traceability-graph-empty">
        Nenhum requisito ou vinculo. Use o painel Requisitos ou carregue um YAML.
      </div>
    )
  }

  return (
    <div className="traceability-graph-wrap">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="traceability-graph-minimap"
        />
      </ReactFlow>
    </div>
  )
}
