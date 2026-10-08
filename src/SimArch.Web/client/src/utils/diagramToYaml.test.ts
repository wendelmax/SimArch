import type { Edge, Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import {
  buildAlternateCloudYaml,
  diagramToYaml,
  parseProjectFromYaml,
  type NodeData,
} from './diagramToYaml'

const service = (id: string, data: NodeData): Node<NodeData> => ({
  id,
  type: 'service',
  position: { x: 0, y: 0 },
  data,
})

describe('diagramToYaml', () => {
  it('serializes services, flow edges, fallback edges, and escaped metadata', () => {
    const nodes = [
      service('API Gateway', {
        label: 'Gateway: primary',
        provider: 'aws',
        componentId: 'api-gateway',
        slaMs: 100,
        fallback: 'unused',
        costPerHour: 0.05,
        currency: 'USD',
      }),
      service('payment', { label: 'Payment #1' }),
      service('fallback', { label: 'Fallback' }),
    ]
    const edges: Edge[] = [
      { id: 'flow', source: 'API Gateway', target: 'payment' },
      { id: 'fallback', source: 'API Gateway', target: 'fallback', sourceHandle: 'fallback' },
    ]

    const yaml = diagramToYaml(nodes, edges, {
      name: 'Checkout: "prod"',
      description: 'A #1\ncritical flow',
      participants: ['User', 'Billing: team'],
      requirements: [{ id: 'REQ-1', text: 'P95 < 500ms', priority: 'high', type: 'non-functional' }],
    })

    expect(yaml).toContain('name: "Checkout: \\"prod\\""')
    expect(yaml).toContain('description: "A #1\\ncritical flow"')
    expect(yaml).toContain('id: api-gateway')
    expect(yaml).toContain('provider: aws')
    expect(yaml).toContain('fallback: fallback')
    expect(yaml).toContain('onFailure: fallback')
    expect(yaml).toContain('requirements:')
    expect(yaml).toContain('text: P95 < 500ms')
  })

  it('excludes zones and fallback edges from the regular service flow', () => {
    const nodes = [
      service('zone', { label: 'AWS', isZone: true }),
      service('one', { label: 'One' }),
      service('two', { label: 'Two' }),
    ]
    const edges: Edge[] = [
      { id: 'normal', source: 'one', target: 'two' },
      { id: 'fallback', source: 'one', target: 'two', sourceHandle: 'fallback' },
    ]

    const yaml = diagramToYaml(nodes, edges)

    expect(yaml).not.toContain('id: zone')
    expect(yaml).toContain('id: one')
    expect(yaml).toContain('id: two')
    expect(yaml.match(/- from:/g)).toHaveLength(1)
  })
})

describe('parseProjectFromYaml', () => {
  it('parses single-cloud metadata and defaults missing cloud to generic', () => {
    expect(parseProjectFromYaml('projectType: single\nprimaryCloud: azure')).toEqual({
      projectType: 'single',
      primaryCloud: 'azure',
    })
    expect(parseProjectFromYaml('name: Example')).toEqual({
      projectType: 'single',
      primaryCloud: 'generic',
    })
  })

  it('normalizes multicloud metadata without selecting a primary cloud', () => {
    expect(parseProjectFromYaml('projectType: multicloud\nprimaryCloud: aws')).toEqual({
      projectType: 'multicloud',
      primaryCloud: null,
    })
  })
})

describe('buildAlternateCloudYaml', () => {
  it('maps service components to the selected cloud', () => {
    const yaml = buildAlternateCloudYaml(
      [service('api', { label: 'API', category: 'Compute', componentId: 'generic-service' })],
      [],
      { name: 'Alternate' },
      'aws'
    )

    expect(yaml).toContain('primaryCloud: aws')
    expect(yaml).toContain('provider: aws')
  })
})
