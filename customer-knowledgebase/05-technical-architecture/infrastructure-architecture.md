# Infrastructure Architecture - SunStyle Retail

## Document Information
- **Document ID**: IA-001
- **Version**: 1.6
- **Status**: Approved
- **Last Updated**: 2026-01-24
- **Owner**: Robert Kim, Infrastructure & Operations Lead

## Overview

This document describes the technical infrastructure architecture for SunStyle Retail's technology systems, hosted primarily on Google Cloud Platform (GCP).

## Architecture Principles

1. **Cloud-First**: Leverage cloud services for scalability and reliability
2. **Microservices**: Loosely coupled services for flexibility
3. **High Availability**: Multi-zone deployment, no single points of failure
4. **Security by Design**: Defense in depth, least privilege access
5. **Automation**: Infrastructure as Code, automated deployments
6. **Observability**: Comprehensive monitoring and logging

## Cloud Architecture (Google Cloud Platform)

### GCP Organization Structure
```
SunStyle Retail (Organization)
├── Production (Folder)
│   ├── sunstyle-prod (Project)
│   └── sunstyle-prod-data (Project)
├── Non-Production (Folder)
│   ├── sunstyle-staging (Project)
│   ├── sunstyle-dev (Project)
│   └── sunstyle-test (Project)
└── Shared Services (Folder)
    └── sunstyle-shared (Project)
```

### Regional Architecture

**Primary Region**: us-west1 (Oregon)
**Secondary Region**: us-east1 (South Carolina)

**Rationale**:
- Geographic redundancy
- Low latency for US customers
- Cost optimization
- Disaster recovery

### Network Architecture

#### VPC Configuration
- **Production VPC**: 10.0.0.0/16
  - Public Subnet (us-west1): 10.0.1.0/24
  - Private Subnet (us-west1): 10.0.2.0/24
  - Database Subnet (us-west1): 10.0.3.0/24
  - Public Subnet (us-east1): 10.0.11.0/24
  - Private Subnet (us-east1): 10.0.12.0/24
  - Database Subnet (us-east1): 10.0.13.0/24

- **Non-Production VPC**: 10.1.0.0/16
  - Similar subnet structure

#### Network Security
- **Cloud Armor**: DDoS protection, WAF rules
- **Cloud NAT**: Outbound internet access for private subnets
- **VPN**: Site-to-site VPN for office connectivity
- **Firewall Rules**: Least privilege, deny by default
- **Private Google Access**: Access GCP services without internet

## Compute Infrastructure

### Google Kubernetes Engine (GKE)

**Cluster Configuration**:
- **Production Cluster**: `sunstyle-prod-gke-cluster`
  - Node Pools:
    - General: 3-10 nodes (n2-standard-4)
    - High Memory: 2-6 nodes (n2-highmem-4)
    - Spot Instances: 0-5 nodes (cost optimization)
  - Auto-scaling: Enabled
  - Multi-zone deployment: us-west1-a, us-west1-b, us-west1-c

**Workloads on GKE**:
- E-Commerce Platform (frontend, backend)
- Order Management System
- Internal APIs and microservices
- Background job processors

**Kubernetes Features Used**:
- Horizontal Pod Autoscaler (HPA)
- Vertical Pod Autoscaler (VPA)
- Network Policies
- Secrets management
- Service mesh (Istio) for traffic management

### Compute Engine (VMs)

**VM Instances**:
- **Bastion Hosts**: 2 instances (us-west1, us-east1)
  - Size: e2-micro
  - Purpose: SSH gateway for administrative access
  - Security: IP whitelisting, MFA required

- **Legacy Applications**: 3 instances
  - Size: n2-standard-2
  - Purpose: Applications not yet containerized
  - Plan: Migrate to GKE by Q4 2026

## Database Infrastructure

### Cloud SQL (PostgreSQL)

**Primary Database**: `sunstyle-prod-db`
- Engine: PostgreSQL 15
- Size: db-n1-highmem-4 (4 vCPU, 26 GB RAM)
- Storage: 500 GB SSD
- Backups: Automated daily, 7-day retention
- High Availability: Enabled (multi-zone)
- Read Replicas: 2 replicas for read scaling

**Databases**:
- `ecommerce`: E-commerce platform data
- `oms`: Order management data
- `customers`: Customer and CRM data

**Connection Pooling**: PgBouncer
**Encryption**: At-rest (Google-managed keys), in-transit (TLS)

### Redis (Memory Store)

**Instance**: `sunstyle-prod-redis`
- Tier: Standard (High Availability)
- Size: 5 GB
- Purpose: Session management, caching, message queuing
- Persistence: RDB snapshots (hourly)

### BigQuery (Data Warehouse)

**Dataset**: `sunstyle_analytics`
- Storage: 2.5 TB
- Tables: 50+ (orders, customers, products, etc.)
- Partitioning: Date-based partitioning
- Clustering: Customer ID, product SKU
- Cost optimization: Table expiration (5 years)

## Storage

### Cloud Storage

**Buckets**:
1. **sunstyle-prod-assets**: Product images, videos
   - Storage class: Standard
   - Size: 800 GB
   - CDN: Enabled via Cloud CDN

2. **sunstyle-prod-backups**: Database and file backups
   - Storage class: Nearline
   - Size: 1.2 TB
   - Lifecycle: Delete after 90 days

3. **sunstyle-prod-logs**: Application logs (archive)
   - Storage class: Coldline
   - Lifecycle: Delete after 365 days

4. **sunstyle-prod-documents**: Business documents, reports
   - Storage class: Standard
   - Size: 50 GB
   - Versioning: Enabled

**Access Control**: IAM policies, signed URLs for temporary access

## Content Delivery

### Cloud CDN + Cloudflare

**Primary CDN**: Cloudflare (global edge network)
- **Purpose**: Static assets, product images, frontend
- **Features**: DDoS protection, WAF, image optimization
- **Caching**: Aggressive caching for static content
- **SSL**: Cloudflare Universal SSL

**Secondary CDN**: Google Cloud CDN
- **Purpose**: Backend API caching (limited)
- **Integration**: Load balancer backend

## Load Balancing

### Global Load Balancer
- **Type**: HTTP(S) Load Balancer
- **SSL**: Managed SSL certificates (auto-renewal)
- **Features**:
  - URL-based routing
  - Host-based routing
  - Health checks
  - Session affinity
  - Backend service tiers

**Traffic Distribution**:
- 100% to us-west1 (primary)
- Automatic failover to us-east1 (secondary) if primary unavailable

### Internal Load Balancer
- **Type**: TCP/UDP Load Balancer
- **Purpose**: Internal microservices communication
- **Backend**: GKE services

## Message Queue and Event Processing

### Cloud Pub/Sub

**Topics**:
- `orders-created`: New order events
- `inventory-updated`: Inventory changes
- `shipments-created`: Shipping events
- `customer-events`: Customer activity events

**Subscriptions**:
- Push subscriptions for real-time processing
- Pull subscriptions for batch processing

**Message Retention**: 7 days
**Ordering**: Not guaranteed (design for idempotency)

## Serverless Components

### Cloud Functions

**Functions Deployed**:
1. **Image Processor**: Resize and optimize product images
2. **Webhook Handler**: Process third-party webhooks
3. **Data Validator**: Validate incoming data files
4. **Report Generator**: Generate scheduled reports

**Runtime**: Node.js 20
**Trigger**: HTTP, Pub/Sub, Cloud Storage events
**Timeout**: 60 seconds (default), 540 seconds (max)

### Cloud Run

**Services**:
- **PDF Generator**: Generate invoices and reports
- **Email Renderer**: Render email templates

**Advantages**: Automatic scaling to zero, pay-per-use

## Monitoring and Observability

### Google Cloud Operations

**Cloud Monitoring**:
- Infrastructure metrics (CPU, memory, disk, network)
- Application metrics (requests, errors, latency)
- Custom metrics (business KPIs)
- Uptime checks (synthetic monitoring)

**Cloud Logging**:
- Centralized log aggregation
- Log-based metrics
- Log exports to BigQuery (analysis)
- Retention: 30 days (default), 365 days (exported)

**Cloud Trace**:
- Distributed tracing for requests
- Latency analysis
- Performance debugging

### Datadog (Third-Party)

**Monitoring**:
- Application Performance Monitoring (APM)
- Infrastructure monitoring
- Log management
- Real User Monitoring (RUM)
- Synthetic monitoring

**Dashboards**:
- Executive dashboard (business metrics)
- Operations dashboard (system health)
- Application dashboard (per service)

**Alerting**:
- PagerDuty integration for critical alerts
- Slack for warnings and informational alerts
- Email for daily/weekly reports

## Security Architecture

### Identity and Access Management (IAM)

**Principles**:
- Least privilege access
- Role-based access control
- Service accounts for applications
- User accounts for individuals
- MFA required for all users

**GCP IAM Roles**:
- Organization Admin: 2 users
- Project Owner: 5 users (per project)
- Project Editor: 10 users (per project)
- Project Viewer: 20 users (per project)
- Custom roles: For specific service access

### Secrets Management

**Google Secret Manager**:
- Store API keys, passwords, certificates
- Automatic rotation (where supported)
- Access logging and auditing
- Version control

**Secret Access**:
- Applications access via Secret Manager API
- Developers access via `gcloud` CLI (MFA required)
- No secrets in code or configuration files

### Network Security

**Layers**:
1. **Cloud Armor**: DDoS protection, WAF
2. **Firewall Rules**: VPC-level firewall
3. **Network Policies**: Kubernetes-level network isolation
4. **Private Endpoints**: Internal-only services
5. **VPN/Interconnect**: Secure connectivity

**Security Monitoring**:
- Cloud IDS (Intrusion Detection)
- Security Command Center
- Vulnerability scanning (weekly)

### Data Security

**Encryption**:
- At-rest: Google-managed encryption keys (default)
- In-transit: TLS 1.3 for all connections
- Application-level: PII encrypted in database

**Data Loss Prevention (DLP)**:
- Scan for sensitive data (PII, PCI)
- Automated detection and redaction
- Compliance reporting

**Backup and Recovery**:
- Database: Automated daily backups, 7-day retention
- Files: Versioning enabled, lifecycle management
- Disaster recovery: RTO 4 hours, RPO 1 hour

## Deployment Architecture

### CI/CD Pipeline

**Source Control**: GitHub
**CI/CD Platform**: GitHub Actions

**Pipeline Stages**:
1. **Code Commit**: Developer pushes code to GitHub
2. **Build**: Compile, lint, unit tests
3. **Container Build**: Docker image build
4. **Push to Registry**: Google Container Registry (GCR)
5. **Deploy to Staging**: Automated deployment to staging
6. **Integration Tests**: Automated tests on staging
7. **Manual Approval**: Required for production
8. **Deploy to Production**: Rolling update on GKE

**Deployment Strategy**:
- **Rolling Update**: Zero-downtime deployment
- **Blue-Green**: For major releases (manual)
- **Canary**: For high-risk changes (10% → 50% → 100%)

### Infrastructure as Code

**Terraform**:
- Manage all GCP resources
- Version controlled (GitHub)
- State stored in Cloud Storage (with locking)
- Separate workspaces for environments

**Modules**:
- Networking (VPC, subnets, firewall)
- Compute (GKE, VMs)
- Database (Cloud SQL, Redis)
- Storage (Cloud Storage buckets)
- Security (IAM, Secret Manager)

## Disaster Recovery

### Backup Strategy

**Database Backups**:
- Automated daily backups (retained 7 days)
- Weekly backups (retained 4 weeks)
- Monthly backups (retained 12 months)
- Backup storage: Multi-region

**File Backups**:
- Cloud Storage versioning (30-day retention)
- Critical files: Cross-region replication

**Configuration Backups**:
- Infrastructure as Code (Terraform) in GitHub
- Kubernetes manifests in GitHub
- Application configuration in Secret Manager

### Disaster Recovery Plan

**Scenarios**:
1. **Regional Failure**: Failover to secondary region (us-east1)
2. **Data Corruption**: Restore from backup
3. **Security Breach**: Isolate affected systems, restore from clean state
4. **Complete Data Center Loss**: Rebuild in secondary region

**Recovery Procedures**:
- Documented runbooks for each scenario
- Quarterly DR drills
- RTO: 4 hours
- RPO: 1 hour

## Scalability and Performance

### Auto-Scaling

**GKE Auto-Scaling**:
- **Horizontal Pod Autoscaler**: Scale pods based on CPU/memory
  - Min replicas: 2
  - Max replicas: 20
  - Target CPU: 70%

- **Cluster Autoscaler**: Scale nodes based on pod demand
  - Min nodes: 3
  - Max nodes: 15

**Database Scaling**:
- **Read Replicas**: 2 replicas for read traffic
- **Vertical Scaling**: Upgrade instance size (planned maintenance)
- **Connection Pooling**: PgBouncer to manage connections

**Caching**:
- Redis for session and API caching
- Cloud CDN for static assets
- Application-level caching

### Performance Optimization

**Strategies**:
- Database indexing (query optimization)
- CDN for static content
- Image optimization (WebP, lazy loading)
- Code splitting (frontend)
- API response caching
- Database query optimization

## Cost Optimization

### Cost Management Strategies

1. **Rightsizing**: Monitor and adjust instance sizes
2. **Committed Use Discounts**: 1-year and 3-year commitments
3. **Spot Instances**: For non-critical workloads
4. **Auto-Scaling**: Scale down during low traffic
5. **Storage Lifecycle**: Move old data to cheaper storage classes
6. **Reserved IPs**: Release unused static IPs

### Cost Monitoring

**Tools**:
- GCP Cost Management Dashboard
- Budget alerts (monthly threshold)
- Cost allocation by project/service
- FinOps practices (monthly review)

**Current Monthly Costs**:
- Compute (GKE, VMs): $8,000
- Database (Cloud SQL, Redis): $3,500
- Storage (Cloud Storage, BigQuery): $1,800
- Networking (Load Balancer, CDN): $1,200
- Other (Logging, Monitoring): $500
- **Total**: ~$15,000/month

---

*Status: Approved*
*Last Updated: 2026-01-24*
*Version: 1.6*
*Owner: Robert Kim, Infrastructure & Operations Lead*
