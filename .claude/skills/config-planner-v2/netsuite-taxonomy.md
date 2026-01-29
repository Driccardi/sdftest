# NetSuite Configuration Taxonomy

This document defines the numbering scheme and categorization for configuration planning.

## Numbering Ranges

| Range | Category | Description |
|-------|----------|-------------|
| 10-999 | Process Areas | End-to-end business processes |
| 1000-1999 | Feature Modules | NetSuite native modules and features |
| 2000-2999 | SuiteApps | Third-party and published SuiteApps |
| 3000-3999 | Integrations | External system integrations |
| 4000-4999 | Customizations | Custom development beyond standard config |

---

## Process Areas (10-999)

End-to-end business processes. **This list is not exhaustive** - create additional process areas as the CKB requires.

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
| ... | *Add as needed* | *Agent creates codes 130-999 based on CKB* |

---

## Feature Modules (1000-1999)

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
| ... | *Add as needed* | *Agent creates codes 1120-1999 based on CKB* |

---

## SuiteApps (2000-2999)

Third-party and published SuiteApps from the SuiteApp marketplace.

| Code | SuiteApp | Publisher | Notes |
|------|----------|-----------|-------|
| 2010 | *Example: RFIO* | *Publisher* | *Purpose* |
| 2020 | *Example: Celigo* | *Publisher* | *Purpose* |
| ... | *Add as needed* | | *Agent populates based on CKB requirements* |

**SuiteApp Planning Requirements:**
- Installation steps and prerequisites
- Configuration settings
- Custom fields/records required for integration
- Testing considerations
- Licensing/cost notes if known

---

## Integrations (3000-3999)

External system integrations (not SuiteApps).

| Code | Integration | Direction | Protocol |
|------|-------------|-----------|----------|
| 3010 | *Example: Salesforce CRM* | Bidirectional | REST API |
| 3020 | *Example: Shopify* | Inbound | Webhook |
| 3030 | *Example: Banking/Lockbox* | Inbound | SFTP/CSV |
| ... | *Add as needed* | | *Agent populates based on CKB requirements* |

**Integration Planning Requirements:**
- Authentication setup (OAuth, token-based, etc.)
- Field mapping specifications
- Transformation logic
- Error handling approach
- Monitoring and alerting
- Sandbox/testing environment needs

---

## Customizations (4000-4999)

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
| ... | *Add as needed* | *Agent creates based on CKB requirements* |

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

## Folder Naming Convention

When creating the Configuration-Plan directory structure:

```
Configuration-Plan/
├── 010-Record-to-Report/           # Zero-padded for sorting
├── 030-Order-to-Cash/
├── 1010-Fixed-Assets/
├── 2010-RFIO-SuiteApp/
├── 3010-Salesforce-Integration/
├── 4010-Custom-Records/
├── _Tracking/                      # Underscore prefix keeps at top
└── configuration-summary.md
```

**Phase file naming:** `{area-code}.{sequence}-{Descriptive-Name}.md`
- Example: `030.050-Customer-Approval-Workflow.md`
- Use zero-padded numbers: `010`, `020`, `030`
- Use hyphens in descriptive names, not spaces
