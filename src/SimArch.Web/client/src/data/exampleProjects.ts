export interface ExampleProject {
  id: string
  name: string
  description: string
  yaml: string
}

export const EXAMPLE_PROJECTS: ExampleProject[] = [
  {
    id: 'ecommerce-order-payment',
    name: 'E-commerce Order e Pagamento',
    description: 'Fluxo completo para dominio de pedidos e pagamentos com User Traffic, API Gateway, Auth, Order, Payment, Message Queue, Fallback e Error',
    yaml: `name: E-commerce Order e Pagamento
description: Fluxo arquitetural completo para dominio de pedidos e pagamentos
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
  - id: auth-service
    name: Auth Service
    component: generic-service
    slaMs: 50
    fallback: error
  - id: order-service
    name: Order Service
    component: generic-service
    slaMs: 200
    fallback: error
  - id: payment-service
    name: Payment Service
    component: generic-service
    slaMs: 300
    fallback: fallback-service
  - id: fallback-service
    name: Fallback Service
    component: generic-service
    slaMs: 500
    fallback: error
  - id: message-queue
    name: Message Queue
    component: generic-queue
  - id: database-cluster
    name: Database Cluster
    component: generic-database
    fallback: error
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
`,
  },
  {
    id: 'checkout-flow',
    name: 'Checkout Flow',
    description: 'Fluxo simples de checkout com User, Gateway, Payment e Wallet fallback',
    yaml: `name: Checkout Flow
projectType: single
primaryCloud: generic
services:
  - id: gateway
    name: API Gateway
    component: generic-api-gateway
    slaMs: 100
    fallback: null
  - id: payment
    name: Payment Service
    component: generic-service
    slaMs: 200
    fallback: wallet
  - id: wallet
    name: Wallet Fallback
    component: generic-service
    slaMs: 500
flows:
  - id: checkout
    name: Checkout
    steps:
      - from: User
        to: gateway
      - from: gateway
        to: payment
        onFailure: wallet
`,
  },
  {
    id: 'checkout-with-requirements',
    name: 'Checkout com Requisitos',
    description: 'Checkout flow com requisitos e rastreabilidade',
    yaml: `name: Checkout Flow
projectType: single
primaryCloud: generic
services:
  - id: gateway
    name: API Gateway
    component: generic-api-gateway
    slaMs: 100
    fallback: null
  - id: payment
    name: Payment Service
    component: generic-service
    slaMs: 200
    fallback: wallet
  - id: wallet
    name: Wallet Fallback
    component: generic-service
    slaMs: 500
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
    text: O checkout deve responder em ate 500ms (P95)
    priority: high
    type: non-functional
    standardRef: SLA 99.9%
  - id: REQ-002
    text: Pagamento deve ter fallback em caso de falha do provedor principal
    priority: high
    type: functional
  - id: REQ-003
    text: Gateway deve expor API unica para o cliente
    priority: medium
    type: functional
traceabilityLinks:
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: gateway
  - requirementId: REQ-001
    linkType: satisfy
    elementType: service
    elementId: payment
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: payment
  - requirementId: REQ-002
    linkType: satisfy
    elementType: service
    elementId: wallet
  - requirementId: REQ-003
    linkType: satisfy
    elementType: service
    elementId: gateway
`,
  },
]
