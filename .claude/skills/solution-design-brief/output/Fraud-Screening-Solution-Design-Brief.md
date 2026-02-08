<!--
SOLUTION DESIGN BRIEF TEMPLATE
================================
Oracle Redwood Light Palette Reference:
- Primary: #C74634 (Redwood Red)
- Secondary: #312D2A (Dark Brown)
- Accent: #3A3631 (Warm Gray)
- Background: #FAF9F8 (Off-White)
- Surface: #FFFFFF (White)
- Text Primary: #161513 (Near Black)
- Text Secondary: #6B6560 (Medium Gray)
- Border: #D4D1CD (Light Gray)
- Success: #1E8E3E (Green)
- Warning: #F9AB00 (Amber)
- Error: #C74634 (Red)
-->

![Company Logo](/assets/logo.png)

---

# Solution Design Brief

| Field | Value |
|-------|-------|
| **Customer** | SunStyle Retail |
| **Solution** | E-Commerce Order Fraud Screening and Review System |
| **Solution Code** | EOFS-2026-001 |
| **Date** | 2026-02-04 |
| **Revision** | 1.0 |
| **Prepared By** | David Riccardi via LLM |

---

## 1. Summary

SunStyle Retail currently processes e-commerce orders with basic fraud detection rules that flag orders with a fraud score above 75 for manual review. However, the existing system lacks a comprehensive framework for managing flagged orders, configuring fraud detection rules, and tracking review outcomes. This creates operational inefficiencies and increases the risk of revenue loss from fraudulent transactions while potentially delaying legitimate customer orders.

This solution implements a configurable, rules-based fraud screening engine integrated directly into NetSuite's Order-to-Cash process. The system will automatically evaluate each incoming Sales Order against a set of customizable fraud detection rules, calculate a composite fraud risk score, and hold high-risk orders in a "Pending Fraud Review" status while reserving inventory to ensure availability for legitimate customers. A dedicated fraud review dashboard and daily saved search queue will enable Risk Management and Customer Service teams to efficiently review flagged orders and make informed approval or cancellation decisions.

The solution provides complete visibility into fraud screening outcomes through comprehensive logging, reporting, and analytics capabilities. By maintaining inventory reservations during the review period, the system balances fraud prevention with customer experience. The architecture includes future-ready configuration options for automatic order cancellation based on configurable score thresholds, allowing SunStyle to evolve their fraud prevention strategy as transaction patterns and business needs change.

This internal, NetSuite-native approach eliminates recurring per-transaction fees associated with third-party fraud detection services while providing full control over rule logic, scoring algorithms, and operational workflows.

---

## 2. Solution Goals

- Reduce fraudulent order losses by 90% through systematic risk scoring and mandatory review of high-risk transactions
- Improve fraud review efficiency by 50% through centralized dashboards and automated workflow management
- Maintain inventory availability for legitimate customers by reserving stock during fraud review periods
- Eliminate reliance on third-party fraud detection services completely, reducing operational costs by $10,000 annually
- Enable business users to configure and tune fraud detection rules without developer intervention
- Provide comprehensive fraud analytics and reporting to identify emerging fraud patterns and optimize detection rules
- Support future scaling to automatic order cancellation for extremely high-risk transactions when business is ready

---

## 3. Business Process & Industry Fit

### Customer Industry

| Industry |
|----------|
| Retail - Fashion Accessories (Sunglasses and Eyewear) |
| E-Commerce and Multi-Channel Retail |

### Applicable Business Process Areas

| Business Process Area |
|-----------------------|
| Order to Cash (O2C) |
| Risk Management and Fraud Prevention |
| Customer Service Operations |

---

## 4. Exception from Standard Functionality

This solution extends or modifies the following standard NetSuite functionality:

- **Sales Order Processing**: NetSuite's standard Sales Order workflow does not include configurable fraud screening rules, risk scoring, or automated order holds based on fraud indicators. This solution adds a fraud evaluation checkpoint before order approval.

- **Order Status Management**: Standard NetSuite does not provide a "Pending Fraud Review" status that holds orders while maintaining inventory reservations. This solution extends the order status lifecycle to support fraud review workflows.

- **Inventory Reservation**: Standard NetSuite inventory reservation logic does not account for orders held in fraud review status. Today, sales orders in any unapproved status have unreserved inventory, while orders in any approved status or pending fulfillment have reserved inventory. NetSuite does not allow creating a status between unapproved and approved or between unapproved and pending fulfillment. This solution implements a custom pattern to maintain inventory reservations for orders in "Pending Fraud Review" status while they await clearance.

- **User Notifications and Queues**: NetSuite does not provide out-of-the-box fraud review dashboards, saved searches, or notification workflows for risk management teams. This solution creates specialized interfaces and notification mechanisms.

- **Configurable Rule Engine**: NetSuite lacks a native fraud rule configuration interface that allows business users to define, weight, and tune fraud detection criteria without customization. This solution implements a user-manageable rule engine.

---

## 5. Functional Requirements

| ID | Requirement Statement | Priority | Source |
|----|----------------------|----------|--------|
| FR1 | The system shall evaluate all e-commerce Sales Orders against configurable fraud detection rules immediately after order creation | High | Business Requirements |
| FR2 | The system shall calculate a composite fraud risk score (0-100 scale) based on weighted rule criteria | High | Business Requirements |
| FR3 | The system shall automatically set Sales Orders to "Pending Fraud Review" status when the fraud score exceeds the configured threshold | High | Order Management Process |
| FR4 | The system shall reserve inventory for orders in "Pending Fraud Review" status to prevent overselling | High | Inventory Management Requirements |
| FR5 | The system shall provide a configurable fraud rule management interface accessible to Risk Management and Operations teams | High | Business Requirements |
| FR6 | The system shall support fraud rule configuration including: rule criteria, scoring weight, active/inactive toggle, and rule priority | High | Business Requirements |
| FR7 | The system shall log all fraud evaluations including: order ID, evaluation timestamp, individual rule results, composite score, and decision outcome | High | Audit and Compliance Requirements |
| FR8 | The system shall provide a fraud review dashboard displaying all orders awaiting review with key risk indicators and order details | High | User Requirements |
| FR9 | The system shall generate a daily saved search report of all pending fraud reviews, deliverable via email to the Risk Management team | Medium | Operational Requirements |
| FR10 | The system shall allow authorized users to approve orders, changing status from "Pending Fraud Review" to standard fulfillment workflow | High | Business Requirements |
| FR11 | The system shall allow authorized users to cancel orders flagged for fraud, releasing inventory and processing refunds | High | Business Requirements |
| FR12 | The system shall record reviewer identity, review timestamp, decision rationale, and outcome for all manual reviews | High | Audit and Compliance Requirements |
| FR13 | The system shall support future configuration of an automatic cancellation threshold (fraud score above which orders are auto-cancelled) | Medium | Future Requirements |
| FR14 | The system shall prevent modifications to orders in "Pending Fraud Review" status except by authorized fraud review personnel | High | Security Requirements |
| FR15 | The system shall provide reporting and analytics on fraud detection effectiveness, false positive rates, and review turnaround times | High | Management Requirements |

---

## 6. Assumptions

- SunStyle Retail's NetSuite account has Advanced Order Management or similar features enabled to support custom order statuses and workflows
- Sales Orders created through e-commerce channels are clearly identifiable (via sales channel field or similar indicator) to apply fraud screening selectively
- Current fraud score threshold of 75 (on 0-100 scale) will be migrated and refined within the new configurable rule system
- Risk Management and Customer Service teams have existing processes for reviewing suspicious orders and will adopt the new dashboard-based workflow
- Average daily volume of orders requiring fraud review is manageable within business hours (fewer than 50 orders per day flagged)
- Payment authorization has already occurred before fraud evaluation (payment holds are in place, but funds not yet captured)
- SunStyle Retail is using Stripe for online payments; Stripe is not providing any fraud signals or fraud detection capabilities, requiring NetSuite-native fraud screening
- Stripe supports authorization holds that remain valid during fraud review period (typically 7 days)
- A custom role for "Fraud Reviewer" will be created and implemented as part of this solution's technical design; users assigned this role will be responsible for order review and approval/cancellation decisions
- No integration with third-party fraud detection services (Signifyd, Kount, Riskified) is required; all fraud logic will be NetSuite-native
- Historical fraud and order data will be available to tune initial rule configurations and scoring thresholds
- Orders in fraud review will not be subject to standard "order aging" or "stale order" cleanup processes that might auto-cancel them

---

## 7. Use Cases

| ID | Requirement Trace | User Role | Use Case Description |
|----|-------------------|-----------|---------------------|
| UC1 | FR1, FR2, FR3 | System | As the NetSuite system, I want to automatically evaluate each new e-commerce Sales Order against fraud detection rules and calculate a risk score, so that high-risk orders are identified and held before fulfillment begins. |
| UC2 | FR4 | System | As the NetSuite system, I want to maintain inventory reservations for orders in "Pending Fraud Review" status, so that legitimate customers' orders are fulfilled once approved without inventory availability issues. |
| UC3 | FR5, FR6 | Risk Manager | As a Risk Manager, I want to configure fraud detection rules including criteria, weights, and thresholds through a user interface, so that I can adapt fraud prevention to emerging patterns without requiring developer support. |
| UC4 | FR8 | Fraud Reviewer | As a Fraud Reviewer, I want to view a centralized dashboard of all orders awaiting fraud review with key risk indicators (score, flags, customer history, order details), so that I can efficiently prioritize and investigate suspicious orders. |
| UC5 | FR9 | Risk Manager | As a Risk Manager, I want to receive a daily email report of all pending fraud reviews, so that I can ensure no orders are waiting excessively long and allocate review resources appropriately. |
| UC6 | FR10 | Fraud Reviewer | As a Fraud Reviewer, I want to approve an order after investigation, changing its status to continue normal fulfillment, so that legitimate customers receive their products without unnecessary delay. |
| UC7 | FR11 | Fraud Reviewer | As a Fraud Reviewer, I want to cancel an order confirmed as fraudulent, automatically releasing inventory and processing a refund, so that SunStyle avoids financial loss and chargebacks. |
| UC8 | FR7, FR12 | Compliance Officer | As a Compliance Officer, I want to review complete audit logs of fraud evaluations and manual review decisions, so that I can demonstrate due diligence and analyze fraud prevention effectiveness. |
| UC9 | FR13 | Risk Manager | As a Risk Manager, I want to configure an automatic cancellation threshold for extremely high-risk orders in the future, so that obvious fraud cases are rejected immediately without manual review overhead. |
| UC10 | FR15 | VP Operations | As the VP of Operations, I want to review fraud detection analytics including false positive rates, review turnaround times, and prevented fraud losses, so that I can measure ROI and continuously improve fraud prevention processes. |

---

## 8. Technical Design

### 8.1 Technical Design Summary

The fraud screening solution is implemented as an extension to NetSuite's standard Sales Order processing workflow using User Event scripts, custom fields, a custom record type for rule configuration, and a Suitelet-based dashboard for fraud review operations.

When an e-commerce Sales Order is created, an **afterSubmit** User Event script executes immediately, retrieving active fraud detection rules from a custom configuration record. Each rule evaluates specific order attributes (order amount, shipping vs. billing address mismatch, velocity checks, customer history, IP geolocation, payment method, etc.) and returns a score contribution based on configured weights. The script aggregates individual rule scores into a composite fraud risk score (0-100 scale) and compares it against the configured review threshold. If the threshold is exceeded, the script updates the Sales Order status to "Pending Fraud Review" and logs the complete evaluation (individual rule results, composite score, timestamp) to a custom Fraud Evaluation record linked to the Sales Order.

Inventory reservations are maintained during fraud review because NetSuite's standard inventory commitment logic respects Sales Orders in any status except Cancelled/Closed. The custom "Pending Fraud Review" status is configured as a standard Sales Order status (not a cancellation or closure status), ensuring inventory remains committed until a fraud reviewer makes an approval or cancellation decision.

The **Fraud Review Dashboard** is a custom Suitelet providing an interactive interface for fraud reviewers. The dashboard displays a real-time list of all Sales Orders in "Pending Fraud Review" status, showing fraud score, individual rule flags, customer history, order details, and time-in-queue metrics. Reviewers can select an order to view detailed information, add review notes, and execute approval or cancellation actions directly from the dashboard. Approval changes the Sales Order status to "Pending Fulfillment" (or the next standard status in SunStyle's workflow), allowing normal order processing to proceed. Cancellation updates the status to "Cancelled," triggers inventory release, processes a refund via payment gateway integration, and logs the cancellation reason.

A **Scheduled Script** runs daily at 8:00 AM to generate and email a saved search report summarizing all orders currently awaiting fraud review, including order age, score, and assigned reviewer. This ensures the Risk Management team maintains visibility and meets review SLA commitments.

The **Fraud Rule Configuration Record** is a custom record type that stores individual fraud detection rules. Each rule record defines: rule name, evaluation logic (implemented as a formula or scripted function reference), scoring weight (0-100), active/inactive status, rule priority/sequence, and optional threshold parameters. Business users with appropriate permissions can create, edit, activate, or deactivate rules through standard NetSuite record interfaces, enabling ongoing tuning without developer intervention. A library of pre-built rule templates (amount thresholds, address validation, velocity checks, etc.) is provided to accelerate initial configuration.

The solution includes comprehensive **logging and audit trails**. Each fraud evaluation creates a Fraud Evaluation Log record (custom record) capturing: Sales Order reference, evaluation timestamp, individual rule results (JSON structure), composite fraud score, decision outcome, reviewer identity (if manually reviewed), review timestamp, and decision rationale. This audit trail supports compliance requirements, fraud analytics, and continuous improvement initiatives.

Future support for **automatic cancellation** is enabled through a configuration field on the rule settings: "Auto-Cancel Threshold." When populated (e.g., 95), the User Event script will immediately cancel orders exceeding this score without manual review, sending notifications to the Risk Management team. This field is initially left blank (null), requiring all flagged orders to undergo manual review. When SunStyle is ready to implement auto-cancellation, the Risk Manager can populate this threshold value through the configuration interface.

All scripts follow NetSuite governance best practices, including try-catch error handling, governance usage monitoring, and fail-safe defaults (if fraud evaluation fails due to script error, the order is flagged for manual review rather than being automatically approved).

### 8.2 Objects

| Name | ID | Type | Description | Dependencies | Usage |
|------|-----|------|-------------|--------------|-------|
| Fraud Risk Score | custbody_ns_fraud_risk_score | Transaction Body Field | Numeric field (0-100) storing composite fraud risk score | None | Set by User Event script during order creation; displayed in fraud review dashboard and reports |
| Fraud Review Status | custbody_ns_fraud_review_status | Transaction Body Field | List field indicating fraud review disposition: Pending Review, Approved, Cancelled, Auto-Cancelled | Custom List: Fraud Review Status Values | Set by User Event script and updated by Suitelet during review actions |
| Fraud Evaluation Timestamp | custbody_ns_fraud_eval_timestamp | Transaction Body Field | Date/Time field recording when fraud evaluation occurred | None | Set by User Event script; used for review aging calculations |
| Fraud Flags | custbody_ns_fraud_flags | Transaction Body Field | Free Text field storing JSON array of triggered fraud rule identifiers | None | Set by User Event script; displayed in dashboard to show which rules flagged the order |
| Fraud Reviewer | custbody_ns_fraud_reviewer | Transaction Body Field | Employee reference field identifying who reviewed the order | Employee record | Set by Suitelet when reviewer approves/cancels order |
| Fraud Review Notes | custbody_ns_fraud_review_notes | Transaction Body Field | Long Text field for reviewer comments and decision rationale | None | Populated by Suitelet during manual review |
| Fraud Review Timestamp | custbody_ns_fraud_review_timestamp | Transaction Body Field | Date/Time field recording when manual review was completed | None | Set by Suitelet when reviewer makes decision |
| Fraud Rule Config | customrecord_ns_fraud_rule | Custom Record | Stores individual fraud detection rule definitions | None | Read by User Event script during fraud evaluation; managed by business users through record interface |
| Rule Name | custrecord_ns_fraud_rule_name | Custom Record Field | Text field: descriptive name of the fraud rule | Fraud Rule Config record | Displayed in configuration interface and evaluation logs |
| Rule Logic Reference | custrecord_ns_fraud_rule_logic | Custom Record Field | Text field: identifier for the evaluation function (e.g., "CHECK_AMOUNT_THRESHOLD", "VERIFY_ADDRESS_MATCH") | Fraud Rule Config record | Used by script to determine which evaluation function to execute |
| Rule Weight | custrecord_ns_fraud_rule_weight | Custom Record Field | Integer field (0-100): scoring weight for this rule's contribution | Fraud Rule Config record | Multiplied by rule result to calculate score contribution |
| Rule Active Status | custrecord_ns_fraud_rule_active | Custom Record Field | Checkbox: indicates if rule is currently evaluated | Fraud Rule Config record | User Event script only evaluates rules where this is checked |
| Rule Priority | custrecord_ns_fraud_rule_priority | Custom Record Field | Integer field: evaluation sequence order | Fraud Rule Config record | Determines order of rule evaluation (lower numbers first) |
| Rule Parameters | custrecord_ns_fraud_rule_params | Custom Record Field | Long Text field: JSON configuration parameters for rule (e.g., thresholds, comparison values) | Fraud Rule Config record | Parsed by evaluation function to customize rule behavior |
| Fraud Evaluation Log | customrecord_ns_fraud_eval_log | Custom Record | Audit log of each fraud evaluation performed | Sales Order record | Created by User Event script; queried for analytics and compliance reporting |
| Evaluation Sales Order | custrecord_ns_fraud_eval_order | Custom Record Field | Transaction reference to the evaluated Sales Order | Fraud Evaluation Log record | Links evaluation log to order |
| Evaluation Timestamp | custrecord_ns_fraud_eval_timestamp | Custom Record Field | Date/Time of evaluation | Fraud Evaluation Log record | Audit trail timestamp |
| Rule Results | custrecord_ns_fraud_eval_results | Custom Record Field | Long Text field: JSON structure containing individual rule results | Fraud Evaluation Log record | Detailed breakdown of each rule's evaluation and score contribution |
| Composite Score | custrecord_ns_fraud_eval_score | Custom Record Field | Decimal field: calculated composite fraud risk score | Fraud Evaluation Log record | Matches custbody_ns_fraud_risk_score on order |
| Decision Outcome | custrecord_ns_fraud_eval_outcome | Custom Record Field | List field: Approved, Cancelled, Auto-Cancelled | Fraud Evaluation Log record | Final disposition of the fraud evaluation |
| Fraud Settings | customrecord_ns_fraud_settings | Custom Record | Singleton configuration record storing global fraud system settings | None | Read by scripts to get review threshold, auto-cancel threshold, notification settings |
| Review Threshold | custrecord_ns_fraud_review_threshold | Custom Record Field | Integer field (0-100): fraud score above which orders are flagged for review | Fraud Settings record | Default: 75; configurable by Risk Manager |
| Auto-Cancel Threshold | custrecord_ns_fraud_autocancel_threshold | Custom Record Field | Integer field (0-100): fraud score above which orders are automatically cancelled (null = disabled) | Fraud Settings record | Initially null; populated when SunStyle enables auto-cancellation |
| Notification Recipients | custrecord_ns_fraud_notify_recipients | Custom Record Field | Multi-Select Employee field: users who receive daily fraud review reports | Fraud Settings record | Used by Scheduled Script for report distribution |

### 8.3 Configuration Parameters

| Parameter Name | Location | Type | Data Type | Default | Description |
|----------------|----------|------|-----------|---------|-------------|
| Review Threshold Score | Fraud Settings Record | Settings Record | Integer | 75 | Fraud score above which orders are held for review (0-100 scale) |
| Auto-Cancel Threshold | Fraud Settings Record | Settings Record | Integer | null (disabled) | Fraud score above which orders are automatically cancelled without review (null = no auto-cancel) |
| Notification Email Recipients | Fraud Settings Record | Settings Record | Multi-Select (Employee) | Risk Manager, Customer Service Manager | Employees who receive daily fraud review reports |
| Daily Report Schedule | Scheduled Script Deployment | Script Parameter | Time | 08:00 AM | Time of day to generate and send daily fraud review report |
| Inventory Hold Duration | Fraud Settings Record | Settings Record | Integer | 7 days | Maximum number of days to hold inventory for orders in fraud review before auto-releasing |
| Enable Fraud Screening | Fraud Settings Record | Settings Record | Checkbox | true | Global on/off toggle for fraud screening system |
| Fraud Review Dashboard URL | Script Deployment | Script Parameter | URL | /app/site/hosting/scriptlet.nl?script=XXX&deploy=1 | URL for fraud review dashboard Suitelet |

### 8.4 Required Features

| Feature Name | Feature ID | Required Setting | Purpose |
|--------------|------------|------------------|---------|
| Advanced Order Management | ADVANCEDORDERMANAGEMENT | Enabled | Supports custom Sales Order statuses ("Pending Fraud Review") and inventory reservation management |
| SuiteScript 2.1 | SUITECLOUD | Enabled | Executes User Event scripts for fraud evaluation and Suitelets for fraud review dashboard |
| Saved Searches | SAVEDSEARCHES | Enabled | Provides fraud review queues, reporting, and daily notification searches |
| Custom Records | CUSTOMRECORDS | Enabled | Stores fraud rule configurations, evaluation logs, and settings |
| Scheduled Scripts | SCHEDULEDSCRIPTS | Enabled | Generates and sends daily fraud review reports |
| Email Notifications | EMAILNOTIFICATIONS | Enabled | Delivers daily reports and fraud review alerts to Risk Management team |

### 8.5 Scripts

| Script Name | Script ID | Script Type | Libraries | Description | Entry Points |
|-------------|-----------|-------------|-----------|-------------|--------------|
| Fraud Evaluation Engine | customscript_ns_fraud_eval_engine | User Event | Fraud Rule Library (customscript_ns_fraud_rule_lib) | Evaluates Sales Orders against fraud detection rules, calculates risk score, and sets order status | afterSubmit (on create and edit of Sales Order) |
| Fraud Review Dashboard | customscript_ns_fraud_review_dash | Suitelet | Fraud Action Library (customscript_ns_fraud_action_lib) | Provides web-based interface for fraud reviewers to view pending orders and approve/cancel decisions | onRequest (GET for dashboard display, POST for approval/cancellation actions) |
| Daily Fraud Review Report | customscript_ns_fraud_daily_report | Scheduled Script | None | Generates and emails daily saved search report of pending fraud reviews to notification recipients | execute (scheduled daily at configured time) |
| Fraud Rule Library | customscript_ns_fraud_rule_lib | Script Library | None | Contains reusable fraud rule evaluation functions (amount checks, address validation, velocity checks, etc.) | N/A (library only) |
| Fraud Action Library | customscript_ns_fraud_action_lib | Script Library | None | Contains reusable functions for order approval, cancellation, inventory release, and refund processing | N/A (library only) |
| Fraud Analytics Client Script | customscript_ns_fraud_analytics_cs | Client Script | None | Adds real-time fraud score display and alert indicators to Sales Order edit forms | pageInit, fieldChanged (displays fraud score and flags on Sales Order form) |

### 8.6 Error Handling

- **Validation Errors**: If fraud evaluation cannot complete due to missing required order data (e.g., shipping address, payment method), the order is automatically flagged for manual review with error details logged to the Fraud Evaluation Log record. Users see a warning message on the Sales Order form indicating incomplete fraud evaluation.

- **System Errors**: If the fraud evaluation script encounters a system error (governance limit, API timeout, database error), the script logs the error to NetSuite's Execution Log with full stack trace and order context. The order is placed in "Pending Fraud Review" status (fail-safe: err on the side of caution). Email notification is sent to NetSuite administrators with error details. The daily report includes orders with evaluation errors for manual processing.

- **Data Errors**: If fraud rule configuration data is invalid (e.g., malformed JSON in rule parameters, circular dependencies), the specific rule is skipped and an error is logged. Evaluation continues with remaining valid rules. The Fraud Settings record includes a "Strict Mode" checkbox; when enabled, any rule configuration error halts the entire evaluation and flags the order for manual review.

- **Logging**: All fraud evaluations, errors, and review actions are logged to custom Fraud Evaluation Log records with detailed context (order ID, timestamp, rule results, errors, decisions). Critical errors (script failures, payment gateway errors) are also logged to NetSuite's system Execution Log and generate email alerts to administrators. Logs are retained for 2 years for compliance and analytics purposes.

- **User Notification**: Fraud reviewers are notified of orders awaiting review through: (1) Dashboard badge showing pending count, (2) Daily email report, (3) Optional real-time email/Slack notification for high-priority orders (score > 90). Customers receive a generic "Order Received - Under Review" email when their order is flagged, with estimated review completion time (24 hours). Upon approval, customers receive standard "Order Confirmed" email; upon cancellation, customers receive "Order Cancelled - Fraud Prevention" email with refund details and appeal instructions.

- **Recovery**: If an order is stuck in "Pending Fraud Review" status beyond the configured hold duration (default: 7 days), a Scheduled Script identifies these orders and either auto-approves them (if score < 85) or escalates to Risk Manager for decision. Payment authorization validity is checked before approval; if expired, the script attempts to re-authorize or flags for manual payment collection. Inventory released by cancellation is immediately available for other orders. All recovery actions are logged to audit trail with system-generated rationale.

### 8.7 Performance Considerations & Expected Volumes

The fraud evaluation engine is designed to execute within NetSuite governance limits for User Event scripts (10,000 governance units). Each fraud rule evaluation consumes approximately 50-150 governance units depending on complexity (database lookups for customer history, external API calls for address validation). The initial rule set is limited to 20 active rules to ensure evaluation completes within governance budget. Complex rules requiring extensive data analysis (e.g., multi-order velocity checks across date ranges) will use Scheduled Scripts for pre-calculation and caching rather than real-time evaluation.

The Fraud Review Dashboard Suitelet uses efficient saved search queries with appropriate filters and column selection to render quickly (target: < 2 seconds for dashboard load). Pagination is implemented for environments with > 50 pending orders. The dashboard uses RESTlet-based backend APIs to minimize page reloads during approval/cancellation actions.

Daily report generation uses saved searches optimized with indexed fields (custbody_ns_fraud_review_status, custbody_ns_fraud_eval_timestamp) to execute efficiently even with large order volumes.

| Volume Metric | Expected Value | Frequency | Notes |
|---------------|----------------|-----------|-------|
| E-Commerce Orders Created | 200-500 orders | Per day | All e-commerce orders undergo fraud evaluation |
| Orders Flagged for Review | 10-30 orders (5-10% of total) | Per day | Based on current 75 threshold and expected fraud patterns |
| Fraud Rules Evaluated | 15-20 rules | Per order (during creation) | Each order evaluated against all active rules; ~2,000-10,000 rule evaluations/day |
| Governance Units per Evaluation | 1,500-3,000 units | Per order evaluation | Well within 10,000 unit User Event limit |
| Fraud Evaluation Log Records Created | 200-500 records | Per day | One log record per order evaluated |
| Dashboard Page Loads | 50-100 page loads | Per day | Fraud reviewers checking dashboard throughout the day |
| Manual Reviews Completed | 10-30 reviews | Per day | Matches flagged order volume |
| Daily Report Email Recipients | 3-5 users | Once per day | Risk Manager, Customer Service Manager, Operations Lead |
| Fraud Configuration Changes | 5-10 changes | Per month | Rule adjustments, threshold tuning, adding new rules |

**Scalability Considerations**: If SunStyle's order volume grows significantly (> 1,000 orders/day), the fraud evaluation logic will be refactored to use a Map/Reduce script for batch processing rather than User Event inline evaluation. This approach would process orders asynchronously within minutes of creation, removing governance constraints while maintaining near-real-time fraud detection. The current User Event architecture supports up to ~1,000 orders/day comfortably; beyond that, Map/Reduce becomes necessary.

**Caching Strategy**: Customer history metrics (lifetime order value, previous fraud flags, return rate) will be cached in custom fields on the Customer record and updated nightly via Scheduled Script, rather than calculated in real-time during fraud evaluation. This reduces governance consumption and improves evaluation performance.

---

## 9. Test Cases

| ID | Requirement | Use Case | Test Description | Preconditions | Steps | Expected Result |
|----|-------------|----------|------------------|---------------|-------|-----------------|
| TC1 | FR1, FR2, FR3 | UC1 | Verify fraud evaluation executes on e-commerce order creation and sets status correctly | Fraud rule configuration includes at least 5 active rules; Fraud Settings threshold = 75 | 1. Create Sales Order with total = $8,500, shipping address ≠ billing address, new customer. 2. Submit order. 3. Check custbody_ns_fraud_risk_score field. 4. Check order status. | Fraud score calculated (e.g., 82). Order status = "Pending Fraud Review". Fraud flags JSON populated with triggered rules. |
| TC2 | FR4 | UC2 | Verify inventory remains reserved for order in fraud review status | Inventory item with 10 units on hand; Sales Order in "Pending Fraud Review" status reserving 2 units | 1. Navigate to Inventory Item record. 2. Check Available quantity. 3. Check Committed quantity. 4. Attempt to create second order for 9 units of same item. | Available = 8 units. Committed = 2 units. Second order cannot be fulfilled (insufficient inventory). Inventory not released until fraud review decision made. |
| TC3 | FR5, FR6 | UC3 | Verify Risk Manager can create and configure fraud detection rule | User logged in with Risk Manager role; Fraud Rule Config record type exists | 1. Navigate to Fraud Rule Config list. 2. Click New. 3. Enter Rule Name = "High Value Order Check". 4. Set Rule Logic Reference = "CHECK_AMOUNT_THRESHOLD". 5. Set Rule Weight = 20. 6. Set Rule Parameters = {"threshold": 5000}. 7. Check Active Status. 8. Save. | New fraud rule created successfully. Rule appears in active rule list. Subsequent order evaluations include this rule. |
| TC4 | FR8 | UC4 | Verify Fraud Review Dashboard displays pending orders with correct details | 3 Sales Orders in "Pending Fraud Review" status with varying fraud scores (78, 85, 92) | 1. Navigate to Fraud Review Dashboard URL. 2. Observe order list. 3. Click on order with score 92. 4. Review order details, fraud flags, customer history. | Dashboard displays all 3 pending orders sorted by score (highest first). Order details page shows fraud score, individual flags, customer info, order line items, payment method, shipping/billing addresses. |
| TC5 | FR9 | UC5 | Verify daily fraud review report generates and emails correctly | Daily Report Scheduled Script deployed and scheduled for 8:00 AM; 2 orders in "Pending Fraud Review" status; Notification Recipients = Risk Manager, CS Manager | 1. Wait for 8:00 AM execution or manually trigger Scheduled Script. 2. Check email inboxes for Risk Manager and CS Manager. | Both recipients receive email with subject "Daily Fraud Review Report - [Date]". Email contains saved search results with 2 pending orders, including order numbers, scores, customer names, time in queue. |
| TC6 | FR10 | UC6 | Verify fraud reviewer can approve order and order proceeds to fulfillment | Sales Order in "Pending Fraud Review" status; User logged in as Fraud Reviewer | 1. Open Fraud Review Dashboard. 2. Select order. 3. Add review notes = "Customer verified via phone call". 4. Click Approve button. 5. Refresh order record. | Order status changes to "Pending Fulfillment". custbody_ns_fraud_review_status = "Approved". custbody_ns_fraud_reviewer set to current user. custbody_ns_fraud_review_timestamp populated. Order enters standard fulfillment workflow. |
| TC7 | FR11 | UC7 | Verify fraud reviewer can cancel order and inventory is released | Sales Order in "Pending Fraud Review" status reserving 1 unit of inventory; Payment authorization active | 1. Open Fraud Review Dashboard. 2. Select order. 3. Add review notes = "Fraudulent - stolen credit card". 4. Click Cancel Order button. 5. Confirm cancellation. 6. Check order status and inventory. | Order status = "Cancelled". custbody_ns_fraud_review_status = "Cancelled". Inventory reservation released (available inventory increases by 1). Refund processed via payment gateway. Customer receives cancellation email. |
| TC8 | FR7, FR12 | UC8 | Verify complete audit trail created for fraud evaluation and review decision | Sales Order with fraud evaluation and manual review completed | 1. Query Fraud Evaluation Log records filtered by Sales Order. 2. Open log record. 3. Review all fields. | Log record contains: Sales Order reference, evaluation timestamp, rule results JSON (all rules evaluated with individual scores), composite fraud score, decision outcome, reviewer identity, review timestamp, review notes. All data matches order fields. |
| TC9 | FR13 | UC9 | Verify auto-cancel threshold configuration (future readiness) | Fraud Settings record exists; Auto-Cancel Threshold field = null | 1. Edit Fraud Settings record. 2. Set Auto-Cancel Threshold = 95. 3. Save. 4. Create Sales Order that triggers fraud score of 96. 5. Submit order. | Order status immediately set to "Cancelled" (not "Pending Fraud Review"). custbody_ns_fraud_review_status = "Auto-Cancelled". Refund processed automatically. Risk Manager receives notification email. Order does not appear in review dashboard. |
| TC10 | FR14 | — | Verify orders in fraud review cannot be modified by unauthorized users | Sales Order in "Pending Fraud Review" status; User logged in with Sales Rep role (not Fraud Reviewer) | 1. Navigate to Sales Order record. 2. Attempt to edit order fields (e.g., change quantity, shipping address). 3. Attempt to save changes. | Edit form displays warning: "Order is under fraud review - modifications restricted". Save button disabled or displays error. Only users with Fraud Reviewer permission can edit the order. |
| TC11 | FR15 | UC10 | Verify fraud analytics dashboard shows accurate metrics | 30 days of fraud evaluation history with mix of approved, cancelled, and auto-cancelled orders | 1. Navigate to Fraud Analytics Dashboard (separate Suitelet or NetSuite Dashboard). 2. Review metrics for past 30 days. | Dashboard displays: Total orders evaluated, % flagged for review, Average fraud score, False positive rate (approved orders / total flagged), Average review time, Prevented fraud losses ($ value of cancelled orders), Trend charts for scores and outcomes over time. |
| TC12 | — | — | Verify fraud evaluation handles missing order data gracefully | Sales Order with missing shipping address (international order edge case) | 1. Create Sales Order with no shipping address. 2. Submit order. | Order flagged for manual review. custbody_ns_fraud_flags includes "EVAL_ERROR: Missing shipping address". Fraud Evaluation Log record contains error details. Order appears in review dashboard with error indicator. |
| TC13 | — | — | Verify fraud system fail-safe behavior on script error | Fraud Evaluation Engine script has syntax error or governance limit exceeded | 1. Introduce error in fraud evaluation script (or simulate governance exceeded). 2. Create Sales Order. 3. Submit order. | Order status set to "Pending Fraud Review" (fail-safe: err on caution side). Error logged to Execution Log and Fraud Evaluation Log. Email alert sent to administrators. Order flagged for manual review with error indicator. |

---

## 10. AI Use Opportunities

The fraud screening solution is an ideal candidate for future AI/ML enhancement to improve fraud detection accuracy, reduce false positives, and enable predictive risk scoring based on emerging patterns. As SunStyle accumulates historical fraud evaluation data (approved vs. cancelled orders with associated attributes), machine learning models can be trained to refine scoring algorithms beyond rule-based logic.

**Identified Opportunities:**

- **Supervised Learning Fraud Model**: Train a classification model (e.g., Random Forest, Gradient Boosting, Neural Network) on historical order data labeled with fraud outcomes (legitimate vs. fraudulent). The model would learn complex, non-linear relationships between order attributes (amount, customer history, device fingerprint, order timing, product mix, etc.) and fraud probability, producing more accurate risk scores than weighted rule summation. This model could be integrated as an additional "ML Rule" in the fraud evaluation engine, contributing its predicted probability to the composite score.

- **Anomaly Detection for Emerging Fraud Patterns**: Implement unsupervised learning (e.g., Isolation Forest, Autoencoders) to identify orders with unusual attribute combinations that don't match historical fraud patterns but represent potential new fraud vectors. This detects "zero-day" fraud techniques not covered by existing rules and alerts Risk Managers to investigate and create new rules.

- **Natural Language Processing for Review Notes Analysis**: Apply NLP sentiment analysis and topic modeling to fraud reviewer notes accumulated over time. This identifies common fraud indicators mentioned by reviewers ("customer nervous", "phone number disconnected", "shipping to freight forwarder") and suggests new automated rule criteria based on patterns found in manual review rationale.

- **Predictive False Positive Reduction**: Train a model to predict which high-scoring orders are likely false positives (legitimate customers exhibiting fraud-like patterns) based on features like customer tenure, previous order history, and review outcomes. Orders predicted as false positives could be auto-approved or fast-tracked for quick review, reducing review workload and improving customer experience.

- **Dynamic Threshold Optimization**: Use reinforcement learning or Bayesian optimization to continuously tune the fraud review threshold (currently static at 75) based on evolving fraud patterns, false positive costs, and review capacity. The system would recommend threshold adjustments to optimize the balance between fraud prevention and operational efficiency.

- **Fraud Network Analysis (Graph ML)**: Build a graph database connecting customers, payment methods, shipping addresses, IP addresses, and devices. Apply graph neural networks or community detection algorithms to identify fraud rings (multiple accounts controlled by the same fraudster) and shared fraud indicators across seemingly unrelated orders.

**Implementation Considerations:**

- **Data Requirements**: Minimum 6-12 months of historical order data with confirmed fraud outcomes (at least 200 fraudulent orders and 5,000 legitimate orders) to train effective models. Data must include rich feature set: customer demographics, order attributes, behavioral data (clickstream, session duration), and external enrichment (IP geolocation, device fingerprinting).

- **Integration Architecture**: AI models would be deployed outside NetSuite (on cloud ML platforms like AWS SageMaker, Azure ML, or Google Vertex AI) and integrated via RESTlet APIs. The fraud evaluation script would call the ML model endpoint for prediction, incorporating the AI-generated risk score into the composite fraud score calculation. Model predictions would be cached to manage API call volume and costs.

- **Model Governance and Monitoring**: Implement MLOps practices including model versioning, A/B testing (compare rule-based vs. AI-enhanced scoring), performance monitoring (accuracy, false positive/negative rates), and model retraining pipelines. Human reviewers should be able to override AI predictions and provide feedback to improve model quality. Bias testing and fairness analysis are critical to ensure the model doesn't discriminate based on protected customer attributes (e.g., geography, demographics).

- **Explainability and Transparency**: Use interpretable ML techniques (SHAP values, LIME, feature importance) to explain why the AI model flagged a specific order. Reviewers need to understand AI reasoning to trust predictions and identify model errors. Fraud review dashboard should display both rule-based flags and AI-driven risk factors.

- **Cost-Benefit Analysis**: Evaluate per-transaction API call costs for ML inference vs. prevented fraud losses and reduced manual review costs. Start with batch-based inference (daily model scoring of previous day's orders) to minimize costs before moving to real-time inference if ROI justifies.

- **User Experience**: Clearly distinguish AI-driven scores from rule-based scores in the fraud review interface. Provide training to fraud reviewers on interpreting AI predictions and understanding model limitations. Gradually increase reliance on AI as model accuracy improves and reviewer confidence grows.

---

*Document generated via LLM-assisted authoring. Human review recommended before finalization.*
