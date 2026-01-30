import type { IconType } from 'react-icons'
import {
  FaCloud,
  FaServer,
  FaDatabase,
  FaLayerGroup,
  FaBolt,
  FaStream,
  FaCogs,
  FaExchangeAlt,
  FaNetworkWired,
  FaShieldAlt,
  FaGlobe,
  FaMicrosoft,
  FaUsers,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa'
import {
  SiAmazonwebservices,
  SiAmazonec2,
  SiAmazondynamodb,
  SiAmazons3,
  SiAmazonsqs,
  SiAmazonrds,
  SiGooglecloud,
  SiGooglecloudstorage,
  SiGooglebigquery,
  SiGooglepubsub,
  SiOracle,
} from 'react-icons/si'
import type { CloudProvider } from './cloudCatalog'

const PROVIDER_ICONS: Record<CloudProvider, IconType> = {
  generic: FaCloud,
  aws: SiAmazonwebservices,
  azure: FaMicrosoft,
  gcp: SiGooglecloud,
  oracle: SiOracle,
}

const CATEGORY_ICONS: Record<string, IconType> = {
  Triggers: FaUsers,
  Compute: FaServer,
  Containers: FaCogs,
  API: FaExchangeAlt,
  Network: FaNetworkWired,
  Storage: FaLayerGroup,
  Database: FaDatabase,
  Cache: FaBolt,
  Messaging: FaStream,
  Events: FaStream,
  CDN: FaGlobe,
  Security: FaShieldAlt,
}

const TRIGGER_ICONS: Record<string, IconType> = {
  'generic-trigger-user': FaUsers,
  'generic-trigger-scheduler': FaClock,
  'generic-trigger-webhook': FaExchangeAlt,
  'generic-trigger-events': FaStream,
  'generic-trigger-error': FaExclamationTriangle,
}

const COMPONENT_ICONS: Record<string, IconType> = {
  'aws-ec2': SiAmazonec2,
  'aws-dynamodb': SiAmazondynamodb,
  'aws-s3': SiAmazons3,
  'aws-sqs': SiAmazonsqs,
  'aws-rds': SiAmazonrds,
  'gcp-storage': SiGooglecloudstorage,
  'gcp-bigquery': SiGooglebigquery,
  'gcp-pubsub': SiGooglepubsub,
}

export function getProviderIcon(provider: CloudProvider): IconType {
  return PROVIDER_ICONS[provider] ?? FaCloud
}

export function getCategoryIcon(category: string): IconType {
  return CATEGORY_ICONS[category] ?? FaCloud
}

export function getComponentIcon(componentId?: string, category?: string): IconType {
  if (componentId && TRIGGER_ICONS[componentId]) return TRIGGER_ICONS[componentId]
  if (componentId && COMPONENT_ICONS[componentId]) return COMPONENT_ICONS[componentId]
  if (category && CATEGORY_ICONS[category]) return CATEGORY_ICONS[category]
  return FaCloud
}

interface ProviderIconProps {
  provider: CloudProvider
  size?: number
  className?: string
  title?: string
}

export function ProviderIcon({ provider, size = 20, className = '', title }: ProviderIconProps) {
  const Icon = getProviderIcon(provider)
  return <Icon size={size} className={className} title={title} />
}

interface ComponentIconProps {
  componentId?: string
  category?: string
  provider?: CloudProvider
  size?: number
  className?: string
  showProviderBadge?: boolean
}

export function ComponentIcon({
  componentId,
  category,
  provider,
  size = 20,
  className = '',
  showProviderBadge = false,
}: ComponentIconProps) {
  const Icon = getComponentIcon(componentId, category)
  const ProviderIconComp = provider ? getProviderIcon(provider) : null
  return (
    <span className={`component-icon-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon size={size} className="component-icon-main" />
      {showProviderBadge && ProviderIconComp && (
        <ProviderIconComp size={Math.round(size * 0.6)} className="component-icon-badge" />
      )}
    </span>
  )
}
