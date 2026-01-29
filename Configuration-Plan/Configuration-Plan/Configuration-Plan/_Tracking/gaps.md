# Requirements Gaps Log
## SunStyle Retail NetSuite Implementation

**Document Purpose**: Track identified gaps between business requirements and available information in the Customer Knowledgebase (CKB).

**Last Updated**: 2026-01-28
**Owner**: Implementation Business Analyst

---

## Gap Classification

- **Type 1 - Missing Information**: Requirement exists but details insufficient
- **Type 2 - Unclear Process**: Process mentioned but steps/rules undefined
- **Type 3 - System Detail Missing**: System integration mentioned but technical details absent
- **Type 4 - Decision Pending**: Business decision needed to finalize requirement
- **Type 5 - Out of Scope Confirmation**: Appears needed but should confirm not in scope

---

## Record-to-Report Gaps

### GAP-RTR-001: Depreciation Schedule Details
**Type**: Type 1 - Missing Information
**Description**: CKB mentions fixed assets (store fixtures, POS equipment, etc.) but lacks depreciation schedules, useful life, and depreciation methods.
**Impact**: Cannot configure NetSuite Fixed Assets module without this data.
**Questions**:
- What are the useful lives for each asset category?
- Straight-line or accelerated depreciation?
- Half-year convention or full-year?
**Required From**: CFO, Controller
**Priority**: High (affects P&L accuracy)
**Status**: Open

### GAP-RTR-002: Intercompany Allocation Rules
**Type**: Type 4 - Decision Pending
**Description**: Future Canada subsidiary mentioned but no detail on how shared costs (IT, HR, Executive) will be allocated between entities.
**Impact**: Cannot design intercompany allocation process.
**Questions**:
- Will there be shared services between USA and Canada?
- Allocation basis (headcount, revenue, square footage)?
- Transfer pricing for inventory transfers?
**Required From**: CFO, CFO
**Priority**: Low (future state, not Phase 1)
**Status**: Deferred to Canada expansion project

### GAP-RTR-003: Budget and Forecasting Process
**Type**: Type 1 - Missing Information
**Description**: No detail on budgeting process, planning cycles, or variance reporting requirements.
**Impact**: NetSuite Planning & Budgeting module not configured; may need third-party tool.
**Questions**:
- Is there an annual budgeting process?
- Who creates budgets (by department, by store)?
- What level of detail (account level, monthly)?
- Budget vs. actual reporting requirements?
**Required From**: CFO, FP&A Lead
**Priority**: Medium (can add post-go-live)
**Status**: Open

### GAP-RTR-004: Consolidation Adjustments
**Type**: Type 2 - Unclear Process
**Description**: Parent company consolidation mentioned but no detail on typical consolidation adjustments (other than intercompany elimination).
**Impact**: May need manual journal entry templates or workflows.
**Questions**:
- Are there recurring consolidation adjustments?
- Who prepares, who approves?
- Timing in close process?
**Required From**: Controller
**Priority**: Medium
**Status**: Open

---

## Order-to-Cash Gaps

### GAP-OTC-001: Fraud Screening Rules
**Type**: Type 1 - Missing Information
**Description**: CKB mentions fraud detection and high-risk order flagging but no details on specific rules or thresholds.
**Impact**: Cannot configure fraud screening workflow accurately.
**Questions**:
- What triggers a fraud review (dollar amount, velocity, address mismatch, etc.)?
- Fraud score calculation method (manual or third-party service)?
- Who reviews flagged orders? What's the SLA?
- Automatic decline thresholds?
**Required From**: Risk Manager, E-commerce Manager
**Priority**: High (fraud = revenue loss)
**Status**: Open

### GAP-OTC-002: Store Associate Commission Structure
**Type**: Type 1 - Missing Information
**Description**: CKB mentions tracking sales associate commissions but lacks commission rates, rules, and calculation method.
**Impact**: Cannot configure commission calculations or reports.
**Questions**:
- Commission rate (% of sale or tiered)?
- Commission on all products or specific categories?
- When paid (weekly, bi-weekly, monthly)?
- Clawbacks for returns?
**Required From**: COO, HR
**Priority**: Medium (can track manually initially)
**Status**: Open

### GAP-OTC-003: Gift Card Program Details
**Type**: Type 1 - Missing Information
**Description**: Gift card liability mentioned but no details on gift card issuance, redemption, expiration, or breakage policy.
**Impact**: Cannot configure gift card tracking or revenue recognition.
**Questions**:
- How are gift cards issued (physical, digital)?
- Do gift cards expire?
- Breakage income recognition policy?
- Partial redemption allowed?
- Integration with POS and e-commerce?
**Required From**: Finance, Operations
**Priority**: Medium
**Status**: Open

### GAP-OTC-004: Price Override Authority
**Type**: Type 2 - Unclear Process
**Description**: Discount approval mentioned but no detail on who can override prices and under what conditions.
**Impact**: Cannot configure price override controls and approvals.
**Questions**:
- Who can approve price overrides (store manager, corporate)?
- Thresholds (% or $ amount)?
- Documentation requirements?
**Required From**: COO, Retail Operations
**Priority**: Medium
**Status**: Open

### GAP-OTC-005: Wholesale Customer Management
**Type**: Type 5 - Out of Scope Confirmation
**Description**: CKB doesn't mention wholesale/B2B customers, but company generates $45M in revenue - is there any wholesale business?
**Impact**: If wholesale exists, need different customer types, pricing, terms, invoicing.
**Questions**:
- Is there any wholesale or B2B business?
- If yes, what % of revenue?
- What are the differences in process (terms, pricing, shipping)?
**Required From**: CEO, Sales
**Priority**: High (major scope difference)
**Status**: Open - Critical to validate

### GAP-OTC-006: Backorder Management
**Type**: Type 2 - Unclear Process
**Description**: No detail on backorder process when item out of stock.
**Impact**: Cannot configure backorder workflow.
**Questions**:
- Do you allow backorders?
- How are customers notified?
- Partial shipments allowed?
- Cancellation policy if item not available?
**Required From**: Operations, Customer Service
**Priority**: Medium
**Status**: Open

---

## Procure-to-Pay Gaps

### GAP-PTP-001: Vendor Onboarding Process
**Type**: Type 2 - Unclear Process
**Description**: No detail on vendor qualification, onboarding, or approval process.
**Impact**: Cannot design vendor setup workflow.
**Questions**:
- Who approves new vendors?
- Required documentation (W-9, insurance, certifications)?
- Vendor portal or email-based communication?
**Required From**: Purchasing, Finance
**Priority**: Low (manual process acceptable initially)
**Status**: Open

### GAP-PTP-002: Contract Management
**Type**: Type 1 - Missing Information
**Description**: No mention of vendor contracts or pricing agreements.
**Impact**: May need contract management functionality or integration.
**Questions**:
- Are vendor prices negotiated annually?
- Contract renewals tracked?
- Volume discounts or rebates?
**Required From**: Purchasing, Finance
**Priority**: Low (can manage outside NetSuite)
**Status**: Open

### GAP-PTP-003: Consignment Inventory
**Type**: Type 5 - Out of Scope Confirmation
**Description**: No mention of consignment inventory from vendors.
**Impact**: If consignment exists, special inventory and AP handling required.
**Questions**:
- Do any vendors provide inventory on consignment?
- If yes, what % and which vendors?
**Required From**: Purchasing, Operations
**Priority**: Medium (if exists, moderate config complexity)
**Status**: Open

### GAP-PTP-004: Import/Customs Process
**Type**: Type 1 - Missing Information
**Description**: CKB mentions "international suppliers" but no detail on import process, customs, duties.
**Impact**: Cannot configure landed cost or customs duty handling.
**Questions**:
- What % of products imported from overseas?
- Customs broker used?
- Landed cost calculation (freight, duties, insurance)?
- Who handles customs documentation?
**Required From**: Supply Chain, Finance
**Priority**: Medium
**Status**: Open

---

## Plan-to-Inventory Gaps

### GAP-PTI-001: Bin Location Strategy
**Type**: Type 2 - Unclear Process
**Description**: Bin management mentioned for warehouse but no detail on bin numbering, putaway rules, or picking strategies.
**Impact**: Cannot configure bin management optimally.
**Questions**:
- Current bin numbering scheme (if any)?
- Fast-movers in accessible bins?
- Random vs. fixed bin assignment?
- Directed putaway and picking?
**Required From**: Warehouse Manager
**Priority**: Medium (can use simple bins initially)
**Status**: Open

### GAP-PTI-002: Serialized Inventory
**Type**: Type 5 - Out of Scope Confirmation
**Description**: No mention of serial numbers or lot tracking.
**Impact**: If needed, requires Serial/Lot tracking module.
**Questions**:
- Are any items tracked by serial number (high-value sunglasses)?
- Lot numbers for quality control?
- Warranty tracking by serial number?
**Required From**: Operations, Quality
**Priority**: Medium
**Status**: Open

### GAP-PTI-003: Store Inventory Replenishment Frequency
**Type**: Type 1 - Missing Information
**Description**: Store replenishment mentioned but no detail on frequency, trigger, or quantity rules.
**Impact**: Cannot configure store replenishment automation.
**Questions**:
- How often are stores replenished (daily, weekly)?
- Push (warehouse driven) or pull (store requested)?
- Min/max levels by store?
- Display stock vs. backstock tracking?
**Required From**: Operations, Merchandising
**Priority**: High (affects customer availability)
**Status**: Open

### GAP-PTI-004: Damaged Goods Process
**Type**: Type 2 - Unclear Process
**Description**: Damage inspection mentioned in receiving but no detail on disposition process for damaged goods.
**Impact**: Cannot configure damage tracking and vendor returns.
**Questions**:
- How are damaged goods tracked (location, GL account)?
- RMA to vendor process?
- Claim filing process?
- Disposal/salvage process?
**Required From**: Warehouse, Purchasing
**Priority**: Low
**Status**: Open

### GAP-PTI-005: Inventory Valuation Method Confirmation
**Type**: Type 4 - Decision Pending
**Description**: Assumption of Average Cost method needs confirmation.
**Impact**: Major impact on COGS and inventory valuation.
**Questions**:
- Confirm Average Cost vs. FIFO vs. Standard Cost?
- Has this been discussed with auditors?
- Any items requiring different costing (prescription lenses)?
**Required From**: CFO, Controller, External Auditor
**Priority**: Critical
**Status**: Open - Must validate in Week 1

---

## Marketing/CRM Gaps

### GAP-MKT-001: Campaign ROI Tracking
**Type**: Type 1 - Missing Information
**Description**: Campaign management mentioned but no detail on how campaign effectiveness is measured.
**Impact**: Cannot design campaign tracking and reporting.
**Questions**:
- How are orders attributed to campaigns?
- UTM parameters used?
- Multi-touch attribution or last-touch?
- Campaign P&L reports needed?
**Required From**: Marketing, E-commerce
**Priority**: Low (can add incrementally)
**Status**: Open

### GAP-MKT-002: Customer Segmentation Rules
**Type**: Type 2 - Unclear Process
**Description**: Customer segmentation mentioned but specific rules for segments (VIP, At-Risk, etc.) not defined.
**Impact**: Cannot configure automated segmentation.
**Questions**:
- What defines a VIP customer (LTV threshold, purchase frequency)?
- At-Risk definition (no purchase in X days)?
- Who manages segments (marketing, CRM team)?
**Required From**: Marketing, CRM
**Priority**: Low (can segment manually initially)
**Status**: Open

---

## Customer Service Gaps

### GAP-CS-001: Case Routing Rules
**Type**: Type 2 - Unclear Process
**Description**: Case management mentioned with types and priorities but no detail on routing logic.
**Impact**: Cannot configure case assignment automation.
**Questions**:
- Round-robin assignment or skills-based?
- VIP customer priority routing?
- After-hours escalation?
**Required From**: Customer Service Manager
**Priority**: Low (manual assignment acceptable initially)
**Status**: Open

### GAP-CS-002: RMA Inspection Standards
**Type**: Type 2 - Unclear Process
**Description**: Return inspection mentioned but no detail on what constitutes "resalable" vs. "damaged."
**Impact**: Cannot train inspectors or configure return workflows accurately.
**Questions**:
- Specific inspection criteria?
- Photos required for high-value returns?
- Who inspects (warehouse staff, QA team)?
**Required From**: Operations, Customer Service
**Priority**: Medium
**Status**: Open

---

## Integration Gaps

### GAP-INT-001: Shopify Order Data Mapping
**Type**: Type 3 - System Detail Missing
**Description**: Shopify integration mentioned but no detail on how Shopify order data maps to NetSuite fields.
**Impact**: Cannot design integration data mapping accurately.
**Questions**:
- All Shopify order fields needed in NetSuite?
- Custom Shopify fields (face shape, style preference) - where stored?
- Shopify customer IDs maintained or new NetSuite IDs?
**Required From**: E-commerce Team, IT
**Priority**: High (Phase 1 integration)
**Status**: Open - Needs detailed mapping session

### GAP-INT-002: Salesforce Custom Objects
**Type**: Type 3 - System Detail Missing
**Description**: Salesforce integration mentioned but unclear if there are custom Salesforce objects beyond standard Contacts/Cases.
**Impact**: Cannot design full integration scope.
**Questions**:
- Custom Salesforce objects in use?
- Fields to sync beyond standard?
- Salesforce → NetSuite vs. NetSuite → Salesforce data ownership?
**Required From**: CRM Team, IT
**Priority**: High (Phase 1 integration)
**Status**: Open

### GAP-INT-003: Lightspeed POS Transaction Detail
**Type**: Type 3 - System Detail Missing
**Description**: Lightspeed POS integration mentioned but no detail on transaction data structure.
**Impact**: Cannot design POS → NetSuite transaction flow.
**Questions**:
- Real-time vs. batch (end-of-day)?
- Transaction-level or aggregated sales?
- Payment method breakdown?
- Sales associate tracked in Lightspeed?
**Required From**: IT, Store Operations
**Priority**: High (Phase 1 integration)
**Status**: Open - Needs Lightspeed API review

### GAP-INT-004: Stripe Payout Reconciliation
**Type**: Type 2 - Unclear Process
**Description**: Stripe payment processing mentioned but no detail on how daily payouts reconcile to orders.
**Impact**: Cannot design payment reconciliation process.
**Questions**:
- Daily or weekly Stripe payouts?
- How are fees netted out?
- Reconciliation report needed?
- Handling of refunds and chargebacks?
**Required From**: Finance, E-commerce
**Priority**: High (critical for cash management)
**Status**: Open

### GAP-INT-005: BigQuery ETL Scope
**Type**: Type 1 - Missing Information
**Description**: BigQuery data warehouse mentioned but unclear which NetSuite data sets are needed.
**Impact**: Cannot scope ETL development.
**Questions**:
- Which NetSuite tables/data needed in BigQuery?
- Real-time or daily batch?
- Full history or incremental?
- Who manages ETL (IT, Data team)?
**Required From**: Data & Analytics Team
**Priority**: Low (can add post-go-live)
**Status**: Open

### GAP-INT-006: Mobile App API Requirements
**Type**: Type 3 - System Detail Missing
**Description**: Mobile app mentioned but no detail on which NetSuite APIs the mobile app will call.
**Impact**: Cannot design mobile app integration.
**Questions**:
- Which features require NetSuite API (order status, loyalty points, product search)?
- REST or GraphQL preferred?
- Authentication method (OAuth)?
- Rate limits and caching strategy?
**Required From**: App Development Team
**Priority**: High (Phase 1 integration)
**Status**: Open - Needs mobile dev workshop

---

## Operational Gaps

### GAP-OPS-001: Ship-from-Store Selection Logic
**Type**: Type 2 - Unclear Process
**Description**: Ship-from-store mentioned as fulfillment option but no detail on how store is selected.
**Impact**: Cannot configure fulfillment routing algorithm.
**Questions**:
- Nearest store based on distance or ship time?
- Exclude stores with low inventory (<X units)?
- Store can decline ship-from-store orders?
- Cost of ship-from-store vs. warehouse (who pays)?
**Required From**: Operations, E-commerce
**Priority**: High (key differentiator)
**Status**: Open

### GAP-OPS-002: BOPIS Pickup Process
**Type**: Type 2 - Unclear Process
**Description**: BOPIS (Buy Online Pickup In Store) mentioned but no detail on store pickup workflow.
**Impact**: Cannot configure BOPIS process in POS and NetSuite.
**Questions**:
- How is customer notified when ready?
- Pickup verification (ID check, order number)?
- How long held before cancelled (24 hours, 7 days)?
- Separate pickup area in store or main register?
**Required From**: Store Operations
**Priority**: High (customer experience)
**Status**: Open

### GAP-OPS-003: Curbside Pickup Process
**Type**: Type 2 - Unclear Process
**Description**: Curbside pickup mentioned but no process detail.
**Impact**: Cannot configure curbside workflow.
**Questions**:
- How does customer notify arrival (app, text, phone)?
- Which stores support curbside?
- Payment at pickup or pre-paid only?
**Required From**: Store Operations
**Priority**: Medium (nice-to-have)
**Status**: Open

### GAP-OPS-004: Prescription Verification Workflow
**Type**: Type 2 - Unclear Process
**Description**: Prescription orders mentioned but no detail on verification process.
**Impact**: Cannot configure prescription workflow and approvals.
**Questions**:
- Who verifies prescriptions (in-house optometrist, third-party)?
- Verification SLA?
- Expired prescription handling?
- Customer notification process?
**Required From**: Operations, Compliance
**Priority**: High (compliance risk)
**Status**: Open

---

## Summary Statistics

**Total Gaps**: 37
- Type 1 (Missing Info): 14
- Type 2 (Unclear Process): 16
- Type 3 (System Detail Missing): 5
- Type 4 (Decision Pending): 2
- Type 5 (Out of Scope Confirmation): 3

**By Functional Area**:
- Record-to-Report: 4
- Order-to-Cash: 6
- Procure-to-Pay: 4
- Plan-to-Inventory: 5
- Marketing/CRM: 2
- Customer Service: 2
- Integration: 6
- Operational: 4

**Priority**:
- Critical: 2
- High: 14
- Medium: 15
- Low: 6

**Status**:
- Open: 36
- Deferred: 1
- Resolved: 0

---

## Gap Resolution Process

1. **Identify Gap**: Log here with unique ID and classification
2. **Assign Owner**: Who will gather missing information
3. **Set Deadline**: Based on when needed for configuration
4. **Gather Information**: Meetings, workshops, documentation review
5. **Resolve**: Document answer and update configuration plan
6. **Update Status**: Mark as Resolved with date
7. **Impact Analysis**: Assess if resolution changes timeline or scope

---

## High Priority Gaps Requiring Immediate Attention

**Week 1**:
- GAP-OTC-005: Wholesale confirmation (major scope impact)
- GAP-PTI-005: Inventory costing method (foundational)
- GAP-OTC-001: Fraud screening rules (revenue protection)

**Week 2-3**:
- GAP-INT-001: Shopify data mapping
- GAP-INT-003: Lightspeed POS detail
- GAP-INT-004: Stripe reconciliation
- GAP-OPS-001: Ship-from-store logic
- GAP-OPS-004: Prescription workflow

**Week 4-5**:
- GAP-OTC-002: Commission structure
- GAP-PTI-003: Store replenishment
- GAP-OPS-002: BOPIS process
- GAP-INT-006: Mobile app APIs

---

## Next Steps

1. **Week 1**: Schedule requirements workshops with key stakeholders for Critical and High priority gaps
2. **Week 2**: Conduct integration deep-dive sessions (Shopify, Salesforce, Lightspeed, Stripe)
3. **Week 3**: Operational process walkthroughs (ship-from-store, BOPIS, prescription)
4. **Ongoing**: Update this log as gaps are resolved; add new gaps as discovered

---

## Change Log

| Date | Gap ID | Change | Resolution |
|------|--------|--------|------------|
| 2026-01-28 | All | Initial gaps documented | - |
| TBD | | | |

---

**Next Review**: Weekly in Project Status Meeting
**Maintained By**: Business Analyst and Project Manager
