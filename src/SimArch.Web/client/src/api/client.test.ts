import { afterEach, describe, expect, it, vi } from 'vitest'
import { runSimulation, simulationCompare } from './client'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('API client', () => {
  it('posts simulation parameters as JSON', async () => {
    const response = { success: true, serviceMetrics: [] }
    const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(response) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(runSimulation({ yaml: 'services: []', rate: 100, seed: 7 })).resolves.toEqual(response)

    expect(fetchMock).toHaveBeenCalledWith('/api/simulation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml: 'services: []', rate: 100, seed: 7 }),
    })
  })

  it('supplies deterministic defaults for scenario comparison', async () => {
    const response = { success: true }
    const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(response) })
    vi.stubGlobal('fetch', fetchMock)

    await simulationCompare({ yaml: 'services: []' })

    expect(fetchMock).toHaveBeenCalledWith('/api/simulation/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        yaml: 'services: []',
        scenarioA: { durationSec: 5, rate: 50, failureRate: 0, seed: 42 },
        scenarioB: { durationSec: 5, rate: 100, failureRate: 0, seed: 43 },
      }),
    })
  })
})
