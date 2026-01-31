export type ExampleCloudGroup = 'generic' | 'aws' | 'azure' | 'gcp' | 'oracle' | 'multicloud'

export interface ExampleProject {
  id: string
  name: string
  description: string
  cloud: ExampleCloudGroup
  yaml: string
}

export const CLOUD_GROUP_LABELS: Record<ExampleCloudGroup, string> = {
  generic: 'Generico',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'Google Cloud',
  oracle: 'Oracle Cloud',
  multicloud: 'Multicloud',
}

export const EXAMPLE_PROJECTS: ExampleProject[] = [
  {
    id: 'ecommerce-order-payment',
    name: 'E-commerce Order e Pagamento',
    description: 'Fluxo completo com custos FinOps, triggers, fallbacks e rastreabilidade',
    cloud: 'generic',
    yaml: `name: E-commerce Order e Pagamento
description: Fluxo arquitetural completo para dominio de pedidos e pagamentos com custos
projectType: single
primaryCloud: generic
services:
  - id: user-traffic
    name: User Traffic
    component: generic-trigger-user
  - id: api-gateway
    name: API Gateway
    component: generic-api-gateway
    slaMs: 100
    fallback: error
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
  - id: auth-service
    name: Auth Service
    component: generic-service
    slaMs: 50
    fallback: error
    costPerHour: 0.12
    costPerMonth: 87
    currency: USD
  - id: order-service
    name: Order Service
    component: generic-service
    slaMs: 200
    fallback: error
    costPerHour: 0.25
    costPerMonth: 180
    currency: USD
  - id: payment-service
    name: Payment Service
    component: generic-service
    slaMs: 300
    fallback: fallback-service
    costPerHour: 0.18
    costPerMonth: 130
    currency: USD
  - id: fallback-service
    name: Fallback Service
    component: generic-service
    slaMs: 500
    fallback: error
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: message-queue
    name: Message Queue
    component: generic-queue
    costPerHour: 0.03
    costPerMonth: 22
    currency: USD
  - id: database-cluster
    name: Database Cluster
    component: generic-database
    fallback: error
    costPerHour: 0.45
    costPerMonth: 328
    currency: USD
  - id: error
    name: Error
    component: generic-trigger-error
flows:
  - id: main
    name: Main Flow
    steps:
      - from: user-traffic
        to: api-gateway
        onFailure: error
      - from: api-gateway
        to: auth-service
      - from: api-gateway
        to: order-service
      - from: auth-service
        to: order-service
        onFailure: error
      - from: order-service
        to: payment-service
      - from: order-service
        to: message-queue
      - from: payment-service
        to: fallback-service
        onFailure: error
      - from: fallback-service
        to: database-cluster
        onFailure: error
      - from: message-queue
        to: database-cluster
  - id: async-orders
    name: Async Orders
    steps:
      - from: order-service
        to: message-queue
      - from: message-queue
        to: database-cluster
requirements:
  - id: REQ-001
    text: Checkout deve responder em ate 500ms (P95)
    priority: high
    type: non-functional
  - id: REQ-002
    text: Pagamento deve ter fallback em caso de falha
    priority: high
    type: functional
  - id: REQ-003
    text: API Gateway deve rotear para Auth e Order
    priority: medium
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: order-service
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: payment-service
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: fallback-service
  - requirementId: REQ-003
    linkType: satisfy
    elementType: service
    elementId: api-gateway
adrs:
  - id: adr-001
    number: 1
    title: Fallback em pagamento
    status: Accepted
    context: Risco de falha no provedor principal
    decision: Usar fallback-service com wallet interno
    consequences: Latencia maior em fallback
`,
  },
  {
    id: 'event-driven-pipeline',
    name: 'Pipeline Event-Driven',
    description: 'Scheduler, Webhook e Event Bus com cenarios de processamento assincrono',
    cloud: 'generic',
    yaml: `name: Pipeline Event-Driven
description: Cenarios com triggers (Scheduler, Webhook) e Event Bus
projectType: single
primaryCloud: generic
services:
  - id: scheduler
    name: Scheduler
    component: generic-trigger-scheduler
  - id: webhook
    name: Webhook
    component: generic-trigger-webhook
  - id: event-bus
    name: Event Bus
    component: generic-event-bus
    costPerHour: 0.02
    costPerMonth: 15
    currency: USD
  - id: processor
    name: Processor
    component: generic-service
    slaMs: 150
    fallback: error
    costPerHour: 0.15
    costPerMonth: 109
    currency: USD
  - id: storage
    name: Storage
    component: generic-storage
    costPerHour: 0.04
    costPerMonth: 29
    currency: USD
  - id: error
    name: Error
    component: generic-trigger-error
flows:
  - id: scheduled
    name: Scheduled Job
    steps:
      - from: scheduler
        to: event-bus
      - from: event-bus
        to: processor
      - from: processor
        to: storage
        onFailure: error
  - id: webhook-flow
    name: Webhook Flow
    steps:
      - from: webhook
        to: event-bus
      - from: event-bus
        to: processor
        onFailure: error
requirements:
  - id: REQ-001
    text: Processamento assincrono via event bus
    priority: high
    type: functional
  - id: REQ-002
    text: Webhook e Scheduler devem publicar no mesmo bus
    priority: medium
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: event-bus
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: webhook
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: scheduler
`,
  },
  {
    id: 'checkout-simple',
    name: 'Checkout Simples',
    description: 'Fluxo basico Gateway, Payment, Wallet com custos e requisitos',
    cloud: 'generic',
    yaml: `name: Checkout Simples
projectType: single
primaryCloud: generic
services:
  - id: gateway
    name: API Gateway
    component: generic-api-gateway
    slaMs: 100
    costPerHour: 0.03
    costPerMonth: 22
    currency: USD
  - id: payment
    name: Payment Service
    component: generic-service
    slaMs: 200
    fallback: wallet
    costPerHour: 0.12
    costPerMonth: 87
    currency: USD
  - id: wallet
    name: Wallet Fallback
    component: generic-service
    slaMs: 500
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
flows:
  - id: checkout
    name: Checkout
    steps:
      - from: User
        to: gateway
      - from: gateway
        to: payment
        onFailure: wallet
requirements:
  - id: REQ-001
    text: Checkout em ate 500ms (P95)
    priority: high
    type: non-functional
  - id: REQ-002
    text: Fallback em pagamento
    priority: high
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: gateway
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: payment
`,
  },
  {
    id: 'aws-serverless-api',
    name: 'API Serverless (AWS)',
    description: 'Lambda, API Gateway, DynamoDB, S3 com custos e cenarios de leitura/escrita',
    cloud: 'aws',
    yaml: `name: API Serverless AWS
description: Arquitetura serverless com Lambda, DynamoDB e S3
projectType: single
primaryCloud: aws
services:
  - id: user-traffic
    name: User Traffic
    component: generic-trigger-user
  - id: api-gateway
    name: API Gateway
    component: aws-api-gateway
    slaMs: 80
    fallback: error
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: lambda-auth
    name: Lambda Auth
    component: aws-lambda
    slaMs: 50
    fallback: error
    costPerHour: 0.02
    costPerMonth: 15
    currency: USD
  - id: lambda-api
    name: Lambda API
    component: aws-lambda
    slaMs: 200
    fallback: error
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
  - id: dynamodb
    name: DynamoDB
    component: aws-dynamodb
    costPerHour: 0.15
    costPerMonth: 109
    currency: USD
  - id: s3
    name: S3
    component: aws-s3
    costPerHour: 0.02
    costPerMonth: 15
    currency: USD
  - id: error
    name: Error
    component: generic-trigger-error
flows:
  - id: read-flow
    name: Read Flow
    steps:
      - from: user-traffic
        to: api-gateway
        onFailure: error
      - from: api-gateway
        to: lambda-auth
      - from: api-gateway
        to: lambda-api
      - from: lambda-auth
        to: lambda-api
        onFailure: error
      - from: lambda-api
        to: dynamodb
        onFailure: error
  - id: write-flow
    name: Write Flow
    steps:
      - from: lambda-api
        to: dynamodb
      - from: lambda-api
        to: s3
requirements:
  - id: REQ-001
    text: API serverless com auto-scaling
    priority: high
    type: non-functional
  - id: REQ-002
    text: Dados em DynamoDB e arquivos em S3
    priority: high
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: lambda-api
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: dynamodb
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: s3
`,
  },
  {
    id: 'aws-event-driven',
    name: 'Event-Driven AWS',
    description: 'EventBridge, SQS, SNS e Lambda com fluxos assincronos',
    cloud: 'aws',
    yaml: `name: Event-Driven AWS
description: EventBridge, SQS, SNS e Lambda
projectType: single
primaryCloud: aws
services:
  - id: webhook
    name: Webhook
    component: generic-trigger-webhook
  - id: eventbridge
    name: EventBridge
    component: aws-eventbridge
    costPerHour: 0.01
    costPerMonth: 7
    currency: USD
  - id: sqs
    name: SQS
    component: aws-sqs
    costPerHour: 0.005
    costPerMonth: 4
    currency: USD
  - id: sns
    name: SNS
    component: aws-sns
    costPerHour: 0.01
    costPerMonth: 7
    currency: USD
  - id: lambda-processor
    name: Lambda Processor
    component: aws-lambda
    slaMs: 100
    costPerHour: 0.03
    costPerMonth: 22
    currency: USD
  - id: dynamodb
    name: DynamoDB
    component: aws-dynamodb
    costPerHour: 0.12
    costPerMonth: 87
    currency: USD
flows:
  - id: ingest
    name: Ingest Flow
    steps:
      - from: webhook
        to: eventbridge
      - from: eventbridge
        to: sqs
      - from: sqs
        to: lambda-processor
      - from: lambda-processor
        to: dynamodb
  - id: notify
    name: Notify Flow
    steps:
      - from: lambda-processor
        to: sns
`,
  },
  {
    id: 'azure-enterprise-app',
    name: 'App Enterprise (Azure)',
    description: 'Functions, App Service, Cosmos DB, Service Bus com custos',
    cloud: 'azure',
    yaml: `name: App Enterprise Azure
description: Arquitetura enterprise com Azure
projectType: single
primaryCloud: azure
services:
  - id: user-traffic
    name: User Traffic
    component: generic-trigger-user
  - id: api-management
    name: API Management
    component: azure-api-management
    slaMs: 100
    fallback: error
    costPerHour: 0.25
    costPerMonth: 180
    currency: USD
  - id: app-service
    name: App Service
    component: azure-app-service
    slaMs: 150
    fallback: error
    costPerHour: 0.18
    costPerMonth: 130
    currency: USD
  - id: functions
    name: Functions
    component: azure-functions
    slaMs: 80
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
  - id: cosmos-db
    name: Cosmos DB
    component: azure-cosmos
    costPerHour: 0.35
    costPerMonth: 255
    currency: USD
  - id: service-bus
    name: Service Bus
    component: azure-service-bus
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: key-vault
    name: Key Vault
    component: azure-key-vault
    costPerHour: 0.01
    costPerMonth: 7
    currency: USD
  - id: error
    name: Error
    component: generic-trigger-error
flows:
  - id: main
    name: Main Flow
    steps:
      - from: user-traffic
        to: api-management
        onFailure: error
      - from: api-management
        to: app-service
      - from: api-management
        to: functions
      - from: app-service
        to: cosmos-db
        onFailure: error
      - from: app-service
        to: service-bus
      - from: functions
        to: key-vault
      - from: functions
        to: cosmos-db
requirements:
  - id: REQ-001
    text: Secrets em Key Vault
    priority: high
    type: functional
  - id: REQ-002
    text: Cosmos DB para dados globais
    priority: high
    type: non-functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: key-vault
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: cosmos-db
`,
  },
  {
    id: 'gcp-data-pipeline',
    name: 'Data Pipeline (GCP)',
    description: 'Cloud Run, Pub/Sub, BigQuery com fluxos de ingestao e analise',
    cloud: 'gcp',
    yaml: `name: Data Pipeline GCP
description: Pipeline de dados com Cloud Run, Pub/Sub e BigQuery
projectType: single
primaryCloud: gcp
services:
  - id: webhook
    name: Webhook
    component: generic-trigger-webhook
  - id: cloud-run
    name: Cloud Run
    component: gcp-cloud-run
    slaMs: 100
    fallback: error
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: pubsub
    name: Pub/Sub
    component: gcp-pubsub
    costPerHour: 0.02
    costPerMonth: 15
    currency: USD
  - id: bigquery
    name: BigQuery
    component: gcp-bigquery
    costPerHour: 0.12
    costPerMonth: 87
    currency: USD
  - id: cloud-storage
    name: Cloud Storage
    component: gcp-storage
    costPerHour: 0.03
    costPerMonth: 22
    currency: USD
  - id: error
    name: Error
    component: generic-trigger-error
flows:
  - id: ingest
    name: Ingest Flow
    steps:
      - from: webhook
        to: cloud-run
        onFailure: error
      - from: cloud-run
        to: pubsub
      - from: cloud-run
        to: cloud-storage
  - id: analyze
    name: Analyze Flow
    steps:
      - from: pubsub
        to: cloud-run
      - from: cloud-run
        to: bigquery
requirements:
  - id: REQ-001
    text: Ingestao em tempo real via Pub/Sub
    priority: high
    type: functional
  - id: REQ-002
    text: Analise em BigQuery
    priority: high
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: pubsub
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: bigquery
`,
  },
  {
    id: 'oracle-enterprise',
    name: 'Enterprise (Oracle)',
    description: 'OKE, Autonomous DB, Streaming e Load Balancer com custos',
    cloud: 'oracle',
    yaml: `name: Enterprise Oracle
description: Arquitetura enterprise com OCI
projectType: single
primaryCloud: oracle
services:
  - id: user-traffic
    name: User Traffic
    component: generic-trigger-user
  - id: load-balancer
    name: Load Balancer
    component: oracle-load-balancer
    slaMs: 50
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
  - id: oke-workers
    name: OKE Workers
    component: oracle-oke
    slaMs: 200
    fallback: error
    costPerHour: 0.35
    costPerMonth: 255
    currency: USD
  - id: api-gateway
    name: API Gateway
    component: oracle-api-gateway
    slaMs: 80
    costPerHour: 0.04
    costPerMonth: 29
    currency: USD
  - id: autonomous-db
    name: Autonomous DB
    component: oracle-autonomous
    costPerHour: 0.45
    costPerMonth: 328
    currency: USD
  - id: streaming
    name: Streaming
    component: oracle-streaming
    costPerHour: 0.02
    costPerMonth: 15
    currency: USD
  - id: error
    name: Error
    component: generic-trigger-error
flows:
  - id: main
    name: Main Flow
    steps:
      - from: user-traffic
        to: load-balancer
        onFailure: error
      - from: load-balancer
        to: api-gateway
      - from: api-gateway
        to: oke-workers
      - from: oke-workers
        to: autonomous-db
        onFailure: error
      - from: oke-workers
        to: streaming
requirements:
  - id: REQ-001
    text: OKE para workloads containerizados
    priority: high
    type: non-functional
  - id: REQ-002
    text: Autonomous DB para banco gerenciado
    priority: high
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: oke-workers
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: autonomous-db
`,
  },
  {
    id: 'multicloud-dr',
    name: 'DR Multicloud (AWS + Azure + GCP)',
    description: 'Zonas por nuvem com failover e replicacao entre regioes',
    cloud: 'multicloud',
    yaml: `name: DR Multicloud
description: Disaster Recovery com AWS, Azure e GCP - zonas por provedor
projectType: multicloud
primaryCloud: generic
services:
  - id: user-traffic
    name: User Traffic
    component: generic-trigger-user
    provider: aws
  - id: api-gateway-aws
    name: API Gateway (AWS)
    component: aws-api-gateway
    provider: aws
    slaMs: 100
    fallback: api-gateway-azure
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: api-gateway-azure
    name: API Management (Azure)
    component: azure-api-management
    provider: azure
    slaMs: 120
    fallback: api-gateway-gcp
    costPerHour: 0.25
    costPerMonth: 180
    currency: USD
  - id: api-gateway-gcp
    name: API Gateway (GCP)
    component: gcp-api-gateway
    provider: gcp
    slaMs: 90
    costPerHour: 0.06
    costPerMonth: 44
    currency: USD
  - id: lambda-aws
    name: Lambda (AWS)
    component: aws-lambda
    provider: aws
    slaMs: 100
    costPerHour: 0.03
    costPerMonth: 22
    currency: USD
  - id: functions-azure
    name: Functions (Azure)
    component: azure-functions
    provider: azure
    slaMs: 100
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
  - id: cloud-run-gcp
    name: Cloud Run (GCP)
    component: gcp-cloud-run
    provider: gcp
    slaMs: 100
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: dynamodb
    name: DynamoDB
    component: aws-dynamodb
    provider: aws
    costPerHour: 0.15
    costPerMonth: 109
    currency: USD
  - id: cosmos-db
    name: Cosmos DB
    component: azure-cosmos
    provider: azure
    costPerHour: 0.35
    costPerMonth: 255
    currency: USD
  - id: bigquery
    name: BigQuery
    component: gcp-bigquery
    provider: gcp
    costPerHour: 0.12
    costPerMonth: 87
    currency: USD
flows:
  - id: primary-aws
    name: Primary (AWS)
    steps:
      - from: user-traffic
        to: api-gateway-aws
        onFailure: api-gateway-azure
      - from: api-gateway-aws
        to: lambda-aws
      - from: lambda-aws
        to: dynamodb
  - id: failover-azure
    name: Failover (Azure)
    steps:
      - from: api-gateway-azure
        to: functions-azure
      - from: functions-azure
        to: cosmos-db
  - id: failover-gcp
    name: Failover (GCP)
    steps:
      - from: api-gateway-gcp
        to: cloud-run-gcp
      - from: cloud-run-gcp
        to: bigquery
requirements:
  - id: REQ-001
    text: Failover entre AWS, Azure e GCP
    priority: high
    type: functional
  - id: REQ-002
    text: Custos por regiao visiveis no FinOps
    priority: high
    type: non-functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: api-gateway-aws
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: api-gateway-azure
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: lambda-aws
adrs:
  - id: adr-001
    number: 1
    title: Estrategia multicloud para DR
    status: Accepted
    context: Necessidade de resiliencia multi-regiao
    decision: Usar AWS como primario, Azure e GCP como failover
    consequences: Custos triplicados, visao unificada no SimArch
`,
  },
  {
    id: 'multicloud-geo',
    name: 'Geo-Distribuido Multicloud',
    description: 'Zonas AWS, Azure e GCP com trafego por regiao',
    cloud: 'multicloud',
    yaml: `name: Geo-Distribuido Multicloud
description: Aplicacao distribuida por regiao - vistas por zona
projectType: multicloud
primaryCloud: generic
services:
  - id: user-traffic
    name: User Traffic
    component: generic-trigger-user
    provider: aws
  - id: cloudfront
    name: CloudFront
    component: aws-cloudfront
    provider: aws
    slaMs: 50
    costPerHour: 0.05
    costPerMonth: 36
    currency: USD
  - id: api-aws
    name: API AWS
    component: aws-api-gateway
    provider: aws
    slaMs: 100
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: lambda-aws
    name: Lambda AWS
    component: aws-lambda
    provider: aws
    slaMs: 80
    costPerHour: 0.03
    costPerMonth: 22
    currency: USD
  - id: api-azure
    name: API Azure
    component: azure-api-management
    provider: azure
    slaMs: 100
    costPerHour: 0.25
    costPerMonth: 180
    currency: USD
  - id: app-azure
    name: App Service Azure
    component: azure-app-service
    provider: azure
    slaMs: 120
    costPerHour: 0.18
    costPerMonth: 130
    currency: USD
  - id: api-gcp
    name: API GCP
    component: gcp-api-gateway
    provider: gcp
    slaMs: 90
    costPerHour: 0.06
    costPerMonth: 44
    currency: USD
  - id: run-gcp
    name: Cloud Run GCP
    component: gcp-cloud-run
    provider: gcp
    slaMs: 100
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
  - id: dynamodb
    name: DynamoDB
    component: aws-dynamodb
    provider: aws
    costPerHour: 0.12
    costPerMonth: 87
    currency: USD
  - id: cosmos
    name: Cosmos DB
    component: azure-cosmos
    provider: azure
    costPerHour: 0.35
    costPerMonth: 255
    currency: USD
  - id: firestore
    name: Firestore
    component: gcp-firestore
    provider: gcp
    costPerHour: 0.08
    costPerMonth: 58
    currency: USD
flows:
  - id: us-east
    name: US East (AWS)
    steps:
      - from: user-traffic
        to: cloudfront
      - from: cloudfront
        to: api-aws
      - from: api-aws
        to: lambda-aws
      - from: lambda-aws
        to: dynamodb
  - id: eu-west
    name: EU West (Azure)
    steps:
      - from: api-azure
        to: app-azure
      - from: app-azure
        to: cosmos
  - id: asia-pacific
    name: Asia Pacific (GCP)
    steps:
      - from: api-gcp
        to: run-gcp
      - from: run-gcp
        to: firestore
requirements:
  - id: REQ-001
    text: CDN AWS para Americas
    priority: high
    type: functional
  - id: REQ-002
    text: Azure para EU, GCP para Asia
    priority: high
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: cloudfront
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: app-azure
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: run-gcp
`,
  },
]

export function getExamplesByCloud(): Record<ExampleCloudGroup, ExampleProject[]> {
  const groups = Object.fromEntries(
    (Object.keys(CLOUD_GROUP_LABELS) as ExampleCloudGroup[]).map((k) => [k, [] as ExampleProject[]])
  ) as Record<ExampleCloudGroup, ExampleProject[]>
  for (const ex of EXAMPLE_PROJECTS) {
    groups[ex.cloud].push(ex)
  }
  return groups
}
