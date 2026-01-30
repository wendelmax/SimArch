import { BsPlayFill, BsStopFill } from 'react-icons/bs'

interface SimulationControlsProps {
    isRunning: boolean
    onRun: () => void
    onStop?: () => void
    status?: string
    error?: string | null
    onDismissError?: () => void
}

export function SimulationControls({
    isRunning,
    onRun,
    onStop,
    status,
    error,
    onDismissError
}: SimulationControlsProps) {
    return (
        <div className="simulation-overlay">
            {error && (
                <div className="sim-error-pill" title={error}>
                    <span className="sim-error-text">{error}</span>
                    {onDismissError && (
                        <button type="button" className="sim-error-dismiss" onClick={onDismissError} aria-label="Fechar">
                            x
                        </button>
                    )}
                </div>
            )}
            {status && <div className="sim-status-pill">{status}</div>}
            <button
                className={`sim-control-btn ${isRunning ? 'stop' : 'play'}`}
                onClick={isRunning ? onStop : onRun}
                title={isRunning ? 'Stop Simulation' : 'Run Simulation'}
            >
                {isRunning ? <BsStopFill /> : <BsPlayFill />}
            </button>
            <div className="sim-info" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>
                {isRunning ? 'Running Simulation...' : 'Ready to Simulate'}
            </div>
        </div>
    )
}
