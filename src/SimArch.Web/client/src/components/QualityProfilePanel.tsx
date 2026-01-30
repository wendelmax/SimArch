import { useCallback, useState } from 'react'
import * as api from '../api/client'
import type { QualityProfileDto } from '../api/client'

interface QualityProfilePanelProps {
  getYaml: () => string
  onError?: (message: string) => void
}

const DEGREE_CLASS: Record<string, string> = {
  Alto: 'degree-high',
  Medio: 'degree-medium',
  Baixo: 'degree-low',
}

export function QualityProfilePanel({ getYaml, onError }: QualityProfilePanelProps) {
  const [profile, setProfile] = useState<QualityProfileDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchProfile = useCallback(
    (runSimulation: boolean) => {
      const yaml = getYaml()
      if (!yaml.trim()) {
        onError?.('Desenhe a arquitetura ou carregue um YAML para ver o perfil de qualidade.')
        return
      }
      setLoading(true)
      api
        .qualityProfile(yaml, {
          runSimulation,
          durationSec: 5,
          rate: 50,
          failureRate: 0.1,
        })
        .then((res) => {
          setLoading(false)
          if (res.success && res.profile) setProfile(res.profile as QualityProfileDto)
          else onError?.(res.error ?? 'Erro ao obter perfil.')
        })
        .catch(() => {
          setLoading(false)
          onError?.('Erro ao obter perfil de qualidade.')
        })
    },
    [getYaml, onError]
  )

  return (
    <div className="quality-profile-panel">
      <div className="quality-profile-title">Metricas de qualidade arquitetural</div>
      <p className="quality-profile-hint">
        Graus e fatores que afetam o algoritmo de simulacao (Circuit Breaker, Fallback, Queue, Bulkhead, Timeout, taxa de falha injetada).
      </p>
      <div className="quality-profile-actions">
        <button
          type="button"
          className="toolbar-btn primary"
          disabled={loading}
          onClick={() => fetchProfile(false)}
        >
          {loading ? '...' : 'Atualizar perfil'}
        </button>
        <button
          type="button"
          className="toolbar-btn"
          disabled={loading}
          onClick={() => fetchProfile(true)}
        >
          {loading ? '...' : 'Perfil + simulacao'}
        </button>
      </div>
      {profile && (
        <div className="quality-profile-content">
          <div className="quality-profile-grid">
            <div className="quality-profile-card">
              <span className="quality-profile-label">Resiliencia</span>
              <span className={`quality-profile-degree ${DEGREE_CLASS[profile.resilienceDegree] ?? ''}`}>
                {profile.resilienceDegree}
              </span>
            </div>
            <div className="quality-profile-card">
              <span className="quality-profile-label">Disponibilidade (meta)</span>
              <span className="quality-profile-value">
                {profile.availabilityTargetPercent != null
                  ? `${profile.availabilityTargetPercent.toFixed(1)}%`
                  : '-'}
              </span>
            </div>
            <div className="quality-profile-card">
              <span className="quality-profile-label">Escalabilidade</span>
              <span className={`quality-profile-degree ${DEGREE_CLASS[profile.scalabilityDegree] ?? ''}`}>
                {profile.scalabilityDegree}
              </span>
            </div>
            <div className="quality-profile-card">
              <span className="quality-profile-label">Pontos unicos de falha</span>
              <span className="quality-profile-value">{profile.singlePointsOfFailureCount}</span>
              {profile.singlePointOfFailureServiceIds.length > 0 && (
                <span className="quality-profile-ids">{profile.singlePointOfFailureServiceIds.join(', ')}</span>
              )}
            </div>
          </div>
          <div className="quality-profile-section">
            <span className="quality-profile-label">Fatores que afetam a simulacao</span>
            <div className="quality-profile-factors">
              {profile.factorsAffectingSimulation.map((f) => (
                <span key={f} className="quality-profile-factor-tag">
                  {f}
                </span>
              ))}
            </div>
          </div>
          {profile.simulationEffectiveAvailabilityPercent != null && (
            <div className="quality-profile-section quality-profile-simulation">
              <span className="quality-profile-label">Apos simulacao (amostra)</span>
              <div className="quality-profile-grid">
                <div className="quality-profile-card">
                  <span className="quality-profile-label">Disponibilidade efetiva</span>
                  <span className="quality-profile-value">{profile.simulationEffectiveAvailabilityPercent}%</span>
                </div>
                <div className="quality-profile-card">
                  <span className="quality-profile-label">Latencia media (ms)</span>
                  <span className="quality-profile-value">
                    {profile.simulationAvgLatencyMs != null ? profile.simulationAvgLatencyMs.toFixed(0) : '-'}
                  </span>
                </div>
                <div className="quality-profile-card">
                  <span className="quality-profile-label">Taxa de falha</span>
                  <span className="quality-profile-value">
                    {profile.simulationFailureRate != null
                      ? `${(profile.simulationFailureRate * 100).toFixed(1)}%`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="quality-profile-section">
            <button
              type="button"
              className="quality-profile-expand"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Ocultar' : 'Ver'} indicadores por servico
            </button>
            {expanded && profile.serviceIndicators.length > 0 && (
              <div className="quality-profile-table-wrap">
                <table className="quality-profile-table">
                  <thead>
                    <tr>
                      <th>Servico</th>
                      <th>SLA</th>
                      <th>Timeout</th>
                      <th>Circuit Breaker</th>
                      <th>Fallback</th>
                      <th>Retry</th>
                      <th>Bulkhead</th>
                      <th>Queue</th>
                      <th>Scaling</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.serviceIndicators.map((s) => (
                      <tr key={s.serviceId}>
                        <td>
                          <span className="quality-profile-svc-name">{s.serviceName}</span>
                        </td>
                        <td>{s.hasSla ? 'Sim' : '-'}</td>
                        <td>{s.hasTimeout ? 'Sim' : '-'}</td>
                        <td>{s.hasCircuitBreaker ? 'Sim' : '-'}</td>
                        <td>{s.hasFallback ? 'Sim' : '-'}</td>
                        <td>{s.hasRetry ? 'Sim' : '-'}</td>
                        <td>{s.hasBulkhead ? 'Sim' : '-'}</td>
                        <td>{s.hasQueue ? 'Sim' : '-'}</td>
                        <td>{s.hasScaling ? 'Sim' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {!profile && !loading && (
        <p className="quality-profile-empty">Clique em Atualizar perfil para ver os graus de qualidade da solucao desenhada.</p>
      )}
    </div>
  )
}
