# Configuration Assumptions Log
## SunStyle Retail NetSuite Implementation

**Document Purpose**: Track all assumptions made during configuration planning that require validation or may impact the implementation.

**Last Updated**: 2026-01-28
**Owner**: Implementation Project Manager

---

## Business Assumptions

### BA-001: Transaction Volumes
**Assumption**: Current transaction volumes (~500 orders/day, ~150k transactions/year) will remain stable during implementation
**Impact**: Sizing, performance, license count
**Validation Required**: Monthly volume reports from existing systems
**Risk if Wrong**: May need additional licenses or performance tuning
**Status**: To be validated with sales forecasts

### BA-002: Store Count
**Assumption**: 25 retail stores + 1 warehouse will remain constant during implementation (no new openings)
**Impact**: Location configuration, inventory allocation, training scope
**Validation Required**: Confirm with COO/Real Estate team
**Risk if Wrong**: Additional locations require configuration, training, potential delays
**Status**: To be validated

### BA-003: Canada Expansion Timeline
**Assumption**: Canada expansion delayed until 2027, not in scope for initial go-live
**Impact**: No CAD currency transactions in Phase 1, subsidiary structure ready but not active
**Validation Required**: Confirm with CEO/CFO strategic plan
**Risk if Wrong**: Need to accelerate multi-currency and Canada subsidiary setup
**Status**: Assumed per business overview, needs confirmation

### BA-004: Product Catalog Stability
**Assumption**: Current product catalog (~2,000 SKUs) is relatively stable; no major brand changes during implementation
**Impact**: Item master data volume, categorization structure
**Validation Required**: Review with Merchandising team
**Risk if Wrong**: May need to reconfigure item categories or add new fields
**Status**: To be validated

### BA-005: Business Model Continuity
**Assumption**: Core business model (retail + e-commerce + services) remains unchanged; no pivot to subscription, rental, or other models during implementation
**Impact**: Revenue recognition, order types, billing cycles
**Validation Required**: Confirm with Executive team
**Risk if Wrong**: Major configuration changes, potential timeline impact
**Status**: Assumed per current operations

### BA-006: Loyalty Program Structure
**Assumption**: SunStyle Rewards program structure (points-based, 1 pt per $1, 100 pts = $10 redemption, 24-month expiration) remains unchanged
**Impact**: Custom fields, calculations, customer deposits
**Validation Required**: Confirm with Marketing/CRM team
**Risk if Wrong**: Need to reconfigure loyalty calculations
**Status**: Assumed per CKB

### BA-007: Prescription Services
**Assumption**: Prescription eyewear represents ~10% of revenue and requires prescription upload/verification workflow
**Impact**: Custom fields, workflows, document management
**Validation Required**: Confirm volumes and process with Operations
**Risk if Wrong**: Underbuilt workflow, potential compliance issues
**Status**: To be validated

### BA-008: Return Policy
**Assumption**: 30-day return policy, free return shipping, no restocking fee continues
**Impact**: RMA workflow, refund processing, financial accruals
**Validation Required**: Confirm with Customer Service and Finance
**Risk if Wrong**: Workflow changes, potential revenue recognition impacts
**Status**: Assumed per CKB

### BA-009: Seasonal Demand
**Assumption**: Summer (May-August) represents 45% of annual revenue due to sunglasses seasonality
**Impact**: Inventory planning, reorder points, resource planning for peak
**Validation Required**: Historical sales analysis
**Risk if Wrong**: Stockouts or excess inventory
**Status**: To be validated with historical data

### BA-010: Wholesale Operations
**Assumption**: No wholesale or B2B operations currently (100% B2C); if wholesale exists, it's minimal
**Impact**: Customer categories, pricing, terms, separate workflows if needed
**Validation Required**: Confirm with Sales/Finance
**Risk if Wrong**: Need to add wholesale customer management
**Status**: Assumed (not mentioned in CKB), needs validation

---

## Technical Assumptions

### TA-001: Data Quality
**Assumption**: Current system data (QuickBooks, OMS, Lightspeed POS) is accurate and exportable for migration
**Impact**: Migration timeline, data cleanup effort
**Validation Required**: Data quality assessment in Week 1
**Risk if Wrong**: Extended data cleanup, migration delays
**Status**: To be validated

### TA-002: Historical Data Retention
**Assumption**: 2-3 years of historical financial and transaction data is available and will be migrated
**Impact**: Data migration scope, NetSuite storage
**Validation Required**: Confirm with IT and Finance audit requirements
**Risk if Wrong**: More/less data to migrate, compliance risks
**Status**: Assumed, needs validation

### TA-003: Network Connectivity
**Assumption**: All 25 stores have reliable high-speed internet (minimum 50 Mbps) suitable for cloud-based NetSuite
**Impact**: System performance, real-time inventory, POS integration
**Validation Required**: Network assessment at each location
**Risk if Wrong**: Need network upgrades, potential delays, offline mode requirements
**Status**: To be validated by IT infrastructure team

### TA-004: Integration API Availability
**Assumption**: All external systems (Shopify, Salesforce, Lightspeed, Stripe) have documented APIs and support needed integration patterns
**Impact**: Integration design, development effort
**Validation Required**: API documentation review, POC for complex integrations
**Risk if Wrong**: Custom workarounds, increased development time/cost
**Status**: High confidence for Shopify/Salesforce/Stripe; Lightspeed to be validated

### TA-005: Lightspeed POS Version
**Assumption**: All stores on same version of Lightspeed Retail (X-Series) with consistent configuration
**Impact**: POS integration, data mapping, testing scope
**Validation Required**: Store location audit
**Risk if Wrong**: Multiple integration versions, increased complexity
**Status**: Assumed per CKB, needs validation

### TA-006: User Device Compatibility
**Assumption**: All users have modern devices (Windows 10+, macOS, iPads, Chrome browsers) compatible with NetSuite
**Impact**: User experience, training approach
**Validation Required**: IT asset inventory
**Risk if Wrong**: Device upgrades needed, budget impact
**Status**: To be validated

### TA-007: Barcode Infrastructure
**Assumption**: Warehouse and stores currently use barcode scanning; barcodes on all inventory items
**Impact**: Receiving, picking, cycle counting processes
**Validation Required**: Confirm barcode standards (UPC, Code 128, etc.)
**Risk if Wrong**: Need to implement barcoding infrastructure, labeling project
**Status**: Assumed for warehouse, to be validated for stores

### TA-008: Email Deliverability
**Assumption**: SunStyle Retail has SPF/DKIM/DMARC configured for email domain to support high-volume transactional emails from NetSuite
**Impact**: Order confirmations, shipment notifications, email reliability
**Validation Required**: Review with IT and email admin
**Risk if Wrong**: Emails to spam, customer complaints, need DNS changes
**Status**: To be validated

### TA-009: Single Sign-On
**Assumption**: SSO not required for initial go-live; users will authenticate directly to NetSuite with MFA
**Impact**: Login process, security, user management
**Validation Required**: Confirm with IT Security and CTO
**Risk if Wrong**: Need to implement SSO (Okta or Google Workspace), additional timeline
**Status**: Assumed for Phase 1; may add later

### TA-010: Data Warehouse Integration
**Assumption**: BigQuery integration is for reporting only (read from NetSuite), not transactional; batch ETL acceptable
**Impact**: Integration pattern, real-time requirements
**Validation Required**: Confirm with Data & Analytics team
**Risk if Wrong**: Need real-time streaming, increased complexity
**Status**: Assumed per CKB integration points

---

## Financial Assumptions

### FA-001: Fiscal Calendar
**Assumption**: Calendar year fiscal year (Jan-Dec) is fixed and will not change
**Impact**: Accounting periods, tax reporting, budget cycles
**Validation Required**: Confirm with CFO
**Risk if Wrong**: Need to reconfigure fiscal calendar (major impact)
**Status**: Assumed per CKB, high confidence

### FA-002: Sales Tax Nexus
**Assumption**: Physical nexus in 5 states (CA, NV, AZ, OR, WA based on store locations) + economic nexus in other states
**Impact**: SuiteTax configuration, filing obligations
**Validation Required**: Sales tax nexus study
**Risk if Wrong**: Incorrect tax collection, compliance risk
**Status**: To be validated by tax advisor

### FA-003: Average Cost Method
**Assumption**: Inventory costing will use Average Cost method (not FIFO or Serial/Lot)
**Impact**: COGS calculation, inventory valuation
**Validation Required**: Confirm with CFO and Controller
**Risk if Wrong**: Need to switch to different costing method, financial impact
**Status**: Assumed (common for retail), needs validation

### FA-004: Revenue Recognition
**Assumption**: Revenue recognized at point of sale (for retail) and upon shipment (for e-commerce); no deferred revenue except extended warranties
**Impact**: Revenue accounts, period close, financial reporting
**Validation Required**: Confirm with CFO and external auditors
**Risk if Wrong**: Need complex revenue recognition rules
**Status**: Assumed per standard retail practice, needs validation

### FA-005: Intercompany Transactions
**Assumption**: Minimal to no intercompany transactions in Phase 1 (single operating subsidiary); intercompany setup is for future Canada operations
**Impact**: Complexity of initial configuration, testing scope
**Validation Required**: Confirm no shared services allocations or management fees
**Risk if Wrong**: Need to configure and test intercompany in Phase 1
**Status**: Assumed, needs validation

### FA-006: Payment Terms
**Assumption**: All retail/e-commerce customers are prepaid (credit card or cash); no AR aging for B2C customers
**Impact**: Invoicing workflow, AR management, collections
**Validation Required**: Confirm no accounts receivable for B2C
**Risk if Wrong**: Need AR aging and collections for customer accounts
**Status**: Assumed for B2C, needs validation if wholesale exists

### FA-007: Vendor Payment Terms
**Assumption**: Standard vendor payment terms are Net 30 or Net 60; early payment discounts available from some vendors (2/10 Net 30)
**Impact**: AP workflow, cash flow planning
**Validation Required**: Review vendor contracts
**Risk if Wrong**: Different terms require configuration changes
**Status**: To be validated

### FA-008: Currency Fluctuation Impact
**Assumption**: Minimal foreign currency exposure in Phase 1 (all USD); no hedging required
**Impact**: Multi-currency configuration complexity
**Validation Required**: Review vendor contracts for any foreign currency purchases
**Risk if Wrong**: Need currency hedging or revaluation processes
**Status**: Assumed, needs validation

---

## Resource Assumptions

### RA-001: Stakeholder Availability
**Assumption**: Key stakeholders (CFO, COO, CTO, VP Digital Ops) available 25-50% of their time for requirements, decisions, UAT
**Impact**: Project timeline, decision velocity
**Validation Required**: Confirm with Executive team and Project Sponsor
**Risk if Wrong**: Delayed decisions, timeline slippage
**Status**: To be validated and managed via project governance

### RA-002: Subject Matter Expert Availability
**Assumption**: 10-15 subject matter experts from Finance, Operations, IT, Stores available ~10 hours/week for requirements and testing
**Impact**: Requirements quality, UAT thoroughness
**Validation Required**: Identify and confirm SMEs
**Risk if Wrong**: Incomplete requirements, inadequate testing
**Status**: To be validated

### RA-003: IT Resource Availability
**Assumption**: Internal IT team (5 people) available 50% time for infrastructure, integrations, support
**Impact**: Integration development, go-live support
**Validation Required**: Confirm with CTO and IT lead
**Risk if Wrong**: Need additional contractor resources
**Status**: To be validated

### RA-004: NetSuite Consultant Availability
**Assumption**: NetSuite partner has consultants available on proposed timeline (start within 30 days)
**Impact**: Project start date, timeline
**Validation Required**: Confirm with NetSuite partner
**Risk if Wrong**: Delayed start, push timeline
**Status**: To be validated during contracting

### RA-005: Training Time Allocation
**Assumption**: All users can dedicate 2-3 days for training (varies by role) in Weeks 26-27
**Impact**: Training schedule, user readiness
**Validation Required**: Confirm with department managers
**Risk if Wrong**: Inadequate training, poor adoption
**Status**: To be validated

### RA-006: UAT Availability
**Assumption**: Key users available 50% time for UAT in Weeks 25-26
**Impact**: Testing thoroughness, issue identification
**Validation Required**: UAT planning and commitment
**Risk if Wrong**: Inadequate testing, post-go-live issues
**Status**: To be validated

---

## Operational Assumptions

### OA-001: Go-Live Timing
**Assumption**: Go-live can occur mid-year (Q3 2026), not required to be at fiscal year-end
**Impact**: Project timeline, cutover approach
**Validation Required**: Confirm with CFO (accounting period implications)
**Risk if Wrong**: Need to wait for year-end, extended timeline
**Status**: Assumed for optimal timeline

### OA-002: Cutover Approach
**Assumption**: "Big Bang" cutover over a weekend (Friday night to Monday morning); no extended parallel run
**Impact**: Cutover timeline, risk, support requirements
**Validation Required**: Confirm with Executive team and Project Sponsor
**Risk if Wrong**: Need longer parallel run, more complex cutover
**Status**: Assumed; can adjust to phased if needed

### OA-003: Peak Season Avoidance
**Assumption**: Go-live will NOT occur during peak season (May-August) to minimize risk
**Impact**: Go-live window is Sept-April
**Validation Required**: Confirm with Operations and Sales
**Risk if Wrong**: High-risk go-live during peak demand
**Status**: To be validated and baked into timeline

### OA-004: Store Operations Disruption
**Assumption**: Stores can operate during cutover weekend if needed (not fully dependent on new system immediately)
**Impact**: Cutover risk mitigation
**Validation Required**: Confirm offline/backup procedures with Store Operations
**Risk if Wrong**: All stores down if system issues
**Status**: To be validated and documented in cutover plan

### OA-005: Business Process Changes
**Assumption**: Users willing to adapt processes to NetSuite best practices; not all current processes will be replicated exactly
**Impact**: Change management, training, adoption
**Validation Required**: Set expectations with leadership and users
**Risk if Wrong**: Resistance to change, adoption issues
**Status**: To be managed via change management

### OA-006: Hypercare Support
**Assumption**: 24/7 hypercare support available for first month post-go-live (combo of NetSuite consultants and internal team)
**Impact**: Go-live support, issue resolution
**Validation Required**: Confirm with NetSuite partner and internal IT
**Risk if Wrong**: Inadequate support, prolonged issues
**Status**: To be included in SOW

### OA-007: Mobile App Integration
**Assumption**: Mobile app (React Native) can be updated to integrate with NetSuite APIs; development team available
**Impact**: Mobile order flow, customer experience
**Validation Required**: Confirm with Application Development team
**Risk if Wrong**: Mobile orders don't flow to NetSuite, broken customer experience
**Status**: To be validated with Maya Patel (App Dev Lead)

### OA-008: Warehouse Operations
**Assumption**: Warehouse team comfortable with barcode scanning and NetSuite mobile app for receiving, picking, cycle counting
**Impact**: Training requirements, adoption
**Validation Required**: Warehouse team assessment
**Risk if Wrong**: Need additional training or simplified processes
**Status**: To be validated

---

## Regulatory/Compliance Assumptions

### CA-001: PCI-DSS Compliance
**Assumption**: SunStyle Retail maintains PCI-DSS compliance via Stripe and PayPal (no card data stored in NetSuite)
**Impact**: Security configuration, data handling
**Validation Required**: Review with Security team and payment processors
**Risk if Wrong**: Compliance violation, need card tokenization
**Status**: Assumed per best practices, needs validation

### CA-002: Sales Tax Filing Frequency
**Assumption**: California monthly, other states quarterly based on current filing obligations
**Impact**: SuiteTax configuration, filing calendar
**Validation Required**: Review with tax advisor
**Risk if Wrong**: Incorrect filing schedule, penalties
**Status**: To be validated

### CA-003: GDPR/CCPA Applicability
**Assumption**: CCPA applies (California customers); GDPR applies if selling to EU (to be confirmed)
**Impact**: Data privacy configuration, customer data rights
**Validation Required**: Legal review
**Risk if Wrong**: Non-compliance with data privacy laws
**Status**: To be validated

### CA-004: Prescription Data Privacy
**Assumption**: Prescription information is PHI (Protected Health Information) under HIPAA if partnering with optometrists
**Impact**: Security, access controls, encryption
**Validation Required**: Legal and compliance review
**Risk if Wrong**: HIPAA violations, penalties
**Status**: To be validated

### CA-005: Sarbanes-Oxley (SOX)
**Assumption**: SunStyle Retail is private company, not subject to SOX; however, strong internal controls desired for audit and potential future IPO
**Impact**: Workflow approvals, audit trails, segregation of duties
**Validation Required**: Confirm with CFO and auditors
**Risk if Wrong**: If subject to SOX, need more rigorous controls
**Status**: Assumed (private company), needs confirmation

---

## Integration Assumptions

### IA-001: Shopify as Master for Product Content
**Assumption**: Shopify is master system for product descriptions, images, SEO metadata; NetSuite is master for SKU, pricing, inventory
**Impact**: Integration data flow direction
**Validation Required**: Confirm with E-commerce and Merchandising teams
**Risk if Wrong**: Conflicting product data, need different sync approach
**Status**: To be validated

### IA-002: Salesforce as Master for Customer Marketing Data
**Assumption**: Salesforce is master for marketing preferences, campaign history, lead scoring; NetSuite is master for transaction history
**Impact**: Integration data flow direction
**Validation Required**: Confirm with Marketing and CRM teams
**Risk if Wrong**: Data conflicts, need different sync approach
**Status**: To be validated

### IA-003: Real-Time vs. Batch Integration
**Assumption**:
- **Real-time**: Orders, Inventory, Payments (latency < 5 minutes)
- **Batch**: Customers, Products, Financials (hourly or daily)
**Impact**: Integration design, infrastructure
**Validation Required**: Confirm business requirements for each data type
**Risk if Wrong**: Performance issues or unmet business needs
**Status**: To be validated

### IA-004: Integration Error Handling
**Assumption**: All integrations have retry logic, error logging, and alerting; IT team monitors integration health
**Impact**: Integration reliability, support model
**Validation Required**: Confirm monitoring tools and processes
**Risk if Wrong**: Silent failures, data loss
**Status**: To be implemented and validated

### IA-005: API Rate Limits
**Assumption**: All integrated systems have sufficient API rate limits for SunStyle transaction volumes
**Impact**: Integration throttling, potential delays
**Validation Required**: Review API documentation and limits
**Risk if Wrong**: API throttling, failed integrations
**Status**: To be validated for each system

---

## Summary Statistics

**Total Assumptions**: 51
- Business: 10
- Technical: 10
- Financial: 8
- Resource: 6
- Operational: 8
- Regulatory/Compliance: 5
- Integration: 5

**Validation Status**:
- Validated: 0
- To be Validated: 51
- Validated with Concerns: 0
- Invalid (requires change): 0

**Priority for Validation**:
- **Critical (Week 1-2)**: TA-001 (Data Quality), TA-003 (Network), BA-001 (Volumes), FA-001 (Fiscal Calendar), RA-001 (Stakeholder Availability)
- **High (Week 3-4)**: All Financial, Integration, Regulatory
- **Medium (Week 5+)**: Operational, some Business

---

## Assumption Validation Process

1. **Identify Assumption**: Log here with unique ID
2. **Assign Owner**: Who will validate
3. **Set Deadline**: By when validation needed
4. **Validate**: Gather evidence, confirm with stakeholders
5. **Update Status**: Mark as Validated, Validated with Concerns, or Invalid
6. **Document**: Record validation evidence and any implications
7. **Action**: If invalid, update configuration plan and timeline

---

## Change Log

| Date | Assumption ID | Change | Impact |
|------|---------------|--------|--------|
| 2026-01-28 | All | Initial assumptions documented | Baseline |
| TBD | | | |

---

**Next Review**: Weekly during project
**Maintained By**: Project Manager and Business Analyst
