# NetSuite Configuration Plan: Record to Report - Financials
## SunStyle Retail Corporation

**Process Area**: Record to Report (R2R) - Financial Management
**Customer**: SunStyle Retail Corporation
**Prepared By**: Functional Configuration Agent
**Date**: 2026-01-28
**Version**: 1.0

---

## Executive Summary

This configuration plan outlines the NetSuite implementation for SunStyle Retail's Record to Report (R2R) process, covering general ledger, accounts receivable, accounts payable, financial reporting, and period close procedures. The configuration supports a $45M retail organization with 25 store locations, e-commerce operations, and complex revenue recognition requirements.

### Key Objectives
- Accurate financial recording and reporting
- Multi-location financial consolidation
- Automated revenue recognition across channels
- Real-time financial visibility
- Compliance with GAAP and retail accounting standards
- Support for audit and tax requirements

---

## Phase 1: Company and Subsidiary Structure

### 1.1 Company Information Setup
**Tool**: Company Information (Setup > Company > Company Information)

**Configuration Tasks**:
1. Configure primary company information
   - Legal Name: SunStyle Retail Corporation
   - Tax ID: 98-7654321
   - Registration Number: SS-2015-8472-USA
   - Primary Address: San Diego, California, USA
   - Fiscal Year Start: January 1
   - Base Currency: USD

2. Set accounting preferences
   - Accounting Book: Primary Books (GAAP)
   - Accounting Method: Accrual
   - Revenue Recognition: Point of Sale for retail, upon shipment for e-commerce
   - Inventory Costing: Average Cost

3. Configure fiscal calendar
   - Fiscal Year: January-December
   - Periods: 12 monthly periods
   - Period naming: Jan 2026, Feb 2026, etc.

**Data Required**:
- Business registration documents
- Tax identification numbers
- Banking information for ACH/EFT

---

### 1.2 Subsidiary Structure
**Tool**: Subsidiaries (Setup > Company > Subsidiaries)

**Configuration Tasks**:
1. Create parent company subsidiary
   - Name: SunStyle Retail Corporation
   - Legal Name: SunStyle Retail Corporation
   - Country: United States
   - Currency: USD
   - Fiscal Calendar: Standard US Calendar

2. Create functional subsidiaries (if needed for reporting)
   - Retail Stores Division
   - E-Commerce Division
   - Distribution Center Operations

**Rationale**: SunStyle operates as a single legal entity but may benefit from subsidiary-level reporting for operational segments (retail vs e-commerce performance analysis).

**Decision Point**: Confirm with finance team if subsidiary structure is needed for segment reporting or if department/location classification is sufficient.

---

## Phase 2: Chart of Accounts Configuration

### 2.1 Account Structure Design

**Tool**: Accounts (Lists > Accounting > Accounts)

**Account Number Structure**: `XXXX-YYYY`
- XXXX = Account number (4 digits)
- YYYY = Sub-account (4 digits, optional)

**Account Categories**:

#### ASSETS (1000-1999)

**Current Assets (1000-1299)**
- 1000 - Petty Cash
- 1010 - Cash - Operating Account
- 1020 - Cash - Payroll Account
- 1050 - Merchant Services Clearing (Stripe)
- 1060 - PayPal Account
- 1100 - Accounts Receivable
- 1105 - Allowance for Doubtful Accounts
- 1200 - Inventory - Raw Materials (if applicable)
- 1210 - Inventory - Finished Goods
- 1220 - Inventory - In Transit
- 1230 - Inventory Reserve
- 1300 - Prepaid Expenses
- 1310 - Prepaid Insurance
- 1320 - Prepaid Rent
- 1350 - Deposits - Store Leases
- 1400 - Other Current Assets

**Fixed Assets (1500-1699)**
- 1500 - Leasehold Improvements
- 1510 - Accumulated Depreciation - Leasehold
- 1520 - Furniture & Fixtures
- 1530 - Accumulated Depreciation - F&F
- 1540 - Store Equipment & Displays
- 1550 - Accumulated Depreciation - Equipment
- 1560 - Computer Equipment & Software
- 1570 - Accumulated Depreciation - Computer
- 1600 - Construction in Progress

**Other Assets (1700-1999)**
- 1700 - Intangible Assets (Software licenses)
- 1710 - Accumulated Amortization
- 1800 - Long-term Deposits

#### LIABILITIES (2000-2999)

**Current Liabilities (2000-2299)**
- 2000 - Accounts Payable
- 2100 - Accrued Expenses
- 2110 - Accrued Payroll
- 2120 - Accrued Payroll Taxes
- 2130 - Accrued Sales Tax Payable
- 2140 - Accrued Rent
- 2150 - Customer Deposits & Gift Cards
- 2160 - Store Credit Liability
- 2170 - Loyalty Points Liability
- 2200 - Credit Card Payables (vendor cards)
- 2250 - Other Current Liabilities

**Long-term Liabilities (2300-2999)**
- 2300 - Notes Payable - Long Term
- 2400 - Deferred Rent
- 2500 - Other Long-term Liabilities

#### EQUITY (3000-3999)
- 3000 - Common Stock
- 3100 - Additional Paid-In Capital
- 3200 - Retained Earnings
- 3300 - Current Year Earnings (auto-created by NetSuite)
- 3400 - Dividends/Distributions

#### REVENUE (4000-4999)

**Product Sales (4000-4499)**
- 4000 - Sales - Premium Sunglasses
- 4010 - Sales - Sport Performance Eyewear
- 4020 - Sales - Prescription Eyewear
- 4030 - Sales - Accessories
- 4040 - Sales - Eco-Friendly Collection
- 4100 - Sales Returns and Allowances
- 4110 - Sales Discounts
- 4120 - Promotional Discounts

**Service Revenue (4500-4699)**
- 4500 - Fitting & Consultation Services
- 4510 - Prescription Services
- 4520 - Lens Customization
- 4530 - Repair Services

**Other Revenue (4700-4999)**
- 4700 - Extended Warranty Revenue
- 4710 - Shipping & Handling Income
- 4800 - Loyalty Point Breakage Revenue
- 4900 - Miscellaneous Income

#### COST OF GOODS SOLD (5000-5999)
- 5000 - COGS - Premium Sunglasses
- 5010 - COGS - Sport Performance Eyewear
- 5020 - COGS - Prescription Eyewear
- 5030 - COGS - Accessories
- 5040 - COGS - Eco-Friendly Collection
- 5100 - Freight In
- 5200 - Inventory Adjustments
- 5210 - Inventory Shrinkage
- 5300 - Product Warranty Costs
- 5400 - COGS - Services

#### OPERATING EXPENSES (6000-7999)

**Personnel Costs (6000-6499)**
- 6000 - Salaries & Wages - Store Staff
- 6010 - Salaries & Wages - Corporate Staff
- 6020 - Salaries & Wages - Distribution Center
- 6100 - Payroll Taxes - Employer
- 6200 - Employee Benefits - Health Insurance
- 6210 - Employee Benefits - Retirement Plan
- 6220 - Employee Benefits - Other
- 6300 - Sales Commissions
- 6400 - Employee Training & Development
- 6450 - Recruitment Costs

**Store Operating Expenses (6500-6999)**
- 6500 - Rent - Store Locations
- 6510 - Rent - Corporate Office
- 6520 - Rent - Distribution Center
- 6600 - Utilities - Stores
- 6610 - Utilities - Corporate
- 6620 - Utilities - Distribution Center
- 6700 - Store Maintenance & Repairs
- 6710 - Store Supplies
- 6720 - Cleaning Services
- 6800 - Security Services
- 6900 - Store Equipment Rental

**Marketing & Advertising (7000-7299)**
- 7000 - Digital Marketing - Google Ads
- 7010 - Digital Marketing - Social Media
- 7020 - Influencer Partnerships
- 7100 - Traditional Advertising
- 7200 - Events & Sponsorships
- 7250 - Marketing Materials & Collateral

**Technology & Systems (7300-7499)**
- 7300 - Software Licenses - ERP
- 7310 - Software Licenses - E-Commerce
- 7320 - Software Licenses - Other
- 7400 - Cloud Infrastructure (AWS, Google Cloud)
- 7410 - IT Support & Maintenance
- 7420 - Telecommunications
- 7430 - Website Hosting

**Distribution & Fulfillment (7500-7699)**
- 7500 - Shipping & Freight - Outbound
- 7510 - Packaging Materials
- 7520 - Warehouse Supplies
- 7600 - 3PL Services (if applicable)

**General & Administrative (7700-7999)**
- 7700 - Insurance - General Liability
- 7710 - Insurance - Property
- 7720 - Insurance - Workers Comp
- 7730 - Insurance - Directors & Officers
- 7800 - Professional Fees - Accounting
- 7810 - Professional Fees - Legal
- 7820 - Professional Fees - Consulting
- 7900 - Bank Fees & Charges
- 7910 - Merchant Processing Fees
- 7920 - Office Supplies
- 7930 - Postage & Shipping
- 7940 - Subscriptions & Dues
- 7950 - Travel & Entertainment
- 7960 - Meals & Entertainment
- 7970 - Depreciation Expense
- 7980 - Amortization Expense
- 7990 - Miscellaneous Expenses

#### OTHER INCOME/EXPENSE (8000-9999)
- 8000 - Interest Income
- 8100 - Other Income
- 9000 - Interest Expense
- 9100 - Other Expenses
- 9200 - Foreign Exchange Gain/Loss

**Configuration Steps**:
1. Create accounts in NetSuite following structure above
2. Map accounts to appropriate account types in NetSuite
3. Configure account restrictions (require department, location, class)
4. Set default accounts for automated transactions
5. Configure currency settings for each account
6. Enable/disable account based on operational needs

---

## Phase 3: Subsidiary Classifications

### 3.1 Department Setup
**Tool**: Departments (Lists > Accounting > Departments)

**Departments**:
1. **Executive Management** - Corporate leadership
2. **Finance & Accounting** - Finance team
3. **Retail Operations** - Store management and operations
4. **E-Commerce** - Online sales operations
5. **Distribution Center** - Warehouse and fulfillment
6. **Marketing** - Marketing and advertising
7. **Customer Service** - Support team
8. **IT & Technology** - Technology operations
9. **Human Resources** - HR and recruitment

**Configuration**: Enable department on all transactions, make required for expenses

---

### 3.2 Location (Store) Setup
**Tool**: Locations (Lists > Accounting > Locations)

**Locations**:
1. **Corporate Headquarters** (San Diego, CA)
2. **Distribution Center** (Location TBD)
3. **Store 001** - [Mall/Location Name, City, State]
4. **Store 002** - [Mall/Location Name, City, State]
   - ...Continue for all 25 retail locations
5. **E-Commerce Channel** (virtual location)

**Location Configuration**:
- Enable "Make Inventory Available"
- Set location address
- Configure tax nexus by location
- Enable location for picking/packing/shipping
- Set location type (Store, Warehouse, Corporate)

**Data Required**: Complete list of 25 store locations with addresses

---

### 3.3 Class Setup (Optional - for Channel Segmentation)
**Tool**: Classes (Lists > Accounting > Classes)

**Classes** (if using classes for channel segmentation):
1. **Retail Stores** - In-store sales
2. **E-Commerce Web** - Website sales
3. **E-Commerce Mobile** - Mobile app sales
4. **Phone Orders** - Customer service phone orders
5. **Wholesale** (if applicable in future)

**Configuration**: Make class optional or required based on reporting needs

**Decision Point**: Discuss with finance team whether to use classes for channel reporting or rely on transaction metadata

---

## Phase 4: Customer Configuration

### 4.1 Customer Record Templates
**Tool**: Customers (Lists > Relationships > Customers)

**Customer Type**: Individual consumers (B2C)

**Configuration**:
1. Enable customer center for self-service
2. Configure required fields:
   - Customer Name
   - Email (unique identifier)
   - Phone
   - Default Billing Address
   - Default Shipping Address
3. Set payment terms: Due on Receipt (immediate payment)
4. Configure customer categories:
   - Retail Store Customer
   - E-Commerce Customer
   - Loyalty Member (Gold, Silver, Platinum)
5. Enable custom fields:
   - Loyalty Member ID
   - Loyalty Points Balance
   - Loyalty Tier
   - Customer Since Date
   - Preferred Store Location
   - Face Shape Profile
   - Communication Preferences

**Integration Point**: Customer records will be created/updated from e-commerce platform and POS system

---

### 4.2 Customer Deposit Configuration
**Tool**: Customer Deposits (Setup > Accounting > Accounting Preferences)

**Configuration**:
- Enable customer deposits for special orders
- Configure default deposit account: 2150 - Customer Deposits & Gift Cards
- Set deposit application method: Apply to invoices automatically

---

## Phase 5: Vendor Configuration

### 5.1 Vendor Categories
**Tool**: Vendors (Lists > Relationships > Vendors)

**Vendor Categories**:
1. **Product Suppliers** - Luxottica (Ray-Ban, Oakley), Maui Jim, Costa Del Mar, Smith Optics
2. **Service Providers** - Optometry networks, shipping carriers
3. **Technology Vendors** - Software licenses, cloud services
4. **Marketing Vendors** - Ad platforms, agencies
5. **Facilities** - Landlords, utilities, maintenance
6. **Professional Services** - Legal, accounting, consulting

**Standard Vendor Configuration**:
1. Vendor name and legal information
2. Tax ID (W-9 collection for 1099 reporting)
3. Payment terms (typically Net 30 or Net 45)
4. Default expense/COGS account
5. Currency (USD primary)
6. Payment method (Check, ACH, Credit Card)
7. 1099 eligible flag
8. PO required flag

**Key Vendor Payment Terms**:
- Product Suppliers: Varies by vendor (Net 30 - Net 60)
- Rent/Facilities: Due on 1st of month
- Technology/SaaS: Typically automatic credit card
- Marketing: Net 30
- Utilities: Due on receipt

**Data Required**: Vendor list with contact information, tax IDs, and payment terms

---

### 5.2 Vendor Bill Configuration
**Tool**: Vendor Bills (Transactions > Payables > Enter Bills)

**Configuration**:
1. Enable bill approval workflow
   - Bills < $5,000: Auto-approved
   - Bills $5,000-$25,000: Manager approval
   - Bills > $25,000: VP/CFO approval
2. Configure 3-way match for inventory purchases:
   - Purchase Order
   - Receipt
   - Vendor Bill
3. Enable early payment discounts tracking
4. Configure default accounts by expense type

---

## Phase 6: Item Master Configuration

### 6.1 Item Types

**Tool**: Items (Lists > Accounting > Items)

**Item Types Used**:
1. **Inventory Items** - Physical products (sunglasses, accessories)
2. **Service Items** - Consultation, fitting, repair services
3. **Non-Inventory Items** - Shipping charges, misc. fees
4. **Kit Items** - Bundled products (if applicable)
5. **Group Items** - Virtual groupings for promotions

**Configuration Fields**:
- Item Name/Number (SKU)
- Display Name
- Description
- Cost (average cost)
- Price (MSRP)
- Income Account (by product category)
- COGS Account (by product category)
- Asset Account: 1210 - Inventory - Finished Goods
- Department (optional)
- Class (optional)
- Vendor (primary supplier)
- UPC/Barcode
- Manufacturer Name
- Category/Subcategory
- Custom Fields:
  - Brand (Ray-Ban, Oakley, etc.)
  - Collection (Premium, Sport, Eco-Friendly)
  - Frame Material
  - Lens Type
  - Gender
  - Style Category

---

### 6.2 Inventory Valuation
**Tool**: Accounting Preferences (Setup > Accounting > Accounting Preferences > Items/Transactions)

**Configuration**:
- Costing Method: Average Cost
- Inventory Valuation: Perpetual
- Enable Multiple Locations: Yes
- Enable Lot/Serial Number Tracking: Yes (for high-value items)
- Inter-location Transfer Approval: Required

---

### 6.3 Item Pricing

**Tool**: Item Pricing (Items > Item Record > Pricing Tab)

**Pricing Tiers**:
1. **Base Price** - MSRP
2. **Retail Price** - Standard selling price
3. **Employee Price** - Staff discount price
4. **Promotional Price** - Sale/promotional price

**Configuration**:
- Enable advanced pricing
- Configure customer price levels
- Set up promotional pricing calendar
- Enable volume pricing (if applicable)

---

## Phase 7: Revenue Recognition

### 7.1 Revenue Recognition Rules

**Tool**: Revenue Recognition (Setup > Accounting > Revenue Recognition)

**Revenue Recognition Rules**:

1. **Retail Store Sales** - Point of Sale
   - Recognition Event: Sales Order fulfillment (immediate)
   - Method: Recognize 100% upon sale
   - Account: Revenue accounts by product category

2. **E-Commerce Sales** - Upon Shipment
   - Recognition Event: Item Fulfillment (shipment)
   - Method: Recognize 100% upon shipment
   - Account: Revenue accounts by product category

3. **Extended Warranty Sales** - Deferred over warranty period
   - Recognition Event: Time-based (monthly)
   - Method: Straight-line over warranty period (typically 24 months)
   - Deferred Revenue Account: 2500 - Deferred Revenue - Warranties
   - Revenue Account: 4700 - Extended Warranty Revenue

4. **Gift Card Sales** - Upon redemption
   - Recognition Event: Gift card redemption
   - Liability Account: 2150 - Customer Deposits & Gift Cards
   - Revenue Account: Varies by product purchased

5. **Store Credit** - Upon redemption
   - Recognition Event: Store credit redemption
   - Liability Account: 2160 - Store Credit Liability
   - Revenue Account: Varies by product purchased

6. **Loyalty Points** - Deferred method with breakage
   - Recognition Event: Points redemption or expiration
   - Deferred Liability Account: 2170 - Loyalty Points Liability
   - Revenue Account: Product revenue accounts (upon redemption)
   - Breakage Revenue Account: 4800 - Loyalty Point Breakage Revenue
   - Breakage Recognition: After 24 months (expiration)

**Configuration Steps**:
1. Create revenue recognition templates
2. Assign templates to item records
3. Configure automatic revenue recognition schedule
4. Set up deferred revenue amortization rules
5. Configure breakage estimation for loyalty points (estimated 15% breakage rate based on industry standards)

---

### 7.2 Sales Tax Configuration

**Tool**: Tax Setup (Setup > Accounting > Set Up Taxes)

**Configuration**:
1. Enable automated tax calculation (integrate with tax service like Avalara or use NetSuite Tax Engine)
2. Configure tax nexus by location (25 store locations + e-commerce nexus)
3. Map tax codes to product categories:
   - Physical goods: Taxable in most states
   - Services: Varies by state
   - Shipping: Varies by state
4. Configure tax liability account: 2130 - Accrued Sales Tax Payable
5. Set up tax reporting schedules by jurisdiction
6. Enable exemption certificate management

**Decision Point**: Confirm tax service provider (Avalara, TaxJar, or NetSuite native)

---

## Phase 8: Payment Processing

### 8.1 Payment Methods

**Tool**: Payment Methods (Setup > Accounting > Payment Methods)

**Payment Methods to Configure**:
1. **Cash** - For in-store transactions
2. **Credit Card - Visa**
3. **Credit Card - Mastercard**
4. **Credit Card - American Express**
5. **Credit Card - Discover**
6. **Debit Card**
7. **Mobile Payment** - Apple Pay, Google Pay
8. **PayPal**
9. **Afterpay** - Buy Now Pay Later
10. **Gift Card** - SunStyle gift cards
11. **Store Credit**
12. **Loyalty Points Redemption**

**Configuration**:
- Set clearing accounts for each method
- Configure merchant fee expense accounts
- Enable payment method availability by sales channel
- Set payment authorization requirements

---

### 8.2 Bank Account Configuration

**Tool**: Bank Accounts (Lists > Accounting > Accounts)

**Bank Accounts**:
1. **Operating Account** - Primary checking
   - Account: 1010 - Cash - Operating Account
   - Enable bank feeds
   - Configure automatic reconciliation rules

2. **Payroll Account** - Payroll disbursements
   - Account: 1020 - Cash - Payroll Account
   - Enable bank feeds

3. **Merchant Services Clearing** - Stripe deposits
   - Account: 1050 - Merchant Services Clearing
   - Enable bank feeds
   - Configure deposit matching rules

4. **PayPal Account**
   - Account: 1060 - PayPal Account
   - Enable integration for automatic transaction import

**Configuration Steps**:
1. Set up bank feeds for each account
2. Create bank reconciliation rules for common transactions
3. Configure automatic matching rules
4. Set up alerts for unmatched transactions

---

## Phase 9: Financial Reporting

### 9.1 Standard Financial Reports

**Tool**: Financial Reports (Reports > Financial)

**Core Financial Statements**:
1. **Balance Sheet**
   - Configure by subsidiary (if using subsidiaries)
   - Enable department/location/class columns
   - Set up comparative periods (current vs prior year)

2. **Income Statement (P&L)**
   - Configure by department and location
   - Enable channel reporting (if using classes)
   - Set up budget vs actual reporting
   - Configure store-level P&L reports

3. **Statement of Cash Flows**
   - Configure cash flow categories
   - Map accounts to cash flow classifications

4. **Trial Balance**
   - Enable drill-down to transaction detail
   - Configure period comparison

**Operational Reports**:
1. **Sales by Location Report** - Daily sales performance by store
2. **Sales by Product Category** - Product mix analysis
3. **Sales by Channel** - Retail vs E-Commerce vs Mobile
4. **Gross Margin Report** - By product, location, channel
5. **Commission Report** - Sales associate commission tracking
6. **Inventory Valuation Report** - By location
7. **Aged Receivables** - Customer account balances (if applicable)
8. **Aged Payables** - Vendor payment aging
9. **Sales Tax Liability Report** - By jurisdiction

**Custom Reports**:
1. **Store P&L Report** - Individual store profitability
   - Revenue by store location
   - Direct store costs (rent, payroll, utilities)
   - Allocated corporate overhead
   - Store-level net income

2. **Channel Performance Report**
   - Revenue by channel (Retail, Web, Mobile)
   - COGS by channel
   - Gross margin by channel
   - Customer acquisition cost by channel

3. **Loyalty Program Financial Report**
   - Points issued (liability incurred)
   - Points redeemed (liability released)
   - Points expired (breakage revenue)
   - Outstanding liability balance

---

### 9.2 Saved Searches for Custom Reporting

**Tool**: Saved Searches (Lists > Search > Saved Searches)

**Key Saved Searches**:
1. **Daily Sales Flash Report**
   - Sales by location for current day
   - Comparison to prior year same day
   - Transaction count

2. **Return Rate Analysis**
   - Returns by product category
   - Return reasons
   - Return rate percentage

3. **Gift Card Liability Aging**
   - Outstanding gift card balance
   - Aging by issue date
   - Breakage projection

4. **Vendor Spend Analysis**
   - Spend by vendor
   - Payment terms compliance
   - Early payment discount capture rate

5. **Sales Commission Detail**
   - Commission by sales associate
   - Commission percentage
   - Store location

**Configuration**: Create saved searches with appropriate filters, columns, and summary types

---

### 9.3 Dashboard Configuration

**Tool**: Dashboards (Setup > Customization > Dashboards)

**Executive Financial Dashboard**:
- Revenue (current vs budget vs prior year)
- Gross margin percentage
- Operating expenses as % of revenue
- Net income
- Cash balance
- Accounts payable aging
- Inventory value
- Key financial ratios

**Store Operations Dashboard**:
- Sales by location (top/bottom performers)
- Transactions by location
- Average transaction value
- Sales per square foot
- Store labor as % of sales

**E-Commerce Dashboard**:
- Online revenue (daily trend)
- Conversion rate
- Average order value
- Shipping costs as % of sales
- Return rate

---

## Phase 10: Period Close Process

### 10.1 Month-End Close Checklist

**Tool**: Period Close Checklist (Custom record or SuiteApp)

**Month-End Close Tasks**:

**Day 1-3 (Close Period)**
1. ☐ Complete all revenue transactions for the period
2. ☐ Complete all purchase orders and receipts
3. ☐ Enter all vendor bills received
4. ☐ Process all credit card transactions
5. ☐ Complete all bank deposits
6. ☐ Process all customer payments
7. ☐ Lock period for transaction entry

**Day 4-6 (Reconciliations)**
8. ☐ Reconcile all bank accounts
9. ☐ Reconcile merchant processing accounts (Stripe, PayPal)
10. ☐ Reconcile inventory across all locations
11. ☐ Review and adjust inventory reserves
12. ☐ Reconcile gift card and store credit liability
13. ☐ Reconcile loyalty points liability
14. ☐ Reconcile sales tax collected vs liability

**Day 7-9 (Accruals & Adjustments)**
15. ☐ Record accrued expenses (rent, utilities, etc.)
16. ☐ Record prepaid expense amortization
17. ☐ Record depreciation expense
18. ☐ Process revenue recognition schedules (warranties, gift cards)
19. ☐ Record loyalty point breakage revenue (if applicable)
20. ☐ Record inventory adjustments from cycle counts
21. ☐ Record inter-location transfer adjustments

**Day 10-12 (Review & Reporting)**
22. ☐ Review trial balance for unusual balances
23. ☐ Review balance sheet accounts for accuracy
24. ☐ Review P&L for anomalies
25. ☐ Analyze revenue by channel and location
26. ☐ Analyze gross margin by product category
27. ☐ Review and explain significant variances to budget
28. ☐ Generate and distribute financial statements
29. ☐ Close accounting period in NetSuite
30. ☐ Open next period

---

### 10.2 Period Close Automation

**Tool**: SuiteFlow (Workflow) and Scheduled Scripts

**Automated Period Close Tasks**:
1. **Automatic Journal Entries**:
   - Recurring rent expense allocation
   - Depreciation expense (if not using fixed asset module)
   - Prepaid expense amortization
   - Revenue recognition for deferred revenue
   - Loyalty point expense accrual

2. **Automatic Alerts**:
   - Undeposited funds alert (amounts sitting in clearing)
   - Unmatched bank transactions
   - Unapproved vendor bills
   - Open purchase orders past due date

3. **Automatic Reports**:
   - Month-end close status report
   - Transaction volume by day report (to identify post-period entries)
   - Variance analysis report (budget vs actual)

---

## Phase 11: Budgeting & Forecasting

### 11.1 Budget Configuration

**Tool**: Budgets (Setup > Accounting > Budgets)

**Budget Structure**:
1. **Annual Operating Budget** - By department and location
2. **Capital Expenditure Budget** - For fixed asset purchases
3. **Marketing Budget** - By campaign and channel

**Budget Entry Method**:
- Top-down by account and department/location
- Bottom-up from store managers (store operating budgets)
- Integrate with strategic plan

**Budget Configuration**:
1. Create budget categories (accounts)
2. Set up budget entry templates
3. Enable budget vs actual reporting
4. Configure variance thresholds for alerts
5. Enable budget reforecasting (quarterly)

**Data Required**:
- Annual budget: $2.5M for technology initiatives
- Revenue target: 20% YoY growth
- Target margins by product category

---

## Phase 12: Compliance & Controls

### 12.1 Audit Trail Configuration

**Tool**: Audit Trail (Setup > Company > Enable Features > Accounting)

**Enable Audit Trail Features**:
- Transaction audit trail (track all changes)
- Field-level audit history
- Login audit trail
- Role change history

**Configuration**:
1. Enable audit trail for all transactions
2. Configure audit reports
3. Set up alerts for high-risk changes
4. Define retention period for audit data (7 years recommended)

---

### 12.2 User Roles and Permissions

**Tool**: Roles (Setup > Users/Roles > Manage Roles)

**Financial User Roles**:

1. **Accountant Role**
   - View all financial transactions
   - Enter journal entries
   - Run financial reports
   - Cannot delete posted transactions
   - Cannot close periods

2. **Accounts Payable Clerk**
   - Enter vendor bills
   - Process vendor payments
   - View vendor records
   - Cannot approve large payments

3. **Accounts Receivable Clerk** (if needed)
   - Enter customer payments
   - Process customer deposits
   - View customer records

4. **Financial Analyst**
   - View-only access to financials
   - Run reports and saved searches
   - Export data for analysis
   - No transaction entry

5. **Controller/CFO Role**
   - Full access to financials
   - Approve journal entries
   - Close accounting periods
   - Override transaction restrictions
   - Access to all reports

6. **Store Manager Role**
   - View store-specific financial reports
   - No access to company-wide financials
   - Cannot enter journal entries

**Configuration**: Create roles with appropriate permissions, test access, and assign to users

---

### 12.3 Approval Workflows

**Tool**: SuiteFlow (Setup > Customization > Workflow)

**Workflows to Configure**:

1. **Vendor Bill Approval Workflow**
   - < $5,000: Auto-approved
   - $5,000-$25,000: Department manager approval
   - > $25,000: VP/CFO approval
   - All POs: 3-way match required

2. **Journal Entry Approval Workflow**
   - All manual JEs: Controller approval
   - System-generated JEs: No approval required
   - Adjustments > $10,000: CFO approval

3. **Expense Report Approval Workflow**
   - < $500: Manager approval
   - $500-$2,000: VP approval
   - > $2,000: CFO approval

4. **Purchase Order Approval Workflow**
   - < $5,000: Auto-approved (if within budget)
   - $5,000-$25,000: Manager approval
   - > $25,000: VP approval

---

### 12.4 Segregation of Duties

**Key Segregation Requirements**:
1. Transaction entry vs. approval (different users)
2. Bank reconciliation vs. transaction entry (different users)
3. Customer payment entry vs. customer master changes (different users)
4. Vendor payment entry vs. vendor master changes (different users)
5. Inventory adjustments vs. inventory reconciliation (different users)

**Configuration**: Implement through role-based permissions and workflow approvals

---

## Phase 13: Integration Requirements

### 13.1 E-Commerce Platform Integration

**Integration**: E-Commerce Platform ↔ NetSuite

**Data Flow**:
1. **Orders**: E-commerce → NetSuite (Sales Orders)
2. **Customers**: E-commerce → NetSuite (Customer Records)
3. **Inventory**: NetSuite → E-commerce (Available Qty)
4. **Fulfillment**: NetSuite → E-commerce (Tracking Info)

**Integration Method**: RESTlet or SuiteTalk API

**Frequency**: Real-time or near-real-time (every 5-15 minutes)

---

### 13.2 POS System Integration

**Integration**: POS System ↔ NetSuite

**Data Flow**:
1. **Sales Transactions**: POS → NetSuite (Cash Sales)
2. **Inventory**: NetSuite ↔ POS (Sync)
3. **Customers**: POS ↔ NetSuite (Sync)
4. **Products**: NetSuite → POS (Item Master)

**Integration Method**: CSV import/export or API

**Frequency**:
- Sales: End of day batch
- Inventory: Real-time or hourly

---

### 13.3 Payment Gateway Integration

**Integration**: Stripe/PayPal ↔ NetSuite

**Data Flow**:
1. **Payment Authorization**: Real-time at checkout
2. **Payment Capture**: Automated with fulfillment
3. **Settlement/Payout**: Daily batch to bank account
4. **Fee Recording**: Automatic expense posting

**Integration Method**: Native Stripe/PayPal integration or custom

**Reconciliation**: Automatic matching of payouts to sales orders

---

### 13.4 Bank Feed Integration

**Integration**: Banks ↔ NetSuite

**Data Flow**:
- Daily download of bank transactions
- Automatic matching to NetSuite transactions
- Exception handling for unmatched items

**Configuration**: Set up bank feeds for all accounts, create matching rules

---

## Phase 14: Training & Documentation

### 14.1 Training Plan

**User Training by Role**:

1. **Finance Team** (2-day training)
   - NetSuite navigation
   - Transaction entry (JEs, bills, payments)
   - Bank reconciliation
   - Financial reporting
   - Month-end close process
   - Budget management

2. **Accounts Payable** (1-day training)
   - Vendor bill entry
   - 3-way matching
   - Payment processing
   - Vendor management

3. **Store Managers** (0.5-day training)
   - Store-level financial reports
   - Sales reporting
   - Inventory inquiries

4. **Executives** (0.5-day training)
   - Dashboard usage
   - Key financial reports
   - Budget vs actual analysis

---

### 14.2 Documentation Requirements

**Process Documentation**:
1. Chart of Accounts guide with account usage
2. Month-end close checklist with detailed steps
3. Bank reconciliation procedures
4. Vendor payment processing guide
5. Journal entry procedures and approval matrix
6. Financial reporting guide
7. Budget management procedures

**System Documentation**:
1. User role definitions and permissions
2. Workflow approval matrices
3. Integration data flow diagrams
4. Custom field definitions
5. Saved search documentation

---

## Phase 15: Go-Live Planning

### 15.1 Go-Live Checklist

**Pre-Go-Live (30 days before)**:
1. ☐ Complete all configuration tasks
2. ☐ Load chart of accounts
3. ☐ Load customer master data (from legacy/e-commerce)
4. ☐ Load vendor master data
5. ☐ Load item master data
6. ☐ Load opening balances (balance sheet accounts)
7. ☐ Configure integrations (test connectivity)
8. ☐ Create user accounts and assign roles
9. ☐ Complete user training
10. ☐ Test all workflows and approvals
11. ☐ Test financial reports
12. ☐ Perform UAT (User Acceptance Testing)
13. ☐ Document all configurations

**Go-Live Week**:
14. ☐ Perform final data load
15. ☐ Reconcile opening balances to legacy system
16. ☐ Activate integrations
17. ☐ Monitor transactions closely
18. ☐ Provide hypercare support to users
19. ☐ Address issues immediately
20. ☐ Perform daily reconciliation to legacy (parallel run if applicable)

**Post-Go-Live (30 days after)**:
21. ☐ Complete first month-end close in NetSuite
22. ☐ Reconcile financials to legacy system (if parallel)
23. ☐ Optimize workflows based on user feedback
24. ☐ Refine reports and dashboards
25. ☐ Conduct lessons learned session

---

### 15.2 Data Migration Plan

**Data to Migrate**:

1. **Chart of Accounts**
   - Export from legacy system
   - Map to NetSuite structure
   - Import via CSV

2. **Opening Balances** (as of go-live date)
   - Balance sheet accounts (assets, liabilities, equity)
   - No historical P&L detail (start fresh)
   - Import via general journal entry

3. **Customer Master Data**
   - Name, email, phone, addresses
   - Loyalty program data
   - Source: E-commerce platform and legacy CRM
   - Import via CSV

4. **Vendor Master Data**
   - Vendor name, contact info, tax ID
   - Payment terms
   - Source: Legacy system
   - Import via CSV

5. **Item Master Data**
   - SKU, description, cost, price
   - Product attributes (brand, category, etc.)
   - Source: Legacy system or e-commerce
   - Import via CSV

6. **Open Transactions** (as of go-live)
   - Open vendor bills
   - Unpaid customer deposits
   - Outstanding gift cards
   - Import individually or via CSV

**Data Migration Steps**:
1. Extract data from source systems
2. Transform data to NetSuite format
3. Validate data quality (completeness, accuracy)
4. Load data to NetSuite sandbox for testing
5. Reconcile and verify
6. Load data to production environment (go-live)
7. Perform final reconciliation

---

## Phase 16: Key Performance Indicators (KPIs)

### 16.1 Financial KPIs to Track in NetSuite

**Profitability Metrics**:
- Gross Margin %: Target 45-50%
- Operating Margin %: Target 15%
- Net Profit Margin %: Target 11%
- EBITDA Margin %
- Store-level contribution margin

**Efficiency Metrics**:
- Days Sales Outstanding (DSO): Target < 5 days (retail fast turnover)
- Days Payable Outstanding (DPO): Target 30-45 days
- Cash Conversion Cycle
- Inventory Turnover: Target > 4.5x annually
- Sales per Square Foot (by store)

**Growth Metrics**:
- Revenue Growth Rate: Target 20% YoY
- Same-Store Sales Growth
- E-Commerce Growth Rate
- Customer Lifetime Value (CLV): Target $1,500
- Customer Acquisition Cost (CAC): Target < $50

**Operational Metrics**:
- Average Transaction Value: Target $285
- Conversion Rate (by channel)
- Return Rate: Target < 5%
- Loyalty Program Participation Rate
- Commission Expense as % of Sales

**Configuration**: Create saved searches and dashboards to track these KPIs in real-time

---

## Phase 17: Ongoing Optimization

### 17.1 Continuous Improvement Plan

**Monthly Reviews**:
- Review financial close process efficiency
- Analyze report usage and relevance
- Gather user feedback on system usability
- Review integration performance

**Quarterly Reviews**:
- Evaluate KPIs against targets
- Assess budget vs actual performance
- Review and optimize workflows
- Identify automation opportunities

**Annual Reviews**:
- Comprehensive system health check
- Chart of accounts cleanup
- Role and permission audit
- Documentation updates
- Training refresher

---

## Appendices

### Appendix A: Decision Log

| Decision Point | Options | Decision | Rationale | Date |
|----------------|---------|----------|-----------|------|
| Subsidiary Structure | Single entity vs multi-subsidiary | TBD | Awaiting finance input | - |
| Class Usage | Use classes for channel segmentation | TBD | Awaiting reporting requirements | - |
| Tax Service | Avalara vs NetSuite Tax Engine | TBD | Pending evaluation | - |
| POS Integration | Real-time vs EOD batch | TBD | Pending POS vendor discussion | - |

### Appendix B: Custom Fields Required

**Customer Custom Fields**:
- Loyalty Member ID (Text)
- Loyalty Points Balance (Integer)
- Loyalty Tier (List: Silver, Gold, Platinum)
- Customer Since Date (Date)
- Preferred Store Location (List: Location)
- Face Shape Profile (Text)
- Communication Preferences (Multi-select)

**Transaction Custom Fields**:
- Sales Channel (List: Retail, Web, Mobile, Phone)
- Sales Associate (Employee)
- Commission Percentage (Decimal)
- Return Reason (List)
- Gift Message (Text)

**Item Custom Fields**:
- Brand (List: Ray-Ban, Oakley, Maui Jim, etc.)
- Collection (List: Premium, Sport, Eco-Friendly)
- Frame Material (List)
- Lens Type (List)
- Gender (List: Men, Women, Unisex)
- Style Category (List)

### Appendix C: Integration Specifications

**E-Commerce → NetSuite**:
- Sales Order creation (real-time via RESTlet)
- Customer creation/update (real-time)
- Payment capture (real-time)

**NetSuite → E-Commerce**:
- Inventory availability (every 15 minutes)
- Order fulfillment status (real-time)
- Tracking numbers (real-time)

**POS → NetSuite**:
- Cash sale transactions (end of day batch)
- Inventory adjustments (real-time or hourly)

**NetSuite → POS**:
- Item master updates (nightly)
- Pricing updates (nightly)
- Customer updates (hourly)

### Appendix D: Month-End Close Timeline

**Target Close**: 10 business days after period end

| Day | Activities |
|-----|------------|
| 1-3 | Transaction entry, period lock |
| 4-6 | Reconciliations (bank, inventory, liabilities) |
| 7-9 | Accruals, adjustments, revenue recognition |
| 10-12 | Review, reporting, period close |

---

## Sign-Off

**Configuration Plan Approval**:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CFO | Patricia Wong | _______________ | _______ |
| Controller | [Name TBD] | _______________ | _______ |
| VP Digital Operations | Sarah Mitchell | _______________ | _______ |
| Implementation Lead | [Name TBD] | _______________ | _______ |

---

**Document Version History**:
- v1.0 - 2026-01-28 - Initial configuration plan created

**Next Steps**:
1. Review plan with finance team
2. Validate assumptions and decisions
3. Gather required data (vendor list, store locations, etc.)
4. Proceed with Phase 1 configuration
