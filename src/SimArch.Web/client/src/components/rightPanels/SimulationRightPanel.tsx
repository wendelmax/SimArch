import type { SimulationViewMode } from '../SimulationTabContent'
import { SIMULATION_PRESETS } from '../../data/simulationPresets'
import type { SimulationScenarioOptions } from '../../api/client'

interface SimulationRightPanelProps {
  viewMode: SimulationViewMode
  onViewModeChange: (mode: SimulationViewMode) => void
  onRunSimulation: () => void
  isRunning: boolean
  costView: boolean
  onCostViewChange: (value: boolean) => void
  simulationOptions: SimulationScenarioOptions
  onSimulationOptionsChange: (opts: Partial<SimulationScenarioOptions>) => void
  onCompareScenarios?: () => void
}

export function SimulationRightPanel({
  viewMode,
  onViewModeChange,
  onRunSimulation,
  isRunning,
  costView,
  onCostViewChange,
  simulationOptions,
  onSimulationOptionsChange,
  onCompareScenarios,
}: SimulationRightPanelProps) {
  return (
    <div className="right-panel-content">
      <div className="property-panel-title">Simulacao</div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Vista</label>
        <div className="right-panel-tabs-compact">
          <button
            type="button"
            className={`right-panel-tab-compact ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => onViewModeChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`right-panel-tab-compact ${viewMode === 'live' ? 'active' : ''}`}
            onClick={() => onViewModeChange('live')}
          >
            Ao vivo
          </button>
        </div>
      </div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Cenario</label>
        <div className="simulation-presets">
          {SIMULATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="simulation-preset-btn"
              title={preset.description}
              onClick={() =>
                onSimulationOptionsChange({
                  durationSec: preset.durationSec,
                  rate: preset.rate,
                  failureRate: preset.failureRate,
                  rampUpSec: preset.rampUpSec,
                  seed: preset.seed,
                })
              }
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Tempo</label>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Duracao (s)</span>
          <input
            type="number"
            min={1}
            max={300}
            value={simulationOptions.durationSec ?? 5}
            onChange={(e) => onSimulationOptionsChange({ durationSec: Math.max(1, Math.min(300, Number(e.target.value))) })}
            className="right-panel-input-num"
          />
        </div>
      </div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Carga</label>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Rate (req/s)</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={simulationOptions.rate ?? 50}
            onChange={(e) => onSimulationOptionsChange({ rate: Math.max(1, Math.min(10000, Number(e.target.value))) })}
            className="right-panel-input-num"
          />
        </div>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Ramp-up (s)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={simulationOptions.rampUpSec ?? 0}
            onChange={(e) => onSimulationOptionsChange({ rampUpSec: Math.max(0, Math.min(60, Number(e.target.value))) })}
            className="right-panel-input-num"
          />
        </div>
      </div>
      <div className="right-panel-section">
        <label className="right-panel-section-label">Falha</label>
        <div className="right-panel-stat-row">
          <span className="right-panel-stat-label">Taxa (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={(simulationOptions.failureRate ?? 0) * 100}
            onChange={(e) => onSimulationOptionsChange({ failureRate: Math.max(0, Math.min(1, Number(e.target.value) / 100)) })}
            className="right-panel-input-num"
          />
        </div>
      </div>
      <div className="right-panel-section">
        <button
          type="button"
          className="toolbar-btn primary right-panel-btn"
          onClick={onRunSimulation}
          disabled={isRunning}
        >
          {isRunning ? 'Executando...' : 'Executar simulacao'}
        </button>
      </div>
      {viewMode === 'dashboard' && (
        <div className="right-panel-section">
          <label className="right-panel-option">
            <input type="checkbox" checked={costView} onChange={(e) => onCostViewChange(e.target.checked)} />
            <span>Vista por custo</span>
          </label>
        </div>
      )}
      {onCompareScenarios && (
        <div className="right-panel-section">
          <button type="button" className="toolbar-btn right-panel-btn" onClick={onCompareScenarios}>
            Comparar cenarios
          </button>
        </div>
      )}
      <div className="right-panel-section">
        <p className="right-panel-hint">
          Duracao: {simulationOptions.durationSec ?? 5}s | Rate: {simulationOptions.rate ?? 50}/s
          {(simulationOptions.rampUpSec ?? 0) > 0 ? ` | Ramp-up: ${simulationOptions.rampUpSec ?? 0}s` : ''}
        </p>
      </div>
    </div>
  )
}
