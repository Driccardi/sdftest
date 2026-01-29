# NetSuite Configuration Plan: Order to Cash
## SunStyle Retail Corporation

**Process Area**: Order to Cash (O2C)
**Customer**: SunStyle Retail Corporation
**Prepared By**: Functional Configuration Agent
**Date**: 2026-01-28
**Version**: 1.0

---

## Executive Summary

This configuration plan outlines the NetSuite implementation for SunStyle Retail's Order to Cash process, covering customer order management, fulfillment, shipping, invoicing, payment processing, and returns. The configuration supports omnichannel sales (25 retail stores, e-commerce website, mobile app) with integrated inventory, automated fulfillment routing, and comprehensive customer service capabilities.

### Key Objectives
- Seamless omnichannel order processing
- Real-time inventory visibility across all locations
- Automated fulfillment routing (warehouse, ship-from-store, BOPIS)
- Integrated payment processing with multiple gateways
- Efficient returns and exchange management
- Customer satisfaction > 4.5/5, Order accuracy > 99%

### Current State Metrics (to be maintained or improved)
- Annual Orders: ~158,000 (based on $45M revenue / $285 avg transaction)
- Order Channels: 60% in-store, 35% e-commerce, 5% mobile
- Average Transaction Value: $285
- Order Accuracy: 99.2%
- On-Time Fulfillment: 92%
- Return Rate: 3.5%

---

## Phase 1: Sales Order Configuration

### 1.1 Sales Order Record Setup
**Tool**: Customize Transaction Forms (Customization > Forms > Transaction Forms > Sales Order)

**Sales Order Form Configuration**:

**Standard Sales Order Form** (for e-commerce/phone orders):
- Customer information section
- Shipping address (with validation)
- Billing address
- Items/pricing grid
- Promotions/discounts section
- Shipping method selection
- Payment information (tokenized)
- Order notes/instructions
- Gift message field (optional)

**Store POS Sales Order Form** (simplified for in-store):
- Quick customer lookup
- Item scan/add
- Apply discounts
- Payment capture
- Receipt printing

**Custom Fields to Add**:
- Sales Channel (List: Retail Store, E-Commerce Web, E-Commerce Mobile, Phone)
- Sales Associate (Employee lookup)
- Commission Eligible (Checkbox)
- Loyalty Points Earned (Integer)
- Loyalty Points Redeemed (Integer)
- Gift Order (Checkbox)
- Gift Message (Text area)
- Prescription Verified (Checkbox - for prescription orders)
- Prescription Upload (File)
- Store Pickup (Checkbox)
- Preferred Pickup Time (Date/Time)

---

### 1.2 Sales Order Preferences
**Tool**: Sales Preferences (Setup > Accounting > Accounting Preferences > Order Management)

**Configuration**:
1. Enable Features:
   - ☑ Sales Orders
   - ☑ Cash Sales (for in-store POS)
   - ☑ Opportunities (optional, for future B2B)
   - ☑ Credit Memo
   - ☑ Return Authorization
   - ☑ Store Pickup (BOPIS)

2. Order Entry Settings:
   - Require location on line items: Yes
   - Allow multiple fulfillment locations per order: Yes
   - Reserve inventory on sales order: Yes (committed quantity)
   - Default order status: Pending Approval (then auto-approve)
   - Allow backorders: Configurable by item
   - Allow partial fulfillment: Yes

3. Order Approval Workflow:
   - Orders < $10,000: Auto-approved
   - Orders > $10,000: Manual review (fraud prevention)

4. Default Accounts:
   - Default Sales Account: Revenue accounts by product category
   - Default COGS Account: COGS accounts by product category
   - Customer Deposit Account: 2150 - Customer Deposits & Gift Cards

---

### 1.3 Sales Order Numbering
**Tool**: Auto-Generated Numbers (Setup > Company > Auto-Generated Numbers)

**Numbering Scheme**: `SS-YYYYMMDD-######`
- SS = SunStyle prefix
- YYYYMMDD = Order date
- ###### = Sequential number (resets daily)

**Examples**:
- SS-20260128-000001
- SS-20260128-000002

**Configuration**:
- Enable auto-numbering for sales orders
- Set prefix: SS-
- Include date stamp: Yes
- Sequential digits: 6
- Reset frequency: Daily

---

## Phase 2: Customer Configuration for O2C

### 2.1 Customer Payment Terms
**Tool**: Terms (Lists > Accounting > Terms)

**Payment Terms**:
1. **Due on Receipt** (default for retail and e-commerce)
   - Net days: 0
   - Discount: None
   - Use for: All B2C transactions

2. **Net 30** (for potential B2B wholesale - future)
   - Net days: 30
   - Discount: 2/10 Net 30 (optional)

**Configuration**: Set "Due on Receipt" as default payment term for all customers

---

### 2.2 Customer Categories
**Tool**: Customer Categories (Lists > Accounting > Customer Categories)

**Categories**:
1. **Retail Customer** - In-store purchaser
2. **E-Commerce Customer** - Online purchaser
3. **Mobile App Customer** - Mobile purchaser
4. **VIP Customer** - High-value customers (CLV > $2,500)
5. **Loyalty Gold** - Loyalty program Gold tier
6. **Loyalty Platinum** - Loyalty program Platinum tier

**Purpose**: Segmentation for marketing, reporting, and targeted promotions

---

### 2.3 Customer Price Levels
**Tool**: Price Levels (Lists > Accounting > Price Levels)

**Price Levels**:
1. **Base Price** - MSRP (default)
2. **Retail Price** - Standard selling price (may be same as base)
3. **Employee Discount** - Staff discount (e.g., 30% off)
4. **VIP Discount** - High-value customer discount (e.g., 10% off)

**Configuration**: Assign price level to customer record, auto-apply at order entry

---

### 2.4 Customer Credit Limit
**Tool**: Customer Record (Lists > Relationships > Customers > Credit tab)

**Configuration**:
- Default credit limit: $0 (B2C, payment upfront)
- Credit hold: Automatic if payment fails 3 times
- Override credit limit: Requires supervisor approval

---

## Phase 3: Item and Pricing Configuration

### 3.1 Item Setup for Sales
**Tool**: Items (Lists > Accounting > Items)

**Item Configuration for O2C**:
1. **Pricing Tab**:
   - Base Price
   - Price levels (Employee, VIP)
   - Quantity pricing (if applicable for wholesale)

2. **Purchasing, Inventory, Receiving Tab**:
   - Reorder Point
   - Preferred Stock Level
   - Safety Stock
   - Default Vendor
   - Purchase Description

3. **Sales Tab**:
   - Sales Description (customer-facing)
   - Default Sales Tax Code
   - Income Account (by product category)
   - Preferred Sale Unit (Each)

4. **Fulfillment Tab**:
   - Handling instructions (fragile, requires signature)
   - Shipping package (default box size)
   - Weight and dimensions

**Custom Fields on Items**:
- Commissionable (Checkbox)
- Commission Rate (Percentage)
- Allow Backorder (Checkbox)
- Ship Separately (Checkbox - for oversize items)
- Requires Prescription (Checkbox)

---

### 3.2 Promotions and Discounts
**Tool**: Promotions (Marketing > Promotions > Promotions)

**Promotion Types to Configure**:

1. **Percentage Discount**
   - Example: 20% off entire order
   - Application: Coupon code or automatic
   - Restrictions: Date range, customer segment, minimum purchase

2. **Fixed Amount Discount**
   - Example: $25 off orders over $150
   - Application: Coupon code
   - Restrictions: Minimum purchase amount

3. **Buy One Get One (BOGO)**
   - Example: Buy 1 pair, get 2nd pair 50% off
   - Application: Automatic
   - Restrictions: Product category

4. **Free Shipping**
   - Example: Free shipping on orders over $100
   - Application: Coupon code or automatic
   - Restrictions: Minimum purchase, domestic only

5. **Gift with Purchase**
   - Example: Free cleaning kit with sunglasses purchase
   - Application: Automatic
   - Restrictions: Product category

**Configuration Steps**:
1. Create promotion record
2. Define promotion type and discount
3. Set date range (start/end)
4. Set usage limits (per customer, total)
5. Define qualifying items/categories
6. Set minimum/maximum order amounts
7. Configure promotion codes (if applicable)
8. Enable/disable by sales channel

**Promotion Stacking Rules**:
- Maximum 1 coupon code per order
- Automatic promotions (like free shipping) can stack with coupon codes
- Employee discounts cannot stack with promotions
- Loyalty point redemptions can stack with promotions

---

### 3.3 Sales Tax Configuration (O2C specific)
**Tool**: Tax Setup (Setup > Accounting > Tax)

**Configuration**:
1. **Tax Engine**: Use NetSuite native or Avalara/TaxJar
2. **Tax Nexus**: Configure for all store locations and e-commerce nexus
3. **Tax Items**:
   - State/local tax by jurisdiction
   - Shipping tax (where applicable)
4. **Tax Exemptions**:
   - Prescription eyewear (may be exempt in some states)
   - Resale exemptions (for B2B)
5. **Tax Codes**:
   - Taxable Product
   - Non-Taxable Service
   - Shipping - Taxable
   - Shipping - Non-Taxable

**Tax Calculation**:
- Calculate tax based on "ship to" address
- Calculate tax at line item level
- Apply tax exemptions automatically

**Tax Reporting**:
- Configure tax liability account: 2130 - Accrued Sales Tax Payable
- Set up tax reporting by jurisdiction
- Enable automatic tax return filing (if using Avalara)

---

## Phase 4: Fulfillment Configuration

### 4.1 Fulfillment Location Strategy
**Tool**: Locations (Lists > Accounting > Locations)

**Fulfillment Locations**:
1. **Primary Distribution Center** - Central warehouse (default)
2. **Store Locations (25)** - Ship-from-store and BOPIS
3. **In-Transit Location** - Virtual location for transfers

**Fulfillment Logic**:

**Order Routing Rules** (via SuiteScript or Advanced Fulfillment):
1. **Default Rule**: Fulfill from warehouse if in stock
2. **Ship-from-Store Rule**: If warehouse out of stock, fulfill from nearest store with inventory
3. **BOPIS Rule**: If customer selects store pickup, reserve at selected store
4. **Split Shipment Rule**: If items in different locations, split shipment (minimize splits)

**Store Fulfillment Prioritization**:
- Distance to customer shipping address (closest first)
- Store inventory availability
- Store sales velocity (avoid depleting high-traffic stores)
- Store fulfillment capacity

**Configuration**:
1. Enable "Make Inventory Available" for all fulfillment locations
2. Set location type (Store, Warehouse)
3. Configure shipping methods available by location
4. Set store fulfillment capacity (max orders per day)
5. Define blackout dates for store fulfillment (holidays, events)

---

### 4.2 Item Fulfillment Process
**Tool**: Item Fulfillment (Transactions > Sales > Fulfill Orders)

**Fulfillment Workflow**:
1. Sales Order → Pending Fulfillment
2. Pick items (generate pick list)
3. Pack items (scan items, print packing slip)
4. Create Item Fulfillment record
5. Select shipping carrier and method
6. Generate shipping label
7. Mark as shipped
8. Update inventory (deduct from location)
9. Trigger customer notification (shipment email)

**Item Fulfillment Form Configuration**:
- Display order details (customer, items, shipping address)
- Barcode scanning fields for picking accuracy
- Package information (weight, dimensions, tracking number)
- Shipping carrier and method
- Shipping cost (actual)
- Mark items as shipped checkbox

**Custom Fields on Item Fulfillment**:
- Pick List Generated (Checkbox)
- Picker (Employee)
- Pick Time (Duration)
- Packer (Employee)
- Pack Time (Duration)
- Quality Check (Checkbox)

---

### 4.3 Shipping Integration
**Tool**: Shipping Integration (Setup > Company > Shipping)

**Shipping Carriers**:
1. **FedEx** - Expedited and express shipping
2. **UPS** - Ground and expedited shipping
3. **USPS** - Economy and standard shipping

**Shipping Methods to Configure**:
1. **Standard Shipping** - 5-7 business days (USPS Ground)
2. **Expedited Shipping** - 2-3 business days (UPS Ground)
3. **Express Shipping** - 1-2 business days (FedEx 2-Day)
4. **Overnight Shipping** - Next business day (FedEx Overnight)
5. **Store Pickup** - BOPIS (no shipping)

**Shipping Rate Configuration**:
- Real-time rate shopping (get best rate from carriers)
- Flat rate shipping (alternative pricing model)
- Free shipping threshold: Orders over $100
- Handling fee: None (included in shipping charge)

**Shipping Label Generation**:
- Automatic label generation upon item fulfillment
- Label format: PDF, printable on thermal printer
- Include order number, tracking number on label
- Package weight and dimensions from item master

**Tracking Number Integration**:
- Automatically capture tracking number from carrier
- Store tracking number on item fulfillment record
- Send tracking number to customer via email/SMS

---

### 4.4 Store Pickup (BOPIS) Configuration
**Tool**: Store Pickup Feature (Setup > Company > Enable Features)

**Configuration**:
1. Enable Store Pickup feature
2. Configure eligible locations (all 25 stores)
3. Set pickup readiness SLA (2 hours for items in stock)
4. Configure pickup notification (email/SMS when ready)

**Store Pickup Workflow**:
1. Customer selects "Store Pickup" at checkout
2. Customer selects preferred store location
3. Order routed to selected store
4. Store associate picks and stages order
5. Store associate marks order "Ready for Pickup"
6. Customer receives notification
7. Customer arrives at store, provides order number
8. Store associate verifies identity, completes pickup
9. Item fulfillment record created (mark as picked up)

**Store Pickup Form Configuration**:
- Customer name and order number
- Items to be picked up
- Pickup location
- Ready for pickup status
- Customer notification sent checkbox
- Pickup completed checkbox (scan ID, signature)

---

### 4.5 Packing Slip Configuration
**Tool**: Advanced PDF/HTML Templates (Customization > Forms > Advanced PDF/HTML Templates)

**Packing Slip Template**:
- Company logo and branding
- Order number and date
- Customer name and shipping address
- Items ordered (description, quantity, SKU)
- Return instructions and RMA process
- Customer service contact information
- Thank you message

**Configuration**:
- Auto-print with item fulfillment
- Include packing slip in shipment
- Enable email option (send PDF to customer)

---

## Phase 5: Payment Processing Configuration

### 5.1 Payment Methods
**Tool**: Payment Methods (Lists > Accounting > Payment Methods)

**Payment Methods** (as defined in Financials plan):
1. Cash
2. Credit Card (Visa, MC, Amex, Discover)
3. Debit Card
4. Mobile Payment (Apple Pay, Google Pay)
5. PayPal
6. Afterpay (Buy Now Pay Later)
7. Gift Card
8. Store Credit
9. Loyalty Points

**Payment Processing Flow**:

**E-Commerce/Mobile**:
1. Customer enters payment info at checkout
2. Payment gateway (Stripe) tokenizes payment
3. Authorize payment (hold funds)
4. Create sales order with authorization
5. Capture payment upon item fulfillment (automatic)
6. Funds settle to bank account

**In-Store POS**:
1. Customer provides payment
2. POS terminal processes payment (real-time)
3. Create cash sale record in NetSuite
4. Print receipt

**Split Payments**:
- Enable multiple payment methods on single order
- Example: $100 gift card + $50 credit card
- Allocate payments to order total

---

### 5.2 Payment Gateway Integration
**Tool**: SuitePayments or SuiteBilling (for Stripe integration)

**Stripe Integration Configuration**:
1. Install Stripe SuiteApp (if available) or custom integration
2. Configure Stripe API credentials
3. Map payment methods to Stripe payment types
4. Configure authorization and capture rules:
   - Authorize at order placement
   - Capture at item fulfillment (automatic)
   - Void authorization if order cancelled
5. Configure automatic refund processing (for returns)
6. Set up payment reconciliation:
   - Match Stripe payouts to NetSuite payments
   - Record merchant fees as expenses

**Stripe Fee Accounting**:
- Payout amount: Net deposit to bank account
- Gross sales: Full order total
- Merchant fee: Expense (7910 - Merchant Processing Fees)
- Journal entry: Debit Bank, Debit Merchant Fees, Credit Revenue

---

### 5.3 Customer Payment Processing
**Tool**: Customer Payment (Transactions > Sales > Enter Payments)

**Use Cases**:
1. **Refund Processing** - For returns
2. **Gift Card Balance Application** - Apply gift card to order
3. **Store Credit Application** - Apply store credit to order
4. **Failed Payment Retry** - Re-process failed payment

**Customer Payment Configuration**:
- Payment method selection
- Reference/authorization number
- Apply to specific invoices/sales orders
- Unapply payments (if needed)
- Record payment fee (if applicable)

---

### 5.4 Gift Card Configuration
**Tool**: Gift Certificates (Setup > Accounting > Enable Features > Gift Certificates)

**Gift Card Configuration**:
1. Enable Gift Certificate feature
2. Create Gift Certificate item:
   - Item name: SunStyle Gift Card
   - Item type: Gift Certificate
   - Liability account: 2150 - Customer Deposits & Gift Cards
   - Revenue recognition: Upon redemption
3. Configure gift card amounts (preset or custom)
4. Enable gift card purchase (online and in-store)
5. Gift card issuance:
   - Physical card with code
   - Digital card (email delivery)
6. Gift card redemption:
   - Apply at checkout (code entry)
   - Deduct from gift card balance
   - Track remaining balance

**Gift Card Liability Accounting**:
- Sale: Debit Cash, Credit Gift Card Liability
- Redemption: Debit Gift Card Liability, Credit Revenue (by product purchased)
- Breakage: After 24 months, recognize breakage revenue

---

### 5.5 Store Credit Configuration
**Tool**: Customer Deposits (Setup > Accounting > Accounting Preferences)

**Store Credit Configuration**:
1. Enable Customer Deposit feature
2. Store credit issuance:
   - Manual issuance (customer service)
   - Automatic issuance (return to store credit)
   - Bonus store credit (promotions, service recovery)
3. Store credit account: 2160 - Store Credit Liability
4. Store credit redemption:
   - Apply at checkout
   - Deduct from store credit balance
5. Store credit expiration: No expiration
6. Bonus for store credit: 10% extra value (e.g., $100 return = $110 store credit)

---

### 5.6 Loyalty Points Configuration
**Tool**: Custom Records and SuiteScript

**Loyalty Points System**:
1. **Points Earning**:
   - 1 point per $1 spent (base rate)
   - Bonus points for Gold/Platinum members (1.25x or 1.5x)
   - Bonus points for special promotions
   - Track points on sales order (custom field)
   - Post points to customer record upon order fulfillment

2. **Points Redemption**:
   - 100 points = $10 value
   - Redeem at checkout (apply as discount)
   - Minimum redemption: 100 points
   - Maximum redemption: 50% of order total (prevent full point orders)

3. **Points Expiration**:
   - Expiration period: 24 months from earning
   - Expiration warning: Email 60 days before expiry
   - Expired points: Breakage revenue

4. **Points Liability Accounting**:
   - Earning: Debit Loyalty Points Expense, Credit Loyalty Points Liability
   - Redemption: Debit Loyalty Points Liability, Credit Revenue (discount)
   - Expiration: Debit Loyalty Points Liability, Credit Breakage Revenue

**Configuration**:
- Create custom record: Loyalty Points Transaction
  - Fields: Customer, Transaction Date, Points Earned, Points Redeemed, Balance, Expiration Date
- Create workflow: Auto-calculate points on sales order
- Create SuiteScript: Apply points redemption at checkout
- Create saved search: Expiring points report
- Create scheduled script: Monthly points expiration batch job

---

## Phase 6: Returns and Exchanges

### 6.1 Return Authorization Configuration
**Tool**: Return Authorizations (Setup > Company > Enable Features > Return Authorizations)

**Return Authorization (RMA) Configuration**:
1. Enable Return Authorization feature
2. Create Return Authorization form:
   - Customer information
   - Original order number (lookup)
   - Items being returned
   - Return reason (dropdown)
   - Return quantity
   - Restocking fee (if applicable - currently $0)
   - Refund method selection
   - RMA number (auto-generated)

**RMA Number Format**: `RMA-YYYYMMDD-######`
- Example: RMA-20260128-000001

**Return Reasons** (dropdown list):
1. Defective product
2. Wrong product received
3. Doesn't fit/suit
4. Changed mind
5. No longer needed
6. Found better price
7. Other (free text)

**Configuration**:
1. Auto-generate RMA number
2. Set return policy (30 days from delivery)
3. Configure eligible items for return (exclude prescription items unless defective)
4. Set restocking fee: $0 (currently waived)
5. Generate return shipping label automatically

---

### 6.2 Return Receiving Process
**Tool**: Item Receipt from RMA (Transactions > Inventory > Item Receipts)

**Return Receiving Workflow**:
1. Customer ships return to warehouse (with RMA number)
2. Warehouse receives package
3. Scan RMA number to locate return authorization
4. Inspect returned items:
   - Verify items match RMA
   - Check condition (resalable, damaged, defective)
   - Verify all components included (tags, packaging)
5. Record inspection results on RMA
6. Create Item Receipt against RMA:
   - Disposition: Resalable, Damaged, Defective
   - Quantity received
   - Location (return to stock if resalable)
7. Trigger refund process

**Return Disposition**:
- **Resalable**: Return to inventory (add to available qty)
- **Damaged**: Write off to inventory shrinkage
- **Defective**: Segregate for vendor return or disposal

**Custom Fields on RMA**:
- Inspection Complete (Checkbox)
- Inspector (Employee)
- Inspection Date (Date)
- Disposition (List: Resalable, Damaged, Defective)
- Defect Description (Text)
- Vendor Notification Required (Checkbox)

---

### 6.3 Refund Processing
**Tool**: Credit Memo and Customer Refund (Transactions > Sales > Issue Credit Memo)

**Refund Workflow**:
1. RMA inspection approved → Create Credit Memo
2. Credit Memo creation:
   - Linked to original sales order
   - Items being refunded
   - Refund amount (item cost + tax + shipping if applicable)
   - Restocking fee deduction (if applicable - currently $0)
3. Credit Memo approval (automatic for standard returns)
4. Create Customer Refund:
   - Apply credit memo
   - Select refund method (original payment method)
   - Process refund via payment gateway
5. Refund posting:
   - Debit Sales Returns & Allowances
   - Debit Sales Tax Payable (reverse tax)
   - Credit Accounts Receivable / Cash
6. Reverse loyalty points (if applicable)
7. Send refund confirmation email to customer

**Refund Methods**:
1. **Original Payment Method** (default)
   - Credit card: Process refund via Stripe (3-5 business days)
   - PayPal: Process refund via PayPal (instant)
   - Cash: Issue check or cash refund in-store
2. **Store Credit** (with 10% bonus)
   - Issue customer deposit
   - Email store credit code
3. **Exchange** - Process as return + new order

**Refund Policy Rules**:
- Full refund: Items in resalable condition within 30 days
- Partial refund: Items missing tags or packaging
- No refund: Prescription items (unless defective)
- Shipping refund: Only for defective/wrong items

**Configuration**:
1. Link credit memo to RMA and original sales order
2. Auto-calculate refund amount (with tax reversal)
3. Configure refund approval workflow (auto-approve < $200)
4. Integrate refund processing with payment gateway
5. Set refund processing SLA: 3 business days

---

### 6.4 Exchange Processing
**Tool**: Return Authorization + New Sales Order

**Exchange Workflow**:
1. Customer initiates exchange (return product A, purchase product B)
2. Create Return Authorization for product A
3. Process return per standard workflow
4. Create new Sales Order for product B:
   - Same customer
   - Reference RMA number
   - Apply credit from return (if already processed)
5. Fulfill new order per standard workflow
6. Net payment: Customer pays difference (or receives refund if lower price)

**Configuration**:
- Link new sales order to RMA (custom field)
- Waive shipping on exchange order
- Expedite fulfillment of exchange orders

---

## Phase 7: Customer Communications

### 7.1 Transaction Email Templates
**Tool**: Email Templates (Setup > Company > Email Templates)

**Email Templates to Configure**:

1. **Order Confirmation Email**
   - Trigger: Sales order created
   - Content:
     - Thank you message
     - Order number and date
     - Items ordered (description, quantity, price)
     - Shipping address
     - Payment method (last 4 digits)
     - Order total
     - Estimated delivery date
     - Loyalty points earned
     - Customer service contact info

2. **Order Shipped Email**
   - Trigger: Item fulfillment created
   - Content:
     - Order number
     - Items shipped
     - Shipping carrier and method
     - Tracking number with link
     - Estimated delivery date
     - Delivery instructions

3. **Order Delivered Email**
   - Trigger: Delivery confirmation (from carrier)
   - Content:
     - Order delivered message
     - Request for product review (link)
     - Customer service contact for issues

4. **Store Pickup Ready Email**
   - Trigger: BOPIS order marked ready
   - Content:
     - Order ready for pickup
     - Pickup location (address, hours)
     - What to bring (order number, ID)
     - Pickup deadline (hold for 7 days)

5. **RMA Confirmation Email**
   - Trigger: Return authorization created
   - Content:
     - RMA number
     - Return shipping label (PDF attachment)
     - Return instructions
     - Refund method and timeline
     - Customer service contact

6. **Refund Processed Email**
   - Trigger: Customer refund processed
   - Content:
     - Refund amount
     - Refund method
     - Processing timeline (3-5 business days for credit cards)
     - Thank you for shopping with us

7. **Order Delayed Email** (proactive communication)
   - Trigger: Estimated ship date passed without fulfillment
   - Content:
     - Apology for delay
     - Updated estimated ship date
     - Explanation (if available)
     - Customer service contact

**Configuration**:
1. Create email templates in NetSuite
2. Configure merge fields (order number, customer name, etc.)
3. Set up workflows to trigger emails
4. Test email delivery
5. Configure email sending account (SMTP)
6. Enable tracking (open rate, click rate)

---

### 7.2 SMS Notifications (Optional)
**Tool**: SMS Integration (Custom or third-party)

**SMS Notifications**:
1. Order Shipped (with tracking link)
2. Out for Delivery (day of delivery)
3. Delivered
4. Store Pickup Ready

**Configuration**:
- Integrate with SMS provider (Twilio, etc.)
- Capture customer mobile number
- Customer opt-in for SMS notifications
- Configure SMS templates
- Trigger SMS via workflow

---

## Phase 8: Order Management Reporting

### 8.1 Sales Reports
**Tool**: Reports and Saved Searches

**Key Sales Reports**:

1. **Sales by Location Report**
   - Sales by store (current day, week, month)
   - Comparison to prior year
   - Top/bottom performing stores
   - Store ranking

2. **Sales by Channel Report**
   - Revenue by channel (Retail, Web, Mobile)
   - Orders by channel
   - Average order value by channel
   - Conversion rate by channel (if available)

3. **Sales by Product Category**
   - Revenue by product category
   - Units sold
   - Gross margin by category
   - Product mix percentage

4. **Sales by Sales Associate**
   - Sales by employee (for commission)
   - Commission amount earned
   - Average transaction value
   - Number of transactions

5. **Daily Sales Flash Report**
   - Total sales (current day)
   - Comparison to budget
   - Comparison to prior year same day
   - Orders by channel
   - Top-selling items

6. **Order Pipeline Report**
   - Orders by status (pending, approved, fulfillment, shipped)
   - Backorders
   - Orders on hold (payment issues, fraud review)

---

### 8.2 Fulfillment Reports

**Key Fulfillment Reports**:

1. **Orders to Fulfill Report**
   - Open sales orders pending fulfillment
   - Order date and priority
   - Items and quantities
   - Fulfillment location
   - Customer shipping address

2. **Fulfillment Performance Report**
   - Orders fulfilled (daily, weekly, monthly)
   - Average time to fulfill (order to ship)
   - On-time fulfillment rate (target > 90%)
   - Orders fulfilled by location

3. **Shipping Cost Analysis**
   - Shipping revenue collected
   - Actual shipping costs paid to carriers
   - Shipping margin (revenue - cost)
   - Shipping cost as % of sales

4. **Backorder Report**
   - Items on backorder
   - Quantity backordered
   - Expected availability date
   - Customer waiting

5. **BOPIS Report**
   - Store pickup orders
   - Ready for pickup (not yet picked up)
   - Picked up today
   - Pickup time (order ready to customer pickup)

---

### 8.3 Returns and Refunds Reports

**Key Returns Reports**:

1. **Returns Analysis Report**
   - Return rate (returns as % of orders)
   - Returns by product category
   - Return reasons analysis
   - Returns by location (where purchased)

2. **Open RMA Report**
   - RMAs awaiting customer shipment
   - RMAs awaiting inspection
   - RMAs awaiting refund processing
   - RMA aging

3. **Refund Processing Report**
   - Refunds processed (daily, weekly, monthly)
   - Refund amount
   - Refund method
   - Average refund processing time (target < 3 days)

4. **Restocking Analysis**
   - Items returned to stock (resalable)
   - Items written off (damaged)
   - Defective items (vendor return)
   - Restocking percentage

---

### 8.4 Customer Metrics Reports

**Key Customer Reports**:

1. **New Customers Report**
   - New customers acquired (daily, weekly, monthly)
   - Acquisition channel
   - First order value

2. **Repeat Customer Report**
   - Repeat purchase rate (target 35%)
   - Time between purchases
   - Customer lifetime value

3. **Customer Satisfaction Report**
   - CSAT scores (from post-purchase surveys)
   - NPS scores
   - Satisfaction by channel
   - Satisfaction by product category

4. **Loyalty Program Report**
   - Loyalty members (by tier)
   - Points earned (liability incurred)
   - Points redeemed (liability released)
   - Points expired (breakage)
   - Loyalty member purchase frequency

---

### 8.5 Order Accuracy and Quality Reports

**Key Quality Reports**:

1. **Order Accuracy Report**
   - Orders shipped complete and correct
   - Order errors (wrong item, wrong quantity)
   - Error rate (target < 1%)
   - Error root cause analysis

2. **Damaged in Transit Report**
   - Orders reported damaged in shipping
   - Carrier responsible
   - Damage rate by carrier

3. **Order Cancellation Report**
   - Orders cancelled (by customer or system)
   - Cancellation reasons
   - Cancellation rate

4. **Customer Complaint Report**
   - Complaints related to orders
   - Complaint types
   - Resolution rate
   - Satisfaction after resolution

---

## Phase 9: Order to Cash Workflow Automation

### 9.1 Sales Order Approval Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Sales Order Approval

**Triggers**: Sales order created

**Conditions**:
- If Order Total < $10,000: Auto-approve
- If Order Total >= $10,000: Route for manual approval
- If Fraud Score > 75: Hold for fraud review

**Actions**:
- Auto-approve: Change status to "Pending Fulfillment"
- Manual approval: Send email to manager with order details
- Fraud review: Send email to fraud team, place order on hold

**Approval Routing**:
- Orders $10,000-$25,000: Store/Department Manager
- Orders > $25,000: VP or CFO

---

### 9.2 Fulfillment Routing Workflow
**Tool**: SuiteScript (Custom Script)

**Script**: Fulfillment Location Assignment

**Logic**:
1. If "Store Pickup" selected: Assign to customer's selected store
2. Else if Warehouse has inventory: Assign to warehouse
3. Else if Stores have inventory: Assign to nearest store with inventory
4. Else: Create backorder

**Factors**:
- Inventory availability
- Customer shipping address (proximity)
- Store fulfillment capacity
- Store sales velocity

**Configuration**:
- Deploy as scheduled script (runs every 15 minutes)
- Or deploy as user event script (on save of sales order)

---

### 9.3 Order Status Update Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Order Status Notifications

**Triggers**:
- Sales Order created → Send order confirmation email
- Item Fulfillment created → Send order shipped email
- Delivery confirmed (tracking status) → Send delivered email
- BOPIS ready for pickup → Send pickup ready email

**Actions**:
- Send email with appropriate template
- Update customer record (last order date, order count)
- Post loyalty points earned
- Update order status field

---

### 9.4 Return Processing Workflow
**Tool**: SuiteFlow (Workflow)

**Workflow**: Return Authorization Processing

**Triggers**:
- RMA created → Generate RMA number, send RMA email with return label
- RMA received and inspected → Create credit memo
- Credit memo approved → Process customer refund
- Customer refund processed → Send refund confirmation email

**Actions**:
- Auto-generate return shipping label
- Send email notifications
- Create accounting transactions (credit memo, refund)
- Update customer record (return history)

---

## Phase 10: Integration Requirements (O2C Specific)

### 10.1 E-Commerce Platform Integration
**Integration**: E-Commerce ↔ NetSuite

**Order Flow** (E-commerce → NetSuite):
1. Customer places order on website
2. E-commerce platform creates order
3. Payment authorized via Stripe
4. Integration creates sales order in NetSuite (real-time or every 5 minutes)
   - Customer record (create/update)
   - Sales order with line items
   - Payment authorization
   - Shipping address
   - Billing address
   - Promotion codes
5. NetSuite reserves inventory
6. NetSuite routes order to fulfillment location

**Fulfillment Flow** (NetSuite → E-commerce):
1. NetSuite creates item fulfillment
2. Capture tracking number from carrier
3. Integration sends tracking to e-commerce (real-time)
4. E-commerce sends shipment email to customer (or NetSuite sends directly)

**Inventory Flow** (NetSuite → E-commerce):
1. NetSuite inventory changes (sale, receipt, adjustment, transfer)
2. Integration sends available qty to e-commerce (every 15 minutes)
3. E-commerce updates product page availability

**Return Flow** (E-commerce → NetSuite):
1. Customer initiates return on website (self-service portal)
2. E-commerce creates return request
3. Integration creates RMA in NetSuite
4. NetSuite generates return label
5. Integration sends RMA details to e-commerce
6. E-commerce emails RMA to customer

**Integration Method**: RESTlet or SuiteTalk API (SOAP/REST)

**Data Mapping**:
- E-commerce Order → NetSuite Sales Order
- E-commerce Customer → NetSuite Customer
- E-commerce Product → NetSuite Item
- E-commerce Payment → NetSuite Payment Authorization

---

### 10.2 POS System Integration
**Integration**: POS ↔ NetSuite

**Sales Flow** (POS → NetSuite):
1. In-store transaction completed at POS
2. POS creates sale record (with payment)
3. Integration creates cash sale in NetSuite (end of day batch or hourly)
   - Customer (lookup or create)
   - Items sold
   - Payment captured
   - Sales associate
   - Store location
4. NetSuite decrements inventory

**Alternative Real-time Approach**:
- POS creates sales order in NetSuite (real-time)
- POS fulfills order immediately
- NetSuite creates item fulfillment and invoice

**Inventory Flow** (NetSuite ↔ POS):
- NetSuite inventory → POS (hourly sync)
- POS adjustments → NetSuite (if POS is source of truth for store inventory)

**Customer Flow** (POS ↔ NetSuite):
- Customer created in POS → Sync to NetSuite
- Customer updated in NetSuite → Sync to POS
- Loyalty points balance: Real-time sync

**Integration Method**: CSV file exchange or API

---

### 10.3 Shipping Carrier Integration
**Integration**: Carriers (FedEx, UPS, USPS) ↔ NetSuite

**Label Generation Flow**:
1. Item fulfillment created in NetSuite
2. NetSuite sends shipment details to carrier API
3. Carrier returns shipping label (PDF) and tracking number
4. NetSuite stores label and tracking number on item fulfillment
5. Print label for package

**Tracking Update Flow**:
1. Carrier updates tracking status (in transit, out for delivery, delivered)
2. NetSuite polls carrier API for status updates (or carrier pushes updates)
3. NetSuite updates item fulfillment with delivery date/time
4. NetSuite triggers customer notification (delivered email)

**Integration Method**: Native carrier integrations (if available) or custom API integration

---

### 10.4 Payment Gateway Integration
**Integration**: Stripe/PayPal ↔ NetSuite

**Authorization Flow**:
1. Customer enters payment at checkout (e-commerce or in-store)
2. Payment gateway authorizes payment
3. Integration stores authorization in NetSuite (sales order custom field)

**Capture Flow**:
1. Item fulfillment created in NetSuite
2. Integration sends capture request to payment gateway
3. Payment gateway captures funds
4. Integration records payment in NetSuite (customer payment)

**Refund Flow**:
1. Credit memo and customer refund created in NetSuite
2. Integration sends refund request to payment gateway
3. Payment gateway processes refund
4. Refund confirmation stored in NetSuite

**Settlement/Reconciliation Flow**:
1. Payment gateway deposits funds to bank account (daily)
2. Bank feed imports deposit to NetSuite
3. NetSuite matches deposit to payment records
4. Record merchant fees as expense

---

## Phase 11: Key Performance Indicators (KPIs)

### 11.1 O2C KPIs to Track

**Order Management KPIs**:
- Orders per day (by channel)
- Average order value (target: $285)
- Order conversion rate (web: target > 3.2%)
- Cart abandonment rate (target < 70%)

**Fulfillment KPIs**:
- Order-to-ship time (target < 24 hours)
- On-time fulfillment rate (target > 90%)
- Same-day shipping rate (target > 90%)
- Order accuracy (target > 99%)
- Pick/pack productivity (target: 30 items/hour)

**Shipping KPIs**:
- On-time delivery rate (target > 90%)
- Shipping cost as % of sales
- Carrier performance (on-time by carrier)
- Damaged in transit rate (target < 0.5%)

**Returns KPIs**:
- Return rate (target < 5%)
- RMA processing time (target < 5 minutes)
- Refund processing time (target < 3 business days)
- Restocking rate (target > 80%)

**Customer Service KPIs**:
- First contact resolution (target > 80%)
- Customer satisfaction (target > 4.5/5)
- Net Promoter Score (target > 70)
- Response time (target < 2 hours for email)

**Financial KPIs**:
- Days sales outstanding (target < 5 days)
- Order-to-cash cycle time
- Revenue per channel
- Discount/promotion redemption rate

---

## Phase 12: Testing & Validation

### 12.1 Order Entry Testing
**Test Scenarios**:
1. Place order via e-commerce (guest checkout)
2. Place order via e-commerce (registered user)
3. Place order via mobile app
4. Place order in-store (POS)
5. Apply coupon code to order
6. Apply loyalty points to order
7. Use gift card for payment
8. Split payment (gift card + credit card)
9. Place BOPIS (store pickup) order
10. Place order with gift message

**Validation**:
- Sales order created correctly
- Customer record created/updated
- Inventory reserved
- Payment authorized
- Order confirmation email sent
- Pricing and tax calculated correctly

---

### 12.2 Fulfillment Testing
**Test Scenarios**:
1. Fulfill order from warehouse
2. Fulfill order from store (ship-from-store)
3. Fulfill BOPIS order (store pickup)
4. Fulfill order with split shipment
5. Generate shipping label
6. Capture tracking number
7. Send shipped notification

**Validation**:
- Item fulfillment created
- Inventory decremented from correct location
- Shipping label generated
- Tracking number captured
- Shipment email sent
- Payment captured (e-commerce orders)

---

### 12.3 Returns Testing
**Test Scenarios**:
1. Create RMA via customer portal
2. Create RMA via customer service
3. Generate return label
4. Receive return and inspect
5. Process refund to credit card
6. Process refund to store credit
7. Process exchange

**Validation**:
- RMA created with unique number
- Return label generated
- RMA email sent
- Item receipt created (return to stock)
- Credit memo created
- Customer refund processed
- Refund confirmation email sent

---

## Phase 13: Training & Documentation

### 13.1 Training Plan (O2C Specific)

**Store Associates** (1-day training):
- POS order entry
- Customer lookup
- Apply discounts and promotions
- Process payments
- Handle returns in-store
- Process BOPIS pickups

**E-Commerce Operations Team** (2-day training):
- Sales order management
- Order review and approval
- Fulfillment routing
- Order modifications
- Customer service inquiries

**Warehouse Team** (1.5-day training):
- Pick list generation
- Picking process (barcode scanning)
- Packing process
- Shipping label generation
- Item fulfillment creation
- Return receiving and inspection

**Customer Service Team** (2-day training):
- Order lookup and status
- Order modifications
- RMA creation
- Refund processing
- Customer inquiries
- Issue escalation

---

### 13.2 Process Documentation

**Process Documents**:
1. Order Entry Procedures (by channel)
2. Order Approval Process
3. Fulfillment Routing Logic
4. Picking and Packing Procedures
5. Shipping Label Generation
6. BOPIS Process
7. Return Authorization Process
8. Return Receiving and Inspection
9. Refund Processing Procedures
10. Exchange Processing

---

## Phase 14: Go-Live Preparation

### 14.1 Go-Live Checklist (O2C)

**Pre-Go-Live**:
1. ☐ Configure sales order forms and preferences
2. ☐ Set up item master with pricing
3. ☐ Configure promotions and discounts
4. ☐ Set up shipping methods and carriers
5. ☐ Configure payment methods and gateway
6. ☐ Set up locations for fulfillment
7. ☐ Configure RMA and returns process
8. ☐ Create email templates
9. ☐ Test e-commerce integration
10. ☐ Test POS integration
11. ☐ Test payment gateway integration
12. ☐ Test shipping carrier integration
13. ☐ Conduct UAT with key users
14. ☐ Train all users
15. ☐ Create process documentation

**Go-Live Day**:
16. ☐ Activate integrations
17. ☐ Monitor orders closely
18. ☐ Test end-to-end order flow
19. ☐ Verify inventory sync
20. ☐ Hypercare support

**Post-Go-Live**:
21. ☐ Monitor order processing daily
22. ☐ Review fulfillment performance
23. ☐ Review customer feedback
24. ☐ Optimize workflows
25. ☐ Conduct lessons learned

---

## Appendices

### Appendix A: Sales Order Custom Fields
- Sales Channel
- Sales Associate
- Commission Eligible
- Commission Rate
- Loyalty Points Earned
- Loyalty Points Redeemed
- Gift Order
- Gift Message
- Prescription Required
- Prescription Verified
- Prescription Document
- Store Pickup Location
- Preferred Pickup Time

### Appendix B: Customer Custom Fields
- Loyalty Member ID
- Loyalty Tier
- Loyalty Points Balance
- Customer Since Date
- Preferred Store
- Face Shape Profile
- Communication Preferences (Email, SMS)

### Appendix C: Item Custom Fields
- Commissionable
- Commission Rate
- Allow Backorder
- Ship Separately
- Requires Prescription
- Brand
- Collection
- Frame Material
- Lens Type
- Style Category

### Appendix D: Integration Data Mapping
*Detailed field mappings for e-commerce, POS, and payment gateway integrations*

---

## Sign-Off

**Configuration Plan Approval**:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| VP Digital Operations | Sarah Mitchell | _______________ | _______ |
| COO | David Martinez | _______________ | _______ |
| E-Commerce Manager | [Name TBD] | _______________ | _______ |
| Store Operations Manager | [Name TBD] | _______________ | _______ |

---

**Document Version History**:
- v1.0 - 2026-01-28 - Initial O2C configuration plan created
