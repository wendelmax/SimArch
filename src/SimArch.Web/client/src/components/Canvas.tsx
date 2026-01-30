import { useCallback, useRef, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { CloudNode } from './CloudNode'
import { ZoneNode } from './ZoneNode'
import type { CloudComponentDef } from '../data/cloudCatalog'
import type { NodeData } from '../utils/diagramToYaml'

const nodeTypes: NodeTypes = { cloud: CloudNode, zone: ZoneNode }

function FlowPositionRef({ setScreenToFlow }: { setScreenToFlow: (fn: (p: { x: number; y: number }) => { x: number; y: number }) => void }) {
  const { screenToFlowPosition } = useReactFlow()
  useEffect(() => {
    setScreenToFlow(screenToFlowPosition)
  }, [screenToFlowPosition, setScreenToFlow])
  return null
}

export type ViewpointType = 'all' | 'services' | 'flows' | 'requirements' | 'constraints'

interface CanvasProps {
  nodes: Node<NodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange<Node<NodeData>>
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  onDropComponent: (component: CloudComponentDef, position: { x: number; y: number }) => void
  viewpoint?: ViewpointType
  projectType?: 'single' | 'multicloud'
  linkedElementIds?: string[]
}

export function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDropComponent,
  viewpoint = 'all',
  projectType = 'single',
  linkedElementIds = [],
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const screenToFlowRef = useRef<((p: { x: number; y: number }) => { x: number; y: number }) | null>(null)

  const { filteredNodes, filteredEdges, edgeOptions } = useMemo(() => {
    const linkedSet = new Set(linkedElementIds)
    let outNodes = [...nodes]
    let outEdges = edges.map((e) => ({ ...e, className: '' }))

    if (viewpoint === 'services' && projectType === 'multicloud') {
      outNodes = nodes.map((n) =>
        n.type === 'zone'
          ? { ...n, style: { ...n.style, opacity: 0.35 } }
          : n
      )
    } else if (viewpoint === 'flows') {
      outEdges = edges.map((e) => ({ ...e, className: 'viewpoint-flows-edge' }))
    } else if (viewpoint === 'requirements') {
      outNodes = nodes.map((n) => {
        if (n.type === 'zone') return n
        const inLinked = linkedSet.has(n.id)
        return { ...n, style: { ...n.style, opacity: inLinked ? 1 : 0.35 } }
      })
    } else if (viewpoint === 'constraints') {
    }

    return {
      filteredNodes: outNodes,
      filteredEdges: outEdges,
      edgeOptions: viewpoint === 'flows'
        ? { type: 'smoothstep' as const, animated: true, style: { strokeWidth: 3, stroke: 'var(--accent-primary)' } }
        : { type: 'smoothstep' as const, animated: true },
    }
  }, [nodes, edges, viewpoint, projectType, linkedElementIds])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const data = e.dataTransfer.getData('application/simarch-component')
      if (!data) return
      try {
        const component = JSON.parse(data) as CloudComponentDef
        const position = screenToFlowRef.current
          ? screenToFlowRef.current({ x: e.clientX, y: e.clientY })
          : { x: e.clientX - 200, y: e.clientY - 100 }
        onDropComponent(component, position)
      } catch {
        // ignore
      }
    },
    [onDropComponent]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div ref={wrapperRef} className="canvas-wrapper">
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        connectionLineStyle={{ stroke: '#64748b' }}
        defaultEdgeOptions={edgeOptions}
        proOptions={{ hideAttribution: true }}
      >
        <FlowPositionRef setScreenToFlow={(fn) => { screenToFlowRef.current = fn }} />
        <Background gap={16} size={1} color="#334155" />
        <Controls className="canvas-controls" />
        <MiniMap className="canvas-minimap" nodeColor="#475569" maskColor="rgba(15,23,42,0.8)" />
        <Panel position="bottom-left" className="canvas-hint">
          Arraste componentes da paleta para o canvas. Conecte nos pelas alcas.
        </Panel>
      </ReactFlow>
    </div>
  )
}

export { useNodesState, useEdgesState, addEdge }
