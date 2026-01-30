export type CloudProvider = 'generic' | 'aws' | 'azure' | 'gcp' | 'oracle'

export interface CloudComponentDef {
  id: string
  name: string
  category: string
  provider: CloudProvider
  icon: string
  isBridge?: boolean
  isTrigger?: boolean
}

export const cloudCatalog: Record<CloudProvider, CloudComponentDef[]> = {
  generic: [
    { id: 'generic-trigger-user', name: 'User Traffic', category: 'Triggers', provider: 'generic', icon: 'Users', isTrigger: true },
    { id: 'generic-trigger-scheduler', name: 'Scheduler', category: 'Triggers', provider: 'generic', icon: 'Clock', isTrigger: true },
    { id: 'generic-trigger-webhook', name: 'Webhook', category: 'Triggers', provider: 'generic', icon: 'Webhook', isTrigger: true },
    { id: 'generic-trigger-events', name: 'Event Source', category: 'Triggers', provider: 'generic', icon: 'Events', isTrigger: true },
    { id: 'generic-trigger-error', name: 'Error', category: 'Triggers', provider: 'generic', icon: 'Error', isTrigger: true },
    { id: 'generic-service', name: 'Service', category: 'Compute', provider: 'generic', icon: 'Svc' },
    { id: 'generic-api-gateway', name: 'API Gateway', category: 'API', provider: 'generic', icon: 'API', isBridge: true },
    { id: 'generic-queue', name: 'Queue', category: 'Messaging', provider: 'generic', icon: 'Q', isBridge: true },
    { id: 'generic-database', name: 'Database', category: 'Database', provider: 'generic', icon: 'DB' },
    { id: 'generic-cache', name: 'Cache', category: 'Cache', provider: 'generic', icon: 'Cache' },
    { id: 'generic-event-bus', name: 'Event Bus', category: 'Events', provider: 'generic', icon: 'EB', isBridge: true },
    { id: 'generic-load-balancer', name: 'Load Balancer', category: 'Network', provider: 'generic', icon: 'LB', isBridge: true },
    { id: 'generic-storage', name: 'Storage', category: 'Storage', provider: 'generic', icon: 'Store' },
  ],
  aws: [
    { id: 'aws-ec2', name: 'EC2', category: 'Compute', provider: 'aws', icon: 'EC2' },
    { id: 'aws-lambda', name: 'Lambda', category: 'Compute', provider: 'aws', icon: 'λ' },
    { id: 'aws-step-functions', name: 'Step Functions', category: 'Compute', provider: 'aws', icon: 'SF' },
    { id: 'aws-ecs', name: 'ECS', category: 'Containers', provider: 'aws', icon: 'ECS' },
    { id: 'aws-eks', name: 'EKS', category: 'Containers', provider: 'aws', icon: 'EKS' },
    { id: 'aws-api-gateway', name: 'API Gateway', category: 'API', provider: 'aws', icon: 'API', isBridge: true },
    { id: 'aws-s3', name: 'S3', category: 'Storage', provider: 'aws', icon: 'S3' },
    { id: 'aws-dynamodb', name: 'DynamoDB', category: 'Database', provider: 'aws', icon: 'DDB' },
    { id: 'aws-rds', name: 'RDS', category: 'Database', provider: 'aws', icon: 'RDS' },
    { id: 'aws-elasticache', name: 'ElastiCache', category: 'Cache', provider: 'aws', icon: 'EC' },
    { id: 'aws-sqs', name: 'SQS', category: 'Messaging', provider: 'aws', icon: 'SQS', isBridge: true },
    { id: 'aws-sns', name: 'SNS', category: 'Messaging', provider: 'aws', icon: 'SNS', isBridge: true },
    { id: 'aws-kinesis', name: 'Kinesis', category: 'Messaging', provider: 'aws', icon: 'K', isBridge: true },
    { id: 'aws-cloudfront', name: 'CloudFront', category: 'CDN', provider: 'aws', icon: 'CF', isBridge: true },
    { id: 'aws-eventbridge', name: 'EventBridge', category: 'Events', provider: 'aws', icon: 'EB', isBridge: true },
  ],
  azure: [
    { id: 'azure-vm', name: 'Virtual Machine', category: 'Compute', provider: 'azure', icon: 'VM' },
    { id: 'azure-functions', name: 'Functions', category: 'Compute', provider: 'azure', icon: 'Fn' },
    { id: 'azure-app-service', name: 'App Service', category: 'Compute', provider: 'azure', icon: 'App' },
    { id: 'azure-logic-apps', name: 'Logic Apps', category: 'Compute', provider: 'azure', icon: 'LA' },
    { id: 'azure-aks', name: 'AKS', category: 'Containers', provider: 'azure', icon: 'AKS' },
    { id: 'azure-api-management', name: 'API Management', category: 'API', provider: 'azure', icon: 'APIM', isBridge: true },
    { id: 'azure-key-vault', name: 'Key Vault', category: 'Security', provider: 'azure', icon: 'KV' },
    { id: 'azure-storage', name: 'Storage', category: 'Storage', provider: 'azure', icon: 'Blob' },
    { id: 'azure-cosmos', name: 'Cosmos DB', category: 'Database', provider: 'azure', icon: 'Cosmos' },
    { id: 'azure-sql', name: 'SQL Database', category: 'Database', provider: 'azure', icon: 'SQL' },
    { id: 'azure-service-bus', name: 'Service Bus', category: 'Messaging', provider: 'azure', icon: 'SB', isBridge: true },
    { id: 'azure-event-hub', name: 'Event Hubs', category: 'Events', provider: 'azure', icon: 'EH', isBridge: true },
    { id: 'azure-cdn', name: 'CDN', category: 'CDN', provider: 'azure', icon: 'CDN', isBridge: true },
    { id: 'azure-redis', name: 'Cache for Redis', category: 'Cache', provider: 'azure', icon: 'Redis' },
  ],
  gcp: [
    { id: 'gcp-compute', name: 'Compute Engine', category: 'Compute', provider: 'gcp', icon: 'GCE' },
    { id: 'gcp-cloud-run', name: 'Cloud Run', category: 'Compute', provider: 'gcp', icon: 'Run' },
    { id: 'gcp-functions', name: 'Cloud Functions', category: 'Compute', provider: 'gcp', icon: 'Fn' },
    { id: 'gcp-cloud-tasks', name: 'Cloud Tasks', category: 'Compute', provider: 'gcp', icon: 'Tasks' },
    { id: 'gcp-gke', name: 'GKE', category: 'Containers', provider: 'gcp', icon: 'GKE' },
    { id: 'gcp-api-gateway', name: 'API Gateway', category: 'API', provider: 'gcp', icon: 'API', isBridge: true },
    { id: 'gcp-storage', name: 'Cloud Storage', category: 'Storage', provider: 'gcp', icon: 'GCS' },
    { id: 'gcp-firestore', name: 'Firestore', category: 'Database', provider: 'gcp', icon: 'FS' },
    { id: 'gcp-bigquery', name: 'BigQuery', category: 'Database', provider: 'gcp', icon: 'BQ' },
    { id: 'gcp-pubsub', name: 'Pub/Sub', category: 'Messaging', provider: 'gcp', icon: 'PubSub', isBridge: true },
    { id: 'gcp-eventarc', name: 'Eventarc', category: 'Events', provider: 'gcp', icon: 'EA', isBridge: true },
    { id: 'gcp-cloud-cdn', name: 'Cloud CDN', category: 'CDN', provider: 'gcp', icon: 'CDN', isBridge: true },
    { id: 'gcp-memorystore', name: 'Memorystore', category: 'Cache', provider: 'gcp', icon: 'Redis' },
  ],
  oracle: [
    { id: 'oracle-compute', name: 'Compute', category: 'Compute', provider: 'oracle', icon: 'VM' },
    { id: 'oracle-functions', name: 'Functions', category: 'Compute', provider: 'oracle', icon: 'Fn' },
    { id: 'oracle-oke', name: 'OKE', category: 'Containers', provider: 'oracle', icon: 'OKE' },
    { id: 'oracle-api-gateway', name: 'API Gateway', category: 'API', provider: 'oracle', icon: 'API', isBridge: true },
    { id: 'oracle-object-storage', name: 'Object Storage', category: 'Storage', provider: 'oracle', icon: 'OS' },
    { id: 'oracle-autonomous', name: 'Autonomous DB', category: 'Database', provider: 'oracle', icon: 'ADB' },
    { id: 'oracle-streaming', name: 'Streaming', category: 'Messaging', provider: 'oracle', icon: 'Stream', isBridge: true },
    { id: 'oracle-events', name: 'Events', category: 'Events', provider: 'oracle', icon: 'Ev', isBridge: true },
    { id: 'oracle-load-balancer', name: 'Load Balancer', category: 'Network', provider: 'oracle', icon: 'LB', isBridge: true },
    { id: 'oracle-cache', name: 'Cache', category: 'Cache', provider: 'oracle', icon: 'Cache' },
  ],
}

export const providerLabels: Record<CloudProvider, string> = {
  generic: 'Generico',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'Google Cloud',
  oracle: 'Oracle Cloud',
}

export const providerColors: Record<CloudProvider, string> = {
  generic: '#64748b',
  aws: '#ff9900',
  azure: '#0078d4',
  gcp: '#4285f4',
  oracle: '#f80000',
}
