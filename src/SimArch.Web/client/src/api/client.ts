const API = '/api'

export async function loadModel(yaml: string) {
  const r = await fetch(`${API}/model/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export async function runSimulation(params: {
  yaml: string
  durationSec?: number
  rate?: number
  failureRate?: number
  rampUpSec?: number
  seed?: number
}) {
  const r = await fetch(`${API}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return r.json()
}

export interface SimulationScenarioOptions {
  durationSec?: number
  rate?: number
  failureRate?: number
  rampUpSec?: number
  seed?: number
}

export interface SimulationCompareResponse {
  success: boolean
  error?: string
  scenarioA?: { elapsed: number; serviceMetrics: Array<{ serviceId: string; requestCount: number; failureCount: number; avgLatencyMs: number; p95LatencyMs: number }> }
  scenarioB?: { elapsed: number; serviceMetrics: Array<{ serviceId: string; requestCount: number; failureCount: number; avgLatencyMs: number; p95LatencyMs: number }> }
  comparison?: Array<{
    serviceId: string
    avgLatencyA?: number
    avgLatencyB?: number
    p95A?: number
    p95B?: number
    failureCountA?: number
    failureCountB?: number
  }>
}

export async function simulationCompare(params: {
  yaml: string
  scenarioA?: SimulationScenarioOptions
  scenarioB?: SimulationScenarioOptions
}): Promise<SimulationCompareResponse> {
  const r = await fetch(`${API}/simulation/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      yaml: params.yaml,
      scenarioA: params.scenarioA ?? { durationSec: 5, rate: 50, failureRate: 0, seed: 42 },
      scenarioB: params.scenarioB ?? { durationSec: 5, rate: 100, failureRate: 0, seed: 43 },
    }),
  })
  return r.json()
}

export async function runSimulationCompare(params: {
  yamlA: string
  yamlB: string
  durationSec?: number
  rate?: number
}) {
  const opts = { durationSec: params.durationSec ?? 5, rate: params.rate ?? 50 }
  const [resA, resB] = await Promise.all([
    runSimulation({ yaml: params.yamlA, ...opts }),
    runSimulation({ yaml: params.yamlB, ...opts }),
  ])
  return { resA, resB }
}

export interface ServiceMetricsDto {
  serviceId: string
  requestCount: number
  failureCount: number
  avgLatencyMs: number
  p95LatencyMs: number
}

export interface SimulationResultDto {
  elapsedSec: number
  serviceMetrics: ServiceMetricsDto[]
}

export async function evaluateDecision(
  yaml: string,
  scenario?: string,
  simulationResult?: SimulationResultDto
) {
  const r = await fetch(`${API}/decision/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml, scenario, simulationResult }),
  })
  return r.json()
}

export interface ConstraintEvaluationDto {
  constraintId: string
  metric: string
  operator: string
  expectedValue: number
  actualValue?: number
  passed: boolean
  scope?: string
}

export async function exportMermaid(yaml: string) {
  const r = await fetch(`${API}/export/mermaid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export async function exportTraceabilityGraph(yaml: string) {
  const r = await fetch(`${API}/export/traceability-graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export async function validateConflicts(yaml: string) {
  const r = await fetch(`${API}/validation/conflicts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export interface ServiceQualityIndicatorsDto {
  serviceId: string
  serviceName: string
  hasSla: boolean
  hasTimeout: boolean
  hasCircuitBreaker: boolean
  hasFallback: boolean
  hasRetry: boolean
  hasBulkhead: boolean
  hasQueue: boolean
  hasScaling: boolean
}

export interface QualityProfileDto {
  resilienceDegree: string
  availabilityTargetPercent: number | null
  scalabilityDegree: string
  singlePointsOfFailureCount: number
  singlePointOfFailureServiceIds: string[]
  factorsAffectingSimulation: string[]
  serviceIndicators: ServiceQualityIndicatorsDto[]
  simulationEffectiveAvailabilityPercent: string | null
  simulationAvgLatencyMs: number | null
  simulationFailureRate: number | null
}

export async function qualityProfile(
  yaml: string,
  options?: { runSimulation?: boolean; durationSec?: number; rate?: number; failureRate?: number; seed?: number }
) {
  const r = await fetch(`${API}/quality/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      yaml,
      runSimulation: options?.runSimulation ?? false,
      durationSec: options?.durationSec ?? 5,
      rate: options?.rate ?? 50,
      failureRate: options?.failureRate ?? 0,
      seed: options?.seed ?? 42,
    }),
  })
  return r.json()
}

export async function exportConsolidated(
  yaml: string,
  options?: { includeSimulationAndDecision?: boolean; durationSec?: number; rate?: number }
) {
  const r = await fetch(`${API}/export/consolidated`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      yaml,
      includeSimulationAndDecision: options?.includeSimulationAndDecision ?? false,
      durationSec: options?.durationSec ?? 5,
      rate: options?.rate ?? 50,
    }),
  })
  return r.json()
}

export async function exportAdr(yaml: string) {
  const r = await fetch(`${API}/export/adr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export async function exportDecisionLog(yaml: string) {
  const r = await fetch(`${API}/export/decision-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export async function exportCostsCsv(yaml: string) {
  const r = await fetch(`${API}/export/costs-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export async function exportMarkdown(yaml: string) {
  const r = await fetch(`${API}/export/markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}

export async function exportJson(yaml: string) {
  const r = await fetch(`${API}/export/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  })
  return r.json()
}
