# Record to Report - Customer Questionnaire
**Customer:** SunStyle Retail
**Date:** 2026-02-02
**Purpose:** Clarify R2R requirements, resolve ambiguities, and validate configuration assumptions

---

## 1. Implementation Timeline & Cutover

### 1.1 Go-Live Planning
- [ ] What is the target go-live date for NetSuite Financials?
- [ ] Is this a new NetSuite Financials implementation or are you already live?
- [ ] What is the planned cutover date from QuickBooks to NetSuite?
- [ ] Will you run parallel systems for any period? If so, for how long?
- [ ] Which historical periods from QuickBooks need to be migrated to NetSuite?
  - [ ] Full transaction detail or summary balances?
  - [ ] How many years of history?

### 1.2 Current State
- [ ] Confirm: QuickBooks Online Advanced is currently your primary financial system of record?
- [ ] What financial processes are already happening in NetSuite Inventory Management today?
- [ ] Are COGS and inventory valuation currently posting to NetSuite or to QuickBooks?

---

## 2. Revenue Recognition & Integration

### 2.1 Revenue Posting Mechanics
- [ ] How does revenue flow from Shopify to the financial system today?
  - [ ] Real-time, daily batch, or manual journal entry?
  - [ ] Summarized by day or detailed by transaction?
  - [ ] Revenue recognized at order placement, shipment, or delivery?

- [ ] How does revenue flow from Lightspeed POS to the financial system?
  - [ ] End-of-day batch, real-time, or manual upload?
  - [ ] Consolidated by store or by register?
  - [ ] How are store deposits handled?

- [ ] How does revenue from your custom OMS flow to financials?
  - [ ] What system posts it? OMS directly or via middleware?

### 2.2 Month-End Cutoff
- [ ] For e-commerce orders: What is your cutoff rule?
  - Example: Order placed 11:59 PM on Jan 31 but shipped Feb 1 - which period's revenue?
  - [ ] Order date, ship date, or delivery date?

- [ ] For store sales: What is your cash register close time?
  - [ ] Do late-night sales post to the following day?

- [ ] How do you handle returns and exchanges across period boundaries?

### 2.3 Deferred Revenue
- [ ] Do you sell extended warranties or service plans?
  - [ ] If yes, how is deferred revenue currently calculated and amortized?
  - [ ] What system tracks the warranty obligation?

- [ ] Do you sell gift cards?
  - [ ] How is gift card liability tracked?
  - [ ] What is your breakage recognition policy?

- [ ] Do you have a loyalty points program?
  - [ ] How is the loyalty liability calculated?
  - [ ] What system is the source of truth?

---

## 3. Payment Processing & Bank Reconciliation

### 3.1 Payment Processor Settlements
- [ ] Stripe settlement timing:
  - [ ] T+2, T+3, or custom schedule?
  - [ ] How do you currently reconcile Stripe settlements to sales?
  - [ ] Do you record fees separately or net of revenue?

- [ ] PayPal settlement timing:
  - [ ] Same questions as Stripe above

- [ ] Are there other payment processors? (Square, Apple Pay, etc.)

### 3.2 Bank Reconciliation
- [ ] How many bank accounts does SunStyle operate?
- [ ] Do you use automated bank feeds in QuickBooks today?
- [ ] What is your target process for bank reconciliation in NetSuite?
  - [ ] Automated feed or manual upload?
  - [ ] Who performs the reconciliation?
  - [ ] How often? (Daily, weekly, monthly)

### 3.3 Cash Management
- [ ] Do stores deposit cash daily or weekly?
- [ ] How are store deposits tracked from register close to bank deposit?
- [ ] Are there armored car services involved?

---

## 4. Cost of Goods Sold & Inventory Valuation

### 4.1 COGS Posting
- [ ] How does COGS currently post to your financials?
  - [ ] Real-time at fulfillment?
  - [ ] End-of-day batch?
  - [ ] Manual journal entry?

- [ ] What inventory costing method do you use?
  - [ ] FIFO, Average, or other?
  - [ ] Same method for all product categories?

### 4.2 Inventory-to-GL Flow
- [ ] Since NetSuite Inventory Management is already live, does it post to NetSuite GL or to QuickBooks?
- [ ] How are inventory adjustments (shrinkage, damage) recorded?
- [ ] What is your cycle count process?
  - [ ] How often?
  - [ ] How are discrepancies investigated and approved?

### 4.3 Freight and Landed Costs
- [ ] Do you import products internationally?
- [ ] If yes, how are freight, duties, and tariffs allocated to inventory cost?
- [ ] Do you use a customs broker? Is there a system integration?

---

## 5. Expenses & Accruals

### 5.1 Expense Accruals
- [ ] Which expenses are accrued monthly?
  - [ ] Utilities?
  - [ ] Rent?
  - [ ] Marketing campaigns in progress?
  - [ ] Employee commissions?

- [ ] How are accrual amounts determined?
  - [ ] Based on prior month actuals, contracts, or vendor estimates?

- [ ] Who is responsible for calculating accruals?

### 5.2 Commission Calculation
- [ ] The Chart of Accounts includes commission expense (6-1020). How are commissions calculated?
  - [ ] Percentage of sales?
  - [ ] Tiered or flat rate?
  - [ ] Product category-specific?

- [ ] What system calculates commissions?
  - [ ] POS, NetSuite, ADP, or manual spreadsheet?

- [ ] When are commissions paid?
  - [ ] Monthly, quarterly, or other cadence?

### 5.3 Payroll Integration
- [ ] You use ADP for payroll. How do payroll journal entries flow to NetSuite?
  - [ ] Automated integration or manual journal entry?
  - [ ] Weekly, bi-weekly, or semi-monthly?

- [ ] Are payroll taxes and benefits accrued separately?

---

## 6. Dimensions & Reporting Structure

### 6.1 Class, Department, and Location
- [ ] Confirm: **Class** represents the 25 stores + warehouse + corporate HQ?
- [ ] Confirm: **Department** represents functional areas (Sales, Operations, Marketing, etc.)?
- [ ] Confirm: **Location** represents inventory locations?

- [ ] For store-level P&L reporting, which dimension is primary?
  - [ ] Class, Department, or Location?

- [ ] Are stores organized into regions for reporting?
  - [ ] If yes, how are regions mapped?

### 6.2 Expense Allocation
- [ ] How are shared corporate expenses (HR, IT, Finance) allocated to stores?
  - [ ] Headcount, revenue, square footage, or other driver?
  - [ ] Allocated monthly or quarterly?

- [ ] Are warehouse costs allocated to stores or kept separate?

---

## 7. Month-End Close Process

### 7.1 Close Timeline
- [ ] You've targeted a 5-business-day close. Have you achieved this in QuickBooks?
- [ ] If not, what is your current close timeline?
- [ ] What are the biggest bottlenecks in your current close process?

### 7.2 Reconciliations
- [ ] What accounts are reconciled monthly?
  - [ ] All balance sheet accounts?
  - [ ] Specific high-risk accounts only?

- [ ] Who performs reconciliations?
- [ ] What is your approval process?

### 7.3 Journal Entries
- [ ] What types of manual journal entries are routine monthly?
  - [ ] Accruals, reclasses, depreciation, other?

- [ ] Who can create journal entries?
- [ ] What is the approval threshold? (Configuration shows >$5,000 requires CFO approval - confirm)

### 7.4 Financial Reporting
- [ ] What reports are required on Day 5 of the close?
  - [ ] P&L by store?
  - [ ] Consolidated financials?
  - [ ] Cash flow statement?
  - [ ] Balance sheet?

- [ ] Who are the primary consumers of these reports?
  - [ ] CFO, Board, Investors, Management team?

---

## 8. Tax & Compliance

### 8.1 Sales Tax
- [ ] You have physical presence in 5+ states. Which states?
- [ ] Do you have economic nexus in additional states due to e-commerce?
- [ ] How do you currently manage sales tax in QuickBooks?
  - [ ] Manual rates or integrated service (Avalara, etc.)?

- [ ] Do you collect sales tax on shipping charges?
- [ ] Do you have any tax-exempt customers? (Wholesale, government, etc.)

### 8.2 Income Tax
- [ ] Your operating entity (SunStyle Retail USA LLC) is a disregarded entity. Who is the tax reporting entity?
- [ ] Do you have nexus in multiple states for income tax?
- [ ] Do you work with an external CPA firm for tax preparation?

### 8.3 Audit Requirements
- [ ] Are you currently audited by an external firm?
- [ ] If yes, who is your auditor and what is the audit timeline?
- [ ] You mentioned working toward SOC 2 Type II - what is the target timeline?

---

## 9. Internal Controls & Approval Workflows

### 9.1 Segregation of Duties
- [ ] Who currently has authority to:
  - [ ] Create vendor bills?
  - [ ] Approve vendor bills?
  - [ ] Process payments?
  - [ ] Post journal entries?
  - [ ] Close accounting periods?

### 9.2 Approval Limits
- [ ] What are your current approval thresholds for:
  - [ ] Purchase orders?
  - [ ] Vendor bills?
  - [ ] Expense reports?
  - [ ] Journal entries? (Configuration shows $5,000 - confirm)

### 9.3 Period Lock Controls
- [ ] Once a period is closed, who can reopen it?
- [ ] What is the process for making adjustments to closed periods?
- [ ] Do you use adjusting periods for corrections?

---

## 10. Canada Expansion (2027)

### 10.1 Subsidiary Planning
- [ ] Confirm: SunStyle Retail Canada Inc will be a separate legal entity?
- [ ] Will Canada have its own bank accounts, payroll, and tax filings?
- [ ] Will inventory be held in Canada or fulfilled from US warehouse?

### 10.2 Multi-Currency
- [ ] Besides CAD, do you transact in any other currencies today?
  - [ ] Vendors in China, Italy, or other eyewear manufacturing hubs?

- [ ] What is your desired functional currency for each subsidiary?
  - [ ] USD for parent and USA sub, CAD for Canada sub?

### 10.3 Intercompany Transactions
- [ ] Are intercompany transactions expected before Canada go-live?
- [ ] If US warehouse ships to Canadian customers, how should that be structured?
  - [ ] Direct sale or intercompany transfer?

---

## 11. Reporting & Analytics

### 11.1 Business Intelligence
- [ ] You use Looker for dashboards. What financial data is currently in Looker?
- [ ] How does data flow from QuickBooks to Google BigQuery today?
  - [ ] ETL tool, manual export, or connector?

- [ ] What is the expected data flow in the future state (NetSuite → BigQuery)?

### 11.2 Executive Reporting
- [ ] What reports does the Board require?
- [ ] What is the cadence? (Monthly, quarterly, annually)
- [ ] Are there specific KPIs tracked?
  - [ ] Revenue by channel?
  - [ ] Store comp sales?
  - [ ] Gross margin by product category?
  - [ ] Cash flow metrics?

---

## 12. People & Process

### 12.1 Finance Team Structure
- [ ] How many people are on the finance team?
- [ ] What are their roles? (Controller, Staff Accountant, AP Clerk, etc.)
- [ ] Do you have dedicated NetSuite admins or developers?

### 12.2 Training & Change Management
- [ ] Has the finance team used NetSuite before?
- [ ] What training is planned for the NetSuite Financials go-live?
- [ ] Are there documented procedures for month-end close in QuickBooks today?

---

## 13. Data Quality & Migration

### 13.1 Chart of Accounts Mapping
- [ ] Will the NetSuite Chart of Accounts match QuickBooks 1:1 or will there be changes?
- [ ] If changes, what is the mapping strategy?

### 13.2 Customer & Vendor Masters
- [ ] How many active customers in QuickBooks?
- [ ] How many active vendors?
- [ ] Will all customers/vendors migrate to NetSuite or just active ones?

### 13.3 Open Transactions
- [ ] At cutover, will you migrate:
  - [ ] Open AR invoices?
  - [ ] Open AP bills?
  - [ ] Open POs?
  - [ ] Open sales orders?

---

## 14. Assumptions to Validate

Please confirm or correct the following assumptions from the configuration plan:

- [ ] **Assumption:** QuickBooks will be fully replaced by NetSuite Financials
  **Confirm or correct:**

- [ ] **Assumption:** You will migrate 2025 closed period data from QuickBooks to NetSuite
  **Confirm or correct:**

- [ ] **Assumption:** The 5-business-day close timeline is achievable in the first month after go-live
  **Confirm or correct:**

- [ ] **Assumption:** All expenses require Department and Location coding
  **Confirm or correct:**

- [ ] **Assumption:** Material adjustments >$5,000 require CFO approval
  **Confirm or correct:**

- [ ] **Assumption:** Monthly depreciation will be automated in NetSuite
  **Confirm or correct:**

- [ ] **Assumption:** Store-level P&L is the primary performance reporting view
  **Confirm or correct:**

---

## 15. Additional Topics

- [ ] Are there any other Record to Report requirements not yet discussed?
- [ ] Are there any pain points in your current QuickBooks process that NetSuite must solve?
- [ ] Are there any custom reporting requirements beyond standard financials?

---

**Next Steps:**
1. SunStyle Retail to complete questionnaire responses
2. Implementation team to review responses and update configuration plan
3. Schedule follow-up session to resolve any gaps or conflicts
4. Update assumptions, gaps, and ambiguities documentation in `/configuration-plan/process-areas/010-Record-to-Report/_Tracking/`

---

**Document Control:**
- **Created:** 2026-02-02
- **Version:** 1.0
- **Owner:** Implementation Team
- **Customer Contact:** [To be filled in]
