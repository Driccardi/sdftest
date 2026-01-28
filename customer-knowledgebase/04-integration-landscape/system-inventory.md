# System Inventory - SunStyle Retail

## Document Information
- **Document ID**: SI-001
- **Version**: 2.2
- **Status**: Approved
- **Last Updated**: 2026-01-25
- **Owner**: James Chen, CTO

## Overview

This document catalogs all systems and applications used by SunStyle Retail, including their purpose, ownership, vendor information, and technical details.

## Core Business Systems

### 1. E-Commerce Platform
**System Name**: SunStyle Digital Commerce
**Type**: Custom-built on Shopify Plus
**Vendor**: Shopify (platform), Internal Development (customizations)
**Version**: Shopify Plus 2025.1, Custom modules v3.2

**Purpose**: Customer-facing e-commerce website

**Key Features**:
- Product catalog and search
- Shopping cart and checkout
- Customer accounts and authentication
- Order management
- Virtual try-on (AR)
- Personalized recommendations
- Content management

**Technology Stack**:
- Frontend: React 18, Next.js 14
- Backend: Node.js 20, Shopify APIs
- Database: PostgreSQL 15 (customer data), Shopify (products/orders)
- Hosting: Google Cloud Platform (GCP)
- CDN: Cloudflare

**Users**: Customers (85,000+ active)
**Administrators**: E-commerce operations team (10 users)

**Integrations**:
- Payment Gateway (Stripe, PayPal)
- Inventory Management System
- Customer Service Platform
- Email Marketing System
- Analytics Platform

**Vendor Contact**:
- Shopify Support: partners@shopify.com
- Account Manager: Jennifer Clark, jennifer.clark@shopify.com

**License**: Shopify Plus subscription, $2,000/month
**Support Contract**: Included with subscription
**Renewal Date**: 2026-08-15

---

### 2. Mobile Applications
**System Name**: SunStyle Mobile App (iOS & Android)
**Type**: Custom-built
**Vendor**: Internal Development
**Version**: iOS v2.8.1, Android v2.8.0

**Purpose**: Mobile shopping and customer engagement

**Key Features**:
- Product browsing and search
- Virtual try-on (AR)
- Mobile checkout
- Order tracking
- Store locator
- Push notifications
- Mobile-exclusive deals
- Loyalty program access

**Technology Stack**:
- Framework: React Native 0.72
- Backend APIs: Node.js REST and GraphQL
- Authentication: OAuth 2.0
- Analytics: Firebase, Mixpanel
- Push Notifications: Firebase Cloud Messaging

**Users**: 45,000 monthly active users
**Downloads**: 125,000+ (iOS: 70k, Android: 55k)

**Integrations**:
- E-Commerce Platform APIs
- Payment Gateway
- Customer Service Platform
- Analytics Platform
- Push Notification Service

**App Store Links**:
- iOS: https://apps.apple.com/app/sunstyle-retail/id123456789
- Android: https://play.google.com/store/apps/details?id=com.sunstyle.retail

**Release Cycle**: Bi-weekly updates
**Last Release**: 2026-01-15

---

### 3. Point of Sale (POS) System
**System Name**: Lightspeed Retail POS
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: Lightspeed Commerce
**Version**: Lightspeed Retail X-Series

**Purpose**: In-store sales transactions and inventory management

**Key Features**:
- Transaction processing
- Customer lookup and loyalty integration
- Inventory management (store level)
- Employee management
- Sales reporting
- Offline mode

**Technology Stack**:
- Platform: Cloud-based SaaS
- Hardware: iPad POS terminals, receipt printers, barcode scanners
- Network: Store WiFi, 4G LTE backup

**Users**: 205 store associates, 25 store managers
**Locations**: 25 retail stores

**Integrations**:
- Payment Processor (Stripe Terminal)
- Inventory Management System
- Customer Management System
- Employee Management System

**Vendor Contact**:
- Lightspeed Support: support@lightspeedhq.com
- Account Manager: Tom Reynolds, tom.reynolds@lightspeedhq.com

**License**: Per-location subscription, $299/month per store = $7,475/month total
**Support Contract**: 24/7 support included
**Renewal Date**: 2026-06-30

---

### 4. Order Management System (OMS)
**System Name**: SunStyle Order Hub
**Type**: Custom-built
**Vendor**: Internal Development
**Version**: 4.1.2

**Purpose**: Centralized order processing and fulfillment

**Key Features**:
- Omnichannel order aggregation
- Order routing and fulfillment
- Inventory reservation
- Shipment tracking
- Returns and exchanges
- Order analytics

**Technology Stack**:
- Backend: Node.js 20, TypeScript
- Database: PostgreSQL 15
- Message Queue: Google Cloud Pub/Sub
- API: RESTful, GraphQL
- Hosting: Google Kubernetes Engine (GKE)

**Users**: 
- System-to-system integrations (automated)
- Warehouse staff (20 users)
- Customer service team (25 users)

**Integrations**:
- E-Commerce Platform
- POS System
- Inventory Management System
- Shipping Carriers (FedEx, UPS, USPS)
- Customer Service Platform
- Payment Gateway

**Development Team**: Internal (5 developers)
**Support**: Internal IT support

---

### 5. Inventory Management System (IMS)
**System Name**: NetSuite Inventory Management
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: Oracle NetSuite
**Version**: NetSuite 2025.1

**Purpose**: Enterprise inventory and supply chain management

**Key Features**:
- Multi-location inventory tracking
- Purchase order management
- Receiving and put-away
- Cycle counting
- Inventory transfers
- Demand forecasting
- Replenishment automation
- Vendor management

**Technology Stack**:
- Platform: Cloud-based SaaS
- Database: Oracle Database (managed by NetSuite)
- API: RESTful (SuiteScript)
- Mobile: NetSuite Mobile app

**Users**: 
- Supply chain team (15 users)
- Warehouse staff (25 users)
- Store managers (25 users)
- Finance team (10 users)

**Integrations**:
- E-Commerce Platform
- POS System
- Order Management System
- Financial System (QuickBooks)
- Vendor EDI connections

**Vendor Contact**:
- NetSuite Support: support@netsuite.com
- Account Manager: Rachel Adams, rachel.adams@netsuite.com

**License**: User-based subscription, $50,000/year
**Support Contract**: Premium support included
**Renewal Date**: 2026-09-01

---

### 6. Customer Relationship Management (CRM)
**System Name**: Salesforce Sales Cloud & Service Cloud
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: Salesforce
**Version**: Summer '25 Release

**Purpose**: Customer relationship and service management

**Key Features**:
- Customer 360-degree view
- Lead and opportunity management
- Case management
- Service ticketing
- Loyalty program management
- Marketing automation
- Analytics and reporting

**Technology Stack**:
- Platform: Salesforce Cloud
- Customization: Apex, Visualforce, Lightning Web Components
- Integration: REST APIs, MuleSoft connectors

**Users**:
- Sales team (12 users)
- Customer service team (25 users)
- Marketing team (10 users)
- Executives (5 users)

**Integrations**:
- E-Commerce Platform
- Order Management System
- Email Marketing System
- Customer Service Platform
- Business Intelligence Platform

**Vendor Contact**:
- Salesforce Support: support@salesforce.com
- Account Executive: David Park, dpark@salesforce.com

**License**: 
- Sales Cloud: 12 licenses x $150/user/month = $1,800/month
- Service Cloud: 25 licenses x $75/user/month = $1,875/month
- Total: $3,675/month ($44,100/year)

**Support Contract**: Premier Success Plan included
**Renewal Date**: 2026-07-01

---

### 7. Customer Service Platform
**System Name**: Zendesk Support Suite
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: Zendesk
**Version**: Enterprise Suite

**Purpose**: Multi-channel customer support and ticketing

**Key Features**:
- Ticket management
- Multi-channel support (email, chat, phone, social media)
- Knowledge base
- Customer self-service portal
- SLA management
- Agent productivity tools
- Reporting and analytics

**Technology Stack**:
- Platform: Cloud-based SaaS
- Integration: REST APIs, webhooks
- Chat widget: JavaScript SDK

**Users**: 
- Customer service representatives (25 users)
- Supervisors (3 users)
- Administrators (2 users)

**Integrations**:
- CRM (Salesforce)
- Order Management System
- E-Commerce Platform
- Phone system (Twilio)
- Social media platforms

**Vendor Contact**:
- Zendesk Support: support@zendesk.com
- Account Manager: Lisa Wong, lwong@zendesk.com

**License**: 30 licenses x $115/user/month = $3,450/month ($41,400/year)
**Support Contract**: Included
**Renewal Date**: 2026-11-15

---

### 8. Email Marketing System
**System Name**: SendGrid Marketing Campaigns + Klaviyo
**Type**: Commercial Off-The-Shelf (COTS)
**Vendors**: Twilio SendGrid, Klaviyo
**Versions**: SendGrid v3 API, Klaviyo Current

**Purpose**: Transactional and marketing email communications

**Key Features**:
**SendGrid** (Transactional emails):
- Order confirmations
- Shipping notifications
- Password resets
- Account notifications
- Email deliverability management

**Klaviyo** (Marketing emails):
- Email campaigns
- Segmentation and personalization
- A/B testing
- Automated flows (abandoned cart, welcome series)
- Analytics and reporting

**Technology Stack**:
- Platform: Cloud-based SaaS
- Integration: REST APIs
- Email Templates: HTML/CSS

**Users**: 
- Marketing team (7 users)
- System automated sends

**Subscriber Base**: 95,000 customers

**Integrations**:
- E-Commerce Platform
- CRM (Salesforce)
- Customer Service Platform
- Analytics Platform

**Vendor Contacts**:
- SendGrid Support: support@sendgrid.com
- Klaviyo Support: support@klaviyo.com

**License**:
- SendGrid: $89.95/month (100k emails)
- Klaviyo: $700/month (95k contacts)
- Total: $789.95/month ($9,479/year)

**Renewal Dates**: SendGrid 2026-05-01, Klaviyo 2026-08-01

---

### 9. Payment Gateway
**System Name**: Stripe Payments + PayPal
**Type**: Payment Service Provider
**Vendors**: Stripe, PayPal
**Version**: Latest APIs

**Purpose**: Payment processing for online and in-store transactions

**Key Features**:
**Stripe** (Primary):
- Credit/debit card processing
- Digital wallets (Apple Pay, Google Pay)
- Subscription billing
- Fraud detection (Radar)
- PCI compliance
- Stripe Terminal (in-store)
- 3D Secure authentication

**PayPal** (Alternative):
- PayPal wallet payments
- Pay in 4 (buy now, pay later)

**Technology Stack**:
- Integration: REST APIs, JavaScript SDK
- Tokenization: PCI-compliant
- Hardware: Stripe Terminal readers (in-store)

**Transaction Volume**: 
- ~150,000 transactions/month
- ~$4M/month transaction value

**Integrations**:
- E-Commerce Platform
- Mobile Apps
- POS System
- Order Management System
- Financial System

**Vendor Contacts**:
- Stripe Support: support@stripe.com
- PayPal Support: merchantsupport@paypal.com

**Pricing**:
- Stripe: 2.9% + $0.30 per transaction (online), 2.7% + $0.05 (in-person)
- PayPal: 3.49% + $0.49 per transaction

**Compliance**: PCI-DSS Level 1 certified

---

### 10. Financial System
**System Name**: QuickBooks Online Advanced
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: Intuit
**Version**: QuickBooks Online Advanced

**Purpose**: Accounting and financial management

**Key Features**:
- General ledger
- Accounts payable/receivable
- Financial reporting
- Budgeting and forecasting
- Tax management
- Payroll integration
- Multi-entity support

**Technology Stack**:
- Platform: Cloud-based SaaS
- Integration: REST APIs

**Users**:
- Finance team (8 users)
- CFO (1 user)
- Accountants (3 external users)

**Integrations**:
- Inventory Management System (NetSuite)
- Payment Gateway (Stripe, PayPal)
- Payroll System (ADP)
- Banking institutions

**Vendor Contact**:
- QuickBooks Support: support@intuit.com

**License**: $200/month ($2,400/year)
**Support Contract**: Included
**Renewal Date**: 2026-12-31

## Supporting Systems

### 11. Business Intelligence & Analytics
**System Name**: Looker (Google Cloud)
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: Google Cloud
**Version**: Latest

**Purpose**: Data visualization and business intelligence

**Key Features**:
- Interactive dashboards
- Custom reports
- Data exploration
- Scheduled reports
- Embedded analytics

**Data Sources**:
- BigQuery (data warehouse)
- PostgreSQL (transactional databases)
- Google Analytics
- Salesforce
- NetSuite

**Users**: 45 users across all departments

**License**: $5,000/month ($60,000/year)
**Renewal Date**: 2026-10-01

---

### 12. Data Warehouse
**System Name**: Google BigQuery
**Type**: Cloud Data Warehouse
**Vendor**: Google Cloud
**Version**: Current

**Purpose**: Centralized data storage and analytics

**Data Volume**: 2.5 TB
**Query Volume**: ~10,000 queries/month

**Data Sources**:
- E-Commerce Platform
- POS System
- Order Management System
- CRM
- Marketing platforms
- Web analytics

**ETL Process**: Apache Airflow (Cloud Composer)

**Cost**: ~$1,200/month (storage + queries)

---

### 13. Web Analytics
**System Name**: Google Analytics 4 + Mixpanel
**Type**: Analytics SaaS
**Vendors**: Google, Mixpanel
**Versions**: GA4, Mixpanel Current

**Purpose**: Website and app user behavior analytics

**Features**:
- User tracking
- Conversion tracking
- Funnel analysis
- Cohort analysis
- Event tracking
- Custom dimensions

**Implementation**:
- GA4: JavaScript tag
- Mixpanel: JavaScript SDK, mobile SDKs

**Users**: Marketing team, product team, executives

**Cost**:
- GA4: Free tier
- Mixpanel: $899/month ($10,788/year)

---

### 14. Infrastructure & Hosting
**System Name**: Google Cloud Platform (GCP)
**Type**: Cloud Infrastructure
**Vendor**: Google Cloud
**Services Used**:
- Compute Engine (VMs)
- Google Kubernetes Engine (GKE)
- Cloud SQL (PostgreSQL)
- Cloud Storage
- Cloud CDN
- Cloud Load Balancing
- Cloud Pub/Sub
- Cloud Functions
- Cloud Logging
- Cloud Monitoring

**Monthly Cost**: ~$15,000/month ($180,000/year)

**Support**: Enterprise support contract

---

### 15. Security & Monitoring
**System Name**: Datadog
**Type**: Monitoring & Observability Platform
**Vendor**: Datadog
**Version**: Current

**Purpose**: Application and infrastructure monitoring

**Features**:
- Application Performance Monitoring (APM)
- Infrastructure monitoring
- Log management
- Alerting
- Dashboards
- Security monitoring

**Monitored Resources**: All production systems

**Users**: IT operations, development teams

**License**: $3,500/month ($42,000/year)
**Renewal Date**: 2026-04-01

---

### 16. Communication & Collaboration
**System Name**: Google Workspace
**Type**: Productivity Suite
**Vendor**: Google
**Version**: Business Plus

**Services**:
- Gmail (email)
- Google Drive (file storage)
- Google Docs, Sheets, Slides
- Google Meet (video conferencing)
- Google Calendar
- Google Chat

**Users**: 320 employees

**License**: 320 users x $18/user/month = $5,760/month ($69,120/year)
**Renewal Date**: 2026-03-15

---

### 17. Human Resources Management System (HRMS)
**System Name**: BambooHR
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: BambooHR
**Version**: Current

**Purpose**: Employee management and HR processes

**Features**:
- Employee records
- Time-off management
- Performance management
- Onboarding/offboarding
- Org charts
- HR reporting

**Users**: 
- All employees (self-service): 320
- HR team: 6
- Managers: 35

**License**: $8,500/year
**Renewal Date**: 2026-06-01

---

### 18. Payroll System
**System Name**: ADP Workforce Now
**Type**: Commercial Off-The-Shelf (COTS)
**Vendor**: ADP
**Version**: Current

**Purpose**: Payroll processing and tax compliance

**Features**:
- Payroll processing
- Tax filing and compliance
- Direct deposit
- Pay stub access
- W-2 generation
- Benefits administration

**Employees**: 320

**Integration**: BambooHR (HRMS), QuickBooks (Financial)

**License**: ~$15,000/year
**Renewal Date**: 2026-12-31

## System Summary

### By Category

| Category | Number of Systems | Annual Cost |
|----------|-------------------|-------------|
| Core Business Systems | 10 | ~$320,000 |
| Supporting Systems | 8 | ~$360,000 |
| **Total** | **18** | **~$680,000** |

### By Deployment Model

| Deployment Model | Systems | Percentage |
|------------------|---------|------------|
| SaaS | 14 | 78% |
| Custom-built | 3 | 17% |
| Hybrid (Shopify Plus) | 1 | 5% |

### By Vendor

| Vendor | Systems |
|--------|---------|
| Google | 5 (GCP, Looker, Workspace, Analytics, BigQuery) |
| Internal | 3 (Mobile Apps, OMS, E-commerce customizations) |
| Salesforce | 1 (CRM) |
| Shopify | 1 (E-commerce platform) |
| Others | 8 (various vendors) |

## System Lifecycle Management

### Upgrade Schedule
- **Quarterly**: Custom applications (OMS, Mobile Apps)
- **Monthly**: SaaS platforms (automatic updates)
- **As needed**: Critical security patches

### End-of-Life Planning
- NetSuite: No planned replacement
- Salesforce: No planned replacement
- QuickBooks: Considering NetSuite Financials in 2027
- Custom systems: Ongoing maintenance and enhancement

## Compliance and Security

### Compliance Requirements
- PCI-DSS Level 1 (payment systems)
- GDPR (customer data)
- CCPA (California customers)
- SOC 2 Type II (in progress for 2026)

### Security Measures
- All systems require MFA for administrative access
- SSO implemented via Google Workspace (where supported)
- Regular security audits
- Penetration testing (annual)
- Vulnerability scanning (weekly)

---

*Status: Approved*
*Last Updated: 2026-01-25*
*Version: 2.2*
*Owner: James Chen, CTO*
