# Follow-Up Questions for Stakeholders
## SunStyle Retail NetSuite Implementation

**Document Purpose**: Consolidated list of questions for stakeholder interviews and requirements workshops.

**Last Updated**: 2026-01-28
**Owner**: Implementation Project Manager

---

## Question Format

Each question includes:
- **Question ID**: Unique identifier
- **Question**: The question to ask
- **Rationale**: Why we need this information
- **Asked To**: Which stakeholder(s) should answer
- **Meeting**: Suggested meeting/workshop for this question
- **Priority**: Critical, High, Medium, Low
- **Status**: Pending, Answered, Deferred

---

## Executive Leadership Questions

### Q-EXEC-001
**Question**: What are the top 3 success criteria for this NetSuite implementation from a business perspective?
**Rationale**: Ensure configuration priorities align with executive vision
**Asked To**: Michael Thompson (CEO), Patricia Wong (CFO)
**Meeting**: Project Kickoff / Executive Alignment
**Priority**: High
**Status**: Pending

### Q-EXEC-002
**Question**: Is Canada expansion still planned for 2027, or has the timeline changed?
**Rationale**: Determines if we need to accelerate or deprioritize Canada subsidiary setup
**Asked To**: Michael Thompson (CEO), Patricia Wong (CFO)
**Meeting**: Project Kickoff
**Priority**: Medium
**Status**: Pending

### Q-EXEC-003
**Question**: Are there any other strategic initiatives (M&A, new product lines, business model changes) planned in the next 12-18 months that should inform the NetSuite design?
**Rationale**: Ensure scalability for known future changes
**Asked To**: Michael Thompson (CEO)
**Meeting**: Project Kickoff
**Priority**: Medium
**Status**: Pending

### Q-EXEC-004
**Question**: What is the approved budget for this implementation, and is there a contingency?
**Rationale**: Understand budget constraints for scope decisions
**Asked To**: Patricia Wong (CFO)
**Meeting**: Project Kickoff
**Priority**: High
**Status**: Pending

### Q-EXEC-005
**Question**: Are there any "off-limits" dates for go-live due to business events (e.g., peak season, board meetings, audits)?
**Rationale**: Timeline planning
**Asked To**: Michael Thompson (CEO), David Martinez (COO)
**Meeting**: Project Kickoff
**Priority**: High
**Status**: Pending

---

## Finance Questions (CFO/Controller)

### Q-FIN-001
**Question**: Confirm fiscal calendar is January-December, and this will NOT change. Correct?
**Rationale**: Foundational to accounting periods configuration
**Asked To**: Patricia Wong (CFO)
**Meeting**: Finance Workshop - Week 1
**Priority**: Critical
**Status**: Pending

### Q-FIN-002
**Question**: What is the preferred inventory costing method: Average Cost, FIFO, or Standard Cost? Has this been discussed with external auditors?
**Rationale**: Major impact on COGS and inventory valuation
**Asked To**: Patricia Wong (CFO), Susan Park (Controller)
**Meeting**: Finance Workshop - Week 1
**Priority**: Critical
**Status**: Pending

### Q-FIN-003
**Question**: For service revenue (extended warranties, fitting services, repairs), when is revenue recognized? At time of sale or over service period?
**Rationale**: Revenue recognition rules, deferred revenue setup
**Asked To**: Patricia Wong (CFO), External Auditor
**Meeting**: Finance Workshop - Week 1
**Priority**: High
**Status**: Pending

### Q-FIN-004
**Question**: Do any vendor agreements include consignment inventory terms?
**Rationale**: Special inventory accounting if consignment exists
**Asked To**: Patricia Wong (CFO), Purchasing Team
**Meeting**: Finance Workshop - Week 1
**Priority**: Medium
**Status**: Pending

### Q-FIN-005
**Question**: Depreciation schedules for fixed assets: useful life and method for each asset category (fixtures, POS equipment, computers, leasehold improvements, etc.)?
**Rationale**: Fixed asset configuration, depreciation automation
**Asked To**: Susan Park (Controller)
**Meeting**: Finance Workshop - Week 1
**Priority**: High
**Status**: Pending

### Q-FIN-006
**Question**: Is there a formal budgeting process? If yes, who creates budgets, at what level of detail, and when?
**Rationale**: Determines if NetSuite Planning & Budgeting module needed
**Asked To**: Patricia Wong (CFO), Brian O'Connor (FP&A)
**Meeting**: Finance Workshop - Week 1
**Priority**: Medium
**Status**: Pending

### Q-FIN-007
**Question**: For gift cards: Do they expire? What is the breakage estimate? How is breakage recognized?
**Rationale**: Gift card liability and revenue recognition
**Asked To**: Patricia Wong (CFO), Susan Park (Controller)
**Meeting**: Finance Workshop - Week 1
**Priority**: Medium
**Status**: Pending

### Q-FIN-008
**Question**: For loyalty points: What is typical breakage (% never redeemed)? How is breakage recognized?
**Rationale**: Loyalty liability calculation
**Asked To**: Patricia Wong (CFO), Marketing Team
**Meeting**: Finance Workshop - Week 1
**Priority**: Medium
**Status**: Pending

### Q-FIN-009
**Question**: Do you accept any B2C customer payments on account (AR aging), or is all B2C pre-paid? Any wholesale/B2B customers with payment terms?
**Rationale**: Determines AR management and collections needs
**Asked To**: Patricia Wong (CFO), Sales Team
**Meeting**: Finance Workshop - Week 1
**Priority**: High
**Status**: Pending

### Q-FIN-010
**Question**: When do you enter vendor bills in the system: upon receipt of goods or upon receipt of invoice from vendor?
**Rationale**: AP accrual process, month-end close
**Asked To**: Susan Park (Controller), AP Team
**Meeting**: Finance Workshop - Week 1
**Priority**: Medium
**Status**: Pending

### Q-FIN-011
**Question**: Target for month-end close is 5 business days. What is current close timeline and main bottlenecks?
**Rationale**: Understand process improvements needed
**Asked To**: Susan Park (Controller)
**Meeting**: Finance Workshop - Week 1
**Priority**: Medium
**Status**: Pending

### Q-FIN-012
**Question**: Which states do you have physical nexus (stores) and economic nexus (e-commerce sales thresholds)? Has a nexus study been completed?
**Rationale**: SuiteTax configuration, compliance
**Asked To**: Patricia Wong (CFO), Tax Advisor
**Meeting**: Finance Workshop - Week 1 (or separate tax meeting)
**Priority**: High
**Status**: Pending

---

## Operations Questions (COO)

### Q-OPS-001
**Question**: Walk through a typical day in the warehouse: receiving, putaway, picking, packing, shipping. What are pain points with current process?
**Rationale**: Understand warehouse operations for NetSuite configuration
**Asked To**: David Martinez (COO), Warehouse Manager
**Meeting**: Warehouse Operations Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-OPS-002
**Question**: For ship-from-store: How do you decide which store fulfills an online order? Distance, inventory level, store performance, other factors?
**Rationale**: Fulfillment routing algorithm
**Asked To**: David Martinez (COO), E-commerce Operations
**Meeting**: Fulfillment Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-OPS-003
**Question**: For BOPIS (Buy Online Pickup In Store): Walk through the process from order placed to customer pickup. How is customer notified? How long do you hold the order?
**Rationale**: BOPIS workflow configuration
**Asked To**: David Martinez (COO), Store Operations
**Meeting**: Fulfillment Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-OPS-004
**Question**: For prescription orders: Walk through the verification process. Who verifies? What is the SLA? What happens if prescription is expired or invalid?
**Rationale**: Prescription workflow and compliance
**Asked To**: David Martinez (COO), Compliance
**Meeting**: Operations Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-OPS-005
**Question**: How often are stores replenished from the warehouse? Is it push (warehouse decides) or pull (store requests)? How are quantities determined?
**Rationale**: Store replenishment configuration
**Asked To**: David Martinez (COO), Merchandising
**Meeting**: Inventory Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-OPS-006
**Question**: Are display models (sunglasses on display in stores) tracked separately from backstock inventory? Can they be sold?
**Rationale**: Inventory tracking and shrinkage
**Asked To**: David Martinez (COO), Store Operations
**Meeting**: Inventory Workshop - Week 2
**Priority**: Low
**Status**: Pending

### Q-OPS-007
**Question**: Walk through the damaged goods process: how identified, how tracked, RMA to vendor, disposal/salvage?
**Rationale**: Damaged goods workflow
**Asked To**: David Martinez (COO), Warehouse Manager
**Meeting**: Inventory Workshop - Week 2
**Priority**: Low
**Status**: Pending

### Q-OPS-008
**Question**: Are any products tracked by serial number or lot number for quality control or warranty tracking?
**Rationale**: Serial/lot tracking requirements
**Asked To**: David Martinez (COO), Quality Team
**Meeting**: Inventory Workshop - Week 2
**Priority**: Medium
**Status**: Pending

### Q-OPS-009
**Question**: For annual physical inventory: When do you prefer to conduct (during holiday season, January, mid-year)? What is current process?
**Rationale**: Physical inventory planning
**Asked To**: David Martinez (COO), Susan Park (Controller)
**Meeting**: Inventory Workshop - Week 2
**Priority**: Low
**Status**: Pending

---

## E-Commerce Questions (VP Digital Operations)

### Q-ECOM-001
**Question**: Is Shopify the master system for product content (descriptions, images, SEO), and NetSuite is master for SKU/pricing/inventory? Or different?
**Rationale**: Data flow direction for integration
**Asked To**: Sarah Mitchell (VP Digital Ops), E-commerce Team
**Meeting**: E-commerce Integration Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-ECOM-002
**Question**: What Shopify customizations are in place? Headless frontend or theme-based? Impact on standard NetSuite-Shopify connector?
**Rationale**: Integration approach and complexity
**Asked To**: Sarah Mitchell (VP Digital Ops), E-commerce Dev Team
**Meeting**: E-commerce Integration Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-ECOM-003
**Question**: Fraud detection: What are the specific rules for flagging orders (dollar amount, velocity, address mismatch, etc.)? Who reviews? What is SLA?
**Rationale**: Fraud workflow configuration
**Asked To**: Sarah Mitchell (VP Digital Ops), Risk Manager
**Meeting**: E-commerce Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-ECOM-004
**Question**: Are there custom Shopify fields (beyond standard) that need to sync to NetSuite? Examples: face shape, style preference captured during online checkout?
**Rationale**: Custom field mapping for integration
**Asked To**: Sarah Mitchell (VP Digital Ops), E-commerce Team
**Meeting**: E-commerce Integration Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-ECOM-005
**Question**: What is the real e-commerce revenue percentage? Company profile says 40%, Business Model says 35%, unclear if mobile is separate or included.
**Rationale**: Reporting baseline clarity
**Asked To**: Sarah Mitchell (VP Digital Ops), Finance
**Meeting**: E-commerce Workshop - Week 2
**Priority**: Low
**Status**: Pending

---

## Technology / IT Questions (CTO)

### Q-IT-001
**Question**: CRITICAL: Is NetSuite currently in use for inventory management (as System Inventory doc suggests), or is this a brand new NetSuite implementation?
**Rationale**: Fundamentally changes project approach (expansion vs. new)
**Asked To**: James Chen (CTO), IT Lead
**Meeting**: Project Kickoff - Week 1
**Priority**: Critical
**Status**: Pending

### Q-IT-002
**Question**: Will the custom Order Management System (SunStyle Order Hub) be retired and replaced by NetSuite native OMS, or will it remain and integrate with NetSuite?
**Rationale**: Core architecture decision
**Asked To**: James Chen (CTO), Sarah Mitchell (VP Digital Ops)
**Meeting**: Architecture Workshop - Week 1
**Priority**: Critical
**Status**: Pending

### Q-IT-003
**Question**: Will Lightspeed POS remain in stores (and integrate to NetSuite), or will it be replaced by NetSuite POS?
**Rationale**: Major scope and timeline decision
**Asked To**: James Chen (CTO), David Martinez (COO)
**Meeting**: Architecture Workshop - Week 1
**Priority**: Critical
**Status**: Pending

### Q-IT-004
**Question**: Network assessment: Do all 25 stores have reliable high-speed internet (50+ Mbps) suitable for cloud-based NetSuite? Any connectivity issues?
**Rationale**: Infrastructure readiness, offline mode requirements
**Asked To**: James Chen (CTO), Robert Kim (Infrastructure Lead)
**Meeting**: IT Infrastructure Review - Week 1
**Priority**: High
**Status**: Pending

### Q-IT-005
**Question**: For Lightspeed POS integration: What version at each store? Is configuration consistent? Real-time or batch integration preferred?
**Rationale**: POS integration design
**Asked To**: James Chen (CTO), IT Support Team
**Meeting**: Integration Architecture - Week 2
**Priority**: High
**Status**: Pending

### Q-IT-006
**Question**: For mobile app: Which NetSuite data/functions does the app need to access (order status, loyalty points, product search, checkout)? REST or GraphQL?
**Rationale**: Mobile app API integration design
**Asked To**: James Chen (CTO), Maya Patel (App Dev Lead)
**Meeting**: Mobile Integration Workshop - Week 3
**Priority**: High
**Status**: Pending

### Q-IT-007
**Question**: Is Single Sign-On (SSO) required, or is direct NetSuite login with MFA acceptable for Phase 1?
**Rationale**: Authentication approach
**Asked To**: James Chen (CTO), Carlos Rodriguez (Security Lead)
**Meeting**: IT Infrastructure Review - Week 1
**Priority**: Medium
**Status**: Pending

### Q-IT-008
**Question**: For BigQuery data warehouse: Which NetSuite data sets are needed? Real-time or batch ETL? Who manages ETL (IT or Data team)?
**Rationale**: Data warehouse integration scope
**Asked To**: James Chen (CTO), John Williams (Data & Analytics Lead)
**Meeting**: Analytics Integration - Week 3
**Priority**: Low (post-go-live acceptable)
**Status**: Pending

### Q-IT-009
**Question**: Email infrastructure: Are SPF/DKIM/DMARC configured for SunStyle domain to support high-volume transactional emails from NetSuite?
**Rationale**: Email deliverability
**Asked To**: James Chen (CTO), IT Team
**Meeting**: IT Infrastructure Review - Week 1
**Priority**: Medium
**Status**: Pending

### Q-IT-010
**Question**: What is current data quality in QuickBooks, Lightspeed POS, and custom OMS? Are there known data issues to address before migration?
**Rationale**: Data migration planning
**Asked To**: James Chen (CTO), IT Team, Finance Team
**Meeting**: Data Migration Planning - Week 1
**Priority**: High
**Status**: Pending

### Q-PURCH-004
**Question**: NEW (2026-01-30) - For wholesale custom frame orders (sports teams): Walk through the complete quote-to-order process from initial contact through delivery. How are design specifications captured, approved, and communicated to vendors?
**Rationale**: Newly discovered wholesale business requiring custom design workflow, NetSuite CRM configuration, and integration with sourcing process
**Asked To**: Sales Team (Wholesale), Design/Product Development Team, Purchasing Team
**Meeting**: NEW - Wholesale Quote-to-Order Workshop - Week 2
**Priority**: High
**Status**: Pending
**Related Docs**: `customer-knowledgebase/03-functional-processes/quote-to-order-wholesale.md`
**Sub-questions**:
- How are custom color/design specifications captured on estimates?
- How is the design team notified of new custom quotes?
- Where are design mockups and renderings stored?
- How are custom specifications communicated to vendors?
- What is the customer approval workflow for quotes?
- Are custom frames drop-shipped or received into inventory first?
- What are the payment terms for custom wholesale orders (deposits, net terms)?
- Should design specifications be a separate custom record or estimate fields?
- Are there external systems for design management (PLM, etc.)?
- What percentage of revenue comes from wholesale custom orders?

### Q-PURCH-005
**Question**: NEW (2026-01-30) - Should the Sourcing Tracker custom record be enhanced to link to Estimate (Quote) records for wholesale custom sourcing?
**Rationale**: Integration between CRM quotes and vendor sourcing workflow
**Asked To**: Purchasing Team, Sales Team, IT
**Meeting**: NEW - Wholesale Quote-to-Order Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-PURCH-006
**Question**: NEW (2026-01-30) - Who are the primary vendors/manufacturers for custom frame production? Do they have NetSuite vendor portal access or is communication via email?
**Rationale**: Vendor communication strategy for custom orders
**Asked To**: Purchasing Team
**Meeting**: NEW - Wholesale Quote-to-Order Workshop - Week 2
**Priority**: Medium
**Status**: Pending

---

## CRM / Marketing Questions

### Q-CRM-001
**Question**: Is Salesforce the master system for customer marketing data (preferences, campaign history), and NetSuite is master for transactional data? Or different?
**Rationale**: Data flow direction for integration
**Asked To**: Marketing Team, CRM Team
**Meeting**: CRM Integration Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-CRM-002
**Question**: Are there custom Salesforce objects (beyond standard Contacts, Accounts, Cases) that need to sync to NetSuite?
**Rationale**: Integration scope
**Asked To**: CRM Team
**Meeting**: CRM Integration Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-CRM-003
**Question**: Customer segmentation (VIP, At-Risk, New, Lapsed): What are the specific criteria for each segment? Who manages assignments?
**Rationale**: Segmentation configuration
**Asked To**: Marketing Team
**Meeting**: Marketing Workshop - Week 3
**Priority**: Low
**Status**: Pending

### Q-CRM-004
**Question**: How is campaign ROI measured? Multi-touch attribution or last-touch? UTM parameters used consistently?
**Rationale**: Campaign tracking design
**Asked To**: Marketing Team, E-commerce Team
**Meeting**: Marketing Workshop - Week 3
**Priority**: Low
**Status**: Pending

---

## Store Operations Questions

### Q-STORE-001
**Question**: Do store managers process transactions, or only sales associates? Different permissions needed?
**Rationale**: Role and permission configuration
**Asked To**: David Martinez (COO), Store Operations Manager
**Meeting**: Store Operations Workshop - Week 2
**Priority**: Low
**Status**: Pending

### Q-STORE-002
**Question**: Sales associate commission structure: Rate (%), eligible products, payment frequency, clawbacks for returns?
**Rationale**: Commission calculation configuration
**Asked To**: David Martinez (COO), HR Team
**Meeting**: Store Operations Workshop - Week 2
**Priority**: Medium
**Status**: Pending

### Q-STORE-003
**Question**: Price override authority: Who can override prices (store manager, corporate)? Thresholds? Documentation required?
**Rationale**: Price override controls
**Asked To**: David Martinez (COO), Finance
**Meeting**: Store Operations Workshop - Week 2
**Priority**: Medium
**Status**: Pending

### Q-STORE-004
**Question**: Employee discount policy: Percentage, eligibility, limits, applicable products?
**Rationale**: Discount configuration
**Asked To**: HR Team, Store Operations
**Meeting**: HR/Store Operations Workshop - Week 3
**Priority**: Low
**Status**: Pending

---

## Customer Service Questions

### Q-CS-001
**Question**: Case routing: Round-robin, skills-based, or queue-based? VIP priority routing? After-hours escalation?
**Rationale**: Case assignment automation
**Asked To**: Customer Service Manager
**Meeting**: Customer Service Workshop - Week 3
**Priority**: Low
**Status**: Pending

### Q-CS-002
**Question**: Return inspection standards: What defines "resalable" vs. "damaged"? Who inspects? Photos required?
**Rationale**: Return inspection workflow
**Asked To**: Customer Service Manager, Warehouse Manager
**Meeting**: Returns Workshop - Week 3
**Priority**: Medium
**Status**: Pending

### Q-CS-003
**Question**: Do you allow backorders when item is out of stock? If yes, what is the process for notification, cancellation, partial shipment?
**Rationale**: Backorder workflow
**Asked To**: Customer Service Manager, Operations
**Meeting**: Customer Service Workshop - Week 3
**Priority**: Medium
**Status**: Pending

---

## Purchasing Questions

### Q-PURCH-001
**Question**: Vendor onboarding: Who approves new vendors? Required documentation (W-9, insurance, certs)? Vendor portal or email?
**Rationale**: Vendor setup workflow
**Asked To**: Purchasing Team, Finance
**Meeting**: Purchasing Workshop - Week 3
**Priority**: Low
**Status**: Pending

### Q-PURCH-002
**Question**: What percentage of products are imported from overseas? Customs broker used? How is landed cost (freight, duties, insurance) calculated?
**Rationale**: Landed cost configuration
**Asked To**: Purchasing Team, Finance
**Meeting**: Purchasing Workshop - Week 3
**Priority**: Medium
**Status**: Pending

### Q-PURCH-003
**Question**: Are vendor prices negotiated annually? Contracts tracked? Volume discounts or rebates?
**Rationale**: Contract management needs
**Asked To**: Purchasing Team
**Meeting**: Purchasing Workshop - Week 3
**Priority**: Low
**Status**: Pending

---

## Warehouse Questions

### Q-WH-001
**Question**: Current bin numbering scheme (if any) in warehouse? Fast-movers in accessible bins? Random vs. fixed bin assignment?
**Rationale**: Bin management configuration
**Asked To**: Warehouse Manager
**Meeting**: Warehouse Workshop - Week 2
**Priority**: Medium
**Status**: Pending

### Q-WH-002
**Question**: Are barcode scanners currently used in warehouse? What barcode standard (UPC, Code 128, etc.)?
**Rationale**: Barcode infrastructure validation
**Asked To**: Warehouse Manager, IT
**Meeting**: Warehouse Workshop - Week 2
**Priority**: High
**Status**: Pending

### Q-WH-003
**Question**: Cycle counting: Is ABC classification currently used? Acceptable count frequency (A monthly, B quarterly, C semi-annual)?
**Rationale**: Cycle counting configuration
**Asked To**: Warehouse Manager, Finance
**Meeting**: Warehouse Workshop - Week 2
**Priority**: Medium
**Status**: Pending

---

## Payment / Reconciliation Questions

### Q-PAY-001
**Question**: Stripe payout frequency: Daily or weekly? How are fees netted out? Reconciliation process?
**Rationale**: Payment reconciliation configuration
**Asked To**: Finance Team, E-commerce Team
**Meeting**: Payment Integration Workshop - Week 3
**Priority**: High
**Status**: Pending

### Q-PAY-002
**Question**: For refunds and chargebacks: How handled in Stripe? How reflected in NetSuite GL?
**Rationale**: Payment exception handling
**Asked To**: Finance Team, E-commerce Team
**Meeting**: Payment Integration Workshop - Week 3
**Priority**: High
**Status**: Pending

---

## Legal / Compliance Questions

### Q-LEGAL-001
**Question**: Prescription eyewear: Are optometrists employed by SunStyle or external partners? Who is liable for prescription errors? Professional liability insurance?
**Rationale**: Liability and compliance understanding
**Asked To**: Legal Team, Compliance
**Meeting**: Compliance Review - Week 2
**Priority**: Medium
**Status**: Pending

### Q-LEGAL-002
**Question**: Is prescription information considered PHI (Protected Health Information) under HIPAA? What are compliance requirements?
**Rationale**: Data security and access controls
**Asked To**: Legal Team, Compliance
**Meeting**: Compliance Review - Week 2
**Priority**: Medium
**Status**: Pending

### Q-LEGAL-003
**Question**: GDPR applicability: Do you sell to EU customers? If yes, what are data privacy requirements?
**Rationale**: Data privacy configuration
**Asked To**: Legal Team
**Meeting**: Compliance Review - Week 2
**Priority**: Medium
**Status**: Pending

### Q-LEGAL-004
**Question**: SOX applicability: Is SunStyle subject to Sarbanes-Oxley? If not currently, are there plans for IPO or being acquired by public company?
**Rationale**: Internal controls and audit requirements
**Asked To**: Patricia Wong (CFO), Legal Team
**Meeting**: Compliance Review - Week 2
**Priority**: Medium
**Status**: Pending

---

## Summary Statistics

**Total Questions**: 88 (+3 new - 2026-01-30)
- Executive: 5
- Finance: 12
- Operations: 9
- E-Commerce: 5
- IT/Technology: 10
- CRM/Marketing: 4
- Store Operations: 4
- Customer Service: 3
- Purchasing: 6 (+3 new)
- Warehouse: 3
- Payment/Reconciliation: 2
- Legal/Compliance: 4

**Priority Breakdown**:
- Critical: 5
- High: 28 (+2 new)
- Medium: 25 (+1 new)
- Low: 14

---

## Recommended Meeting Schedule

### Week 1
1. **Project Kickoff** (Executive team) - Q-EXEC-001 through 005, Q-IT-001, 002, 003
2. **Finance Workshop Day 1** (CFO, Controller, FP&A) - Q-FIN-001 through 012
3. **IT Infrastructure Review** (CTO, IT team) - Q-IT-004, 007, 009, 010
4. **Data Migration Planning** (IT, Finance) - Q-IT-010

### Week 2
5. **Architecture Workshop** (CTO, VP Digital Ops, COO) - Q-IT-002, 003
6. **NEW: Wholesale Quote-to-Order Workshop** (Sales-Wholesale, Design/Product, Purchasing, IT) - Q-PURCH-004, 005, 006
7. **Warehouse Operations Workshop** (Warehouse team) - Q-OPS-001, Q-WH-001, 002, 003
8. **Fulfillment Workshop** (Operations, E-commerce) - Q-OPS-002, 003, 004, 005
9. **Inventory Workshop** (Operations, Merchandising) - Q-OPS-006, 007, 008, 009
10. **E-commerce Integration Workshop** (E-commerce team, IT) - Q-ECOM-001, 002, 003, 004, 005
11. **CRM Integration Workshop** (CRM, Marketing) - Q-CRM-001, 002
12. **Integration Architecture** (IT) - Q-IT-005
13. **Store Operations Workshop** (Store Ops, HR) - Q-STORE-001, 002, 003, Q-OPS-006
14. **Compliance Review** (Legal, Compliance, Operations) - Q-LEGAL-001, 002, 003, 004

### Week 3
14. **Mobile Integration Workshop** (App Dev team, IT) - Q-IT-006
15. **Payment Integration Workshop** (Finance, E-commerce, IT) - Q-PAY-001, 002
16. **Marketing Workshop** (Marketing team) - Q-CRM-003, 004
17. **Customer Service Workshop** (CS team, Operations) - Q-CS-001, 002, 003
18. **Returns Workshop** (CS, Warehouse, Finance) - Q-CS-002
19. **Purchasing Workshop** (Purchasing, Finance) - Q-PURCH-001, 002, 003
20. **HR/Store Operations Workshop** (HR, Store Ops) - Q-STORE-004
21. **Analytics Integration** (Data team, IT) - Q-IT-008

---

## Question Tracking

### Status Tracking
- **Pending**: Question not yet asked
- **Answered**: Question answered, documented
- **Deferred**: Question deferred to later phase
- **N/A**: Question no longer relevant

### Answer Documentation
When a question is answered:
1. Update Status to "Answered"
2. Document answer in this log or reference configuration document
3. Note any follow-up actions or impacts
4. Update related Gaps or Ambiguities logs

---

## Change Log

| Date | Question ID | Change | Answer Summary |
|------|-------------|--------|----------------|
| 2026-01-28 | All | Initial questions documented | - |
| 2026-01-30 | Q-PURCH-004, 005, 006 | New wholesale quote-to-order questions added | New process discovered; requires workshop |
| 2026-01-30 | Q-FIN-009 | Partially answered | Wholesale B2B business confirmed (sports teams custom orders) - payment terms still TBD |

---

**Next Steps**:
1. Distribute question list to stakeholders 1 week before their workshop
2. Schedule all workshops for Weeks 1-3
3. Assign facilitators and note-takers for each workshop
4. Consolidate answers and update configuration plan
5. Identify any new questions that arise during workshops

---

**Maintained By**: Project Manager and Business Analyst
**Distribution**: All project stakeholders
