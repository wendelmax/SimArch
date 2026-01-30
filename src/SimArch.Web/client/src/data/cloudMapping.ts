import { cloudCatalog, type CloudProvider } from './cloudCatalog'

const CLOUD_PROVIDERS: CloudProvider[] = ['aws', 'azure', 'gcp', 'oracle']

function firstByCategory(provider: CloudProvider, category: string) {
  const list = cloudCatalog[provider]
  const found = list.find((c) => c.category === category)
  return found ?? list[0]
}

export function mapComponentToCloud(
  _componentId: string,
  category: string,
  targetCloud: CloudProvider
): { id: string; name: string; provider: CloudProvider } {
  if (targetCloud === 'generic') {
    const gen = cloudCatalog.generic.find((c) => c.category === category) ?? cloudCatalog.generic[0]
    return { id: gen.id, name: gen.name, provider: 'generic' }
  }
  const comp = firstByCategory(targetCloud, category)
  return { id: comp.id, name: comp.name, provider: targetCloud }
}

export function getCompareTargetClouds(current: CloudProvider | null): CloudProvider[] {
  if (!current || current === 'generic') return CLOUD_PROVIDERS
  return CLOUD_PROVIDERS.filter((p) => p !== current)
}
