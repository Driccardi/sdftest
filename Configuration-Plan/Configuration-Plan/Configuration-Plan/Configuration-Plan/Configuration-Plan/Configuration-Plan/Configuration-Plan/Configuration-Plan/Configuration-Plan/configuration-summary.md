# NetSuite Configuration Plan - Executive Summary
## SunStyle Retail Corporation

**Document Version**: 1.0
**Prepared Date**: 2026-01-28
**Prepared By**: NetSuite Implementation Team
**Status**: Draft for Approval

---

## Executive Overview

### Project Scope
This document provides a comprehensive NetSuite configuration plan for SunStyle Retail, a $45M specialty retailer of premium sunglasses and eyewear. The implementation will replace and consolidate multiple disparate systems (QuickBooks, custom Order Hub, standalone inventory management) with NetSuite ERP as the central system of record for financials, inventory, and operations.

### Business Context
**Company**: SunStyle Retail Corporation
**Industry**: Retail - Fashion Accessories (Premium Eyewear)
**Revenue**: $45M annually
**Employees**: 320
**Locations**: 26 (1 warehouse + 25 retail stores + Corporate HQ)
**Channels**: Physical stores (60%), E-commerce (35%), Mobile app (5%)
**Geography**: USA (current), Canada expansion (2027)

### Implementation Objectives
1. **Financial Management**: Real-time financial reporting across all locations and channels
2. **Omnichannel Order Management**: Unified order processing from web, mobile, in-store, and phone
3. **Multi-Location Inventory**: Real-time inventory visibility across 26 locations
4. **Operational Efficiency**: Automate procure-to-pay and order-to-cash processes
5. **Customer Experience**: Enable BOPIS, ship-from-store, and flexible fulfillment
6. **Scalability**: Support 20% YoY growth and Canada expansion
7. **Integration**: Seamless data flow with Shopify, Salesforce, Lightspeed POS, Stripe

---

## Configuration Architecture

### NetSuite Modules Required
- **OneWorld**: Multi-subsidiary, multi-currency (USA + future Canada)
- **Advanced Inventory**: Multi-location tracking, bin management, cycle counting
- **Advanced Order Management**: Omnichannel routing, ship-from-store, BOPIS
- **SuiteTax**: Automated sales tax calculation and filing
- **SuiteCommerce Advanced** (or API integration): E-commerce integration
- **CRM**: Customer management and loyalty program tracking
- **Advanced Financials**: Multi-entity consolidation, intercompany
- **Advanced Billing**: Extended warranties, recurring services

### Key Integrations
1. **Shopify Plus** (E-commerce Platform) - Bidirectional: Products, Orders, Inventory
2. **Salesforce** (CRM) - Bidirectional: Customers, Cases, Orders
3. **Lightspeed POS** (Store Systems) - Real-time: Transactions, Inventory
4. **Stripe/PayPal** (Payments) - Real-time: Payment processing, reconciliation
5. **FedEx/UPS/USPS** (Shipping) - Real-time: Label generation, tracking
6. **QuickBooks Online** (Migration source) - One-time: Historical data
7. **BigQuery** (Data Warehouse) - Batch: Analytics and reporting

---

## Configuration Components Summary

### 010 - Record-to-Report (6 configurations)

#### 010.010 - Chart of Accounts
- **Accounts**: 200+ GL accounts structured for retail operations
- **Hierarchy**: 8-level numbering schema (Asset, Liability, Equity, Revenue, COGS, Expense, Other)
- **Revenue Accounts**: By product category (Premium Sunglasses, Sport, Prescription, Accessories, Services)
- **Expense Accounts**: By department and function (Personnel, Occupancy, Marketing, Technology, Operations)
- **Multi-Entity**: Shared accounts across subsidiaries with proper elimination

#### 010.020 - Subsidiary Structure
- **Parent**: SunStyle Retail Corporation (consolidation entity)
- **USA Subsidiary**: SunStyle Retail USA LLC (operating entity, $45M revenue)
- **Future**: SunStyle Retail Canada Inc (2027, CAD currency)
- **Structure**: Full consolidation with intercompany elimination
- **Reporting**: Standalone by subsidiary + consolidated

#### 010.030 - Accounting Periods
- **Fiscal Year**: Calendar year (Jan-Dec)
- **Periods**: 12 monthly, 4 quarterly, 1 annual
- **Adjusting Periods**: Enabled for prior period corrections
- **Close Timeline**: 5 business days after month-end
- **Tax Alignment**: Matches fiscal calendar

#### 010.040 - Currencies and Exchange Rates
- **Base Currency**: USD (USA operations)
- **Additional Currencies**: CAD (Canada - future)
- **Exchange Rates**: Monthly updates, locked at period close
- **Revaluation**: Quarterly for foreign currency accounts (future)

#### 010.050 - SuiteTax Configuration
- **Nexus**: Physical presence (stores in 5+ states) + economic nexus (e-commerce)
- **Rates**: Automated by jurisdiction (state, county, city, district)
- **Exemptions**: Wholesale accounts, prescription eyewear (some states)
- **Filing**: Automated tax return generation
- **Remittance**: Monthly (CA), Quarterly (other states)

#### 010.060 - Departments, Classes, Locations
- **Departments**: Corporate, Retail Operations, E-commerce, Technology, Marketing, Finance, HR
- **Classes**: Each of 25 stores + Warehouse + Corporate HQ + E-commerce (virtual)
- **Locations**: 26 physical locations (warehouse + 25 stores) with address, inventory settings
- **Segmentation**: Enable P&L by department, class, location for detailed analysis

**Estimated Effort**: 40 hours
**Priority**: Critical (Foundation for all other config)

---

### 030 - Order-to-Cash (7 configurations)

#### 030.010 - Customer Categories & Custom Fields
- **Categories**: Retail (in-store), Online, Wholesale, Employee, VIP
- **Custom Fields**:
  - Loyalty Tier (Silver/Gold/Platinum), Points Balance
  - Face Shape, Style Preference, Prescription on File
  - Marketing Opt-in, Communication Preferences
  - Lifetime Value, Acquisition Channel, Return Risk Score
- **Segmentation**: For targeted marketing and service levels

#### 030.020 - Sales Order Forms & Workflow
- **Forms**: Retail Sales Order, E-commerce Order, Wholesale Order, Prescription Order
- **Fields**: Channel, Store Location, Sales Associate, Loyalty Points Used/Earned
- **Workflow**: Fraud screening, inventory allocation, fulfillment routing
- **Approval**: Orders >$5K, high fraud score, large discounts

#### 030.030 - Fulfillment Configuration
- **Methods**: Ship from Warehouse, Ship from Store, BOPIS, Curbside Pickup
- **Routing Logic**:
  1. Check warehouse stock
  2. Find nearest store with stock
  3. Optimize for cost and speed
  4. Avoid depleting store display stock
- **Picking**: Barcode scanning, pick-to-light (future)
- **Packing**: Branded packaging, eco-friendly options, packing slips
- **Integration**: ShipStation for multi-carrier shipping

#### 030.040 - Invoicing & AR Setup
- **Invoice Timing**: Immediate (e-commerce), upon shipment (wholesale)
- **Terms**: Net 30 (wholesale), Due on Receipt (retail)
- **Aging Buckets**: 0-30, 31-60, 61-90, 90+ days
- **Collections**: Automated email reminders at 15, 30, 45 days
- **Bad Debt**: Write-off after 120 days past due (CFO approval)

#### 030.050 - Return Authorization Process
- **Policy**: 30-day return window, unworn, original tags
- **Exceptions**: Prescription items (defective only), final sale items
- **RMA Process**: Self-service portal, email, phone, in-store
- **Inspection**: Resalable, damaged, defective disposition
- **Refund**: Original payment method, store credit, exchange
- **Restocking**: Automated for resalable items

#### 030.060 - Omnichannel Order Routing
- **Channels**: Shopify (web), Mobile App, Lightspeed POS (stores), CSR (phone)
- **Aggregation**: All orders flow to NetSuite OMS
- **Inventory Reservation**: Real-time, released if not fulfilled in 24 hours
- **Status Sync**: Bidirectional with source channel
- **Customer Notifications**: Email, SMS, push notifications

#### 030.070 - Customer Deposits & Payments
- **Deposits**: Special orders, custom prescription orders
- **Store Credit**: From returns, compensation, promotions
- **Gift Cards**: Liability tracking, partial redemption
- **Loyalty Points**: Conversion rate (100 points = $10), expiration (24 months)
- **Payment Methods**: Credit/debit, digital wallets, split payments

**Estimated Effort**: 60 hours
**Priority**: Critical (Core business process)

---

### 020 - Procure-to-Pay (4 configurations)

#### 020.010 - Vendor Categories & Custom Fields
- **Categories**: Eyewear Suppliers, Packaging Vendors, Service Providers, Technology
- **Tiers**: Preferred, Standard, Probationary
- **Custom Fields**: Lead Time, Minimum Order, Payment Terms, Quality Rating, Certifications
- **Vendor Portal**: Self-service PO acknowledgment, shipping notifications (future)

#### 020.020 - Purchase Order Workflow
- **Approval Thresholds**:
  - Auto-approve: <$5K
  - Manager: $5K-$25K
  - VP/CFO: >$25K
- **Reorder Automation**: Trigger PO when below reorder point
- **Vendor Selection**: Primary vendor, fallback to secondary
- **EDI**: For major suppliers (Luxottica, etc.)

#### 020.030 - Item Receipt Processing
- **Receiving**: Barcode scanning, quantity verification, quality inspection
- **Discrepancies**: Over-shipment, under-shipment, damage claims
- **Blind Receiving**: Option for high-value items
- **Put-Away**: Bin location assignment, FIFO compliance
- **3-Way Match**: PO, Receipt, Bill

#### 020.040 - Bill & Payment / AP Setup
- **Payment Terms**: Net 30, Net 60, 2/10 Net 30 (early payment discount)
- **Approval**: Controller approval for bills >$10K
- **Payment Batching**: Weekly ACH runs
- **Check Printing**: For vendors not accepting ACH
- **1099 Tracking**: For tax reporting

**Estimated Effort**: 30 hours
**Priority**: High

---

### 040 - Plan-to-Inventory (6 configurations)

#### 040.010 - Item Master Setup
- **Item Types**: Inventory Part (sunglasses), Kit (display sets), Service (fittings), Non-Inventory (marketing)
- **Categories**: Premium, Sport, Prescription, Accessories, Eco-Friendly
- **Attributes**: Brand, Frame Material, Lens Type, Gender, Color, Size, UPC
- **Pricing**: MSRP, Standard Price, Channel-Specific, Promotional
- **Costing**: Average Cost method
- **Matrix Items**: Size/Color combinations

#### 040.020 - Inventory Location Setup
- **Locations**:
  - Central Warehouse (primary, 50K sq ft, bin mgmt enabled)
  - 25 Store Locations (retail, limited backstock)
  - Corporate HQ (non-inventory)
- **Settings**: Make Available, Transfer Pricing, Reorder Points
- **Bin Management**: Enabled for warehouse only
- **Cycle Counting**: ABC classification

#### 040.030 - Reorder Points & Replenishment
- **Calculation**: Lead time demand + safety stock
- **Automation**: Auto-generate PO when below reorder point
- **Allocation**: Push inventory to stores based on sales velocity
- **Seasonality**: Summer surge for sunglasses, adjust safety stock
- **Review**: Quarterly review of reorder points

#### 040.040 - Inventory Transfer Orders
- **Types**: Warehouse-to-Store, Store-to-Store, Store-to-Warehouse (returns)
- **Approval**: Auto <$1K, Manager $1K-$5K, VP >$5K
- **Transit Tracking**: In-transit location, carrier tracking
- **Receipt**: Scan verification at receiving location

#### 040.050 - Cycle Counting Configuration
- **ABC Classification**:
  - A items (top 20% value): Monthly count
  - B items (next 30% value): Quarterly count
  - C items (bottom 50% value): Semi-annual count
- **Blind Counts**: No expected quantity shown
- **Variance Threshold**: >5% or >10 units triggers recount
- **Adjustments**: Auto-adjust if variance within threshold, manager approval if over

#### 040.060 - Demand Planning Setup
- **Forecasting**: 12-month rolling forecast
- **Method**: Historical average, seasonal adjustment, trend analysis
- **Review**: Monthly by Merchandising team
- **Integration**: Feeds reorder point calculations

**Estimated Effort**: 50 hours
**Priority**: Critical (Inventory accuracy critical)

---

### 070 - Market-to-ROI (3 configurations)

#### 070.010 - Campaign Management Setup
- **Campaign Types**: Email, Social Media, In-Store Events, Influencer, Paid Search
- **Tracking**: Campaign ID on transactions, ROI calculation
- **Integration**: Klaviyo (email), Google Ads, Facebook Ads

#### 070.020 - Promotion & Pricing Rules
- **Promotion Types**: % Off, $ Off, BOGO, Free Shipping, Gift with Purchase
- **Stacking Rules**: Define which can combine
- **Channels**: All channels, online only, in-store only
- **Date Ranges**: Schedule start/end
- **Usage Limits**: Per customer, total redemptions
- **Coupon Codes**: Single-use, multi-use, auto-applied

#### 070.030 - Customer Segmentation
- **Segments**: VIP, Loyal, At-Risk, New, Lapsed
- **Criteria**: Recency, Frequency, Monetary value (RFM)
- **Auto-Assignment**: Based on purchase behavior
- **Use Cases**: Targeted campaigns, personalized offers, retention programs

**Estimated Effort**: 25 hours
**Priority**: Medium

---

### 080 - Case-to-Resolution (3 configurations)

#### 080.010 - Case Management Setup
- **Case Types**: Order Issue, Product Defect, Return Request, General Inquiry
- **Priorities**: Low, Medium, High, Urgent
- **Status**: New, In Progress, Pending Customer, Resolved, Closed
- **Assignment**: By type, queue-based routing
- **Integration**: Zendesk (primary), Salesforce (CRM sync)

#### 080.020 - Knowledge Base Configuration
- **Categories**: FAQs, Return Policy, Product Care, Shipping Info, Account Help
- **Articles**: 50+ articles for common issues
- **Search**: Keyword search, suggested articles
- **Customer Portal**: Self-service access

#### 080.030 - SLA & Escalation Rules
- **SLAs**:
  - First Response: <2 hours (business hours)
  - Resolution: <24 hours (low), <8 hours (high), <2 hours (urgent)
- **Escalation**: Auto-escalate to supervisor if SLA breach
- **Notifications**: Email to customer and agent

**Estimated Effort**: 20 hours
**Priority**: Medium

---

### 4010 - Custom Records & Fields (5 configurations)

#### 4010.010 - Custom Customer Fields
**Customer Record Extensions**:
- **Loyalty Program**:
  - `custentity_loyalty_tier` (List: Silver, Gold, Platinum)
  - `custentity_loyalty_points` (Integer)
  - `custentity_loyalty_join_date` (Date)
  - `custentity_points_expiration_date` (Date)
- **Preferences**:
  - `custentity_face_shape` (List: Oval, Round, Square, Heart, Diamond)
  - `custentity_style_preference` (Multi-Select: Classic, Sporty, Fashion, Oversized, Minimalist)
  - `custentity_frame_material_pref` (List: Plastic, Metal, Wood, Titanium, Mixed)
- **Prescription Info**:
  - `custentity_has_prescription` (Checkbox)
  - `custentity_prescription_file` (File)
  - `custentity_prescription_expiry` (Date)
- **Marketing**:
  - `custentity_acquisition_channel` (List: Organic Search, Paid Search, Social Media, Referral, Store Walk-in, Other)
  - `custentity_email_optin` (Checkbox)
  - `custentity_sms_optin` (Checkbox)
- **Risk & Value**:
  - `custentity_lifetime_value` (Currency - calculated)
  - `custentity_return_rate` (Percent - calculated)
  - `custentity_fraud_score` (Integer)

#### 4010.020 - Custom Item Fields
**Item Record Extensions**:
- **Product Details**:
  - `custitem_brand` (List: Ray-Ban, Oakley, Maui Jim, Costa Del Mar, Smith, Other)
  - `custitem_frame_material` (List: Acetate, Metal, Titanium, Wood, TR90, Mixed)
  - `custitem_lens_type` (List: Polarized, Photochromic, Mirrored, Standard, Prescription-Ready)
  - `custitem_gender` (List: Men, Women, Unisex, Youth)
  - `custitem_face_shape_fit` (Multi-Select: Oval, Round, Square, Heart, Diamond, All)
- **Dimensions**:
  - `custitem_lens_width` (Integer - mm)
  - `custitem_bridge_width` (Integer - mm)
  - `custitem_temple_length` (Integer - mm)
- **Sustainability**:
  - `custitem_eco_friendly` (Checkbox)
  - `custitem_recycled_material_pct` (Percent)
- **Supplier Info**:
  - `custitem_vendor_sku` (Text)
  - `custitem_lead_time_days` (Integer)
  - `custitem_min_order_qty` (Integer)
- **Merchandising**:
  - `custitem_season` (List: Spring/Summer, Fall/Winter, Year-Round)
  - `custitem_collection` (Text - e.g., "2026 Beach Collection")
  - `custitem_new_arrival` (Checkbox)
  - `custitem_featured_product` (Checkbox)

#### 4010.030 - Custom Transaction Fields
**Sales Order Fields**:
- **Channel & Source**:
  - `custbody_sales_channel` (List: In-Store, E-commerce, Mobile App, Phone)
  - `custbody_store_location` (List: Links to Location)
  - `custbody_sales_associate` (List: Links to Employee)
  - `custbody_campaign_source` (List: Links to Campaign)
- **Fulfillment**:
  - `custbody_fulfillment_method` (List: Ship from Warehouse, Ship from Store, BOPIS, Curbside)
  - `custbody_requested_ship_date` (Date)
  - `custbody_gift_message` (Long Text)
  - `custbody_special_instructions` (Long Text)
- **Loyalty & Promotions**:
  - `custbody_loyalty_points_earned` (Integer - calculated)
  - `custbody_loyalty_points_redeemed` (Integer)
  - `custbody_promotion_code` (Text)
  - `custbody_discount_reason` (List: Promotion, Employee, Manager Override, Loyalty, Other)
- **Risk**:
  - `custbody_fraud_score` (Integer)
  - `custbody_fraud_review_status` (List: Clear, Review Required, Approved, Declined)

**Purchase Order Fields**:
- `custbody_requested_delivery_date` (Date)
- `custbody_receiving_location` (List)
- `custbody_vendor_po_number` (Text)

**Return Authorization Fields**:
- `custbody_return_reason` (List: Defective, Wrong Item, Doesn't Fit, Changed Mind, Other)
- `custbody_return_condition` (List: Unopened, Worn Once, Worn Multiple, Damaged)
- `custbody_restockable` (Checkbox)
- `custbody_refund_method` (List: Original Payment, Store Credit, Exchange)

#### 4010.040 - Custom Lists
**Lists to Create**:
1. **Loyalty Tiers**: Silver, Gold, Platinum
2. **Face Shapes**: Oval, Round, Square, Heart, Diamond
3. **Style Preferences**: Classic, Sporty, Fashion-Forward, Oversized, Minimalist, Retro
4. **Frame Materials**: Acetate, Metal, Titanium, Wood, TR-90 Nylon, Mixed Material
5. **Lens Types**: Polarized, Photochromic, Mirrored, Standard, Prescription-Ready, Blue Light Blocking
6. **Brands**: Ray-Ban, Oakley, Maui Jim, Costa Del Mar, Smith Optics, Warby Parker, Other
7. **Sales Channels**: In-Store, E-commerce, Mobile App, Phone Order, Wholesale
8. **Return Reasons**: Defective Product, Wrong Item, Doesn't Fit, Changed Mind, Found Better Price, Other
9. **Fraud Review Status**: Clear, Review Required, Approved, Declined
10. **Fulfillment Methods**: Ship from Warehouse, Ship from Store, BOPIS, Curbside Pickup

#### 4010.050 - Custom Records
**Custom Record Types**:

**1. Prescription Record** (custrecord_prescription):
- Linked to: Customer
- Fields:
  - Right Eye: Sphere, Cylinder, Axis, Add, Prism
  - Left Eye: Sphere, Cylinder, Axis, Add, Prism
  - Pupillary Distance (PD)
  - Prescription Date
  - Doctor Name, Phone
  - Expiration Date
  - Prescription File (PDF/Image)
  - Status (Active, Expired)

**2. Store Performance Record** (custrecord_store_performance):
- Linked to: Location
- Fields:
  - Period (Month/Year)
  - Sales Target
  - Actual Sales
  - Foot Traffic Count
  - Conversion Rate
  - Average Transaction Value
  - Top Selling Product
  - Labor Cost
  - Occupancy Cost
  - Net Profit

**3. Loyalty Transaction Record** (custrecord_loyalty_txn):
- Linked to: Customer, Transaction
- Fields:
  - Transaction Date
  - Transaction Type (Earn, Redeem, Adjust, Expire)
  - Points Amount
  - Points Balance After
  - Related Order Number
  - Expiration Date (for earned points)
  - Notes

**Estimated Effort**: 40 hours
**Priority**: High (Enables unique business processes)

---

### 4030 - Workflows (4 configurations)

#### 4030.010 - Order Approval Workflow
**Trigger**: Sales Order saved
**Conditions**:
- Order Total > $5,000, OR
- Fraud Score > 75, OR
- Discount > 20%

**Actions**:
1. Set Status to "Pending Approval"
2. Send email to Store Manager (if in-store) or E-commerce Manager (if online)
3. If approved: Set Status to "Pending Fulfillment", send confirmation
4. If rejected: Set Status to "Cancelled", email customer

**Approvers**: Store Manager, E-commerce Manager, Risk Manager

#### 4030.020 - PO Approval Workflow
**Trigger**: Purchase Order saved
**Conditions**:
- PO Total > $5,000

**Actions**:
1. If $5K-$25K: Route to Supply Chain Manager
2. If >$25K: Route to COO or CFO
3. Send email notification
4. Upon approval: Change status to "Pending Receipt"
5. Upon rejection: Status "Cancelled", notify buyer

#### 4030.030 - Return Processing Workflow
**Trigger**: Return Authorization created
**Conditions**: Check return eligibility (30-day window, resalable condition)

**Actions**:
1. Auto-approve if within 30 days + resalable condition
2. Flag for review if outside window or damaged
3. Generate return label
4. Email customer with instructions
5. Upon receipt: Inspect, process refund, update inventory

#### 4030.040 - Customer Onboarding Workflow
**Trigger**: New customer created (online signup)
**Actions**:
1. Send welcome email (via Klaviyo integration)
2. Offer first-purchase discount (10% off)
3. Assign to "New Customer" segment
4. Create loyalty account (start at Silver tier)
5. Schedule follow-up email (7 days later)

**Estimated Effort**: 30 hours
**Priority**: Medium

---

### 4040 - Templates (4 configurations)

#### 4040.010 - Invoice PDF Template
**Design**: Branded SunStyle layout with logo, colors
**Sections**:
- Header (logo, invoice #, date, customer info)
- Line items (product, qty, unit price, total)
- Subtotal, tax breakdown, shipping, discounts, total
- Payment terms, remittance instructions
- Return policy footer
- Barcode for quick lookup

#### 4040.020 - Packing Slip Template
**Design**: Simple, printer-friendly
**Sections**:
- Order number, ship-to address
- Items (name, SKU, qty)
- Special instructions
- Return instructions with QR code
- "Thank You" message

#### 4040.030 - Purchase Order Template
**Design**: Professional, vendor-facing
**Sections**:
- PO number, date, vendor info
- Ship-to location (warehouse/store)
- Line items (SKU, description, qty, unit cost, total)
- Terms, delivery date
- Contact info for questions

#### 4040.040 - Email Templates
**Templates**:
1. Order Confirmation (plain text + HTML)
2. Shipment Notification (with tracking link)
3. Delivery Confirmation
4. Return Label (with instructions)
5. Refund Processed
6. Back-in-Stock Notification
7. Abandoned Cart Reminder (via Klaviyo)
8. Loyalty Points Balance
9. Birthday Offer

**Estimated Effort**: 20 hours
**Priority**: Medium

---

### 4050 - Searches & Reports (4 configurations)

#### 4050.010 - Sales Dashboards
**Dashboards**:
1. **Executive Dashboard**: Revenue, orders, AOV, top products, channel mix
2. **Store Performance**: Sales by store, comp-store sales, conversion rate
3. **E-commerce Dashboard**: Traffic, conversion, cart abandonment, top pages
4. **Daily Flash Report**: Yesterday's sales vs. target, MTD, YTD

#### 4050.020 - Inventory Reports
**Reports**:
1. **Inventory Valuation**: Total value by location, category, brand
2. **Stock Status**: On-hand, reserved, available, on-order
3. **Slow-Moving Items**: Items with <1 sale in 90 days
4. **Stockout Report**: Items out of stock with demand
5. **Inventory Turnover**: By category, brand, location
6. **ABC Analysis**: Classification for cycle counting

#### 4050.030 - Financial Reports
**Reports**:
1. **P&L**: By department, class (store), consolidated
2. **Balance Sheet**: By subsidiary, consolidated
3. **Cash Flow Statement**: Operating, investing, financing activities
4. **AR Aging**: By customer, with collection notes
5. **AP Aging**: By vendor, payment status
6. **Budget vs. Actual**: Variance analysis
7. **Sales Tax Report**: By jurisdiction, filing status

#### 4050.040 - Customer Analytics
**Reports**:
1. **Customer Lifetime Value**: Top customers by LTV
2. **Loyalty Program**: Members by tier, points issued/redeemed
3. **Customer Cohort Analysis**: Retention by acquisition month
4. **RFM Analysis**: Recency, Frequency, Monetary segments
5. **Return Rate**: By customer, product, reason
6. **Customer Acquisition Cost**: By channel

**Estimated Effort**: 35 hours
**Priority**: High (Business insights)

---

### Integration Configurations

#### 3010 - Shopify Integration (4 configurations)
**Purpose**: Sync products, inventory, orders between NetSuite and Shopify Plus
**Connector**: Native NetSuite-Shopify connector or Celigo integration
**Data Flows**:
- Products: NetSuite → Shopify (master data)
- Orders: Shopify → NetSuite (real-time)
- Inventory: NetSuite → Shopify (every 5 minutes)
- Customers: Bidirectional
- Fulfillment Status: NetSuite → Shopify

**Estimated Effort**: 40 hours

#### 3020 - Salesforce Integration (3 configurations)
**Purpose**: Sync customers, orders, cases between NetSuite and Salesforce CRM
**Connector**: Native NetSuite-Salesforce connector or middleware
**Data Flows**:
- Customers: Bidirectional (NetSuite master)
- Orders: NetSuite → Salesforce (for customer view)
- Cases: Salesforce → NetSuite (for order/refund actions)
- Loyalty Data: NetSuite → Salesforce

**Estimated Effort**: 30 hours

#### 3030 - Stripe Payment Integration (2 configurations)
**Purpose**: Process payments, reconcile transactions
**Connector**: SuiteApp or API integration
**Data Flows**:
- Payment Authorization: NetSuite → Stripe
- Payment Capture: NetSuite → Stripe
- Refunds: NetSuite → Stripe
- Payout Reconciliation: Stripe → NetSuite (daily)

**Estimated Effort**: 25 hours

#### 3040 - Shipping Carrier Integration (2 configurations)
**Purpose**: Generate shipping labels, track shipments
**Connector**: ShipStation (recommended) or native carrier APIs
**Data Flows**:
- Shipment Creation: NetSuite → ShipStation/Carriers
- Label Generation: Carriers → NetSuite
- Tracking Updates: Carriers → NetSuite (webhooks)
- Rate Shopping: Real-time API calls

**Estimated Effort**: 30 hours

**Total Integration Effort**: 125 hours
**Priority**: Critical (Omnichannel operations depend on integrations)

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
**Focus**: Core financial and master data setup
- Chart of Accounts (Week 1)
- Subsidiary Structure (Week 1)
- Accounting Periods (Week 1)
- Currencies & SuiteTax (Week 2)
- Departments, Classes, Locations (Week 2)
- Item Master creation (Week 3-4)
- Vendor/Customer master data (Week 3-4)

**Deliverables**:
- COA and subsidiary ready for transactions
- Master data loaded (items, customers, vendors)
- Locations configured

### Phase 2: Procure-to-Pay (Weeks 5-6)
**Focus**: Vendor management and purchasing
- Vendor categories and fields (Week 5)
- PO workflow and approvals (Week 5)
- Receiving process (Week 6)
- AP setup and payment processing (Week 6)

**Deliverables**:
- Purchase orders functional
- Receiving and AP operational

### Phase 3: Inventory Management (Weeks 7-9)
**Focus**: Multi-location inventory tracking
- Location setup and bin management (Week 7)
- Reorder points and replenishment (Week 7-8)
- Transfer orders (Week 8)
- Cycle counting (Week 9)
- Historical inventory loading (Week 9)

**Deliverables**:
- Real-time inventory across 26 locations
- Automated replenishment operational

### Phase 4: Order-to-Cash (Weeks 10-13)
**Focus**: Omnichannel order processing
- Customer categories and fields (Week 10)
- Sales order forms and workflow (Week 10-11)
- Fulfillment configuration (Week 11-12)
- Invoicing and AR (Week 12)
- Return authorization (Week 13)
- Customer deposits and payments (Week 13)

**Deliverables**:
- Orders flowing from all channels
- Fulfillment processes live
- AR and collections operational

### Phase 5: Integrations (Weeks 14-18)
**Focus**: Connect external systems
- Shopify integration (Week 14-15)
- Salesforce integration (Week 16)
- Stripe payment integration (Week 17)
- Shipping carrier integration (Week 18)
- Testing end-to-end flows (Week 18)

**Deliverables**:
- All integrations live and tested
- Orders flowing end-to-end
- Automated processes operational

### Phase 6: Customizations (Weeks 19-22)
**Focus**: Custom fields, workflows, reports
- Custom fields and lists (Week 19)
- Custom records (Week 20)
- Workflows (Week 21)
- Saved searches and reports (Week 22)
- Dashboards (Week 22)

**Deliverables**:
- Business-specific configurations
- Automated workflows
- Management reporting

### Phase 7: Templates & Marketing (Weeks 23-24)
**Focus**: Customer-facing and internal docs
- PDF templates (invoices, packing slips) (Week 23)
- Email templates (Week 23)
- Campaign management (Week 24)
- Promotion engine (Week 24)

**Deliverables**:
- Branded templates
- Marketing automation

### Phase 8: Testing & Training (Weeks 25-27)
**Focus**: UAT and user readiness
- End-to-end testing (Week 25)
- Performance testing (Week 25)
- User training (Week 26)
- Documentation (Week 26)
- Go-live readiness (Week 27)

**Deliverables**:
- UAT sign-off
- Trained users
- Go-live plan

### Phase 9: Go-Live & Hypercare (Week 28+)
**Focus**: Transition to production
- Cutover weekend (data migration, final setup)
- Go-live (Monday Week 28)
- Hypercare support (Week 28-31, 24/7 coverage)
- Post-go-live optimization (ongoing)

**Deliverables**:
- Live system
- Stable operations
- Issue resolution

**Total Timeline**: 28 weeks (7 months)
**Go-Live Target**: Q3 2026

---

## Resource Requirements

### Implementation Team

**NetSuite Side**:
- **NetSuite Solution Architect** (Full-time, Weeks 1-28)
- **NetSuite Functional Consultant** x2 (Full-time, Weeks 1-28)
- **NetSuite Technical Consultant** (Full-time, Weeks 10-28)
- **Integration Specialist** (Full-time, Weeks 14-20)
- **Data Migration Specialist** (Full-time, Weeks 1-4, 25-28)

**SunStyle Side**:
- **Project Manager** (Full-time, internal)
- **CFO / Finance Lead** (25% time, approvals and decisions)
- **Controller** (50% time, requirements and testing)
- **IT Lead** (50% time, integrations and infrastructure)
- **COO / Operations Lead** (25% time, process design)
- **Key Users** (10-15 people, 25% time for requirements, testing, training)

**Third-Party**:
- **Change Management Consultant** (Part-time, Weeks 20-28)
- **Training Specialist** (Part-time, Weeks 26-28)

### Total Effort Estimate
- **NetSuite Consulting**: 3,200 hours
- **SunStyle Internal**: 2,000 hours
- **Third-Party Support**: 400 hours
- **Total**: 5,600 hours

---

## Budget Estimate

### NetSuite Licensing (Annual)
- **OneWorld**: $99,000/year (base with 75 full users)
- **Advanced Inventory**: $20,000/year
- **Advanced Order Management**: $25,000/year
- **SuiteTax**: $5,000/year
- **SuiteCommerce Advanced** (or integration): $12,000/year
- **Additional Users** (50 limited): $15,000/year
- **Total Annual License**: $176,000/year

### Implementation Services
- **NetSuite Professional Services**: $640,000 (3,200 hours x $200/hour)
- **Integration Development**: $100,000
- **Data Migration**: $50,000
- **Change Management**: $40,000
- **Training**: $30,000
- **Total Implementation**: $860,000

### Third-Party Connectors/Apps
- **Shopify Connector** (Celigo): $12,000/year
- **Salesforce Connector**: $10,000/year
- **ShipStation**: $6,000/year
- **Other SuiteApps**: $10,000/year
- **Total Connectors**: $38,000/year

### Hardware/Infrastructure
- **Barcode Scanners** (warehouse + stores): $15,000
- **Label Printers**: $10,000
- **Network Upgrades**: $25,000
- **Total Hardware**: $50,000

### Contingency (15%)
- $150,000

### Total Budget
- **Year 1 Total**: $1,274,000 (implementation + first year license)
- **Annual Ongoing** (Year 2+): $214,000 (license + connectors)

---

## Success Metrics

### Operational Metrics
- **Order Accuracy**: >99% (from 98.5%)
- **Inventory Accuracy**: >98% (from 96%)
- **On-Time Fulfillment**: >95% (from 92%)
- **Month-End Close**: 5 days (from 10 days)
- **Order-to-Ship Time**: <24 hours (from 30 hours)

### Financial Metrics
- **Revenue Visibility**: Real-time (from next-day)
- **Inventory Turnover**: >5x (from 4.2x)
- **DSO (Days Sales Outstanding)**: <30 days (from 35 days)
- **Carrying Cost Reduction**: 15% reduction

### Customer Experience
- **BOPIS Availability**: 90% of orders eligible
- **Ship-from-Store**: 30% of online orders
- **Customer Satisfaction**: >4.7/5 (from 4.6/5)
- **NPS**: >75 (from 72)

### System Performance
- **System Uptime**: 99.9%
- **Page Load Time**: <2 seconds
- **Integration Success Rate**: >99.5%
- **User Adoption**: 95% (active use within 30 days)

---

## Risk Assessment

### High Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data migration errors | High | Medium | Multiple validation cycles, parallel run |
| Integration complexity | High | Medium | Proof-of-concept early, dedicated specialist |
| User adoption resistance | Medium | Medium | Change management, training, executive sponsorship |
| Go-live delays | Medium | Medium | Realistic timeline, phased approach available |
| Budget overruns | High | Low | Detailed SOW, change control process |

### Medium Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Customization complexity | Medium | Medium | Leverage native features where possible |
| Peak season overlap | Medium | Low | Go-live after back-to-school season |
| Key person unavailability | Medium | Low | Cross-training, documentation |
| Third-party connector issues | Medium | Low | Backup integration methods |

### Mitigation Strategies
1. **Weekly Steering Committee**: Executive oversight, quick decisions
2. **Dedicated Project Manager**: Full-time coordination
3. **Phased Approach**: Can go live in stages if needed
4. **Parallel Run**: Run old and new system briefly
5. **Hypercare Support**: 24/7 for first month
6. **Rollback Plan**: Documented contingency if major issues

---

## Assumptions

### Business Assumptions
1. Current transaction volumes continue (no 2x spike during implementation)
2. Store count remains at 25 during implementation
3. Canada expansion delayed until 2027 (not in initial scope)
4. Executive sponsorship and stakeholder availability maintained
5. No major business model changes during implementation

### Technical Assumptions
1. Existing systems have data export capabilities
2. Network bandwidth sufficient for cloud-based NetSuite
3. All stores have reliable internet connectivity
4. Shopify/Salesforce/Stripe APIs stable and documented
5. Historical data available for 2-3 years

### Resource Assumptions
1. SunStyle team 25-50% available for project
2. Key users available for UAT
3. NetSuite consultants available on planned timeline
4. Budget approved and available when needed

---

## Dependencies

### External Dependencies
1. **NetSuite**: License agreement signed, account provisioned
2. **Shopify**: API access granted, sandbox available
3. **Salesforce**: API access, integration user licenses
4. **Stripe**: Account configuration, API keys
5. **Carriers**: Shipper accounts, rate agreements
6. **ISP**: Network upgrades completed by Week 10

### Internal Dependencies
1. **Data Cleanup**: Complete by Week 1
2. **Process Documentation**: Current state by Week 2
3. **User Roles Defined**: By Week 3
4. **Infrastructure Ready**: By Week 10
5. **Training Room Setup**: By Week 26

---

## Next Steps

### Immediate Actions (Next 30 Days)
1. **Executive Approval**: Review and approve configuration plan and budget
2. **Project Kickoff**: Assemble team, assign roles, establish governance
3. **NetSuite Provisioning**: Finalize licensing, provision sandbox account
4. **Data Assessment**: Audit existing data quality, identify cleanup needs
5. **Integration Discovery**: Meet with Shopify, Salesforce, Stripe to confirm APIs

### Weeks 2-4
1. **Detailed Requirements**: Workshops with each department
2. **Process Mapping**: Document As-Is and To-Be processes
3. **Data Migration Plan**: Finalize migration approach and tools
4. **Change Management**: Stakeholder analysis, communication plan
5. **Begin Configuration**: Start with COA and subsidiary setup

---

## Appendices

### A. Detailed File Listing
See individual configuration files in the following directories:
- `010-Record-to-Report/` (6 files)
- `020-Procure-to-Pay/` (4 files)
- `030-Order-to-Cash/` (7 files)
- `040-Plan-to-Inventory/` (6 files)
- `070-Market-to-ROI/` (3 files)
- `080-Case-to-Resolution/` (3 files)
- `4010-Custom-Records-Fields/` (5 files)
- `4030-Workflows/` (4 files)
- `4040-Templates/` (4 files)
- `4050-Searches-Reports/` (4 files)
- `3010-Shopify-Integration/` (4 files)
- `3020-Salesforce-Integration/` (3 files)
- `3030-Stripe-Payment-Integration/` (2 files)
- `3040-Shipping-Carrier-Integration/` (2 files)

### B. Tracking Documents
- `_Tracking/assumptions.md`: Detailed assumptions log
- `_Tracking/gaps.md`: Requirements gaps and open items
- `_Tracking/ambiguities.md`: Items needing clarification
- `_Tracking/follow-up-questions.md`: Questions for stakeholders

### C. Reference Materials
- Customer Knowledgebase (CKB) in `customer-knowledgebase/`
- Business Requirements Document
- Functional Requirements Document
- Technical Requirements Document
- Current system documentation

---

## Document Control

**Approval Required From**:
- [ ] Michael Thompson, CEO
- [ ] Patricia Wong, CFO
- [ ] James Chen, CTO
- [ ] David Martinez, COO
- [ ] Sarah Mitchell, VP Digital Operations

**Version History**:
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | Implementation Team | Initial configuration plan |

**Next Review**: Upon stakeholder approval and before project kickoff

---

**END OF CONFIGURATION SUMMARY**
