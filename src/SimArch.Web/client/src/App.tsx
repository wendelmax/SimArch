import { useCallback, useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Canvas, useNodesState, useEdgesState, addEdge } from './components/Canvas'
import { Dashboard } from './components/Dashboard'
import { Palette } from './components/Palette'
import { Layout } from './components/Layout'
import { FlowsView } from './components/FlowsView'
import { PropertyPanel } from './components/PropertyPanel'
import {
  RequirementsRightPanel,
  TraceabilityRightPanel,
  FlowsRightPanel,
  DecisionsRightPanel,
  SimulationRightPanel,
} from './components/rightPanels'
import type { TraceabilityViewMode } from './components/TraceabilityContent'
import { RequirementsPanel } from './components/RequirementsPanel'
import { TraceabilityContent } from './components/TraceabilityContent'
import { AdrPanel } from './components/AdrPanel'
import { ProjectInfoCard } from './components/ProjectInfoCard'
import { CanvasFrame, type LinkedFromInfo } from './components/CanvasFrame'
import { FinOpsSummary } from './components/FinOpsSummary'
import { QualityProfilePanel } from './components/QualityProfilePanel'
import { ConstraintsPanel } from './components/ConstraintsPanel'
import { ProjectSetupModal, type ProjectType } from './components/ProjectSetupModal'
import { CompareCloudModal } from './components/CompareCloudModal'
import { ScenarioCompareModal } from './components/ScenarioCompareModal'
import { SimulationTabContent } from './components/SimulationTabContent'
import { SimulationControls } from './components/SimulationControls'
import { ViewpointToolbar, type ViewpointType } from './components/ViewpointToolbar'
import type { RibbonMainTab } from './components/Ribbon'
import type { CloudComponentDef, CloudProvider } from './data/cloudCatalog'
import { providerLabels } from './data/cloudCatalog'
import type { NodeData, RequirementDef, TraceabilityLinkDef, ParametricConstraintDef, AdrDef } from './utils/diagramToYaml'
import type { Node, Edge, Connection } from '@xyflow/react'
import { diagramToYaml, parseProjectFromYaml, buildAlternateCloudYaml } from './utils/diagramToYaml'
import * as api from './api/client'
import { markdownToPdf } from './utils/markdownToPdf'
import type { ServiceMetricsDto, ConstraintEvaluationDto } from './api/client'
import './App.css'

let nodeId = 1
function createNodeId() {
  return `node-${nodeId++}`
}

const ZONE_PROVIDERS: CloudProvider[] = ['aws', 'azure', 'gcp', 'oracle']
const INITIAL_ZONE_NODES: Node<NodeData>[] = ZONE_PROVIDERS.map((p, i) => ({
  id: `zone-${p}`,
  type: 'zone',
  position: { x: (i % 2) * 440 + 20, y: Math.floor(i / 2) * 320 + 20 },
  data: { label: providerLabels[p], isZone: true, zoneProvider: p } as NodeData,
  style: { width: 400, height: 280 },
}))

function AppInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [dashboardData, setDashboardData] = useState<{
    elapsedSec: number
    serviceMetrics: ServiceMetricsDto[]
    constraintResults: ConstraintEvaluationDto[]
  } | null>(null)
  const [yamlPreview, setYamlPreview] = useState<string | null>(null)
  const [viewMode] = useState<'technical' | 'simple'>('technical')
  const [modelName, setModelName] = useState<string>('Architecture')
  const [projectDescription, setProjectDescription] = useState<string>('')
  const [projectVersion, setProjectVersion] = useState<string>('')
  const [projectParticipants, setProjectParticipants] = useState<string[]>([])
  const [requirements, setRequirements] = useState<RequirementDef[]>([])
  const [traceabilityLinks, setTraceabilityLinks] = useState<TraceabilityLinkDef[]>([])
  const [constraints, setConstraints] = useState<ParametricConstraintDef[]>([])
  const [adrs, setAdrs] = useState<AdrDef[]>([])
  const [activeMainTab, setActiveMainTab] = useState<RibbonMainTab>('architecture')
  const [linkedFrom, setLinkedFrom] = useState<LinkedFromInfo | null>(null)
  const [simulationCostView, setSimulationCostView] = useState(false)
  const [simulationViewMode, setSimulationViewMode] = useState<'dashboard' | 'live'>('dashboard')
  const [simulationOptions, setSimulationOptions] = useState({ durationSec: 5, rate: 50, failureRate: 0, rampUpSec: 0, seed: 42 })
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [simulationError, setSimulationError] = useState<string | null>(null)
  const [projectType, setProjectType] = useState<ProjectType>('single')
  const [primaryCloud, setPrimaryCloud] = useState<CloudProvider | null>('generic')
  const [showProjectSetup, setShowProjectSetup] = useState(false)
  const [selectedZoneForMultiCloud, setSelectedZoneForMultiCloud] = useState<CloudProvider | null>('aws')
  const [showCompareCloud, setShowCompareCloud] = useState(false)
  const [showScenarioCompare, setShowScenarioCompare] = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showBottomPanel, setShowBottomPanel] = useState(true)
  const [rightPanelTab, setRightPanelTab] = useState<'finops' | 'perfil' | 'propriedades' | 'constraints'>('propriedades')
  const [viewpoint, setViewpoint] = useState<ViewpointType>('all')
  const [traceabilityViewMode, setTraceabilityViewMode] = useState<TraceabilityViewMode>('matrix')

  const selectedNode = nodes.find((n) => n.selected) ?? null

  useEffect(() => {
    if (selectedNode) {
      setShowRightPanel(true)
      setRightPanelTab('propriedades')
    }
  }, [selectedNode])
  const elementIds = nodes.filter((n) => n.type === 'cloud' || n.type === 'service').map((n) => n.id)

  const onConnect = useCallback(
    (params: Connection) => {
      if (projectType === 'multicloud' && params.source && params.target) {
        const src = nodes.find((n) => n.id === params.source)
        const tgt = nodes.find((n) => n.id === params.target)
        const srcParent = src?.parentId
        const tgtParent = tgt?.parentId
        if (srcParent && tgtParent && srcParent !== tgtParent) {
          const srcData = src?.data as NodeData
          const tgtData = tgt?.data as NodeData
          const srcBridge = srcData?.isBridge === true
          const tgtBridge = tgtData?.isBridge === true
          if (!srcBridge && !tgtBridge) return
        }
      }
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges, projectType, nodes]
  )

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...(n.data as NodeData), viewMode } as NodeData }))
    )
  }, [viewMode, setNodes])

  const onDropComponent = useCallback(
    (component: CloudComponentDef, position: { x: number; y: number }) => {
      if (component.provider !== 'generic') {
        if (projectType === 'single') {
          if (primaryCloud && component.provider !== primaryCloud) return
        } else {
          const zone = selectedZoneForMultiCloud ?? 'aws'
          if (component.provider !== zone) return
        }
      }
      const id = createNodeId()
      const parentId = projectType === 'multicloud' && selectedZoneForMultiCloud ? `zone-${selectedZoneForMultiCloud}` : undefined
      let pos = position
      if (parentId) {
        const parent = nodes.find((n) => n.id === parentId)
        if (parent && parent.position) {
          pos = { x: position.x - parent.position.x, y: position.y - parent.position.y }
        }
      }
      const newNode: Node<NodeData> = {
        id,
        type: 'cloud',
        position: pos,
        parentId,
        data: {
          label: component.name,
          provider: component.provider,
          componentId: component.id,
          componentName: component.name,
          category: component.category,
          viewMode,
          isBridge: component.isBridge ?? false,
          isTrigger: component.isTrigger ?? false,
        },
      }
      setNodes((nds) => nds.concat(newNode as Node<NodeData>))
    },
    [setNodes, viewMode, projectType, primaryCloud, selectedZoneForMultiCloud, nodes]
  )

  const onUpdateNode = useCallback(
    (nodeId: string, data: Partial<NodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...(n.data as NodeData), ...data } as NodeData } : n
        )
      )
    },
    [setNodes]
  )

  const getYaml = useCallback(
    () =>
      diagramToYaml(nodes, edges, {
        name: modelName,
        description: projectDescription || undefined,
        version: projectVersion || undefined,
        participants: projectParticipants.length > 0 ? projectParticipants : undefined,
        projectType,
        primaryCloud: projectType === 'multicloud' ? undefined : (primaryCloud ?? 'generic'),
        requirements: requirements.length > 0 ? requirements : undefined,
        traceabilityLinks: traceabilityLinks.length > 0 ? traceabilityLinks : undefined,
        constraints: constraints.length > 0 ? constraints : undefined,
        adrs: adrs.length > 0 ? adrs : undefined,
      }),
    [nodes, edges, modelName, projectDescription, projectVersion, projectParticipants, projectType, primaryCloud, requirements, traceabilityLinks, constraints, adrs]
  )

  const handleNew = useCallback(() => {
    setDashboardData(null)
    setYamlPreview(null)
    setModelName('Architecture')
    setRequirements([])
    setTraceabilityLinks([])
    setConstraints([])
    setAdrs([])
    setProjectDescription('')
    setProjectVersion('')
    setProjectParticipants([])
    setShowProjectSetup(true)
  }, [])

  const handleProjectChoose = useCallback(
    (chosenType: ProjectType, chosenCloud: CloudProvider | null) => {
      setProjectType(chosenType)
      setPrimaryCloud(chosenCloud)
      setShowProjectSetup(false)
      setNodes([])
      setEdges([])
      if (chosenType === 'multicloud') {
        setNodes(INITIAL_ZONE_NODES)
        setSelectedZoneForMultiCloud('aws')
      }
    },
    [setNodes, setEdges]
  )

  const handleLoadYaml = useCallback(
    (yaml: string) => {
      setYamlPreview(yaml)
      const { projectType: pt, primaryCloud: pc } = parseProjectFromYaml(yaml)
      setProjectType(pt)
      setPrimaryCloud(pc)
      if (pt === 'multicloud') setSelectedZoneForMultiCloud('aws')
      api.loadModel(yaml).then((res) => {
        if (res.success && res.model?.services) {
          const services = res.model.services as { id: string; name: string; component?: string; costPerHour?: number; costPerMonth?: number; currency?: string; provider?: string }[]
          let newNodes: Node<NodeData>[] = services.map((s, i) => {
            const provider = (s as { provider?: string }).provider as CloudProvider | undefined
            const componentId = s.component ?? 'generic-service'
            const isTrigger = componentId?.startsWith('generic-trigger-') ?? false
            const category = isTrigger ? 'Triggers' : undefined
            const zoneId = pt === 'multicloud' ? `zone-${provider ?? 'aws'}` : undefined
            return {
              id: s.id,
              type: 'cloud',
              position: { x: 50 + (i % 4) * 200, y: 80 + Math.floor(i / 4) * 100 },
              parentId: zoneId,
              data: {
                label: s.name,
                componentName: s.name,
                componentId,
                category,
                isTrigger,
                viewMode,
                provider: ((provider as string) === 'logical' ? 'generic' : (provider as CloudProvider)) ?? (pt === 'single' ? pc ?? 'generic' : 'aws'),
                costPerHour: s.costPerHour,
                costPerMonth: s.costPerMonth,
                currency: s.currency,
              },
            }
          })
          if (pt === 'multicloud') {
            const hasZones = newNodes.some((n) => n.type === 'zone')
            if (!hasZones) newNodes = [...INITIAL_ZONE_NODES, ...newNodes]
          }
          const nodeIds = new Set(newNodes.map((n) => n.id))
          const addMissingNode = (id: string, label: string, componentId: string, isTrigger: boolean) => {
            if (nodeIds.has(id)) return
            const idx = newNodes.length
            const zoneId = pt === 'multicloud' ? `zone-${selectedZoneForMultiCloud ?? 'aws'}` : undefined
            newNodes.push({
              id,
              type: 'cloud',
              position: { x: 50, y: 80 + idx * 60 },
              parentId: zoneId,
              data: {
                label,
                componentName: label,
                componentId,
                category: isTrigger ? 'Triggers' : undefined,
                isTrigger,
                viewMode,
                provider: (pt === 'single' ? pc ?? 'generic' : 'aws') as CloudProvider,
              },
            } as Node<NodeData>)
            nodeIds.add(id)
          }
          const flows = res.model.flows as { steps?: { from: string; to: string; onFailure?: string }[] }[] | undefined
          if (flows?.length) {
            for (const flow of flows) {
              for (const step of flow.steps ?? []) {
                if (step.from === 'User' && !nodeIds.has('User')) addMissingNode('User', 'User Traffic', 'generic-trigger-user', true)
              }
            }
          }
          const newEdges: Edge[] = []
          if (flows?.length) {
            for (const flow of flows) {
              for (const step of flow.steps ?? []) {
                if (step.from && step.to && nodeIds.has(step.from) && nodeIds.has(step.to)) {
                  newEdges.push({
                    id: `e-${step.from}-${step.to}-${Math.random().toString(36).slice(2)}`,
                    source: step.from,
                    target: step.to,
                    sourceHandle: 'out',
                    targetHandle: 'in',
                    type: 'smoothstep',
                  } as Edge)
                }
                if (step.onFailure && step.from && nodeIds.has(step.from) && nodeIds.has(step.onFailure)) {
                  newEdges.push({
                    id: `e-${step.from}-fallback-${step.onFailure}-${Math.random().toString(36).slice(2)}`,
                    source: step.from,
                    target: step.onFailure,
                    sourceHandle: 'fallback',
                    targetHandle: 'in',
                    type: 'smoothstep',
                  } as Edge)
                }
              }
            }
          }
          setNodes(newNodes as Node<NodeData>[])
          setEdges(newEdges)
          setModelName(res.model.name ?? 'Architecture')
          setProjectDescription(res.model.description ?? '')
          setProjectVersion(res.model.version ?? '')
          setProjectParticipants(Array.isArray(res.model.participants) ? res.model.participants : [])
          setRequirements(
            (res.model.requirements ?? []).map((r: { id: string; text: string; priority: string; type: string; standardRef?: string }) => ({
              id: r.id,
              text: r.text,
              priority: r.priority ?? 'medium',
              type: r.type ?? 'functional',
              standardRef: r.standardRef,
            }))
          )
          setTraceabilityLinks(
            (res.model.traceabilityLinks ?? []).map((t: { requirementId: string; linkType: string; elementType: string; elementId: string }) => ({
              requirementId: t.requirementId,
              linkType: t.linkType ?? 'satisfy',
              elementType: t.elementType ?? 'service',
              elementId: t.elementId,
            }))
          )
          setConstraints(
            (res.model.constraints ?? []).map((c: { id: string; metric: string; operator: string; value: number; adrId?: string }) => ({
              id: c.id,
              metric: c.metric,
              operator: c.operator ?? 'lt',
              value: c.value,
              adrId: c.adrId,
            }))
          )
          const validStatuses: AdrDef['status'][] = ['Draft', 'Proposed', 'UnderReview', 'Accepted', 'Rejected', 'Implemented', 'Superseded', 'Deprecated']
          const normStatus = (s: string): AdrDef['status'] => (validStatuses.includes(s as AdrDef['status']) ? (s as AdrDef['status']) : 'Draft')
          setAdrs(
            (res.model.adrs ?? []).map(
              (a: Record<string, unknown>) => ({
                id: (a.id as string) ?? '',
                number: (a.number as number) ?? 0,
                title: (a.title as string) ?? '',
                slug: a.slug as string | undefined,
                template: (a.template as AdrDef['template']) ?? 'simarch',
                status: normStatus((a.status as string) ?? 'Draft'),
                date: a.date as string | undefined,
                owner: a.owner as string | undefined,
                stakeholders: (a.stakeholders as string[]) ?? [],
                proposedBy: a.proposedBy as string | undefined,
                reviewedBy: a.reviewedBy as string | undefined,
                approvedBy: a.approvedBy as string | undefined,
                targetDate: a.targetDate as string | undefined,
                reviewDate: a.reviewDate as string | undefined,
                context: (a.context as string) ?? '',
                decision: (a.decision as string) ?? '',
                consequences: (a.consequences as string) ?? '',
                alternativesConsidered: a.alternativesConsidered as string | undefined,
                options: a.options as AdrDef['options'],
                references: a.references as string | undefined,
                supersededBy: a.supersededBy as string | undefined,
                amendments: a.amendments as AdrDef['amendments'],
                linkedConstraintIds: a.linkedConstraintIds as string[] | undefined,
                appliesTo: a.appliesTo as AdrDef['appliesTo'],
              })
            )
          )
          // Update global nodeId to avoid collisions
          const currentIds = newNodes.map(n => {
            const match = n.id.match(/node-(\d+)/)
            return match ? parseInt(match[1], 10) : 0
          })
          const maxId = Math.max(0, ...currentIds)
          nodeId = maxId + 1
        }
      })
    },
    [setNodes, setEdges, viewMode]
  )

  const handleSaveYaml = useCallback(() => {
    const yaml = getYaml()
    setYamlPreview(yaml)
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'architecture.yaml'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [getYaml])

  const handleRunSimulation = useCallback(() => {
    const yaml = getYaml()
    const serviceNodes = nodes.filter((n) => (n.type === 'cloud' || n.type === 'service') && n.data && !(n.data as NodeData).isZone)
    if (serviceNodes.length === 0) {
      setSimulationError('Adicione ao menos um componente ao diagrama antes de executar a simulacao.')
      return
    }
    setSimulationError(null)
    setDashboardData(null)
    setIsSimulationRunning(true)
    api.runSimulation({
      yaml,
      durationSec: simulationOptions.durationSec ?? 5,
      rate: simulationOptions.rate ?? 50,
      failureRate: simulationOptions.failureRate ?? 0,
      rampUpSec: simulationOptions.rampUpSec ?? 0,
      seed: simulationOptions.seed ?? 42,
    }).then((simRes) => {
      if (!simRes.success) {
        setSimulationError(simRes.error ?? 'Erro ao executar simulacao. Verifique se a API esta rodando.')
        setIsSimulationRunning(false)
        return
      }
      const metrics = simRes.serviceMetrics ?? []
      api
        .evaluateDecision(yaml, undefined, {
          elapsedSec: simRes.elapsed ?? 0,
          serviceMetrics: metrics,
        })
        .then((evalRes) => {
          setDashboardData({
            elapsedSec: simRes.elapsed ?? 0,
            serviceMetrics: metrics,
            constraintResults: evalRes.constraintResults ?? [],
          })
          setIsSimulationRunning(false)
        })
        .catch(() => {
          setDashboardData({
            elapsedSec: simRes.elapsed ?? 0,
            serviceMetrics: metrics,
            constraintResults: [],
          })
          setIsSimulationRunning(false)
        })
    }).catch((err) => {
      setSimulationError(err?.message ?? 'Erro de conexao. Verifique se a API esta rodando (porta 5044).')
      setIsSimulationRunning(false)
    })
  }, [getYaml, nodes, simulationOptions])

  const handleExportAdr = useCallback(() => {
    const yaml = getYaml()
    api.exportAdr(yaml).then(async (res) => {
      if (res.success && res.content) await markdownToPdf(res.content, 'adr.pdf')
    })
  }, [getYaml])

  const handleExportDecisionLog = useCallback(() => {
    const yaml = getYaml()
    api.exportDecisionLog(yaml).then(async (res) => {
      if (res.success && res.content) await markdownToPdf(res.content, 'decision-log.pdf')
    })
  }, [getYaml])

  const handleExportPdf = useCallback(() => {
    const yaml = getYaml()
    api.exportMarkdown(yaml).then(async (res) => {
      if (res.success && res.content) await markdownToPdf(res.content, 'architecture.pdf')
    })
  }, [getYaml])

  const handleExportJson = useCallback(() => {
    const yaml = getYaml()
    api.exportJson(yaml).then((res) => {
      if (res.success && res.content) {
        const blob = new Blob([res.content], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'architecture.json'
        a.click()
        URL.revokeObjectURL(a.href)
      }
    })
  }, [getYaml])

  const handleExportMermaid = useCallback(() => {
    const yaml = getYaml()
    api.exportMermaid(yaml).then((res) => {
      if (res.success && res.content) {
        const blob = new Blob([res.content], { type: 'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'sequence.mmd'
        a.click()
        URL.revokeObjectURL(a.href)
      }
    })
  }, [getYaml])

  const handleValidateConflicts = useCallback(() => {
    const yaml = getYaml()
    api.validateConflicts(yaml).then((res) => {
      if (!res.success) {
        alert(res.error ?? 'Erro ao validar')
        return
      }
      const conflicts = res.conflicts ?? []
      if (conflicts.length === 0) alert('Nenhum conflito entre constraints.')
      else alert(`${conflicts.length} conflito(s) encontrado(s):\n\n${conflicts.map((c: { description?: string }) => c.description ?? JSON.stringify(c)).join('\n')}`)
    })
  }, [getYaml])

  const handleExportConsolidated = useCallback(() => {
    const yaml = getYaml()
    api.exportConsolidated(yaml, { includeSimulationAndDecision: true, durationSec: 5, rate: 50 }).then(async (res) => {
      if (res.success && res.content) await markdownToPdf(res.content, 'relatorio-consolidado.pdf')
    })
  }, [getYaml])

  const handleSelectElement = useCallback(
    (elementId: string) => {
      setLinkedFrom({ tab: 'traceability', label: 'Rastreabilidade' })
      setActiveMainTab('architecture')
      setNodes((nds) =>
        nds.map((n) => ({ ...n, selected: n.id === elementId }))
      )
    },
    [setNodes]
  )

  const goToTab = useCallback((tab: RibbonMainTab) => {
    setActiveMainTab(tab)
    if (tab !== 'architecture') setLinkedFrom(null)
  }, [])

  const handleExportCosts = useCallback(() => {
    const yaml = getYaml()
    api.exportCostsCsv(yaml).then((res) => {
      if (res.success && res.content) {
        const blob = new Blob(['\ufeff' + res.content], { type: 'text/csv;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'custos-finops.csv'
        a.click()
        URL.revokeObjectURL(a.href)
      }
    })
  }, [getYaml])

  const handleDashboardExportConsolidated = useCallback(() => {
    const yaml = getYaml()
    api.exportConsolidated(yaml, { includeSimulationAndDecision: true, durationSec: 5, rate: 50 }).then(async (res) => {
      if (res.success && res.content) await markdownToPdf(res.content, 'relatorio-consolidado.pdf')
    })
  }, [getYaml])

  const handleExport = useCallback((type: string) => {
    switch (type) {
      case 'adr': handleExportAdr(); break
      case 'pdf': handleExportPdf(); break
      case 'json': handleExportJson(); break
      case 'mermaid': handleExportMermaid(); break
      case 'consolidated': handleExportConsolidated(); break
      case 'costs': handleExportCosts(); break
      case 'decision-log': handleExportDecisionLog(); break
    }
  }, [handleExportAdr, handleExportPdf, handleExportJson, handleExportMermaid, handleExportConsolidated, handleExportCosts, handleExportDecisionLog])

  const handleOpen = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yaml,.yml'
    input.onchange = () => {
      const f = input.files?.[0]
      if (f) {
        const reader = new FileReader()
        reader.onload = () => handleLoadYaml((reader.result as string) ?? '')
        reader.readAsText(f)
      }
    }
    input.click()
  }, [handleLoadYaml])

  return (
    <>
      <Layout
        activeTab={activeMainTab}
        onTabChange={goToTab}
        modelName={modelName}
        onNew={handleNew}
        onOpen={handleOpen}
        onLoadExample={handleLoadYaml}
        onSave={handleSaveYaml}
        onExport={handleExport}
        onToggleLeftPanel={() => setShowLeftPanel((v) => !v)}
        showLeftPanel={showLeftPanel}
        onTogglePanel={() => setShowRightPanel((v) => !v)}
        showPanel={showRightPanel}
        onToggleBottomPanel={() => setShowBottomPanel((v) => !v)}
        showBottomPanel={showBottomPanel}
        simulationResult={dashboardData}
        simulationViewMode={simulationViewMode}
      >
        {activeMainTab === 'architecture' && (
          <CanvasFrame
            canvasTab="architecture"
            linkedFrom={linkedFrom}
            onGoToTab={goToTab}
          >
            <Palette
              onDragStart={() => { }}
              projectType={projectType}
              primaryCloud={primaryCloud}
              selectedZone={selectedZoneForMultiCloud}
              onZoneChange={setSelectedZoneForMultiCloud}
            />
            <div className="canvas-area">
              <ViewpointToolbar viewpoint={viewpoint} onViewpointChange={setViewpoint} />
              <Canvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDropComponent={onDropComponent}
                viewpoint={viewpoint}
                projectType={projectType}
                linkedElementIds={[...new Set(traceabilityLinks.map((l) => l.elementId))]}
              />
            </div>
            <SimulationControls
              isRunning={isSimulationRunning}
              onRun={handleRunSimulation}
              onStop={() => setIsSimulationRunning(false)}
              status={dashboardData ? 'Simulacao concluida' : undefined}
              error={simulationError}
              onDismissError={() => setSimulationError(null)}
            />
            {showRightPanel && (
              <div className="right-panel right-panel-architecture">
                <div className="right-panel-actions-row">
                  <button
                    type="button"
                    className="toolbar-btn right-panel-action-btn"
                    onClick={handleValidateConflicts}
                    title="Validar conflitos entre constraints"
                  >
                    Validar conflitos
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn right-panel-action-btn"
                    onClick={() => setShowCompareCloud(true)}
                    title="Comparar arquitetura em outra nuvem"
                  >
                    Outra nuvem
                  </button>
                </div>
                <div className="right-panel-tabs">
                  <button
                    type="button"
                    className={`right-panel-tab ${rightPanelTab === 'finops' ? 'active' : ''}`}
                    onClick={() => setRightPanelTab('finops')}
                  >
                    FinOps
                  </button>
                  <button
                    type="button"
                    className={`right-panel-tab ${rightPanelTab === 'perfil' ? 'active' : ''}`}
                    onClick={() => setRightPanelTab('perfil')}
                  >
                    Perfil
                  </button>
                  <button
                    type="button"
                    className={`right-panel-tab ${rightPanelTab === 'propriedades' ? 'active' : ''}`}
                    onClick={() => setRightPanelTab('propriedades')}
                  >
                    Propriedades
                  </button>
                  <button
                    type="button"
                    className={`right-panel-tab ${rightPanelTab === 'constraints' ? 'active' : ''}`}
                    onClick={() => setRightPanelTab('constraints')}
                  >
                    Constraints
                  </button>
                </div>
                {rightPanelTab === 'finops' && <FinOpsSummary nodes={nodes} />}
                {rightPanelTab === 'perfil' && <QualityProfilePanel getYaml={getYaml} onError={(msg: string) => alert(msg)} />}
                {rightPanelTab === 'propriedades' && <PropertyPanel selectedNode={selectedNode as Node<NodeData> | null} onUpdate={onUpdateNode} />}
                {rightPanelTab === 'constraints' && <ConstraintsPanel constraints={constraints} onConstraintsChange={setConstraints} adrs={adrs} onAdrsChange={setAdrs} />}
              </div>
            )}
          </CanvasFrame>
        )}
        {activeMainTab === 'requirements' && (
          <CanvasFrame canvasTab="requirements" onGoToTab={goToTab}>
            <div className="canvas-view canvas-view-with-panel">
              <RequirementsPanel
                requirements={requirements}
                traceabilityLinks={traceabilityLinks}
                onRequirementsChange={setRequirements}
                onTraceabilityLinksChange={setTraceabilityLinks}
                elementIds={elementIds}
              />
            </div>
            {showRightPanel && (
              <div className="right-panel right-panel-requirements">
                <RequirementsRightPanel
                  requirements={requirements}
                  traceabilityLinks={traceabilityLinks}
                  elementIds={elementIds}
                />
              </div>
            )}
          </CanvasFrame>
        )}
        {activeMainTab === 'traceability' && (
          <CanvasFrame canvasTab="traceability" onGoToTab={goToTab}>
            <div className="canvas-view canvas-view-with-panel">
              <TraceabilityContent
                requirements={requirements}
                traceabilityLinks={traceabilityLinks}
                adrs={adrs}
                onSelectElement={handleSelectElement}
                viewMode={traceabilityViewMode}
                onViewModeChange={setTraceabilityViewMode}
              />
            </div>
            {showRightPanel && (
              <div className="right-panel right-panel-traceability">
                <TraceabilityRightPanel
                  requirements={requirements}
                  traceabilityLinks={traceabilityLinks}
                  viewMode={traceabilityViewMode}
                  onViewModeChange={setTraceabilityViewMode}
                />
              </div>
            )}
          </CanvasFrame>
        )}
        {activeMainTab === 'flows' && (
          <CanvasFrame canvasTab="flows" onGoToTab={goToTab}>
            <div className="canvas-view canvas-view-with-panel">
              <FlowsView getYaml={getYaml} onExportMermaid={handleExportMermaid} />
            </div>
            {showRightPanel && (
              <div className="right-panel right-panel-flows">
                <FlowsRightPanel
                  onExportMermaid={handleExportMermaid}
                />
              </div>
            )}
          </CanvasFrame>
        )}
        {activeMainTab === 'decisions' && (
          <CanvasFrame canvasTab="decisions" onGoToTab={goToTab}>
            <div className="canvas-view canvas-view-decisions canvas-view-with-panel">
              <ProjectInfoCard
                modelName={modelName}
                onModelNameChange={setModelName}
                description={projectDescription}
                onDescriptionChange={setProjectDescription}
                version={projectVersion}
                onVersionChange={setProjectVersion}
                participants={projectParticipants}
                onParticipantsChange={setProjectParticipants}
              />
              <AdrPanel
                adrs={adrs}
                onAdrsChange={setAdrs}
                onExportDecisionLog={handleExportDecisionLog}
                serviceIds={elementIds}
                flowIds={['main']}
                constraints={constraints}
                onConstraintsChange={setConstraints}
              />
            </div>
            {showRightPanel && (
              <div className="right-panel right-panel-decisions">
                <DecisionsRightPanel
                  adrs={adrs}
                  onExportDecisionLog={handleExportDecisionLog}
                />
              </div>
            )}
          </CanvasFrame>
        )}
        {activeMainTab === 'simulation' && (
          <CanvasFrame canvasTab="simulation" onGoToTab={goToTab}>
            <div className="canvas-view canvas-view-with-panel">
              <SimulationTabContent
                viewMode={simulationViewMode}
                onViewModeChange={setSimulationViewMode}
                result={dashboardData}
                onClearResult={() => { setDashboardData(null); setSimulationError(null) }}
                nodes={nodes}
                edges={edges}
                onRunSimulation={handleRunSimulation}
                onExportConsolidated={handleDashboardExportConsolidated}
                isRunning={isSimulationRunning}
                costView={simulationCostView}
                onCostViewChange={setSimulationCostView}
                error={simulationError}
                onDismissError={() => setSimulationError(null)}
                hideToolbar={showRightPanel}
              />
            </div>
            {showRightPanel && (
              <div className="right-panel right-panel-simulation">
                <SimulationRightPanel
                  viewMode={simulationViewMode}
                  onViewModeChange={setSimulationViewMode}
                  onRunSimulation={handleRunSimulation}
                  isRunning={isSimulationRunning}
                  costView={simulationCostView}
                  onCostViewChange={setSimulationCostView}
                  simulationOptions={simulationOptions}
                  onSimulationOptionsChange={(opts) => setSimulationOptions((prev) => ({ ...prev, ...opts }))}
                  onCompareScenarios={() => setShowScenarioCompare(true)}
                  onCompareCloud={() => setShowCompareCloud(true)}
                />
              </div>
            )}
          </CanvasFrame>
        )}
      </Layout>
      {
        dashboardData && activeMainTab !== 'simulation' && (
          <Dashboard
            elapsedSec={dashboardData.elapsedSec}
            serviceMetrics={dashboardData.serviceMetrics}
            constraintResults={dashboardData.constraintResults}
            onClose={() => setDashboardData(null)}
            onExportConsolidated={handleDashboardExportConsolidated}
            costNodes={nodes}
            showCostView={simulationCostView}
          />
        )
      }
      {
        yamlPreview && (
          <div className="yaml-preview-panel">
            <pre>{yamlPreview}</pre>
          </div>
        )
      }
      {
        showProjectSetup && (
          <ProjectSetupModal onChoose={handleProjectChoose} />
        )
      }
      {
        showScenarioCompare && (
          <ScenarioCompareModal getYaml={getYaml} onClose={() => setShowScenarioCompare(false)} />
        )}
      {
        showCompareCloud && (
          <CompareCloudModal
            primaryCloud={primaryCloud}
            getYaml={getYaml}
            getAlternateYaml={(targetCloud) =>
              buildAlternateCloudYaml(
                nodes,
                edges,
                {
                  name: modelName,
                  projectType: 'single',
                  primaryCloud: primaryCloud ?? 'generic',
                  requirements: requirements.length > 0 ? requirements : undefined,
                  traceabilityLinks: traceabilityLinks.length > 0 ? traceabilityLinks : undefined,
                  constraints: constraints.length > 0 ? constraints : undefined,
                  adrs: adrs.length > 0 ? adrs : undefined,
                  description: projectDescription || undefined,
                  version: projectVersion || undefined,
                  participants: projectParticipants.length > 0 ? projectParticipants : undefined,
                },
                targetCloud
              )
            }
            nodes={nodes}
            onClose={() => setShowCompareCloud(false)}
          />
        )
      }
    </>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  )
}
