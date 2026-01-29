# NetSuite Configuration Plan: Procure to Pay
## SunStyle Retail Corporation

**Process Area**: Procure to Pay (P2P) - Purchasing and Accounts Payable
**Customer**: SunStyle Retail Corporation
**Prepared By**: Functional Configuration Agent
**Date**: 2026-01-28
**Version**: 1.0

---

## Executive Summary

This configuration plan outlines the NetSuite implementation for SunStyle Retail's Procure to Pay process, covering vendor management, purchase requisitions, purchase orders, receiving, invoice processing, payment processing, and vendor performance management. The configuration supports both automated replenishment for inventory and manual purchasing for services and non-inventory items.

### Key Objectives
- Automated purchase order creation based on reorder points
- Streamlined vendor onboarding and management
- 3-way matching (PO, Receipt, Invoice) for accuracy
- Efficient accounts payable processing with payment terms optimization
- Vendor performance tracking and optimization
- Cost control and budget management

### Current State Metrics
- Annual Purchases: ~$22M (estimated 50% COGS of $45M revenue)
- Number of Vendors: ~150 active suppliers
- Purchase Orders per Month: ~400 POs
- Average PO Value: $4,500
- Payment Terms: Net 30 (standard), 2/10 Net 30 (some vendors)
- AP Processing Time: Target < 5 days from invoice receipt to payment

---

## Phase 1: Vendor Configuration

### 1.1 Vendor Record Setup
**Tool**: Vendors (Lists > Relationships > Vendors)

**Vendor Information Sections**:

**Primary Information**:
- Vendor Name (legal entity name)
- Vendor ID (auto-generated: V-######)
- DBA Name (if different)
- Tax ID (EIN)
- Vendor Category (classification)
- Vendor Type (supplier type)
- Currency (default: USD)
- Primary Contact Name
- Phone Number
- Email Address
- Website

**Address Information**:
- Remittance Address (for payments)
- Shipping Address (return address for vendor)
- Multiple location support

**Financial Information**:
- Payment Terms (Net 30, 2/10 Net 30, etc.)
- Payment Method (Check, ACH, Wire, Credit Card)
- Default Expense/COGS Account
- 1099 Eligible (checkbox)
- Credit Limit (if applicable)
- Account Number (vendor's account# for us)

**Purchasing Information**:
- Lead Time (days)
- Minimum Order Quantity
- Minimum Order Amount
- Freight Terms (FOB, CIF, etc.)
- Shipping Method Preference
- Order Submission Method (Email, EDI, Portal)

**Custom Fields to Add**:
- Vendor Status (List: Active, Inactive, On Hold, Prospective)
- Vendor Tier (List: Tier 1 - Strategic, Tier 2 - Preferred, Tier 3 - Standard)
- Primary Product Category (List: Sunglasses, Accessories, Services, Packaging)
- Vendor Performance Score (Decimal - calculated)
- Last Performance Review Date (Date)
- Preferred Vendor (Checkbox)
- EDI Capable (Checkbox)
- Drop Ship Vendor (Checkbox)
- International Vendor (Checkbox)
- Country of Origin (List: USA, Italy, China, etc.)
- Payment Hold Reason (Text - if on hold)
- Insurance Certificate Expiration (Date)
- W-9 on File (Checkbox)
- Contract Expiration Date (Date)

---

### 1.2 Vendor Categories
**Tool**: Vendor Categories (Lists > Relationships > Vendor Categories)

**Categories**:
1. **Merchandise Suppliers** - Sunglasses and eyewear products
2. **Accessory Suppliers** - Cases, cleaning kits, straps
3. **Packaging Suppliers** - Boxes, bags, packing materials
4. **Marketing Vendors** - Advertising, promotions, print materials
5. **Technology Vendors** - Software, hardware, IT services
6. **Professional Services** - Legal, accounting, consulting
7. **Facility Services** - Rent, utilities, maintenance
8. **Logistics Providers** - Freight, shipping, 3PL
9. **Store Fixtures & Equipment** - Display units, POS hardware
10. **Office Supplies** - General office consumables

**Purpose**: Reporting, spend analysis, vendor segmentation

---

### 1.3 Vendor Types
**Tool**: Vendor Types (Setup > Accounting > Vendor Types)

**Types**:
1. **Manufacturer** - Direct brand manufacturers
2. **Distributor** - Multi-brand distributors
3. **Wholesaler** - Bulk product suppliers
4. **Service Provider** - Professional and facility services
5. **Contractor** - Independent contractors
6. **Freight Carrier** - Shipping and logistics

**Purpose**: Vendor classification, 1099 tracking, reporting

---

### 1.4 Payment Terms
**Tool**: Terms (Lists > Accounting > Terms)

**Payment Terms**:
1. **Due on Receipt** - Payment immediately upon receipt
   - Net days: 0
   - Discount: None
   - Use for: Small vendors, contractors

2. **Net 15** - Payment due in 15 days
   - Net days: 15
   - Discount: None
   - Use for: Select service providers

3. **Net 30** - Payment due in 30 days (most common)
   - Net days: 30
   - Discount: None
   - Use for: Standard vendor terms

4. **2/10 Net 30** - 2% discount if paid within 10 days, else net 30
   - Net days: 30
   - Discount: 2% if paid by day 10
   - Use for: Preferred vendors offering early payment discount

5. **Net 45** - Payment due in 45 days
   - Net days: 45
   - Discount: None
   - Use for: Large merchandise suppliers

6. **Net 60** - Payment due in 60 days
   - Net days: 60
   - Discount: None
   - Use for: International suppliers

7. **1% 15 Net 45** - 1% discount if paid within 15 days, else net 45
   - Net days: 45
   - Discount: 1% if paid by day 15
   - Use for: Strategic suppliers

**Configuration**: Set "Net 30" as default payment term for new vendors

---

### 1.5 Vendor Approval Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: New Vendor Approval

**Triggers**: New vendor record created

**Approval Routing**:
- Spend < $25,000/year: Purchasing Manager approval
- Spend $25,000-$100,000/year: Purchasing Manager + Finance Manager approval
- Spend > $100,000/year: Purchasing Manager + Finance Manager + CFO approval

**Required Documentation**:
- W-9 form (for US vendors)
- Certificate of Insurance (COI)
- Credit application (for credit terms)
- Vendor agreement/contract
- Banking information (ACH payments)

**Actions**:
- Send approval request email
- Collect required documents
- Vendor status: "Prospective" → "Active" upon approval
- Set up vendor in payment system (ACH)

---

## Phase 2: Item Master Configuration for Purchasing

### 2.1 Item Setup for Purchasing
**Tool**: Items (Lists > Accounting > Items)

**Purchasing Tab Configuration**:

**Inventory Items**:
1. **Vendor Information**:
   - Primary Vendor
   - Alternate Vendors (1-3)
   - Preferred Vendor by location

2. **Cost Information**:
   - Last Purchase Price
   - Average Cost (system-calculated)
   - Standard Cost (for variance analysis)
   - Cost Accounting Method (Average Cost)

3. **Purchasing Details**:
   - Purchase Unit (Each, Case, Dozen)
   - Units per Purchase Unit (conversion)
   - Purchase Description
   - Vendor Part Number/SKU
   - Manufacturer Part Number

4. **Replenishment Settings**:
   - Reorder Point (by location)
   - Preferred Stock Level (by location)
   - Safety Stock Level
   - Economic Order Quantity (EOQ)
   - Lead Time (days)
   - Reorder Multiple (case quantity)

5. **Expense Account Mapping**:
   - COGS Account: 5100 - Cost of Goods Sold (by category)
   - Inventory Asset Account: 1300 - Inventory

**Non-Inventory Purchase Items** (services, expenses):
- Purchase Description
- Default Expense Account
- Default Tax Code
- Primary Vendor

**Custom Fields on Items**:
- Country of Origin (List)
- Harmonized Tariff Code (Text - for imports)
- Duty Rate (Percentage)
- Minimum Order Quantity (MOQ) - Integer
- Order Multiple (Integer - e.g., must order in dozens)
- Supplier Lead Time (Integer - days)
- Last PO Date (Date)
- Last Purchase Price (Currency - auto-populated)
- Average Days Between Orders (Integer - calculated)

---

### 2.2 Item Vendor Relationships
**Tool**: Item Records > Vendors Subtab

**Configuration**:
- Primary Vendor: Preferred supplier
- Vendor Part Number: Vendor's SKU for the item
- Vendor Price: Current price from vendor
- Purchase Tax Code: Tax treatment for purchases
- Schedule: Pricing tiers by quantity

**Pricing by Quantity** (if applicable):
- 1-50 units: $10.00 each
- 51-200 units: $9.50 each
- 201+ units: $9.00 each

**Purpose**: Automatic vendor selection and pricing on POs

---

## Phase 3: Purchase Requisition Configuration

### 3.1 Purchase Requisition Setup
**Tool**: Purchase Requisitions (Enable Features > Purchasing > Purchase Requisitions)

**Purchase Requisition Use Cases**:
1. **Non-Inventory Purchases**: Services, office supplies, one-time purchases
2. **Budget Approval Required**: Purchases requiring pre-approval
3. **Department Requests**: Store managers requesting items

**Purchase Requisition Form Configuration**:
- Requested By (Employee)
- Department/Location
- Requested Date
- Required By Date
- Line Items:
  - Item or Description
  - Quantity
  - Estimated Unit Cost
  - Suggested Vendor
  - Account (expense account)
  - Budget Code (optional)
- Business Justification (Text)
- Attachments (quotes, specifications)

**Custom Fields on Requisition**:
- Budget Code (List - for tracking)
- Budget Amount Available (Currency - calculated)
- Priority (List: Standard, High, Urgent)
- Project Code (Text - if project-related)
- Capital Expense (Checkbox - if CapEx)

---

### 3.2 Purchase Requisition Approval Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Purchase Requisition Approval

**Triggers**: Purchase requisition submitted

**Approval Routing**:
- Requisition < $1,000: Supervisor approval
- Requisition $1,000-$5,000: Department Manager approval
- Requisition $5,000-$25,000: VP approval
- Requisition > $25,000: VP + CFO approval

**Budget Check**:
- If budget code assigned: Verify available budget
- If over budget: Require CFO approval (override)
- Expense categories with budget tracking (configurable)

**Actions**:
- Approved: Convert to Purchase Order (automatic or manual)
- Rejected: Notify requester with reason
- Pending: Send reminder after 2 days

---

## Phase 4: Purchase Order Configuration

### 4.1 Purchase Order Record Setup
**Tool**: Purchase Orders (Customization > Forms > Transaction Forms > Purchase Order)

**Standard Purchase Order Form**:

**Header Information**:
- PO Number (auto-generated)
- Vendor
- PO Date
- Expected Receipt Date
- Ship To Location (warehouse or store)
- Buyer (Employee)
- Department
- Payment Terms
- Shipping Method
- FOB (Freight terms)

**Line Items**:
- Item/Description
- Quantity Ordered
- Unit Cost
- Amount
- Expected Receipt Date (line level)
- Account (expense account for non-inventory)
- Location (for inventory items)
- Memo/Notes

**Totals**:
- Subtotal
- Shipping/Freight
- Tax (if applicable)
- Total Amount

**Custom Fields to Add**:
- PO Type (List: Inventory, Services, Capital Equipment, Marketing)
- Budget Code (List - if applicable)
- Approval Status (List: Pending, Approved, Rejected)
- Approver (Employee)
- Approval Date (Date)
- Requisition Reference (Link to requisition)
- Freight Terms (List: Prepaid, Collect, FOB Origin, FOB Destination)
- Shipment Tracking Number (Text - populated on receipt)
- Quality Inspection Required (Checkbox)
- Drop Ship Order (Checkbox - for customer direct shipments)
- Partial Receipt Allowed (Checkbox)
- Rush Order (Checkbox)
- Contract Number (Text - if under contract)

---

### 4.2 Purchase Order Preferences
**Tool**: Purchasing Preferences (Setup > Accounting > Accounting Preferences > Purchasing)

**Configuration**:
1. Enable Features:
   - ☑ Purchase Orders
   - ☑ Purchase Requisitions
   - ☑ Purchase Approvals
   - ☑ Vendor Bills
   - ☑ Vendor Credits
   - ☑ Vendor Prepayments (if needed)

2. PO Creation Settings:
   - Default PO Status: Pending Approval
   - Require approval before transmission to vendor: Yes
   - Allow receiving without PO: No (enforce PO requirement)
   - Allow billing without PO: Yes (for recurring services)
   - Warn if receiving over PO quantity: Yes
   - Tolerance for over-receipt: 5%
   - Allow partial receipt: Yes
   - Allow change orders: Yes (track revisions)

3. Default Accounts:
   - Default COGS Account: 5100 (by item category)
   - Default Inventory Account: 1300 - Inventory
   - Unbilled Receivables Account: 1425 - Inventory Received Not Billed
   - Accrued Purchases: 2110 - Accrued Purchases

4. Approval Thresholds:
   - Auto-approve POs from replenishment: < $5,000
   - Manager approval: $5,000-$25,000
   - VP approval: $25,000-$100,000
   - CFO approval: > $100,000

---

### 4.3 Purchase Order Numbering
**Tool**: Auto-Generated Numbers (Setup > Company > Auto-Generated Numbers)

**Numbering Scheme**: `PO-YYYYMM-#####`
- PO = Purchase Order prefix
- YYYYMM = Year and month (e.g., 202601)
- ##### = Sequential number (resets monthly)

**Examples**:
- PO-202601-00001
- PO-202601-00002

**Configuration**:
- Enable auto-numbering for purchase orders
- Set prefix: PO-
- Include date stamp: Yes (YYYYMM)
- Sequential digits: 5
- Reset frequency: Monthly

---

### 4.4 Automated Purchase Order Generation
**Tool**: Reorder Point Planning / SuiteScript

**Automated Replenishment Logic**:

**Trigger**: Item quantity falls below Reorder Point

**Calculation**:
- **Reorder Point** = (Average Daily Demand × Lead Time) + Safety Stock
- **Order Quantity** = Preferred Stock Level - (On Hand + On Order)
- **Economic Order Quantity (EOQ)** = √[(2 × Annual Demand × Order Cost) / Holding Cost]

**Automated PO Creation Rules**:
1. System runs daily (scheduled script)
2. Identify items below reorder point
3. Calculate order quantity
4. Select vendor (primary vendor by default)
5. Generate purchase order:
   - Auto-approve if < $5,000
   - Route for approval if >= $5,000
6. Submit PO to vendor (email, EDI)

**Exceptions** (manual review required):
- New vendor (no purchase history)
- Price variance > 10% from last purchase
- Item on quality hold
- Vendor on payment hold
- Order quantity > $25,000

**Configuration**:
- Set reorder point and preferred stock level on all items
- Configure automated replenishment script (SuiteScript Scheduled Script)
- Set approval thresholds
- Configure vendor notification (email template)

---

### 4.5 Purchase Order Approval Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Purchase Order Approval

**Triggers**: Purchase order saved (status = Pending Approval)

**Conditions and Routing**:

| PO Amount | Approver(s) | SLA |
|-----------|-------------|-----|
| < $5,000 (auto-replenishment) | Auto-approved | Instant |
| $5,000 - $25,000 | Purchasing Manager | 1 business day |
| $25,000 - $100,000 | Purchasing Manager + Finance Manager | 2 business days |
| > $100,000 | Purchasing Manager + CFO | 3 business days |
| Capital Expenditures (any amount) | Department Head + CFO | 3 business days |

**Additional Approval Triggers**:
- New Vendor: Add Purchasing Manager approval
- Price Variance > 10%: Add Finance Manager approval
- Off-Contract Purchase: Add Procurement Director approval
- Rush Order: Expedited approval (same day)

**Actions**:
- Approved: Status → "Pending Receipt", email PO to vendor
- Rejected: Status → "Rejected", notify buyer with reason
- Pending: Send reminder to approver after 1 day
- Auto-Approve: For replenishment POs < $5,000

---

### 4.6 Purchase Order Change Management
**Tool**: Purchase Order Change Orders

**Change Order Scenarios**:
- Quantity change (increase/decrease)
- Price change (vendor price update)
- Delivery date change
- Line item additions/deletions
- Ship-to location change

**Change Order Process**:
1. Edit existing PO (creates change order)
2. Document reason for change
3. Re-approval if:
   - Total amount increases > $1,000
   - New total exceeds approval threshold
4. Notify vendor of change
5. Update expected receipt date

**Configuration**:
- Enable change order tracking
- Require re-approval for material changes
- Version control for PO revisions

---

## Phase 5: Receiving Configuration

### 5.1 Item Receipt Setup
**Tool**: Item Receipts (Transactions > Purchases > Enter Item Receipts)

**Item Receipt Form Configuration**:

**Header Information**:
- Receipt Number (auto-generated)
- Created From: Purchase Order (linked)
- Vendor
- Receipt Date
- Received At Location (warehouse/store)
- Reference Number (packing slip#, BOL#)
- Receiver (Employee)

**Line Items**:
- Item Description
- Quantity Ordered
- Quantity Received (can be partial)
- Quantity Remaining
- Unit Cost
- Bin Location (where stored)
- Serial Numbers (if tracked)
- Lot Numbers (if tracked)

**Inspection Section**:
- Quality Check Performed (Checkbox)
- Inspector (Employee)
- Inspection Date
- Inspection Result (Pass/Fail)
- Defect Notes (Text)

**Custom Fields on Item Receipt**:
- Receiving Location Type (List: Warehouse, Store)
- BOL/Tracking Number (Text)
- Carrier (List: FedEx, UPS, USPS, Freight, Vendor Direct)
- Number of Packages (Integer)
- Freight Charges (Currency)
- Receiving Discrepancy (Checkbox)
- Discrepancy Type (List: Overage, Shortage, Damage, Wrong Item)
- Discrepancy Quantity (Integer)
- Discrepancy Notes (Text)
- Photos Attached (Checkbox - for damage claims)
- Quality Inspection Required (Checkbox)
- Inspection Status (List: Pending, Pass, Fail, Conditional)
- Quarantine Location (Text - if failed inspection)

**Receiving Process**:
1. Locate PO in system (scan or search)
2. Verify packing slip matches PO
3. Unload and inspect packages
4. Count and scan items received
5. Record actual quantity received
6. Quality inspection (if required)
7. Note discrepancies (overage, shortage, damage)
8. Create item receipt in NetSuite
9. Update inventory quantities
10. Assign bin locations
11. Route discrepancies for resolution

---

### 5.2 Receiving Preferences
**Tool**: Accounting Preferences > Purchasing

**Configuration**:
1. **Receipt Rules**:
   - Allow receipt without PO: No
   - Require PO match for receiving: Yes
   - Allow over-receipt: Yes, with tolerance (5%)
   - Warn on over-receipt: Yes
   - Allow partial receipts: Yes
   - Create item receipt automatically creates bill: No (3-way match)

2. **Inspection Rules**:
   - Quality inspection required for:
     - New items (first 3 orders)
     - High-value items (> $500 per unit)
     - Items with history of defects
     - Random sampling (10% of receipts)

3. **Discrepancy Handling**:
   - Shortage: Partial receipt, vendor follow-up
   - Overage: Accept up to 5%, return excess
   - Damage: Reject, segregate, document for vendor claim
   - Wrong item: Reject, vendor RMA

4. **Accounts**:
   - Inventory Asset: 1300 - Inventory
   - Inventory Received Not Billed: 1425 - IRNB (accrual account)

---

### 5.3 Receiving Discrepancy Process
**Tool**: Vendor Return Authorizations (for defects) or Vendor Credits (for pricing)

**Discrepancy Workflow**:

**1. Shortage (quantity short-shipped)**:
- Partial receipt in NetSuite
- Notify vendor immediately
- Request shipment of balance
- Follow up if not received in 5 days
- Cancel remaining quantity if vendor cannot fulfill

**2. Overage (received more than ordered)**:
- Accept if within tolerance (5%)
- Create "special pricing" vendor credit for overage amount
- If significant overage: Notify vendor, return excess

**3. Damaged Goods**:
- Reject damaged items (do not receive)
- Take photos for documentation
- Create incident report
- Notify vendor within 24 hours
- Request replacement or credit
- File freight claim if carrier fault
- Dispose of damaged goods per vendor instruction

**4. Wrong Item Received**:
- Do not receive into inventory
- Notify vendor immediately
- Request RMA from vendor
- Return wrong items
- Request correct items shipped

**Configuration**:
- Create discrepancy notification workflow (email vendor)
- Track discrepancies in custom record or case management
- Report vendor performance (discrepancy rate)

---

### 5.4 Quality Inspection Process
**Tool**: Custom Record or Item Receipt Custom Fields

**Inspection Criteria**:
1. **Physical Inspection**:
   - Packaging integrity
   - Product condition
   - Verify brand and model
   - Check for defects or damage

2. **Quantity Verification**:
   - Count matches packing slip
   - Count matches PO

3. **Documentation Verification**:
   - Certificate of authenticity (if applicable)
   - Compliance certificates (safety, quality)
   - Country of origin documentation

4. **Sample Testing** (for new products):
   - Product functionality
   - Quality comparison to specifications
   - Durability testing

**Inspection Results**:
- **Pass**: Receive into inventory, mark as available
- **Conditional Pass**: Receive but flag for monitoring
- **Fail**: Reject, segregate, notify vendor, request replacement

**Configuration**:
- Quality inspection custom fields on item receipt
- Quality inspection checklist (saved search or custom form)
- Quarantine location for failed items
- Quality inspection report (for trending)

---

## Phase 6: Accounts Payable Configuration

### 6.1 Vendor Bill Setup
**Tool**: Vendor Bills (Transactions > Purchases > Enter Bills)

**Vendor Bill Form Configuration**:

**Header Information**:
- Bill Number (auto-generated internal)
- Vendor
- Vendor Invoice Number (vendor's invoice#)
- Invoice Date
- Due Date (calculated from terms)
- Terms (payment terms)
- Bill From: Purchase Order or Item Receipt (linked)
- Account (expense or COGS account)
- Department/Location
- Memo

**Line Items**:
- Item/Expense Description
- Quantity Billed
- Rate
- Amount
- Account (GL account)
- Department
- Location
- Class (optional)

**Matching Section**:
- Purchase Order Reference
- Item Receipt Reference
- Match Status (3-way match indicator)

**Custom Fields on Vendor Bill**:
- Approval Status (List: Pending, Approved, Rejected, On Hold)
- Approver (Employee)
- Approval Date (Date)
- GL Period (Period - for accrual cutoff)
- Payment Status (List: Unpaid, Scheduled, Paid)
- Payment Date (Date)
- Payment Method (List: Check, ACH, Wire, Credit Card)
- Payment Reference (Text - check#, wire confirmation)
- Early Payment Discount Available (Checkbox)
- Discount Date (Date)
- Discount Amount (Currency)
- Discrepancy Flag (Checkbox)
- Discrepancy Type (List: Price, Quantity, Freight, Tax)
- Discrepancy Notes (Text)
- 1099 Reportable (Checkbox)
- Invoice Received Date (Date - for aging)

---

### 6.2 Vendor Bill Preferences
**Tool**: Accounting Preferences > Accounting

**Configuration**:
1. **Vendor Bill Settings**:
   - Require vendor invoice number: Yes (enforce unique)
   - Warn on duplicate invoice: Yes
   - Allow vendor bill without PO: Yes (for recurring services)
   - Default bill status: Pending Approval
   - Require approval before payment: Yes

2. **3-Way Matching**:
   - Match PO, Receipt, and Invoice
   - Tolerance for variances:
     - Quantity variance: ±2%
     - Price variance: ±5% or $50 (whichever greater)
     - Freight variance: ±10%
   - Auto-approve if within tolerance
   - Route for manual approval if outside tolerance

3. **Accrual Accounting**:
   - Accrue inventory received not billed: Yes
   - Accrual account: 1425 - Inventory Received Not Billed
   - Auto-create IRNB entries on receipt
   - Reverse IRNB upon bill entry

4. **Due Date Calculation**:
   - Calculate due date from invoice date (not entry date)
   - Respect payment terms
   - Highlight early payment discount opportunities

---

### 6.3 3-Way Match Process
**Tool**: 3-Way Match Report / SuiteScript

**3-Way Match Components**:
1. **Purchase Order**: What was ordered (quantity, price)
2. **Item Receipt**: What was received (quantity)
3. **Vendor Bill**: What vendor is charging (quantity, price)

**Matching Logic**:

| Field | PO | Receipt | Invoice | Match Criteria |
|-------|----|---------|---------| ---------------|
| Quantity | Ordered | Received | Billed | Receipt Qty = Invoice Qty |
| Price | PO Price | N/A | Invoice Price | Invoice Price ≈ PO Price (±5%) |
| Total | PO Total | N/A | Invoice Total | Sum matches within tolerance |

**Match Results**:
- **Exact Match**: Quantities and prices match exactly → Auto-approve
- **Within Tolerance**: Variances within acceptable range → Auto-approve with notification
- **Outside Tolerance**: Variances exceed thresholds → Hold for review, route to AP manager

**Variance Types**:
1. **Price Variance**: Invoice price ≠ PO price
   - Investigate: Pricing error, contract change, discount applied
   - Action: Verify with buyer, request credit memo if overcharged

2. **Quantity Variance**: Billed quantity ≠ received quantity
   - Investigate: Billing error, partial shipment, receiving error
   - Action: Verify receipt, request corrected invoice

3. **Freight Variance**: Freight charged ≠ PO freight
   - Investigate: Freight terms, actual shipping cost
   - Action: Verify freight terms, dispute if overcharged

4. **Tax Variance**: Sales tax charged incorrectly
   - Investigate: Tax jurisdiction, exempt items
   - Action: Request corrected invoice, update vendor tax setup

**Configuration**:
- Configure matching tolerances
- Create 3-way match dashboard (saved search)
- Exception report (items outside tolerance)
- Automate approval for exact matches

---

### 6.4 Vendor Bill Approval Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Vendor Bill Approval

**Triggers**: Vendor bill created or saved (status = Pending Approval)

**Approval Routing**:

| Scenario | Approver(s) | SLA |
|----------|-------------|-----|
| Exact 3-way match, Amount < $5,000 | Auto-approved | Instant |
| Within tolerance, Amount < $25,000 | AP Manager | 1 business day |
| Amount $25,000 - $100,000 | AP Manager + Finance Manager | 2 business days |
| Amount > $100,000 | AP Manager + CFO | 3 business days |
| Variance outside tolerance | Original PO Buyer + AP Manager | 2 business days |
| No PO (services, recurring) | Department Manager + AP Manager | 1 business day |
| Duplicate invoice detected | AP Manager (manual review) | 1 business day |

**Approval Actions**:
- **Approved**: Status → "Open" (ready for payment)
- **Rejected**: Status → "Rejected", notify vendor for corrected invoice
- **On Hold**: Status → "On Hold", resolve discrepancy before approval
- **Request Adjustment**: Request vendor credit memo or revised invoice

**Configuration**:
- Set approval rules by amount and variance
- Configure approval routing
- Send email notifications to approvers
- Escalation: Reminder after 1 day, escalate after 3 days

---

### 6.5 Vendor Credit Memo
**Tool**: Vendor Credit (Transactions > Purchases > Enter Vendor Credits)

**Vendor Credit Scenarios**:
1. **Return to Vendor**: Defective or wrong items returned
2. **Pricing Adjustment**: Vendor refund for overcharge
3. **Promotional Rebate**: Volume rebate, co-op advertising credit
4. **Damaged Goods**: Credit for items damaged in transit
5. **Billing Error**: Vendor issued credit for invoice error

**Vendor Credit Form**:
- Credit Number (auto-generated)
- Vendor
- Vendor Credit Number (vendor's credit memo#)
- Credit Date
- Reason for Credit (dropdown)
- Reference to Original Invoice
- Line Items (quantity, amount)
- Apply to Open Bills (apply credit to bill)

**Credit Application**:
- Apply credit to specific vendor bill (reduce amount due)
- Leave unapplied (credit on account)
- Request refund check from vendor (for overpayment)

**Configuration**:
- Create vendor credit form
- Link to original bill (for tracking)
- Configure credit memo workflow (approval if > $1,000)

---

## Phase 7: Payment Processing Configuration

### 7.1 Payment Methods
**Tool**: Payment Methods (Lists > Accounting > Payment Methods)

**Vendor Payment Methods**:
1. **Check** - Paper check mailed to vendor
2. **ACH** - Electronic bank transfer (preferred)
3. **Wire Transfer** - Same-day wire transfer (urgent payments)
4. **Credit Card** - Corporate card for small purchases
5. **Vendor Portal** - Online payment through vendor portal

**Configuration**:
- Set default payment method by vendor
- Set up ACH/wire banking information
- Configure check printing

---

### 7.2 Bill Payment Setup
**Tool**: Bill Payment (Transactions > Purchases > Pay Bills)

**Payment Batch Process**:
1. **Payment Selection**:
   - Select bills by due date
   - Select bills for early payment discount
   - Filter by vendor, location, amount
   - Exclude bills on hold

2. **Payment Prioritization**:
   - Early payment discounts (2/10 Net 30)
   - Past due bills
   - Critical vendors
   - Bills by due date

3. **Payment Batch Creation**:
   - Group by payment method (ACH, check, wire)
   - Group by payment date
   - Calculate total payment amount
   - Generate payment batch

4. **Payment Review and Approval**:
   - Review batch for accuracy
   - Approve payment batch (if > threshold)
   - Generate payment files (ACH) or print checks

5. **Payment Execution**:
   - Submit ACH file to bank
   - Print and mail checks
   - Process wire transfers
   - Mark bills as paid in NetSuite

6. **Payment Confirmation**:
   - Record payment reference (check#, ACH trace#)
   - Notify vendor of payment (remittance advice)
   - Update vendor account

**Payment Run Frequency**:
- ACH/Wire: Weekly (every Friday)
- Checks: Weekly (every Friday)
- Expedited: As needed (for rush payments)

---

### 7.3 Check Printing Configuration
**Tool**: Check Printing (Setup > Accounting > Set Up Check Printing)

**Check Format**:
- Check Layout: Standard voucher (check on top, stub below)
- Check Stock: Preprinted checks with company logo
- Signature: Printed signature or signature stamp
- Signature Requirements:
  - < $10,000: Single signature (AP Manager)
  - $10,000-$50,000: Single signature (Controller or CFO)
  - > $50,000: Dual signature (Controller + CFO)

**Check Numbering**:
- Starting Check Number: 10001
- Sequential numbering
- Void check tracking

**Positive Pay**:
- Enable positive pay file export
- Daily transmission to bank
- Check number, date, amount, payee
- Fraud prevention

**Configuration**:
- Set up check template (PDF format)
- Configure check printer
- Set up signature authorization
- Configure positive pay file format

---

### 7.4 ACH Payment Configuration
**Tool**: Electronic Bank Payments

**ACH Setup**:
1. **Bank Account Configuration**:
   - Bank name and routing number
   - Account number
   - Account type (checking)
   - ACH origination agreement with bank

2. **Vendor Banking Information**:
   - Vendor bank name
   - Vendor routing number
   - Vendor account number
   - Account type (checking or savings)
   - ACH authorization form on file

3. **ACH File Format**:
   - NACHA format
   - Payment type: CCD (corporate)
   - Batch processing
   - File encryption

4. **ACH Processing Schedule**:
   - Create ACH file: Thursday
   - Submit to bank: Friday
   - Settlement date: Monday (2 business days)

**Benefits of ACH**:
- Lower cost than checks (~$0.50 vs $5 per check)
- Faster processing
- More secure
- Automatic reconciliation
- Vendor preference

**Configuration**:
- Set up ACH payment method
- Configure ACH file export
- Establish vendor ACH agreements
- Set up bank transmission (secure FTP)

---

### 7.5 Payment Approval Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Payment Batch Approval

**Triggers**: Payment batch created (status = Pending Approval)

**Approval Routing**:

| Payment Batch Amount | Approver(s) | SLA |
|----------------------|-------------|-----|
| < $50,000 | AP Manager | 1 business day |
| $50,000 - $250,000 | AP Manager + Controller | 1 business day |
| > $250,000 | Controller + CFO | 2 business days |

**Actions**:
- Approved: Execute payments (print checks, submit ACH)
- Rejected: Notify AP team with reason
- Modify: Adjust batch and re-submit

**Payment Hold Scenarios**:
- Vendor on hold (payment dispute, quality issue)
- Duplicate invoice suspected
- Unapproved vendor bill included
- Insufficient funds (cash flow issue)

---

### 7.6 Vendor Prepayments (Deposits)
**Tool**: Vendor Prepayments (Transactions > Purchases > Enter Vendor Prepayments)

**Use Cases**:
1. Deposit required for large custom orders
2. Advance payment for international shipments
3. Retainer for professional services

**Prepayment Process**:
1. Create vendor prepayment record
2. Link to purchase order
3. Process payment (check, wire, ACH)
4. Receive goods/services
5. Enter vendor bill
6. Apply prepayment to bill
7. Pay remaining balance (if any)

**Accounting**:
- Prepayment: Debit Prepaid Expenses, Credit Cash
- Bill Entry: Apply prepayment, reverse prepaid expense
- Remaining: Pay balance due

**Configuration**:
- Enable vendor prepayments
- Set prepayment asset account: 1410 - Prepaid Expenses
- Require PO linkage for prepayments

---

## Phase 8: Vendor Performance Management

### 8.1 Vendor Scorecard Configuration
**Tool**: Custom Records / Saved Searches

**Vendor Performance Metrics**:

1. **On-Time Delivery**:
   - Target: > 95%
   - Calculation: (# on-time deliveries / # total deliveries) × 100
   - Measurement: Compare actual receipt date to PO expected date

2. **Order Accuracy**:
   - Target: > 98%
   - Calculation: (# accurate orders / # total orders) × 100
   - Measurement: Receipts without discrepancies (quantity, item)

3. **Quality Rating**:
   - Target: > 95% pass rate
   - Calculation: (# quality pass / # inspections) × 100
   - Measurement: Inspection results (pass/fail)

4. **Invoice Accuracy**:
   - Target: > 95%
   - Calculation: (# accurate invoices / # total invoices) × 100
   - Measurement: 3-way match without variances

5. **Responsiveness**:
   - Target: < 24 hours
   - Measurement: Response time to inquiries, issues

6. **Cost Competitiveness**:
   - Target: Within market pricing
   - Measurement: Price benchmarking, cost increases

**Overall Vendor Score**: Weighted average of all metrics
- On-Time Delivery: 30%
- Order Accuracy: 25%
- Quality: 25%
- Invoice Accuracy: 10%
- Responsiveness: 5%
- Cost: 5%

**Vendor Tiers**:
- **Tier 1 (Strategic)**: Score > 95%, high volume, critical items
- **Tier 2 (Preferred)**: Score 85-95%, good performance
- **Tier 3 (Standard)**: Score < 85%, needs improvement

**Configuration**:
- Create custom record: Vendor Performance Metrics
- Create saved searches: Vendor scorecards
- Create dashboard: Vendor performance summary
- Scheduled reports: Monthly vendor performance

---

### 8.2 Vendor Performance Review Process
**Tool**: Custom Record or Vendor Notes

**Quarterly Vendor Review**:
1. Generate vendor scorecard (3-month data)
2. Identify top performers and underperformers
3. Schedule review meetings:
   - Top performers (annual): Recognize, negotiate better terms
   - Underperformers (quarterly): Discuss issues, improvement plan
4. Document review notes on vendor record
5. Update vendor tier classification
6. Action plan:
   - Continue relationship
   - Improvement plan (90 days)
   - Source alternatives (if critical issues)
   - Terminate relationship (if unresolved)

**Performance Improvement Plan**:
- Issue: Specific performance gap
- Target: Expected improvement
- Timeline: 90 days
- Actions: Vendor commitments
- Monitoring: Weekly check-ins
- Resolution: Achieve target or escalate

**Configuration**:
- Create vendor review custom record
- Schedule quarterly review workflow
- Vendor performance dashboard

---

## Phase 9: Procure to Pay Reporting

### 9.1 Purchasing Reports
**Tool**: Reports and Saved Searches

**Key Purchasing Reports**:

1. **Purchase Order Report**:
   - Open POs by vendor
   - PO aging (days since PO date)
   - POs pending approval
   - POs pending receipt
   - PO value by vendor, category, month

2. **Receiving Report**:
   - Items received (daily, weekly, monthly)
   - Receipt accuracy rate
   - Discrepancies by type
   - Receiving by location
   - Average receiving time

3. **Spend Analysis Report**:
   - Total spend by vendor
   - Spend by category
   - Spend by department
   - Spend trends (YoY, MoM)
   - Top 10 vendors by spend

4. **Vendor Performance Report**:
   - Vendor scorecards (all metrics)
   - On-time delivery by vendor
   - Quality rating by vendor
   - Invoice accuracy by vendor
   - Vendor tier distribution

5. **Inventory Replenishment Report**:
   - Items below reorder point
   - Days until stockout (projected)
   - Outstanding POs (expected receipt)
   - Inventory turnover by item

---

### 9.2 Accounts Payable Reports

**Key AP Reports**:

1. **Accounts Payable Aging Report**:
   - Outstanding bills by aging bucket:
     - Current (not yet due)
     - 1-30 days past due
     - 31-60 days past due
     - 61-90 days past due
     - > 90 days past due
   - Aging by vendor
   - Total AP balance

2. **Cash Requirements Report**:
   - Bills due this week
   - Bills due next week
   - Bills due this month
   - Early payment discount opportunities
   - Projected cash outflow

3. **Payment Report**:
   - Payments made (daily, weekly, monthly)
   - Payments by method (ACH, check, wire)
   - Payments by vendor
   - Average days to pay
   - Payment volume and value

4. **3-Way Match Exception Report**:
   - Bills with variances outside tolerance
   - Price variances
   - Quantity variances
   - Pending investigation
   - Aging of exceptions

5. **Vendor Credit Report**:
   - Vendor credits issued
   - Unapplied credits by vendor
   - Credits pending resolution
   - Credit trends

6. **1099 Report** (Annual):
   - 1099-NEC reportable vendors
   - Total payments by vendor
   - 1099 forms (electronic filing)

---

### 9.3 Key Performance Indicators (KPIs)

**Purchasing KPIs**:
- Purchase Order Cycle Time: Target < 2 days (requisition to PO)
- PO Approval Time: Target < 1 day
- Automated PO Percentage: Target > 80%
- PO Accuracy: Target > 98%
- Vendor On-Time Delivery: Target > 95%

**Receiving KPIs**:
- Receiving Accuracy: Target > 99%
- Receiving Cycle Time: Target < 2 hours
- Discrepancy Rate: Target < 3%
- Quality Inspection Pass Rate: Target > 95%

**Accounts Payable KPIs**:
- Invoice Processing Time: Target < 3 days (receipt to approval)
- 3-Way Match Rate: Target > 95%
- Early Payment Discount Capture: Target > 90%
- Days Payable Outstanding (DPO): Target 30-35 days
- AP Accuracy: Target > 99%
- Cost per Invoice Processed: Target < $5

**Cost Savings KPIs**:
- Early Payment Discounts Captured: Target $50K annually
- Procurement Cost Savings: Target 3% YoY
- Vendor Consolidation Savings: Target 5% YoY

---

## Phase 10: Procure to Pay Workflow Automation

### 10.1 Automated Replenishment Workflow
**Tool**: SuiteScript (Scheduled Script)

**Script**: Automated Purchase Order Creation

**Schedule**: Daily at 6:00 AM

**Logic**:
1. Query items with quantity < reorder point
2. Calculate order quantity (preferred stock level - on hand - on order)
3. Select primary vendor for item
4. Verify vendor is active and not on hold
5. Create purchase order:
   - Populate vendor, items, quantities
   - Calculate expected receipt date (today + lead time)
   - Set PO status based on amount:
     - < $5,000: Auto-approved
     - >= $5,000: Pending approval
6. Send email notification:
   - To buyer: POs created summary
   - To vendor: PO (if auto-approved)
7. Log results (items ordered, POs created, errors)

**Exception Handling**:
- No primary vendor: Notify buyer
- Vendor on hold: Skip item, notify buyer
- Price change > 10%: Hold for buyer review
- Item inactive: Skip, notify buyer

---

### 10.2 Receipt Notification Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Item Receipt Notifications

**Triggers**: Item receipt saved

**Actions**:
1. Email notification to AP team: "Items received, expecting invoice"
2. Update PO status: "Fully Received" or "Partially Received"
3. If discrepancy flagged: Email notification to buyer and vendor
4. If quality inspection failed: Email notification to buyer, hold inventory
5. Create accrual entry: Debit IRNB, Credit AP (if no bill yet)

---

### 10.3 Bill Matching and Approval Workflow
**Tool**: SuiteFlow (Workflow) + SuiteScript

**Workflow**: Vendor Bill 3-Way Match and Approval

**Triggers**: Vendor bill saved

**Steps**:
1. **Duplicate Check**:
   - Search for existing bills with same vendor invoice number
   - If duplicate found: Flag for review, notify AP manager

2. **3-Way Match** (if bill from PO):
   - Match bill to PO and item receipt
   - Compare quantities: Bill qty vs. received qty
   - Compare prices: Bill price vs. PO price
   - Calculate variances
   - Classify result:
     - Exact match: Auto-approve (if amount < $5,000)
     - Within tolerance: Route to AP manager
     - Outside tolerance: Route to buyer + AP manager

3. **Approval Routing**:
   - Route based on amount and match result (per approval matrix)
   - Send email notification to approver(s)
   - Set due date for approval (SLA)

4. **Approval Actions**:
   - Approved: Status → "Open", ready for payment
   - Rejected: Status → "Rejected", notify AP clerk
   - On Hold: Status → "On Hold", resolve issue

5. **Payment Scheduling**:
   - Calculate due date (invoice date + terms)
   - Calculate discount date (if early payment discount)
   - Flag for payment batch

---

### 10.4 Payment Scheduling Workflow
**Tool**: SuiteScript (Scheduled Script)

**Script**: Payment Batch Creation

**Schedule**: Weekly (Thursday at 3:00 PM)

**Logic**:
1. Query approved vendor bills:
   - Bills with due date <= payment date + 7 days
   - Bills with early payment discount expiring
   - Exclude bills on hold
2. Group bills by payment method (ACH, check, wire)
3. Calculate total payment amount by method
4. Create payment batch records
5. Route for approval (if total > threshold)
6. Generate payment files:
   - ACH: NACHA file
   - Check: Print queue
   - Wire: Wire transfer details
7. Email notification to approvers

**Payment Prioritization**:
1. Early payment discounts (expiring)
2. Past due bills
3. Critical vendors (flag on vendor record)
4. Bills by due date (oldest first)

---

### 10.5 Vendor Performance Tracking Workflow
**Tool**: SuiteScript (Scheduled Script)

**Script**: Vendor Performance Calculation

**Schedule**: Monthly (1st of month at 8:00 AM)

**Logic**:
1. Calculate metrics for prior month (all vendors):
   - On-time delivery rate
   - Order accuracy rate
   - Quality pass rate
   - Invoice accuracy rate
2. Calculate overall vendor score (weighted average)
3. Update vendor performance custom fields
4. Classify vendor tier (Tier 1, 2, 3)
5. Identify vendors needing review:
   - Score dropped > 10 points
   - Score < 85% (underperformer)
6. Generate vendor performance report
7. Email report to procurement team
8. Create tasks for vendor reviews (underperformers)

---

## Phase 11: Integration Requirements (P2P Specific)

### 11.1 E-Commerce Platform Integration (Drop Ship)
**Integration**: E-Commerce ↔ NetSuite ↔ Vendor

**Drop Ship Order Flow**:
1. Customer places order on e-commerce (product not stocked)
2. E-commerce sends order to NetSuite (sales order)
3. NetSuite creates drop ship purchase order to vendor
4. PO sent to vendor (EDI or email)
5. Vendor ships directly to customer
6. Vendor sends shipment notification (tracking) to NetSuite
7. NetSuite creates item fulfillment (drop ship)
8. NetSuite updates e-commerce with tracking
9. E-commerce sends shipment email to customer
10. Vendor sends invoice to NetSuite (AP processing)

**Integration Method**: RESTlet or SuiteTalk API

---

### 11.2 Vendor EDI Integration
**Integration**: NetSuite ↔ Vendor (EDI)

**EDI Transactions**:
1. **EDI 850 - Purchase Order**:
   - NetSuite → Vendor
   - Automatic PO transmission
   - Real-time or batch

2. **EDI 856 - Advance Ship Notice (ASN)**:
   - Vendor → NetSuite
   - Shipment notification (items, quantities, tracking)
   - Pre-populate item receipt

3. **EDI 810 - Invoice**:
   - Vendor → NetSuite
   - Electronic invoice
   - Auto-create vendor bill

4. **EDI 820 - Payment Order**:
   - NetSuite → Vendor
   - Electronic remittance advice
   - Payment notification

**EDI Benefits**:
- Faster order processing
- Reduced errors (no manual entry)
- Automated 3-way match
- Improved vendor relationships

**Configuration**:
- EDI provider (TrueCommerce, SPS Commerce)
- Vendor EDI setup
- Document mapping
- Testing and certification

---

### 11.3 Expense Management Integration
**Integration**: Expense Management System ↔ NetSuite

**Expense Flow**:
1. Employee submits expense report (Concur, Expensify)
2. Manager approves expense report
3. Integration creates vendor bill in NetSuite:
   - Vendor: Employee (as vendor)
   - Expense categories mapped to GL accounts
   - Attachments (receipts)
4. AP processes bill
5. Payment to employee (reimbursement)

**Integration Method**: CSV import or API

---

### 11.4 Bank Integration
**Integration**: NetSuite ↔ Bank

**Bank Feeds**:
1. Automatic import of bank transactions (daily)
2. Match to NetSuite payments and deposits
3. Auto-reconciliation (when matched)
4. Flag exceptions for manual review

**ACH Transmission**:
1. Generate ACH file from NetSuite (NACHA format)
2. Transmit to bank (secure FTP or portal)
3. Bank processes ACH payments
4. Confirmation file from bank

**Positive Pay**:
1. Generate positive pay file (checks issued)
2. Transmit to bank daily
3. Bank validates checks presented
4. Fraud prevention (reject unauthorized checks)

**Configuration**:
- Bank account setup in NetSuite
- Bank feed connection (OFX, BAI2)
- ACH file format configuration
- Positive pay file format
- Secure FTP credentials

---

## Phase 12: Key Performance Indicators (KPIs)

### 12.1 P2P KPIs to Track

**Procurement KPIs**:
- Procurement Cycle Time: Target < 5 days (requisition to goods receipt)
- PO Approval Time: Target < 1 business day
- Vendor On-Time Delivery: Target > 95%
- Supplier Quality Rating: Target > 95%
- Maverick Spend: Target < 5% (purchases outside process)
- Contract Compliance: Target > 90% (purchases under contract)
- Cost Savings: Target 3% YoY reduction

**Accounts Payable KPIs**:
- Invoice Processing Time: Target < 3 days
- Invoice Approval Time: Target < 2 days
- 3-Way Match Rate: Target > 95%
- Invoice Accuracy: Target > 98%
- Early Payment Discount Capture: Target > 90%
- Duplicate Invoice Rate: Target < 0.5%
- Days Payable Outstanding (DPO): Target 30-35 days
- AP Turnover: Target 12x annually
- Payment Error Rate: Target < 0.5%

**Vendor Management KPIs**:
- Vendor On-Time Delivery: Target > 95%
- Vendor Quality Score: Target > 90%
- Vendor Response Time: Target < 24 hours
- Vendor Contract Renewal Rate: Target > 85%
- Number of Active Vendors: Target consolidation (reduce by 10%)

**Cost Efficiency KPIs**:
- Cost per PO: Target < $50
- Cost per Invoice: Target < $5
- Procurement as % of Spend: Target < 2%
- Savings from Negotiations: Track annually
- Payment Discount Captured: Target $50K+ annually

---

## Phase 13: Testing & Validation

### 13.1 Purchasing Testing
**Test Scenarios**:
1. Create purchase requisition (approval routing)
2. Convert requisition to PO
3. Create manual PO (non-inventory item)
4. Create automated PO (replenishment)
5. PO approval workflow (various amounts)
6. Send PO to vendor (email)
7. Change order (modify PO)
8. Cancel PO

**Validation**:
- PO created correctly
- Approval routing works
- Vendor notification sent
- Budget commitments recorded
- PO numbering sequential

---

### 13.2 Receiving Testing
**Test Scenarios**:
1. Receive full PO (exact quantities)
2. Receive partial PO (partial shipment)
3. Over-receive (excess quantity)
4. Receive with discrepancy (shortage, damage)
5. Quality inspection (pass/fail)
6. Multi-location receiving
7. Receive without PO (should fail)

**Validation**:
- Item receipt created
- Inventory quantities updated
- Bin locations assigned
- IRNB accrual posted
- Discrepancy flagged
- Vendor notified

---

### 13.3 Accounts Payable Testing
**Test Scenarios**:
1. Enter vendor bill from PO (3-way match)
2. Enter vendor bill without PO (services)
3. 3-way match (exact match)
4. 3-way match (variance within tolerance)
5. 3-way match (variance outside tolerance)
6. Duplicate invoice detection
7. Vendor credit memo
8. Early payment discount

**Validation**:
- Vendor bill created
- 3-way match executed
- Approval routing works
- IRNB reversed
- AP liability recorded
- Due date calculated
- Discount date flagged

---

### 13.4 Payment Processing Testing
**Test Scenarios**:
1. Create payment batch (ACH)
2. Create payment batch (checks)
3. Payment approval workflow
4. Print checks
5. Generate ACH file
6. Positive pay file
7. Vendor remittance advice

**Validation**:
- Payment batch created
- Approval routing works
- Checks printed correctly
- ACH file formatted correctly
- Bills marked as paid
- Bank account reduced
- Vendor account updated

---

## Phase 14: Training & Documentation

### 14.1 Training Plan (P2P Specific)

**Purchasing Team** (2-day training):
- Vendor setup and management
- Purchase requisition entry
- Purchase order creation
- PO approval process
- Change orders and cancellations
- Vendor communication

**Warehouse Receiving Team** (1-day training):
- PO lookup
- Item receipt entry
- Barcode scanning
- Quality inspection
- Discrepancy reporting
- Bin location management

**Accounts Payable Team** (2-day training):
- Vendor bill entry
- 3-way matching
- Bill approval workflow
- Vendor credit processing
- Payment batch creation
- Check printing and ACH processing
- Vendor inquiries

**Procurement Management** (1-day training):
- Vendor performance tracking
- Spend analysis reports
- Contract management
- Vendor negotiations
- Cost savings tracking

---

### 14.2 Process Documentation

**Process Documents**:
1. Vendor Onboarding Procedures
2. Purchase Requisition Process
3. Purchase Order Creation (Manual and Automated)
4. Receiving and Inspection Procedures
5. 3-Way Match Process
6. Vendor Bill Approval
7. Payment Processing Procedures
8. Vendor Credit and Returns
9. Vendor Performance Review Process
10. P2P Exception Handling

---

## Phase 15: Go-Live Preparation

### 15.1 Go-Live Checklist (P2P)

**Pre-Go-Live**:
1. ☐ Configure vendor records (migrate existing vendors)
2. ☐ Set up payment terms and vendor categories
3. ☐ Configure item master with purchasing info
4. ☐ Set up purchase order forms and preferences
5. ☐ Configure receiving forms and preferences
6. ☐ Set up vendor bill and payment processing
7. ☐ Configure approval workflows (requisition, PO, bill, payment)
8. ☐ Set up automated replenishment (reorder points)
9. ☐ Configure integrations (EDI, bank feeds)
10. ☐ Create custom reports and dashboards
11. ☐ Migrate open POs and outstanding AP
12. ☐ Conduct UAT with key users
13. ☐ Train all P2P users
14. ☐ Create process documentation

**Go-Live Day**:
15. ☐ Activate automated replenishment
16. ☐ Test PO creation and approval
17. ☐ Test receiving process
18. ☐ Test vendor bill entry and approval
19. ☐ Monitor for errors
20. ☐ Hypercare support

**Post-Go-Live** (First 30 days):
21. ☐ Monitor daily P2P transactions
22. ☐ Review approval workflows (bottlenecks)
23. ☐ Review vendor performance data
24. ☐ Optimize reorder points and order quantities
25. ☐ Conduct lessons learned
26. ☐ Refine processes based on feedback

---

## Appendices

### Appendix A: Vendor Custom Fields
- Vendor Status
- Vendor Tier
- Primary Product Category
- Vendor Performance Score
- Last Performance Review Date
- Preferred Vendor
- EDI Capable
- Drop Ship Vendor
- International Vendor
- Country of Origin
- Payment Hold Reason
- Insurance Certificate Expiration
- W-9 on File
- Contract Expiration Date

### Appendix B: Purchase Order Custom Fields
- PO Type
- Budget Code
- Approval Status
- Approver
- Approval Date
- Requisition Reference
- Freight Terms
- Shipment Tracking Number
- Quality Inspection Required
- Drop Ship Order
- Partial Receipt Allowed
- Rush Order
- Contract Number

### Appendix C: Item Receipt Custom Fields
- Receiving Location Type
- BOL/Tracking Number
- Carrier
- Number of Packages
- Freight Charges
- Receiving Discrepancy
- Discrepancy Type
- Discrepancy Quantity
- Discrepancy Notes
- Photos Attached
- Quality Inspection Required
- Inspection Status
- Quarantine Location

### Appendix D: Vendor Bill Custom Fields
- Approval Status
- Approver
- Approval Date
- GL Period
- Payment Status
- Payment Date
- Payment Method
- Payment Reference
- Early Payment Discount Available
- Discount Date
- Discount Amount
- Discrepancy Flag
- Discrepancy Type
- Discrepancy Notes
- 1099 Reportable
- Invoice Received Date

### Appendix E: Sample Vendor Performance Scorecard

| Vendor Name | On-Time % | Accuracy % | Quality % | Invoice % | Overall Score | Tier |
|-------------|-----------|------------|-----------|-----------|---------------|------|
| Premium Optics Inc | 98% | 99% | 97% | 98% | 97.9% | Tier 1 |
| SunWear Distributors | 92% | 96% | 95% | 94% | 93.8% | Tier 2 |
| Global Eyewear Co | 88% | 91% | 89% | 90% | 89.5% | Tier 2 |
| Budget Frames LLC | 78% | 85% | 82% | 88% | 82.3% | Tier 3 |

### Appendix F: Integration Data Mapping
*Detailed field mappings for EDI, e-commerce, and bank integrations*

---

## Sign-Off

**Configuration Plan Approval**:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| COO | David Martinez | _______________ | _______ |
| CFO | Alex Kim | _______________ | _______ |
| VP Operations | Sarah Mitchell | _______________ | _______ |
| Procurement Manager | [Name TBD] | _______________ | _______ |
| AP Manager | [Name TBD] | _______________ | _______ |

---

**Document Version History**:
- v1.0 - 2026-01-28 - Initial P2P configuration plan created
