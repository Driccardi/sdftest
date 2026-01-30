# Vendor Sourcing Process - Coastal Shades Inc.

---
**Document ID**: PROC-VS-001
**Client**: Coastal Shades Inc. (Project Code: csi)
**Created**: 2026-01-30
**Status**: Draft
**Source**: Discovery notes from M. Rivera, 2026-01-28
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

### 5. Reporting and Analysis
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

Tom requested visibility from the Vendor record - options to explore:
- Related records subtab on vendor
- Custom saved search embedded on vendor form
- Suitelet showing sourcing history

> ⚠️ OPEN: Technical approach for vendor record integration - subtab vs. saved search vs. suitelet

## Open Questions

> ⚠️ OPEN: Should we track multiple quote iterations per sourcing record?
**Answer (per Sarah):** No - for now, just overwrite with the latest quote. Can revisit in phase 2 if needed.

> ⚠️ OPEN: Should Model/Style Code be a custom list instead of free text?
**Answer (per Sarah and Tom):** No - too many one-off vendor style codes. Free text is fine.

> ⚠️ OPEN: Attachment handling strategy for quote PDFs
**Decision:** Parking lot for phase 2. May use NetSuite file attachments or link to external document management.

## Next Steps

1. Build custom record type: Sourcing Tracker
2. Create custom list: Sourcing Status (with values above)
3. Configure roles and permissions per access matrix
4. Create saved searches and dashboard portlets
5. Design vendor record integration (subtab or search)
6. Conduct user acceptance testing with Sarah and purchasing team

## Changelog

- **2026-01-30**: Initial document created from discovery notes (M. Rivera, 2026-01-28)

---

*Last Updated: 2026-01-30*
*Version: 1.0.0*
*Status: Draft*
