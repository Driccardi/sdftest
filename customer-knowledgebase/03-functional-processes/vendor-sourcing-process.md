# Vendor Sourcing Process - Coastal Shades Inc.

---
**Document ID**: PROC-VS-001
**Client**: Coastal Shades Inc. (Project Code: csi)
**Created**: 2026-01-30
**Status**: Draft
**Source**: Discovery notes from M. Rivera, 2026-01-28
**Source Documents**:
  - `unprocessed/_processed/2026-01-30_vendor-sourcing-requirements.pdf` (processed 2026-01-30)
  - `unprocessed/_processed/2026-02-05_vendor-sourcing-requirements.md` (processed 2026-02-05)
**Related**:
  - [Inventory Management Process](./inventory-management.md)
  - [Configuration Spec: Sourcing Tracker Custom Record](../../configuration-execution/custom-records/sourcing-tracker.md)
---

## Overview

Coastal Shades Inc. requires a structured approach to vendor qualification and product sourcing. This document captures the business requirements and process workflows for tracking vendor outreach, quote management, and sourcing decisions within NetSuite.

## Background

Per discovery call with Sarah (Purchasing Manager) and Tom (Operations Director) on January 28, 2026:

Currently, the vendor sourcing workflow is managed through spreadsheets and email threads, leading to:
- No visibility into which vendors have been contacted for which styles
- Duplicate outreach - buyers unknowingly contact the same vendor for the same model
- No centralized record of quoted prices, MOQs, or lead times until a PO is issued
- Inability to report on "time to source" metrics or vendor responsiveness

## Business Objectives

1. **Eliminate duplicate outreach** - Provide real-time visibility into active sourcing efforts
2. **Centralize sourcing data** - Track quotes, pricing, and lead times in one system
3. **Improve vendor performance tracking** - Measure response times and cost competitiveness
4. **Tie sourcing to procurement** - Connect sourcing history to actual POs and inventory

## Process Flow

### 1. Initial Vendor Contact
- Buyer identifies need for a specific item/model
- Checks NetSuite for existing sourcing records for that Vendor + Item + Model combination
- If no active record exists, creates new sourcing tracker record
- Records:
  - Vendor
  - Item (inventory item)
  - Model/Style Code (vendor's model number)
  - Initial Contact Date
  - Assigned Buyer
  - Sourcing Status: "Contacted"

### 2. Quote Request and Receipt
- Buyer updates record when quote is received
- Records:
  - Quote Received Date
  - Quoted Unit Cost
  - MOQ (Minimum Order Quantity)
  - Lead Time (in days)
  - Status changes to: "Quote Received"

### 3. Evaluation and Negotiation
- Buyer compares Quoted Cost against Target Cost
- If negotiation required, status changes to: "Negotiating"
- Notes field captures conversation summaries, email snippets, key points

### 4. Decision
- Final status set to one of:
  - **Approved** - Vendor selected, ready to issue PO
  - **Rejected** - Did not meet requirements or pricing
  - **On Hold** - Paused for business reasons
  - **Cancelled** - Sourcing effort cancelled

### 5. Automated Email Notifications

**NEW REQUIREMENT (2026-01-30)**: Per discussion with Moxi, the customer requires automated email notifications to be sent whenever the Sourcing Status field changes.

**Notification Requirements**:
- Trigger: Status field change on Sourcing Tracker record
- Recipients: *To be determined (see open questions)*
- Content: *To be determined (see open questions)*

> ⚠️ **OPEN QUESTIONS** - See GAP-PTP-005:
> - Which status changes should trigger emails (all or specific transitions)?
> - Who receives notifications (assigned buyer, vendor, purchasing manager)?
> - Should vendors receive automated notifications?
> - What information should be included in the email?
> - Email format preferences (HTML vs. plain text)?
> - Immediate send or batched/delayed?
> - Any status changes that should NOT trigger emails?
> - Should recipients be configurable per record or standard per status?

**Implementation Notes**:
- Requires workflow or user event script with email notification action
- Email templates needed for each status transition (or generic template)
- Consider using NetSuite's workflow notification feature vs. custom SuiteScript
- May need custom email template records

### 6. Reporting and Analysis
- Purchasing team reviews dashboards showing:
  - Open sourcing requests by status
  - Average days to quote by vendor
  - Cost variance (quoted vs. target) by vendor
- Operations leadership views aggregated metrics

## Sourcing Tracker Data Model

### Core Fields

| Field | Type | Purpose | Required |
|-------|------|---------|----------|
| Vendor | List/Record (Vendor) | Link to vendor master record | Yes |
| Item | List/Record (Item) | Inventory item being sourced | Yes |
| Model/Style Code | Free text (50 char) | Vendor's model number (may differ from SKU) | No |
| Sourcing Status | Dropdown | Current stage in sourcing workflow | Yes |
| Initial Contact Date | Date | When buyer first reached out | Yes |
| Quote Received Date | Date | When vendor responded with pricing | No |
| Quoted Unit Cost | Currency (USD) | Vendor's quoted price per unit | No |
| MOQ | Integer | Minimum order quantity | No |
| Lead Time (Days) | Integer | Quoted lead time in calendar days | No |
| Target Cost | Currency (USD) | Internal target/budget price | No |
| Assigned Buyer | List/Record (Employee) | Owner of this sourcing effort | Yes |
| Notes | Long text | Free-form notes, email snippets, conversation summaries | No |
| Attachment Folder | *(Phase 2)* | For quote PDFs and supporting documents | No |

### Sourcing Status Values

- **Contacted** - Initial outreach sent, awaiting response
- **Awaiting Quote** - Vendor acknowledged, preparing quote
- **Quote Received** - Pricing and terms received
- **Negotiating** - In discussion on pricing/terms
- **Approved** - Vendor selected, ready to proceed
- **Rejected** - Vendor not selected
- **On Hold** - Sourcing paused
- **Cancelled** - Sourcing effort cancelled *(added 2026-01-30)*

### Calculated Metrics (future)

- **Cost Variance** - `(Quoted - Target) / Target` as percentage
- **Days to Quote** - `Quote Received Date - Initial Contact Date`

## Access and Permissions

| Role | Access Level | Notes |
|------|--------------|-------|
| Purchasing Team | Full Edit | Create, update, delete records |
| Sales Team | View Only | Visibility into sourcing pipeline |
| Executives | Reports Only | Dashboard access, no direct record access |

## Reporting Requirements

### Required Saved Searches / Dashboards

1. **Open Sourcing Requests by Status**
   - Filterable by buyer, vendor, item
   - Shows days since initial contact
   - Highlights overdue quotes (>7 days)

2. **Vendor Response Time Analysis**
   - Average days to quote by vendor
   - Trends over time
   - Identifies slow responders

3. **Cost Variance by Vendor**
   - Shows which vendors consistently quote over/under target
   - Supports vendor negotiation strategy
   - Flags outliers

### Integration with Vendor Record

**Decision (2026-02-05)**: Implemented via saved search subtab on vendor record form.

**Technical Approach**:
- Saved Search: `customsearch_vendor_sourcing_history`
- Displays all sourcing tracker records for the current vendor
- Shows: Record ID, Item, Model Code, Status, Buyer, Contact Date, Quoted Cost, MOQ, Lead Time
- Sorted by contact date (most recent first)
- Available filters: Status, Buyer, Contact Date range

**Post-Deployment Configuration Required**:
1. Navigate to Customization > Forms > Entry Forms > Vendor
2. Customize the Standard Vendor Form (or custom vendor form)
3. Add Custom Subtab: "Sourcing History"
4. Subtab Type: Saved Search
5. Select: "Vendor Sourcing History" search
6. Save form

**Rationale**: Saved search subtab provides native NetSuite functionality with no custom scripts required, real-time visibility, and easy maintenance. Users can click sourcing records directly from the vendor form to view full details.

## Open Questions

> ⚠️ OPEN: Should we track multiple quote iterations per sourcing record?
**Answer (per Sarah):** No - for now, just overwrite with the latest quote. Can revisit in phase 2 if needed.

> ⚠️ OPEN: Should Model/Style Code be a custom list instead of free text?
**Answer (per Sarah and Tom):** No - too many one-off vendor style codes. Free text is fine.

> ⚠️ OPEN: Attachment handling strategy for quote PDFs
**Decision:** Parking lot for phase 2. May use NetSuite file attachments or link to external document management.

> ⚠️ OPEN: Email notification requirements for status changes (NEW 2026-01-30)
**Decision:** Pending - See GAP-PTP-005 in gaps.md for detailed requirements gathering questions. Needs workshop with Purchasing team to define triggers, recipients, and content.

## Next Steps

1. Build custom record type: Sourcing Tracker
2. Create custom list: Sourcing Status (with values above)
3. Configure roles and permissions per access matrix
4. Create saved searches and dashboard portlets
5. Design vendor record integration (subtab or search)
6. Conduct user acceptance testing with Sarah and purchasing team

## Changelog

- **2026-02-05**: Technical decision - Vendor record integration implemented via saved search subtab (customsearch_vendor_sourcing_history)
- **2026-02-05**: Updated source document reference - markdown file processed and archived
- **2026-02-02**: Updated source documents to include markdown version of discovery notes
- **2026-01-30**: Added "Cancelled" status value and automated email notification requirement (per discussion with Moxi). Added GAP-PTP-005 reference.
- **2026-01-30**: Initial document created from discovery notes (M. Rivera, 2026-01-28)

---

*Last Updated: 2026-02-05*
*Version: 1.2.0*
*Status: Draft*
