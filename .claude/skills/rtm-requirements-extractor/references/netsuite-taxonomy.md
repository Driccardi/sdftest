# NetSuite Configuration Taxonomy

This document defines the numbering scheme and categorization for configuration planning. This taxonomy applies to multiple project directories as specified in `project-taxonomy.md`.

**Version:** 2.0.0  
**Last Updated:** 2026-01-30  
**Maintained By:** Implementation Standards Team

---

## Directory Structure

All directories governed by this taxonomy **must** contain the following top-level subfolders, organized by thousands-range categories:

```
{taxonomy-governed-directory}/
├── process-areas/                # 10-999: End-to-end business processes
├── feature-modules/              # 1000-1999: NetSuite native modules
├── suite-apps/                   # 2000-2999: Third-party SuiteApps
├── integrations/                 # 3000-3999: External system integrations
├── customizations/               # 4000-4999: Custom development
└── [directory-specific files]    # Summary docs, logs, etc.
```

### Directories Using This Taxonomy

| Directory | Purpose | Additional Subfolders |
|-----------|---------|----------------------|
| `/configuration-plan` | Planned configuration | `_tracking/`, `_archived/` |
| `/configuration-execution` | Built configuration | — |
| `/solutions` | Design documentation | `environment-design/` |
| `/test-plan` | Test planning | `role-based/` (optional) |
| `/test-execution` | Test results | `unit-tests/`, `e2e-tests/`, `uat/`, `defects/` |

---

## Numbering Ranges

| Range | Category | Subfolder | Description |
|-------|----------|-----------|-------------|
| 10-999 | Process Areas | `process-areas/` | End-to-end business processes |
| 1000-1999 | Feature Modules | `feature-modules/` | NetSuite native modules and features |
| 2000-2999 | SuiteApps | `suite-apps/` | Third-party and published SuiteApps |
| 3000-3999 | Integrations | `integrations/` | External system integrations |
| 4000-4999 | Customizations | `customizations/` | Custom development beyond standard config |

---

## Process Areas (10-999)

**Subfolder:** `process-areas/`

End-to-end business processes. **This list is not exhaustive** — create additional process areas as the project requires.

| Code | Process Area | Description |
|------|--------------|-------------|
| 10 | Record to Report | Financial close, GL, reporting, consolidation |
| 20 | Procure to Pay | Purchasing, vendor management, AP |
| 30 | Order to Cash | Sales orders, fulfillment, invoicing, AR |
| 40 | Plan to Inventory | Demand planning, inventory management, transfers |
| 50 | Project to Cash | Project management, resource allocation, billing |
| 60 | Hire to Retire | HR, payroll, employee lifecycle |
| 70 | Market to ROI | Campaigns, lead management, attribution |
| 80 | Case to Resolution | Customer service, support cases |
| 90 | Design to Build | Product lifecycle, engineering, BOM management |
| 100 | Web to Order | E-commerce, online sales, cart management |
| 110 | Wave to Ship | Warehouse operations, picking, packing, shipping |
| 120 | Return to Refund | RMA processing, credits, refunds |
| ... | *Add as needed* | *Create codes 130-999 based on project requirements* |

### Process Area File Structure

```
process-areas/
├── 010-Record-to-Report/
│   ├── 010.010-Chart-of-Accounts.md
│   ├── 010.020-Period-Close-Process.md
│   └── 010.030-Financial-Reporting.md
├── 030-Order-to-Cash/
│   ├── 030.010-Sales-Order-Entry.md
│   ├── 030.020-Fulfillment-Process.md
│   ├── 030.030-Invoicing.md
│   └── 030.040-AR-Collections.md
└── [additional process areas as needed]
```

---

## Feature Modules (1000-1999)

**Subfolder:** `feature-modules/`

NetSuite native modules and features requiring specific configuration.

| Code | Module | Notes |
|------|--------|-------|
| 1010 | Fixed Assets | Depreciation, asset tracking |
| 1020 | Advanced Revenue Management (ARM) | Revenue recognition, contracts |
| 1030 | SuiteBilling | Subscription billing, usage rating |
| 1040 | WMS | Warehouse management system |
| 1050 | Manufacturing | Work orders, routing, WIP |
| 1060 | Advanced CRM | Sales force automation, forecasting |
| 1070 | ShipCentral | Shipping integration hub |
| 1080 | SuiteCommerce / SCA | E-commerce platform |
| 1090 | Dunning | Collections automation |
| 1100 | Multi-Book Accounting | Secondary accounting books |
| 1110 | Intercompany Management | Cross-subsidiary transactions |
| ... | *Add as needed* | *Create codes 1120-1999 based on project requirements* |

### Feature Module File Structure

```
feature-modules/
├── 1010-Fixed-Assets/
│   ├── 1010.010-Asset-Types-Setup.md
│   ├── 1010.020-Depreciation-Rules.md
│   └── 1010.030-Asset-Lifecycle.md
├── 1050-Manufacturing/
│   ├── 1050.010-Work-Order-Configuration.md
│   ├── 1050.020-Routing-Setup.md
│   └── 1050.030-WIP-Accounting.md
└── [additional modules as needed]
```

---

## SuiteApps (2000-2999)

**Subfolder:** `suite-apps/`

Third-party and published SuiteApps from the SuiteApp marketplace.

| Code | SuiteApp | Publisher | Notes |
|------|----------|-----------|-------|
| 2010 | *Example: RFIO* | *Publisher* | *Purpose* |
| 2020 | *Example: Celigo Integrator* | Celigo | iPaaS integration platform |
| 2030 | *Example: RF-SMART* | RF-SMART | Warehouse mobility |
| ... | *Add as needed* | | *Populate based on project requirements* |

### SuiteApp Planning Requirements

Each SuiteApp document should include:
- Installation steps and prerequisites
- Configuration settings
- Custom fields/records required for integration
- Testing considerations
- Licensing/cost notes if known
- Version compatibility notes

### SuiteApp File Structure

```
suite-apps/
├── 2020-Celigo-Integrator/
│   ├── 2020.010-Installation-Setup.md
│   ├── 2020.020-Flow-Configuration.md
│   └── 2020.030-Error-Handling.md
└── [additional SuiteApps as needed]
```

---

## Integrations (3000-3999)

**Subfolder:** `integrations/`

External system integrations (not SuiteApps).

| Code | Integration | Direction | Protocol |
|------|-------------|-----------|----------|
| 3010 | *Example: Salesforce CRM* | Bidirectional | REST API |
| 3020 | *Example: Shopify* | Inbound | Webhook |
| 3030 | *Example: Banking/Lockbox* | Inbound | SFTP/CSV |
| 3040 | *Example: EDI/Trading Partners* | Bidirectional | AS2/SFTP |
| 3050 | *Example: Tax Engine (Avalara)* | Outbound | REST API |
| ... | *Add as needed* | | *Populate based on project requirements* |

### Integration Planning Requirements

Each integration document should include:
- Authentication setup (OAuth, token-based, etc.)
- Field mapping specifications
- Transformation logic
- Error handling approach
- Monitoring and alerting
- Sandbox/testing environment needs
- Volume and frequency requirements
- Retry and recovery procedures

### Integration File Structure

```
integrations/
├── 3010-Salesforce-CRM/
│   ├── 3010.010-Authentication-Setup.md
│   ├── 3010.020-Customer-Sync.md
│   ├── 3010.030-Opportunity-Sync.md
│   └── 3010.040-Error-Handling.md
├── 3030-Bank-Lockbox/
│   ├── 3030.010-File-Format-Spec.md
│   ├── 3030.020-Import-Process.md
│   └── 3030.030-Reconciliation.md
└── [additional integrations as needed]
```

---

## Customizations (4000-4999)

**Subfolder:** `customizations/`

Custom development beyond standard configuration.

| Code | Customization Type | Examples |
|------|-------------------|----------|
| 4010 | Custom Records & Fields | Data model extensions |
| 4020 | SuiteScripts | User Event, Client, Scheduled, Map/Reduce, Restlets, Suitelets |
| 4030 | SuiteFlow Workflows | Complex approval chains, automations |
| 4040 | Custom PDF/HTML Templates | Invoice, PO, Packing Slip designs |
| 4050 | Saved Searches & Reports | Complex reporting requirements |
| 4060 | Portlets & Dashboards | Executive dashboards, KPI displays |
| 4070 | Single Page Applications | Custom UIs, Suitelets with React/Vue |
| 4080 | SuiteQL & Analytics | Workbooks, datasets, custom analytics |
| ... | *Add as needed* | *Create based on project requirements* |

### Customization File Structure

```
customizations/
├── 4010-Custom-Records/
│   ├── 4010.010-Data-Model-Overview.md
│   ├── 4010.020-Custom-Record-Definitions.md
│   └── 4010.030-Field-Specifications.md
├── 4020-SuiteScripts/
│   ├── 4020.010-Script-Inventory.md
│   ├── 4020.020-User-Event-Scripts.md
│   └── 4020.030-Scheduled-Scripts.md
├── 4040-Custom-Templates/
│   ├── 4040.010-Invoice-Template.md
│   └── 4040.020-Packing-Slip-Template.md
└── [additional customization types as needed]
```

---

## File Naming Convention

### Directory Names

Zero-padded code followed by descriptive name with hyphens:

```
{zero-padded-code}-{Descriptive-Name}/

Examples:
010-Record-to-Report/
030-Order-to-Cash/
1010-Fixed-Assets/
2010-RFIO-SuiteApp/
3010-Salesforce-Integration/
4010-Custom-Records/
```

### File Names

Area code, sequence number, and descriptive name:

```
{area-code}.{sequence}-{Descriptive-Name}.md

Examples:
030.010-Sales-Order-Entry.md
030.020-Fulfillment-Process.md
030.030-Invoicing.md
1050.010-Work-Order-Configuration.md
3010.020-Customer-Sync.md
```

### Sequence Number Guidelines

- Use increments of 10 (010, 020, 030) to allow insertion
- Zero-pad to three digits for proper sorting
- Group related topics with consecutive numbers

---

## Industry-Specific Considerations

When assigning codes and creating phases, apply industry knowledge:

### Manufacturing
- Model/part supersession tracking (custom fields for effective dates, replacement chains)
- Engineering change order workflows
- BOM versioning and revision control
- Quality hold and inspection processes

### Wholesale Distribution
- Complex pricing structures (price books, quantity breaks, customer-specific)
- Rebate and promotional pricing management
- Vendor compliance and chargebacks
- EDI transaction handling

### Software / SaaS
- Subscription lifecycle management
- Usage-based billing and metering
- Revenue recognition complexity (ASC 606)
- Contract modifications and amendments

### Professional Services
- Resource utilization tracking
- Project profitability analysis
- Time and expense capture workflows
- Billing milestone management

### Retail / E-commerce
- High-volume transaction handling
- Multi-channel inventory visibility
- Return and exchange processing
- Gift card and loyalty programs

### Healthcare
- HIPAA compliance considerations
- Patient/member data handling
- Claim and reimbursement tracking
- Regulatory reporting requirements

### Nonprofit
- Fund accounting and restrictions
- Grant management and reporting
- Donor management
- Program expense allocation

---

## Complete Example: Configuration-Plan Directory

```
configuration-plan/
├── process-areas/
│   ├── 010-Record-to-Report/
│   │   ├── 010.010-Chart-of-Accounts.md
│   │   ├── 010.020-Period-Close.md
│   │   └── 010.030-Financial-Statements.md
│   ├── 030-Order-to-Cash/
│   │   ├── 030.010-Sales-Order-Entry.md
│   │   ├── 030.020-Pricing-Configuration.md
│   │   ├── 030.030-Fulfillment-Process.md
│   │   ├── 030.040-Invoicing.md
│   │   └── 030.050-AR-Collections.md
│   └── 110-Wave-to-Ship/
│       ├── 110.010-Warehouse-Setup.md
│       └── 110.020-Pick-Pack-Ship.md
├── feature-modules/
│   ├── 1040-WMS/
│   │   ├── 1040.010-Location-Setup.md
│   │   └── 1040.020-Bin-Management.md
│   └── 1090-Dunning/
│       └── 1090.010-Dunning-Procedures.md
├── suite-apps/
│   └── 2030-RF-SMART/
│       ├── 2030.010-Installation.md
│       └── 2030.020-Device-Configuration.md
├── integrations/
│   ├── 3010-Salesforce/
│   │   ├── 3010.010-Authentication.md
│   │   └── 3010.020-Contact-Sync.md
│   └── 3020-Shopify/
│       └── 3020.010-Order-Import.md
├── customizations/
│   ├── 4020-SuiteScripts/
│   │   └── 4020.010-Order-Validation-UE.md
│   └── 4040-Custom-Templates/
│       └── 4040.010-Invoice-Template.md
├── _tracking/
│   ├── decisions-log.md
│   ├── open-items.md
│   └── phase-status.md
├── _archived/
│   └── [superseded plans]
└── configuration-summary.md
```

---

## Cross-Reference Matrix

Use this matrix to map business requirements to taxonomy codes:

| Business Need | Process Area | Feature Module | Potential SuiteApps | Integration Points |
|---------------|--------------|----------------|---------------------|-------------------|
| Sales orders | 30 O2C | — | — | CRM (3010) |
| Warehouse ops | 110 Wave-to-Ship | 1040 WMS | 2030 RF-SMART | — |
| Subscriptions | 30 O2C | 1030 SuiteBilling | — | — |
| Manufacturing | 90 Design-to-Build | 1050 Manufacturing | — | PLM (30xx) |
| E-commerce | 100 Web-to-Order | 1080 SuiteCommerce | — | Shopify (3020) |

---

## Maintenance

### Adding New Codes

1. Identify the appropriate range (process, module, app, integration, customization)
2. Check for existing similar codes to avoid duplication
3. Select next available code in the range
4. Update this taxonomy document with the new code
5. Create the corresponding folder structure

### Code Retirement

- Do not reuse retired codes
- Mark retired codes in this document with strikethrough and retirement date
- Move related files to `_archived/` folder

---

*This taxonomy is enforced by project standards. All taxonomy-governed directories must maintain this subfolder structure.*
