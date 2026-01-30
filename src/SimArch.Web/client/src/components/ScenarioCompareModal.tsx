import { useState, useCallback } from 'react'
import * as api from '../api/client'
import type { SimulationScenarioOptions, SimulationCompareResponse } from '../api/client'

interface ScenarioCompareModalProps {
  getYaml: () => string
  onClose: () => void
}

const DEFAULT_A: SimulationScenarioOptions = { durationSec: 5, rate: 50, failureRate: 0, seed: 42 }
const DEFAULT_B: SimulationScenarioOptions = { durationSec: 5, rate: 100, failureRate: 0, seed: 43 }

function ScenarioConfig({
  label,
  durationSec,
  rate,
  failureRate,
  seed,
  onDurationSec,
  onRate,
  onFailureRate,
  onSeed,
  disabled,
}: {
  label: string
  durationSec: number
  rate: number
  failureRate: number
  seed: number
  onDurationSec: (v: number) => void
  onRate: (v: number) => void
  onFailureRate: (v: number) => void
  onSeed: (v: number) => void
  disabled: boolean
}) {
  return (
    <div className="scenario-compare-config">
      <h4 className="scenario-compare-config-title">{label}</h4>
      <div className="scenario-compare-config-grid">
        <div className="scenario-compare-field">
          <label>Duracao (s)</label>
          <input
            type="number"
            min={1}
            max={300}
            value={durationSec}
            onChange={(e) => onDurationSec(Number(e.target.value) || 5)}
            disabled={disabled}
          />
        </div>
        <div className="scenario-compare-field">
          <label>Taxa (req/s)</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={rate}
            onChange={(e) => onRate(Number(e.target.value) || 50)}
            disabled={disabled}
          />
        </div>
        <div className="scenario-compare-field">
          <label>Taxa falha (0-1)</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={failureRate}
            onChange={(e) => onFailureRate(Number(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
        <div className="scenario-compare-field">
          <label>Seed</label>
          <input
            type="number"
            min={0}
            value={seed}
            onChange={(e) => onSeed(Number(e.target.value) || 42)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

export function ScenarioCompareModal({ getYaml, onClose }: ScenarioCompareModalProps) {
  const [scenarioA, setScenarioA] = useState<SimulationScenarioOptions>(DEFAULT_A)
  const [scenarioB, setScenarioB] = useState<SimulationScenarioOptions>(DEFAULT_B)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationCompareResponse | null>(null)

  const runCompare = useCallback(async () => {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await api.simulationCompare({
        yaml: getYaml(),
        scenarioA: { ...DEFAULT_A, ...scenarioA },
        scenarioB: { ...DEFAULT_B, ...scenarioB },
      })
      if (!res.success) {
        setError(res.error ?? 'Erro ao comparar cenarios')
        return
      }
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao comparar')
    } finally {
      setLoading(false)
    }
  }, [getYaml, scenarioA, scenarioB])

  const updateA = useCallback(
    (upd: Partial<SimulationScenarioOptions>) =>
      setScenarioA((s) => ({ ...s, ...upd })),
    []
  )
  const updateB = useCallback(
    (upd: Partial<SimulationScenarioOptions>) =>
      setScenarioB((s) => ({ ...s, ...upd })),
    []
  )

  return (
    <div className="project-setup-overlay">
      <div className="scenario-compare-modal">
        <h2 className="project-setup-title">Comparativo de cenarios A vs B</h2>
        <p className="project-setup-desc">
          Mesmo YAML, cenarios diferentes (duracao, taxa, taxa de falha, seed). Executa duas simulacoes e exibe metricas lado a lado.
        </p>
        <div className="scenario-compare-configs">
          <ScenarioConfig
            label="Cenario A"
            durationSec={scenarioA.durationSec ?? 5}
            rate={scenarioA.rate ?? 50}
            failureRate={scenarioA.failureRate ?? 0}
            seed={scenarioA.seed ?? 42}
            onDurationSec={(v) => updateA({ durationSec: v })}
            onRate={(v) => updateA({ rate: v })}
            onFailureRate={(v) => updateA({ failureRate: v })}
            onSeed={(v) => updateA({ seed: v })}
            disabled={loading}
          />
          <ScenarioConfig
            label="Cenario B"
            durationSec={scenarioB.durationSec ?? 5}
            rate={scenarioB.rate ?? 100}
            failureRate={scenarioB.failureRate ?? 0}
            seed={scenarioB.seed ?? 43}
            onDurationSec={(v) => updateB({ durationSec: v })}
            onRate={(v) => updateB({ rate: v })}
            onFailureRate={(v) => updateB({ failureRate: v })}
            onSeed={(v) => updateB({ seed: v })}
            disabled={loading}
          />
        </div>
        {error && <div className="compare-cloud-error">{error}</div>}
        <div className="project-setup-actions">
          <button type="button" className="toolbar-btn" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="toolbar-btn primary" onClick={runCompare} disabled={loading}>
            {loading ? 'Executando...' : 'Comparar cenarios'}
          </button>
        </div>
        {result?.success && result.scenarioA && result.scenarioB && result.comparison && (
          <div className="compare-cloud-results scenario-compare-results">
            <h3 className="compare-cloud-results-title">Resultados</h3>
            <div className="compare-cloud-columns">
              <div className="compare-cloud-column">
                <h4 className="compare-cloud-column-title">Cenario A</h4>
                <span className="compare-cloud-meta">
                  Duracao: {result.scenarioA.elapsed.toFixed(1)}s | Rate: {scenarioA.rate ?? 50}/s
                </span>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Servico</th>
                      <th>Req</th>
                      <th>Falhas</th>
                      <th>Lat. media</th>
                      <th>P95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.scenarioA.serviceMetrics.map((m) => (
                      <tr key={m.serviceId}>
                        <td>{m.serviceId}</td>
                        <td>{m.requestCount}</td>
                        <td>{m.failureCount}</td>
                        <td>{m.avgLatencyMs.toFixed(1)}</td>
                        <td>{m.p95LatencyMs.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="compare-cloud-column">
                <h4 className="compare-cloud-column-title">Cenario B</h4>
                <span className="compare-cloud-meta">
                  Duracao: {result.scenarioB.elapsed.toFixed(1)}s | Rate: {scenarioB.rate ?? 100}/s
                </span>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Servico</th>
                      <th>Req</th>
                      <th>Falhas</th>
                      <th>Lat. media</th>
                      <th>P95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.scenarioB.serviceMetrics.map((m) => (
                      <tr key={m.serviceId}>
                        <td>{m.serviceId}</td>
                        <td>{m.requestCount}</td>
                        <td>{m.failureCount}</td>
                        <td>{m.avgLatencyMs.toFixed(1)}</td>
                        <td>{m.p95LatencyMs.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="scenario-compare-diff">
              <h4 className="scenario-compare-diff-title">Diferenca por servico</h4>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Servico</th>
                    <th>Lat. media A</th>
                    <th>Lat. media B</th>
                    <th>P95 A</th>
                    <th>P95 B</th>
                    <th>Falhas A</th>
                    <th>Falhas B</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((c) => (
                    <tr key={c.serviceId}>
                      <td>{c.serviceId}</td>
                      <td>{c.avgLatencyA != null ? c.avgLatencyA.toFixed(1) : '-'}</td>
                      <td>{c.avgLatencyB != null ? c.avgLatencyB.toFixed(1) : '-'}</td>
                      <td>{c.p95A != null ? c.p95A.toFixed(1) : '-'}</td>
                      <td>{c.p95B != null ? c.p95B.toFixed(1) : '-'}</td>
                      <td>{c.failureCountA ?? '-'}</td>
                      <td>{c.failureCountB ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
