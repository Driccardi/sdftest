# NetSuite Solution Patterns

Common patterns in NetSuite customizations and their solution type classifications.

## Revenue Management Patterns

### Indicators
- Record types: `transaction`, `journalentry`, `revenuerecognition`, `billingschedule`
- Keywords: "revenue", "ASC 606", "IFRS 15", "recognition", "billing", "deferred"
- Modules: `N/financial`, `N/revenue`
- Custom records: Revenue schedules, contract terms, billing milestones

### Common Features
- Multi-element arrangement handling
- Percentage of completion tracking
- Subscription billing automation
- Revenue forecasting dashboards
- Automated journal entry creation
- Compliance reporting (ASC 606/IFRS 15)

### Industries
- Software/SaaS (subscription models)
- Professional Services (percentage of completion)
- Construction (WIP and percentage of completion)

---

## Inventory & Warehouse Patterns

### Indicators
- Record types: `item`, `binnumber`, `inventorytransfer`, `itemfulfillment`, `inventoryadjustment`
- Keywords: "warehouse", "bin", "pick", "pack", "ship", "barcode", "cycle count", "inventory"
- Modules: `N/inventory`, `N/warehouse`
- Custom records: Picking routes, bin locations, scan logs

### Common Features
- Mobile picking interfaces
- Barcode scanning integration
- Automated bin optimization
- Wave picking
- Real-time inventory tracking
- Cycle count automation
- Cross-docking support

### Industries
- Wholesale Distribution
- Manufacturing
- Retail
- 3PL (Third-party logistics)

---

## Professional Services Automation Patterns

### Indicators
- Record types: `project`, `projecttask`, `timebill`, `expensereport`, `job`
- Keywords: "project", "billable", "utilization", "resource", "time tracking", "profitability"
- Modules: `N/project`, `N/time`
- Custom records: Resource allocation, project milestones, billing rules

### Common Features
- Project profitability tracking
- Resource capacity planning
- Automated time approval
- Project-based billing
- Utilization reporting
- Budget vs. actual tracking

### Industries
- Professional Services
- Consulting
- Architecture/Engineering
- IT Services

---

## Manufacturing & Production Patterns

### Indicators
- Record types: `workorder`, `assemblybuild`, `manufacturingoperationtask`, `bom`
- Keywords: "work order", "assembly", "BOM", "production", "capacity", "routing"
- Modules: `N/manufacturing`
- Custom records: Production schedules, quality checks, machine logs

### Common Features
- Work order automation
- BOM management
- Capacity planning
- Shop floor integration
- Quality control workflows
- Production scheduling

### Industries
- Manufacturing
- Discrete Manufacturing
- Process Manufacturing

---

## Financial Management Patterns

### Indicators
- Record types: `journalentry`, `customsegment`, `subsidiary`, `currency`
- Keywords: "GL", "consolidation", "intercompany", "allocation", "multi-book"
- Modules: `N/financial`, `N/accounting`
- Custom segments present

### Common Features
- Automated allocations
- Intercompany eliminations
- Multi-book accounting
- Custom reporting dimensions
- Consolidation automation
- Currency management

### Industries
- Multi-national corporations
- Financial Services
- Holding companies

---

## Sales & CRM Patterns

### Indicators
- Record types: `customer`, `opportunity`, `estimate`, `salesorder`, `lead`
- Keywords: "quote", "CPQ", "commission", "pipeline", "forecast", "CRM"
- Modules: `N/sales`, `N/crm`
- Custom records: Commission schedules, quote templates, pipeline stages

### Common Features
- Quote generation automation
- Commission calculation
- Sales pipeline management
- Opportunity forecasting
- Contract lifecycle management
- Customer portal

### Industries
- B2B Sales
- Software/SaaS
- Manufacturing
- Wholesale Distribution

---

## Procurement & Supply Chain Patterns

### Indicators
- Record types: `purchaseorder`, `vendor`, `itemreceipt`, `vendorbill`
- Keywords: "procurement", "purchasing", "PO", "vendor", "approval", "requisition"
- Modules: `N/procurement`, `N/purchasing`
- Custom records: Approval workflows, vendor scorecards, requisitions

### Common Features
- Purchase order approval workflows
- Vendor management
- Automated reorder points
- Purchase requisitions
- Vendor performance tracking
- Contract management

### Industries
- Manufacturing
- Retail
- Wholesale Distribution
- Healthcare

---

## Compliance & Reporting Patterns

### Indicators
- Record types: Custom audit records, saved searches, portlets
- Keywords: "audit", "compliance", "SOX", "GAAP", "IFRS", "report", "dashboard"
- Workflow objects with approval stages
- Multiple portlets and saved searches

### Common Features
- Audit trail logging
- Automated compliance checks
- Executive dashboards
- Custom financial reports
- Control monitoring
- Segregation of duties

### Industries
- Public companies
- Financial Services
- Healthcare
- Regulated industries

---

## Workflow Automation Patterns

### Indicators
- Multiple workflow objects
- Workflow action scripts
- Email notification actions
- Custom approval records

### Common Features
- Multi-level approval processes
- Automated notifications
- Escalation logic
- Approval delegation
- Audit trail
- SLA monitoring

### Industries
- All industries (process-specific)

---

## Integration & Data Exchange Patterns

### Indicators
- RESTlet scripts
- Scheduled scripts with external API calls
- File import/export scripts
- Keywords: "API", "integration", "sync", "import", "export", "webhook"

### Common Features
- Third-party system connectivity
- Data synchronization
- Real-time API endpoints
- File-based integration
- EDI processing
- Webhook listeners

### Industries
- E-commerce (platform integration)
- 3PL (WMS integration)
- Retail (POS integration)
- Any with external systems

---

## Pattern Matching Strategy

### 1. Primary Pattern
Identify the dominant pattern based on:
- Most scripts and objects
- Core record types
- Main business process

### 2. Secondary Patterns
Note additional patterns that represent features:
- Approval workflows (add "Approval Process" feature)
- Portlets/reports (add "Dashboard & Analytics" feature)
- RESTlets (add "API Integration" feature)

### 3. Combined Solutions
Some solutions span multiple patterns:
- **Example**: Project accounting solution might combine:
  - Professional Services (primary)
  - Financial Management (GL integration)
  - Workflow Automation (approval processes)

### 4. Niche Solutions
Specialized solutions might not fit standard patterns:
- Look for industry-specific terminology
- Focus on the specific problem solved
- Create custom solution_type if needed

## Keyword-to-Feature Mapping

| Keywords in Code | Feature Description |
|-----------------|-------------------|
| ASC 606, revenue recognition | ASC 606 Compliance |
| bin, warehouse, pick | Warehouse Management |
| approval, workflow | Approval Workflows |
| barcode, scan | Barcode Scanning |
| project, task, time | Project Tracking |
| dashboard, portlet | Analytics Dashboard |
| API, RESTlet, webhook | Third-party Integration |
| scheduled, batch | Automated Processing |
| commission, comp | Commission Management |
| intercompany, consolidation | Multi-entity Accounting |
| mobile | Mobile Interface |
| SOX, audit, compliance | Compliance Monitoring |
