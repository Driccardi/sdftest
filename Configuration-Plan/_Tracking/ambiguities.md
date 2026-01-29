# Ambiguities Log
## SunStyle Retail NetSuite Implementation

**Document Purpose**: Track areas where CKB information is contradictory, unclear, or open to multiple interpretations requiring clarification.

**Last Updated**: 2026-01-28
**Owner**: Implementation Business Analyst

---

## Classification

- **Type A - Contradictory Information**: Different CKB documents provide conflicting information
- **Type B - Unclear Interpretation**: Information exists but meaning is ambiguous
- **Type C - Missing Context**: Information provided but lacks sufficient context to implement
- **Type D - Multiple Valid Interpretations**: Information could be implemented multiple ways

---

## Ambiguities

### AMB-001: E-Commerce Revenue Percentage
**Type**: Type A - Contradictory Information
**Description**:
- Company Profile states: "E-commerce Sales: 40% of total revenue"
- Business Model states: "E-Commerce Platform (35% of sales)"
- User request states: "E-commerce (35%), Mobile app (5%)"

**Impact**: Affects channel reporting expectations and performance metrics.
**Clarification Needed**: What is the actual e-commerce breakdown?
- Web: 35% + Mobile: 5% = 40% total digital? OR
- Web: 40% (includes mobile)? OR
- Different measurement periods?

**Requested From**: Finance / E-commerce Team
**Priority**: Low (doesn't affect configuration, just reporting baselines)
**Status**: Open

---

### AMB-002: Inventory Management System vs. NetSuite IMS
**Type**: Type B - Unclear Interpretation
**Description**:
- System Inventory document states: "NetSuite Inventory Management" already in use
- User request states: NetSuite implementation will "replace QuickBooks" and "expand IMS"
- Business context suggests new NetSuite implementation

**Clarification Needed**:
- Is NetSuite currently used ONLY for inventory (limited implementation)?
- Are we expanding existing NetSuite or net-new implementation?
- If already using NetSuite, what modules currently active?
- Historical data already in NetSuite or in QuickBooks?

**Impact**: Determines if this is:
- New implementation (likely based on overall context)
- Expansion of existing (would change approach, less data migration)

**Requested From**: CTO, IT Lead
**Priority**: High (fundamentally changes project approach)
**Status**: Open - Critical clarification needed

---

### AMB-003: Sales Channel vs. Fulfillment Method
**Type**: Type D - Multiple Valid Interpretations
**Description**: CKB uses "channel" to mean both sales source and fulfillment method.

**Examples**:
- "In-Store" channel: Could mean purchased in-store OR fulfilled from store
- "E-commerce" channel: Could mean purchased online OR fulfilled from warehouse
- Customer could buy online but pick up in-store (BOPIS) - which "channel"?

**Clarification Needed**: Define terminology:
- **Sales Channel**: Where order originated (In-Store, Web, Mobile App, Phone)
- **Fulfillment Method**: How order fulfilled (Warehouse, Store, BOPIS, Curbside)

**Impact**: Affects field design, reporting structure, KPI definitions.

**Requested From**: Operations, E-commerce Team
**Priority**: Medium (needs definition for clear reporting)
**Status**: Open

---

### AMB-004: Custom Order Management System (OMS)
**Type**: Type B - Unclear Interpretation
**Description**: System Inventory lists "SunStyle Order Hub" as custom-built OMS version 4.1.2, but also lists NetSuite for inventory and suggests NetSuite integration.

**Clarification Needed**:
- Will custom OMS be retired and replaced by NetSuite native OMS?
- OR will custom OMS remain and integrate with NetSuite?
- If integrating, what is data flow (OMS → NetSuite or bidirectional)?

**Impact**: Major architectural decision - native NetSuite OMS vs. integrated custom OMS.
- Native NetSuite: Simpler, standard functionality, less customization
- Custom OMS integrated: More complex, preserves custom logic, integration overhead

**Requested From**: CTO, VP Digital Operations
**Priority**: Critical (core architecture decision)
**Status**: Open - Must clarify before design

---

### AMB-005: Lightspeed POS vs. NetSuite POS
**Type**: Type D - Multiple Valid Interpretations
**Description**: CKB states Lightspeed Retail POS in stores but NetSuite POS is available.

**Clarification Needed**:
- Will Lightspeed remain in stores and integrate to NetSuite? OR
- Will NetSuite POS replace Lightspeed?

**Trade-offs**:
- **Keep Lightspeed**: Less store disruption, proven system, integration needed
- **Replace with NetSuite POS**: Unified system, native integration, store training/change

**Impact**: Major decision affecting:
- Store operations (training, hardware, processes)
- Integration scope and complexity
- Timeline (POS replacement = longer)
- Budget (NetSuite POS licenses vs. Lightspeed ongoing)

**Requested From**: COO, CTO, Store Operations
**Priority**: Critical (major scope decision)
**Status**: Open - Assumption: Keep Lightspeed, but must confirm

---

### AMB-006: Service Revenue Recognition
**Type**: Type C - Missing Context
**Description**: Service revenue listed as "Fitting and Consultation Services, Prescription Services, Extended Warranties, Repair Services" but unclear when revenue is recognized.

**Examples**:
- Extended warranties: Recognized over warranty period (deferred revenue) or at sale?
- Repair services: At time of service or when customer picks up item?
- Prescription services: When prescription verified or when product ships?

**Clarification Needed**: Revenue recognition timing for each service type.

**Impact**: Affects revenue accounts, deferred revenue setup, period-end accruals.

**Requested From**: CFO, Controller, External Auditor
**Priority**: High (affects financial statement accuracy)
**Status**: Open

---

### AMB-007: Loyalty Points Breakage
**Type**: Type C - Missing Context
**Description**: Loyalty points expire after 24 months, but no mention of breakage accounting (points never redeemed).

**Clarification Needed**:
- What % of points typically go unredeemed (breakage)?
- Is breakage recognized as revenue or contra-liability?
- Breakage recognition timing (at issuance, expiration, or statistical)?

**Impact**: Affects loyalty liability calculation and revenue recognition.

**Requested From**: CFO, Controller, Marketing
**Priority**: Medium (affects financial reporting)
**Status**: Open

---

### AMB-008: Store Inventory vs. Display Inventory
**Type**: Type D - Multiple Valid Interpretations
**Description**: Stores have both "sellable inventory" and "display models" (sunglasses on display).

**Clarification Needed**:
- Are display models tracked separately in inventory?
- Can display models be sold (last one)?
- How are damaged/stolen display models handled?
- Separate inventory accounts or same as regular inventory?

**Impact**: Affects inventory tracking, shrinkage calculation, GL accounts.

**Requested From**: Operations, Merchandising
**Priority**: Low (can treat as regular inventory initially)
**Status**: Open

---

### AMB-009: Employee Discount Policy
**Type**: Type C - Missing Context
**Description**: Employee discount mentioned in accounts (6-9010-300-000) but no detail on discount percentage or eligibility.

**Clarification Needed**:
- Discount percentage (e.g., 30% off)?
- Eligible employees (all, certain roles, after X months)?
- Limit per transaction or per year?
- Applicable to all products or exclusions?

**Impact**: Affects discount workflow, reporting, potential abuse controls.

**Requested From**: HR, Operations
**Priority**: Low (can configure later)
**Status**: Open

---

### AMB-010: Multi-State Sales Tax Nexus
**Type**: Type C - Missing Context
**Description**: System Inventory mentions "Multi-State Tax Filing: Yes" and Technical Requirements mention "nexus in multiple states" but CKB only specifically mentions California.

**Clarification Needed**:
- Physical nexus states (stores): Confirm all states with retail locations
- Economic nexus states (e-commerce): States where exceeding revenue/transaction thresholds
- Marketplace facilitator implications (if any)

**Impact**: Affects SuiteTax configuration, filing obligations, registration requirements.

**Requested From**: CFO, Tax Advisor
**Priority**: High (compliance risk)
**Status**: Open - Needs tax nexus study

---

### AMB-011: Customer Data Master System
**Type**: Type D - Multiple Valid Interpretations
**Description**: Customer data exists in multiple systems (Shopify, Salesforce, Lightspeed POS, NetSuite).

**Clarification Needed**: Which system is master for which customer data?
- **Transactional**: NetSuite (orders, payments, history)
- **Marketing**: Salesforce (preferences, campaigns, segments)
- **E-commerce**: Shopify (login, cart, wishlist)
- **Profile**: ? (name, email, address - needs one master)

**Impact**: Affects integration data flow direction, conflict resolution, data governance.

**Requested From**: CTO, Data Governance
**Priority**: High (data integrity)
**Status**: Open

---

### AMB-012: Inventory Costing for Services
**Type**: Type B - Unclear Interpretation
**Description**: Services listed as revenue stream (10% of revenue) but unclear if services have associated costs (COGS).

**Examples**:
- Fitting services: Labor only (no COGS) or includes supplies?
- Prescription services: Commission to optometrist (COGS)?
- Repair services: Parts and labor (COGS) or labor only?

**Clarification Needed**: How to account for service costs - COGS or Operating Expense?

**Impact**: Affects account structure, service item setup, margin reporting.

**Requested From**: CFO, Operations
**Priority**: Medium (affects P&L structure)
**Status**: Open

---

### AMB-013: Store Manager vs. Sales Associate Roles
**Type**: Type C - Missing Context
**Description**: Store managers and sales associates mentioned but unclear if both process sales or only associates sell.

**Clarification Needed**:
- Do store managers also process transactions?
- Different permissions for managers vs. associates?
- Manager-only functions (returns, overrides)?

**Impact**: Affects role configuration, permissions, commission tracking.

**Requested From**: Store Operations, HR
**Priority**: Low (can define roles in config)
**Status**: Open

---

### AMB-014: Vendor Bill Timing
**Type**: Type D - Multiple Valid Interpretations
**Description**: No clarity on when vendor bill is entered in system.

**Options**:
- Option A: Enter bill upon receipt of goods (3-way match: PO, Receipt, Bill)
- Option B: Enter bill only when invoice received from vendor (could be days/weeks after receipt)

**Clarification Needed**: Which approach does SunStyle use/prefer?

**Impact**: Affects AP accruals, month-end close process, cash flow management.

**Requested From**: AP Team, Controller
**Priority**: Medium (affects close process)
**Status**: Open

---

### AMB-015: Prescription Eyewear Liability
**Type**: Type B - Unclear Interpretation
**Description**: Prescription eyewear requires prescription verification and optometrist partnership, but unclear on liability.

**Clarification Needed**:
- Does SunStyle employ optometrists or partner with external?
- Who is liable for prescription errors (SunStyle or optometrist)?
- Professional liability insurance carried?
- Regulatory compliance requirements (state optometry boards)?

**Impact**: Affects workflow design, compliance processes, insurance accounting.

**Requested From**: Legal, Compliance, Operations
**Priority**: Medium (compliance risk)
**Status**: Open

---

### AMB-016: Shopify Plus Custom vs. Standard
**Type**: Type C - Missing Context
**Description**: E-commerce listed as "Custom-built on Shopify Plus" with "Custom modules v3.2"

**Clarification Needed**:
- What is customized vs. standard Shopify Plus?
- Custom modules: Headless frontend or Shopify theme extensions?
- Impact on NetSuite-Shopify integration (standard connector or custom API)?

**Impact**: Affects integration approach and complexity.

**Requested From**: E-commerce Development Team, IT
**Priority**: High (Phase 1 integration)
**Status**: Open

---

### AMB-017: Annual Physical Inventory Timing
**Type**: Type C - Missing Context
**Description**: Annual physical inventory mentioned "typically end of fiscal year" but SunStyle has calendar fiscal year (ends Dec 31).

**Clarification Needed**:
- Physical inventory during holiday season (stores busy)?
- Or wait until January (after peak, but new fiscal year)?
- Or mid-year (less disruptive)?

**Impact**: Affects inventory close process, staffing, store operations.

**Requested From**: CFO, Operations
**Priority**: Low (operational decision)
**Status**: Open

---

## Summary Statistics

**Total Ambiguities**: 17
- Type A (Contradictory): 2
- Type B (Unclear Interpretation): 5
- Type C (Missing Context): 7
- Type D (Multiple Interpretations): 3

**Priority**:
- Critical: 2
- High: 6
- Medium: 5
- Low: 4

**Status**:
- Open: 17
- Clarified: 0

---

## Ambiguity Resolution Process

1. **Identify Ambiguity**: Log here with type and description
2. **Define Interpretations**: List possible interpretations
3. **Assess Impact**: Understand configuration impact of each interpretation
4. **Request Clarification**: Schedule meeting or send questions to stakeholders
5. **Document Decision**: Record chosen interpretation and rationale
6. **Update Configuration**: Reflect decision in configuration documents
7. **Close**: Mark as Clarified

---

## Critical Ambiguities Requiring Immediate Attention

**Week 1**:
- **AMB-002**: Is NetSuite already in use? (Affects entire project approach)
- **AMB-004**: Custom OMS retirement or integration? (Core architecture)
- **AMB-005**: Lightspeed replacement or integration? (Major scope)

**Week 2**:
- **AMB-006**: Service revenue recognition (Financial accuracy)
- **AMB-010**: Sales tax nexus states (Compliance)
- **AMB-011**: Customer data master system (Data governance)
- **AMB-016**: Shopify customizations (Integration design)

---

## Next Steps

1. **Week 1**: Executive alignment meeting to clarify critical ambiguities (AMB-002, AMB-004, AMB-005)
2. **Week 1**: Finance meeting for revenue recognition and tax clarifications
3. **Week 2**: Integration architecture session to clarify data flows and system roles
4. **Ongoing**: Update as ambiguities clarified; add new as discovered

---

## Change Log

| Date | Ambiguity ID | Change | Resolution |
|------|--------------|--------|------------|
| 2026-01-28 | All | Initial ambiguities documented | - |
| TBD | | | |

---

**Next Review**: Daily during Week 1, then weekly
**Maintained By**: Business Analyst and Solution Architect
