import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SimulationControls } from './SimulationControls'

describe('SimulationControls', () => {
  it('starts a simulation when idle', () => {
    const onRun = vi.fn()
    render(<SimulationControls isRunning={false} onRun={onRun} />)

    const button = screen.getByRole('button', { name: 'Run Simulation' })
    expect(screen.getByText('Ready to Simulate')).toBeInTheDocument()

    fireEvent.click(button)

    expect(onRun).toHaveBeenCalledOnce()
  })

  it('stops a running simulation and displays status', () => {
    const onStop = vi.fn()
    render(<SimulationControls isRunning onRun={vi.fn()} onStop={onStop} status="Running" />)

    fireEvent.click(screen.getByRole('button', { name: 'Stop Simulation' }))

    expect(onStop).toHaveBeenCalledOnce()
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Running Simulation...')).toBeInTheDocument()
  })

  it('allows dismissing a simulation error', () => {
    const onDismissError = vi.fn()
    render(
      <SimulationControls
        isRunning={false}
        onRun={vi.fn()}
        error="Não foi possível executar"
        onDismissError={onDismissError}
      />
    )

    expect(screen.getByText('Não foi possível executar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onDismissError).toHaveBeenCalledOnce()
  })
})
