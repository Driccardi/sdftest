# Integration Points - SunStyle Retail

## Document Information
- **Document ID**: IP-001
- **Version**: 1.5
- **Status**: Draft
- **Last Updated**: 2026-02-03
- **Owner**: Robert Kim, Infrastructure & Operations Lead

## Overview

This document describes the integration points between systems in the SunStyle Retail technology ecosystem. Each integration includes technical details, data flows, and SLAs.

## Integration Architecture

### Integration Patterns Used
1. **RESTful API**: Synchronous request/response
2. **GraphQL**: Flexible query-based integration
3. **Webhooks**: Event-driven push notifications
4. **Message Queue**: Asynchronous event processing (Google Cloud Pub/Sub)
5. **Batch File Transfer**: Scheduled bulk data transfers (SFTP)
6. **Database Replication**: Real-time data synchronization

## Core Integration Map

```
E-Commerce Platform
├── → Order Management System (REST API, Webhooks)
├── → Inventory Management System (REST API)
├── → Payment Gateway (REST API, Webhooks)
├── → Email Marketing System (REST API)
├── → CRM (REST API)
└── → Analytics Platform (JavaScript SDK)

Order Management System
├── → Inventory Management System (REST API, Pub/Sub)
├── → Shipping Carriers (REST API, Webhooks)
├── → Customer Service Platform (REST API)
├── → Payment Gateway (REST API)
└── → Financial System (REST API, Batch)

Point of Sale System
├── → Payment Gateway (Stripe Terminal API)
├── → Inventory Management System (REST API)
├── → CRM (REST API)
└── → Order Management System (REST API)

CRM (Salesforce)
├── → Email Marketing System (Native connector)
├── → Customer Service Platform (Native connector)
├── → Order Management System (REST API)
└── → Business Intelligence (REST API)
```

## Integration Details

### INT-001: E-Commerce Platform ↔ Order Management System
**Integration Type**: REST API + Webhooks
**Direction**: Bidirectional
**Frequency**: Real-time
**Data Volume**: ~500 orders/day

**Purpose**: Order creation and status synchronization

**Data Flows**:
1. **E-Commerce → OMS**: New order placement
   - Endpoint: `POST /api/v1/orders`
   - Payload: Order details (customer, items, shipping, payment)
   - Response: Order ID, confirmation

2. **OMS → E-Commerce**: Order status updates
   - Method: Webhook
   - Endpoint: `POST /webhooks/order-status`
   - Events: Order confirmed, shipped, delivered, cancelled
   - Payload: Order ID, status, tracking info

**Authentication**: OAuth 2.0 client credentials
**Error Handling**: Retry with exponential backoff (5 attempts)
**Monitoring**: Success rate > 99.5%, latency < 500ms

**SLA**:
- Uptime: 99.9%
- Response time: < 500ms (p95)
- Error rate: < 0.5%

---

### INT-002: E-Commerce Platform ↔ Inventory Management System
**Integration Type**: REST API
**Direction**: Bidirectional
**Frequency**: Real-time
**Data Volume**: ~50,000 inventory checks/day

**Purpose**: Real-time inventory availability

**Data Flows**:
1. **E-Commerce → IMS**: Inventory availability check
   - Endpoint: `GET /api/v1/inventory/{sku}/availability`
   - Query params: location (optional)
   - Response: Available quantity, locations

2. **IMS → E-Commerce**: Inventory updates
   - Endpoint: `PATCH /api/v1/products/{sku}/inventory`
   - Payload: SKU, quantity, location
   - Trigger: Stock level changes

**Authentication**: API Key
**Caching**: Redis cache (5-minute TTL)
**Error Handling**: Fallback to "limited availability" if API unavailable

**SLA**:
- Uptime: 99.9%
- Response time: < 100ms (p95)
- Data accuracy: 100%

---

### INT-003: Order Management System ↔ Shipping Carriers
**Integration Type**: REST API + Webhooks
**Direction**: Bidirectional
**Frequency**: Real-time
**Data Volume**: ~500 shipments/day

**Purpose**: Shipping label generation and tracking

**Carriers Integrated**:
- FedEx Ship Manager API
- UPS Shipping API
- USPS Web Tools API

**Data Flows**:
1. **OMS → Carrier**: Create shipment
   - Endpoint: Carrier-specific (e.g., FedEx `/ship`)
   - Payload: Package details, addresses, service level
   - Response: Tracking number, label (PDF)

2. **Carrier → OMS**: Tracking updates
   - Method: Webhook
   - Events: In transit, out for delivery, delivered, exception
   - Payload: Tracking number, status, location, timestamp

**Authentication**: API credentials per carrier
**Label Format**: PDF (stored in Cloud Storage)
**Error Handling**: Retry, failover to alternative carrier

**SLA**:
- Label generation: < 10 seconds
- Tracking update latency: < 15 minutes
- Label success rate: > 99%

---

### INT-004: Point of Sale ↔ Payment Gateway (Stripe Terminal)
**Integration Type**: Stripe Terminal SDK
**Direction**: Bidirectional
**Frequency**: Real-time
**Data Volume**: ~300 in-store transactions/day

**Purpose**: In-store payment processing

**Data Flows**:
1. **POS → Stripe**: Payment authorization
   - SDK Method: `createPaymentIntent()`
   - Data: Amount, currency, metadata
   - Reader: Presents to customer for payment

2. **Stripe → POS**: Payment confirmation
   - Event: Payment succeeded/failed
   - Data: Transaction ID, card details (last 4), receipt

**Authentication**: Stripe API keys (per store location)
**Hardware**: Stripe Terminal readers (BBPOS WisePad 3)
**Offline Mode**: Queue transactions for later processing

**SLA**:
- Authorization time: < 5 seconds
- Success rate: > 98%
- Uptime: 99.5% (including offline mode)

---

### INT-005: Point of Sale (Lightspeed) ↔ NetSuite
**Integration Type**: SuiteApp (Lightspeed NetSuite Integration)
**Direction**: Bidirectional
**Frequency**: Real-time
**Data Volume**: ~300 in-store transactions/day

**Purpose**: Store operations integration for inventory visibility and cash sale processing

**Decision Context**: Per 2026-02-03 decision, Lightspeed POS will be retained in stores (not replaced by NetSuite POS). This impacts store operations, integration scope, timeline, budget, and training requirements.

**Data Flows**:
1. **NetSuite → Lightspeed**: Inventory and pricing synchronization
   - Product catalog (SKUs, descriptions, attributes)
   - Inventory levels by location
   - Pricing (base prices, promotional pricing)
   - Sync frequency: TBD by integration team

2. **Lightspeed → NetSuite**: Cash Sale records
   - Transaction details (items sold, quantities, prices)
   - Payment information
   - Store location
   - Timestamp and associate information
   - Sync frequency: TBD by integration team

**Implementation Notes**:
- Uses Lightspeed's official NetSuite SuiteApp
- Configuration and management responsibility: Separate integration team
- SuiteApp installation and setup required in NetSuite account
- Store-level inventory mapping required

**Integration Ownership**: Separate team responsible for Lightspeed-NetSuite SuiteApp configuration

> ⚠️ OPEN: Integration team assignment and contact information
> ⚠️ OPEN: Sync frequency and latency requirements
> ⚠️ OPEN: Error handling and reconciliation procedures
> ⚠️ OPEN: Mapping of Lightspeed locations to NetSuite locations
> ⚠️ OPEN: Payment method mapping (Lightspeed → NetSuite)
> ⚠️ OPEN: Return/refund handling through integration

**SLA**: TBD by integration team

---

### INT-007: Customer Service Platform ↔ CRM
**Integration Type**: Native Zendesk-Salesforce connector
**Direction**: Bidirectional
**Frequency**: Real-time
**Data Volume**: ~200 tickets/day

**Purpose**: Unified customer view

**Data Flows**:
1. **Zendesk → Salesforce**: Ticket creation
   - Creates Case in Salesforce
   - Links to Contact/Account
   - Syncs ticket updates

2. **Salesforce → Zendesk**: Customer data
   - Customer details (name, email, phone)
   - Purchase history
   - Loyalty program status
   - Case history

**Authentication**: OAuth 2.0
**Sync Frequency**: Real-time (event-driven)
**Field Mapping**: Custom field mapping configured

**SLA**:
- Sync latency: < 30 seconds
- Data consistency: 100%

---

### INT-008: E-Commerce Platform ↔ Email Marketing (Klaviyo)
**Integration Type**: REST API + JavaScript SDK
**Direction**: Bidirectional
**Frequency**: Real-time + Batch
**Data Volume**: ~5,000 events/day, ~100k contacts

**Purpose**: Customer behavior tracking and email personalization

**Data Flows**:
1. **E-Commerce → Klaviyo**: Customer events
   - SDK tracking: Page views, product views, add to cart
   - API events: Order placed, order fulfilled
   - Profile updates: Customer data, preferences

2. **Klaviyo → E-Commerce**: None (Klaviyo initiates sends)

**Authentication**: API key
**Event Tracking**: JavaScript SDK embedded on website
**Profile Sync**: Daily batch sync of customer data

**SLA**:
- Event tracking latency: < 5 seconds
- Profile sync: Daily at 2 AM
- Data accuracy: > 99%

---

### INT-009: All Systems → Data Warehouse (BigQuery)
**Integration Type**: ETL Pipeline (Apache Airflow)
**Direction**: Unidirectional (to BigQuery)
**Frequency**: Scheduled batch (hourly/daily)
**Data Volume**: ~2.5 TB total

**Purpose**: Centralized analytics and reporting

**Data Sources**:
- E-Commerce Platform (orders, customers, products)
- Order Management System (fulfillment, shipping)
- Inventory Management System (stock levels, transfers)
- CRM (customer interactions, cases)
- POS System (in-store transactions)
- Marketing platforms (campaigns, engagement)

**ETL Process**:
1. Extract: Query source systems via API or database replication
2. Transform: Clean, normalize, enrich data
3. Load: Append/upsert to BigQuery tables

**Schedule**:
- Transactional data: Hourly
- Master data: Daily
- Historical backfill: On-demand

**Data Quality**: Validation rules, duplicate detection, schema enforcement

**SLA**:
- ETL completion: Within scheduled window
- Data freshness: < 1 hour for transactional, < 24 hours for master
- Data quality: > 99% accuracy

---

### INT-010: Order Management System ↔ Financial System
**Integration Type**: REST API + Batch file transfer
**Direction**: Unidirectional (OMS → QuickBooks)
**Frequency**: Daily batch (11 PM)
**Data Volume**: ~500 transactions/day

**Purpose**: Accounting and financial reconciliation

**Data Flows**:
1. **OMS → QuickBooks**: Daily sales summary
   - API: Create invoices for completed orders
   - Batch file: Sales summary CSV
   - Data: Order ID, customer, items, amounts, taxes, payments

**Authentication**: OAuth 2.0
**File Format**: CSV with predefined schema
**Transfer Method**: SFTP to QuickBooks import folder

**Reconciliation**:
- Automated matching of payments to invoices
- Exception report for mismatches
- Manual review by finance team

**SLA**:
- Batch completion: By midnight
- Data accuracy: 100%
- Reconciliation: 95% automated

---

### INT-011: Mobile Apps ↔ Backend APIs
**Integration Type**: REST API + GraphQL
**Direction**: Bidirectional
**Frequency**: Real-time
**Data Volume**: ~10,000 API calls/day

**Purpose**: Mobile app functionality

**APIs Used**:
- Product Catalog (GraphQL): Product browsing, search
- Order Management (REST): Order placement, tracking
- Customer Account (REST): Login, profile, order history
- Loyalty Program (REST): Points balance, rewards

**Authentication**: OAuth 2.0 + JWT tokens
**Token Refresh**: Automatic token refresh
**Offline Mode**: Local caching for product catalog

**SLA**:
- API uptime: 99.9%
- Response time: < 200ms (p95)
- Error rate: < 1%

---

### INT-012: All Systems → Monitoring (Datadog)
**Integration Type**: Agent-based + API
**Direction**: Unidirectional (to Datadog)
**Frequency**: Real-time
**Data Volume**: ~1M metrics/hour

**Purpose**: Observability and monitoring

**Data Collected**:
- Application metrics (requests, errors, latency)
- Infrastructure metrics (CPU, memory, disk, network)
- Custom business metrics (orders, revenue, inventory)
- Logs (application, system, security)
- Traces (distributed tracing for requests)

**Implementation**:
- Datadog Agent on servers/containers
- API integration for cloud services
- Application instrumentation (APM libraries)

**Alerting**:
- PagerDuty integration for on-call
- Slack notifications for warnings
- Email notifications for reports

**SLA**:
- Data ingestion latency: < 10 seconds
- Alerting latency: < 1 minute
- Dashboard uptime: 99.9%

## Integration Security

### Security Measures
1. **Authentication**: OAuth 2.0, API keys, JWT tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Encryption**: TLS 1.3 for data in transit
4. **API Gateway**: Rate limiting, DDoS protection
5. **Secret Management**: Google Cloud Secret Manager
6. **Audit Logging**: All API calls logged
7. **IP Whitelisting**: For sensitive integrations

### API Security Standards
- HTTPS only (TLS 1.3)
- API key rotation: Quarterly
- OAuth token expiration: 1 hour (access), 30 days (refresh)
- Rate limiting: Per client/endpoint
- Input validation: All API inputs validated
- Output encoding: Prevent injection attacks

## Integration Monitoring and Alerts

### Monitoring Metrics
1. **Availability**: Uptime per integration
2. **Performance**: Response time, throughput
3. **Reliability**: Error rate, retry rate
4. **Data Quality**: Validation failures, data loss

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 1% | > 5% |
| Response Time (p95) | > 1s | > 3s |
| Availability | < 99% | < 95% |
| Data Sync Lag | > 5 min | > 15 min |

### Incident Response
1. Automated alerts to on-call engineer
2. Runbook for each integration
3. Escalation path defined
4. Post-incident review (PIR)

## Integration Testing

### Test Types
1. **Unit Tests**: Individual API endpoints
2. **Integration Tests**: End-to-end flows
3. **Performance Tests**: Load and stress testing
4. **Security Tests**: Penetration testing, vulnerability scans
5. **Disaster Recovery Tests**: Failover and recovery

### Test Frequency
- Unit/Integration: Every deployment (CI/CD)
- Performance: Monthly
- Security: Quarterly
- DR: Quarterly

## Future Integration Roadmap

### Planned Integrations (Next 12 months)
1. **Afterpay Integration** (Q2 2026): Buy now, pay later option
2. **Yotpo Reviews** (Q2 2026): Product reviews and ratings
3. **ShipStation** (Q3 2026): Multi-carrier shipping platform
4. **Attentive SMS** (Q3 2026): SMS marketing campaigns
5. **Okta SSO** (Q4 2026): Enterprise single sign-on

### Integration Improvements
1. Implement API versioning strategy
2. Develop integration health dashboard
3. Automate integration testing
4. Implement circuit breaker pattern for resilience

---

## Changelog

- **2026-02-03 (v1.5)**: Added INT-005 Lightspeed POS ↔ NetSuite integration details per decision to retain Lightspeed in stores. Source: note-1770165538789.txt
- **2026-01-26 (v1.4)**: Previous updates

---

*Status: Draft*
*Last Updated: 2026-02-03*
*Version: 1.5*
*Owner: Robert Kim, Infrastructure & Operations Lead*
