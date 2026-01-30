export interface SimulationPreset {
  id: string
  name: string
  description: string
  durationSec: number
  rate: number
  failureRate: number
  rampUpSec: number
  seed: number
}

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    description: 'Carga basica para validacao',
    durationSec: 5,
    rate: 50,
    failureRate: 0,
    rampUpSec: 0,
    seed: 42,
  },
  {
    id: 'pico',
    name: 'Pico',
    description: 'Pico de trafego',
    durationSec: 10,
    rate: 200,
    failureRate: 0.05,
    rampUpSec: 2,
    seed: 43,
  },
  {
    id: 'black-friday',
    name: 'Black Friday',
    description: 'Carga extrema com falhas',
    durationSec: 30,
    rate: 500,
    failureRate: 0.1,
    rampUpSec: 5,
    seed: 44,
  },
  {
    id: 'falha-regional',
    name: 'Falha Regional',
    description: 'Simula degradacao de regiao',
    durationSec: 10,
    rate: 50,
    failureRate: 0.2,
    rampUpSec: 0,
    seed: 45,
  },
]
