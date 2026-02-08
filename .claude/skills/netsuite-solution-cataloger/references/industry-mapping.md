# Industry Mapping Guidelines

Map NetSuite customization features to relevant industries.

## Industry Profiles

### Construction
**Key Indicators**:
- Custom segments (job costing dimensions)
- Project/job record types
- WIP (Work in Progress) tracking
- Keywords: "job", "project", "subcontractor", "change order", "retention", "AIA billing"

**Common Features**:
- Job costing and tracking
- Project-based revenue recognition
- Subcontractor management
- Change order tracking
- Retention billing
- Certified payroll
- Percentage of completion accounting

**Solution Types**:
- Professional Services (project-based)
- Financial Management (job cost accounting)
- Revenue Management (% of completion)

---

### Energy (Oil & Gas)
**Key Indicators**:
- Item tracking with serial/lot numbers
- Asset management
- Keywords: "well", "rig", "AFE", "JIB", "joint interest", "royalty", "lease"

**Common Features**:
- AFE (Authorization for Expenditure) tracking
- Joint interest billing
- Royalty calculations
- Lease management
- Equipment/asset tracking

**Solution Types**:
- Financial Management
- Project Management
- Compliance & Reporting

---

### Retail
**Key Indicators**:
- Multi-location inventory
- POS integration (RESTlets)
- Keywords: "store", "POS", "SKU", "channel", "omnichannel", "ecommerce"

**Common Features**:
- Multi-channel inventory
- POS integration
- Store-level reporting
- Merchandise planning
- Demand forecasting
- Promotional pricing

**Solution Types**:
- Inventory & Warehouse
- Sales & CRM
- Integration (POS systems)

---

### Nonprofit
**Key Indicators**:
- Custom segments (fund/program/grant dimensions)
- Donation tracking
- Keywords: "fund", "grant", "donor", "restricted", "campaign", "pledge"

**Common Features**:
- Fund accounting
- Grant tracking
- Donor management
- Pledge processing
- Restricted revenue tracking
- Program allocation

**Solution Types**:
- Financial Management (fund accounting)
- CRM (donor management)
- Compliance & Reporting

---

### Healthcare
**Key Indicators**:
- HIPAA compliance features
- Patient/provider records
- Keywords: "patient", "claim", "provider", "HIPAA", "PHI", "medical", "billing"

**Common Features**:
- Claims processing
- Patient billing
- Provider management
- HIPAA compliance
- Insurance verification
- Medical coding

**Solution Types**:
- Compliance & Reporting
- Revenue Management
- Workflow Automation

---

### Manufacturing
**Key Indicators**:
- Work orders, assemblies, BOMs
- Production records
- Keywords: "BOM", "work order", "assembly", "production", "capacity", "routing", "MRP"

**Common Features**:
- Production scheduling
- BOM management
- Shop floor control
- Capacity planning
- Material requirements planning (MRP)
- Quality management

**Solution Types**:
- Manufacturing & Production
- Inventory & Warehouse
- Supply Chain

---

### Education
**Key Indicators**:
- Student/course records
- Enrollment tracking
- Keywords: "student", "course", "enrollment", "tuition", "semester", "campus"

**Common Features**:
- Student information system
- Enrollment management
- Tuition billing
- Financial aid tracking
- Course scheduling
- Alumni management

**Solution Types**:
- CRM (student lifecycle)
- Revenue Management (tuition)
- Workflow Automation

---

### Software/SaaS
**Key Indicators**:
- Subscription billing
- Revenue recognition (ASC 606)
- Multi-element arrangements
- Keywords: "subscription", "MRR", "ARR", "churn", "license", "SaaS", "recurring"

**Common Features**:
- Subscription management
- Usage-based billing
- Revenue recognition (ASC 606)
- Customer lifecycle management
- Expansion/upsell tracking
- Churn analytics

**Solution Types**:
- Revenue Management
- Sales & CRM
- Analytics & Reporting

---

### Professional Services
**Key Indicators**:
- Project/task tracking
- Time and expense billing
- Keywords: "billable", "utilization", "project", "consultant", "engagement"

**Common Features**:
- Project accounting
- Resource management
- Time tracking and approval
- Utilization reporting
- Project profitability
- Retainer management

**Solution Types**:
- Professional Services
- Project Management
- Financial Management

---

### Wholesale Distribution
**Key Indicators**:
- Multi-location inventory
- Advanced warehouse features
- Keywords: "warehouse", "distribution", "wholesale", "B2B", "fulfillment"

**Common Features**:
- Warehouse management
- Multi-location inventory
- Demand planning
- Drop ship automation
- Vendor-managed inventory
- B2B ecommerce

**Solution Types**:
- Inventory & Warehouse
- Supply Chain
- Sales & CRM (B2B)

---

### Financial Services
**Key Indicators**:
- Complex accounting (multi-book, consolidation)
- Regulatory compliance
- Keywords: "compliance", "SOX", "GAAP", "intercompany", "consolidation", "regulatory"

**Common Features**:
- Multi-entity consolidation
- Compliance reporting
- SOX controls
- Intercompany accounting
- Multi-book accounting
- Audit trails

**Solution Types**:
- Financial Management
- Compliance & Reporting
- Multi-entity Accounting

---

## Industry Selection Strategy

### Primary Industry (Choose 1-2)
Look for the strongest indicators:
1. **Dominant record types**: Which industry's records are most prevalent?
2. **Core functionality**: What business process is central?
3. **Terminology**: Which industry's keywords appear most?

### Secondary Industries (Choose 0-2 additional)
Add if solution applies to multiple industries:
- Generic features (approval workflows, dashboards) → Multiple industries
- Cross-industry patterns (e.g., project tracking in both Construction and Professional Services)

### Avoid "All Industries"
Only mark as applicable to all industries if:
- Truly generic utility (email enhancement, UI improvement)
- No industry-specific terminology or features
- Horizontal solution (workflow engine, reporting framework)

## Feature-to-Industry Quick Reference

| Feature | Primary Industries | Secondary Industries |
|---------|-------------------|---------------------|
| Job costing | Construction | Professional Services |
| Revenue recognition (ASC 606) | Software/SaaS | Professional Services, Construction |
| Warehouse management | Wholesale Distribution, Manufacturing | Retail |
| Project tracking | Professional Services | Construction, IT Services |
| Fund accounting | Nonprofit | Education, Government |
| Subscription billing | Software/SaaS | Media, Telecom |
| Compliance reporting | Healthcare, Financial Services | Public Companies |
| Work orders/BOM | Manufacturing | Field Service |
| Grant tracking | Nonprofit | Education, Research |
| Multi-location inventory | Retail, Wholesale | Manufacturing |
| Commission tracking | Software/SaaS | Any B2B sales |
| Asset management | Energy | Construction, Government |

## Multi-Industry Examples

### Example 1: Approval Workflow System
- **Features**: Multi-level approvals, email notifications, audit trail
- **Industries**: All industries (truly horizontal)
- **Rationale**: Generic business process, no vertical-specific features

### Example 2: Advanced Inventory Management
- **Features**: Bin management, barcode scanning, cycle counts
- **Industries**: Wholesale Distribution, Manufacturing, Retail
- **Rationale**: Inventory-centric features apply to distribution/manufacturing/retail

### Example 3: Project-Based Revenue Recognition
- **Features**: % completion, project milestones, revenue forecasting
- **Industries**: Construction, Professional Services
- **Rationale**: Project accounting with % completion is common to both

### Example 4: Compliance Dashboard
- **Features**: SOX controls, audit trails, executive reporting
- **Industries**: Financial Services, Healthcare, Energy
- **Rationale**: Regulatory requirements span multiple regulated industries

## Inference Decision Tree

```
1. Are there industry-specific keywords?
   YES → Map to that industry
   NO → Continue to step 2

2. What record types are extended?
   - Project/job → Construction or Professional Services
   - Item/bin → Manufacturing, Wholesale, or Retail
   - Work order/assembly → Manufacturing
   - Patient/claim → Healthcare
   - Fund/grant → Nonprofit
   - Student/course → Education

3. What compliance requirements are mentioned?
   - HIPAA → Healthcare
   - SOX/GAAP → Financial Services or Public Companies
   - ASC 606/IFRS 15 → Software/SaaS, Professional Services

4. What business process is automated?
   - Revenue recognition → Software/SaaS, Professional Services
   - Warehouse operations → Wholesale, Manufacturing, Retail
   - Project accounting → Construction, Professional Services
   - Subscription billing → Software/SaaS

5. If still unclear:
   - Default to 2-3 most likely industries
   - Avoid being too broad
   - Consider the solution's core value proposition
```

## Marketing Language by Industry

### Construction
- "Job costing", "Project profitability", "Change order management", "Retention billing"

### Software/SaaS
- "Subscription management", "Recurring revenue", "Customer lifetime value", "Usage-based billing"

### Manufacturing
- "Production efficiency", "Shop floor visibility", "Material planning", "Quality control"

### Healthcare
- "Compliance-ready", "HIPAA-secure", "Claims processing", "Patient billing"

### Professional Services
- "Utilization optimization", "Project profitability", "Resource management", "Billable efficiency"

### Retail
- "Omnichannel", "Inventory optimization", "Store operations", "Customer experience"

### Wholesale Distribution
- "Fulfillment automation", "Multi-location visibility", "Demand planning", "B2B commerce"
