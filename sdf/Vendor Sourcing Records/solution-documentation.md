# Vendor Sourcing Tracker

**Version**: 1.0 | **By**: NetSuite Professional Services

---

## Description

The Vendor Sourcing Tracker is a procurement vendor evaluation system that provides structured tracking of vendor qualification efforts for product sourcing. Designed to replace scattered vendor evaluation data in emails and spreadsheets, the solution offers a centralized repository where procurement teams systematically capture vendor quotes, pricing terms, minimum order quantities (MOQ), lead times, and sourcing status throughout the evaluation lifecycle.

Each sourcing record represents a unique vendor-item-model combination for a specific sourcing round, enabling procurement teams to compare multiple vendors bidding on the same product or evaluate different model variations from a single vendor. The solution follows an 8-step status workflow from initial vendor contact through final approval or rejection, with full audit trail of pricing negotiations and decision rationale captured in notes fields.

Organizations benefit from eliminating lost vendor evaluation data, standardized vendor comparison processes, searchable history of vendor performance across sourcing rounds, quick identification of approved vendors by item, and comprehensive analytics on vendor cost competitiveness, lead time reliability, and MOQ flexibility.

---

## Solution Details

### Solution Type
- **Procurement**

### Target Industries
- **Retail** (sourcing product inventory)
- **Wholesale Distribution** (supplier evaluation)
- **Manufacturing** (component/material sourcing)

### Dependencies
- None (standalone configuration-only solution)

---

## Features

### Vendor Evaluation Tracking
Systematic capture of each vendor evaluation attempt with complete lifecycle tracking from initial contact through final approval or rejection decision.

### Quote Request Management
Tracks when vendors are contacted, when quotes are received, and maintains pricing quote history for future reference and price trend analysis.

### Pricing Comparison Analysis
Captures both vendor-quoted costs and internal target costs, enabling procurement teams to compare vendor pricing against budget thresholds and negotiate effectively.

### MOQ & Lead Time Tracking
Records vendor minimum order quantity requirements and delivery lead times in days, critical factors in vendor selection and supply chain planning.

### Sourcing Status Workflow
8-step status progression (Contacted, Awaiting Quote, Quote Received, Negotiating, Approved, Rejected, On Hold, Cancelled) provides clear visibility into evaluation progress.

### Buyer Assignment
Links each sourcing effort to a specific procurement team member, ensuring accountability and enabling workload balancing across buyers.

### Vendor-Item-Model Tracking
Captures vendor's model/style code alongside NetSuite item reference, enabling precise tracking when vendors offer multiple SKU variations for the same product category.

### Procurement Decision Audit Trail
Notes field captures conversation summaries, email snippets, and negotiation details, maintaining full context for sourcing decisions and future vendor performance reviews.

---

## Technical Details

### Script Files
**None** - This is a pure configuration solution with no SuiteScript files.

### Custom Records

**customrecord_sourcing_tracker** - Sourcing Tracker Record

**Configuration**:
- Auto-numbering with "ST-" prefix (e.g., ST-0001, ST-0002)
- Inline editing enabled for quick updates
- Attachments enabled for vendor quotes and documentation
- Quick search enabled for fast vendor/item lookup

**Fields (11 total)**:
| Field ID | Label | Type | Mandatory | Description |
|----------|-------|------|-----------|-------------|
| `custrecord_st_vendor` | Vendor | SELECT | Yes | Links to vendor record |
| `custrecord_st_item` | Item | SELECT | Yes | NetSuite inventory item being sourced |
| `custrecord_st_model_code` | Model/Style Code | TEXT | No | Vendor's model/SKU (max 50 chars) |
| `custrecord_st_status` | Sourcing Status | SELECT | Yes | Current evaluation status (from custom list) |
| `custrecord_st_buyer` | Assigned Buyer | SELECT | Yes | Employee responsible (defaults to current user) |
| `custrecord_st_contact_date` | Initial Contact Date | DATE | Yes | When vendor first contacted (defaults to today) |
| `custrecord_st_quote_date` | Quote Received Date | DATE | No | When vendor provided pricing |
| `custrecord_st_quoted_cost` | Quoted Unit Cost | CURRENCY | No | Vendor's price per unit |
| `custrecord_st_target_cost` | Target Cost | CURRENCY | No | Internal budget/maximum price |
| `custrecord_st_moq` | MOQ | INTEGER | No | Vendor's minimum order quantity (hidden from list) |
| `custrecord_st_lead_time` | Lead Time (Days) | INTEGER | No | Days from PO to delivery (hidden from list) |
| `custrecord_st_notes` | Notes | TEXTAREA | No | Free-form conversation summaries |

### Workflows
None (status field provides simple workflow tracking)

### Custom Fields
None (all fields are on the custom record itself)

### Saved Searches

**customsearch_vendor_sourcing_history** - Vendor Sourcing History

**Purpose**: Displays all sourcing tracker records for a specific vendor, designed to be embedded on the vendor record as a subtab.

**Features**:
- Automatically filters to show only sourcing records for the current vendor (@CURRENT@ context)
- Sorted by contact date (most recent first)
- Available filters: Status, Buyer, Contact Date
- Shows: Record ID, Item, Model Code, Status, Buyer, Contact Date, Quoted Cost, MOQ, Lead Time
- Public search available to all roles

**Usage**: After deployment, add this saved search as a subtab on the vendor record form via Customization > Forms > Entry Forms > Vendor

### Other Objects

**customlist_ns_csi_sourcing_status** - Sourcing Status List

**8 Status Values** (ordered workflow progression):
1. **Contacted** (default) - Initial outreach made
2. **Awaiting Quote** - Waiting for vendor response
3. **Quote Received** - Vendor has provided pricing
4. **Negotiating** - Terms under discussion
5. **Approved** - Vendor accepted, ready to source
6. **Rejected** - Vendor does not meet requirements
7. **On Hold** - Temporarily paused
8. **Cancelled** - Sourcing attempt discontinued

---

## System Requirements

### NetSuite Version
- **Minimum**: 2019.1
- **Recommended**: Latest stable release

### NetSuite Edition
- **Required**: N/A (compatible with all editions)

### Required Features
- **Custom Records**

---

## Installation

### Prerequisites
1. NetSuite account with Administrator or Developer role
2. SuiteCloud Development Framework (SDF) CLI installed
3. Vendor records populated in NetSuite
4. Item master data configured
5. Employee records for procurement team members

### Deployment Steps

1. **Navigate to Project**
   ```bash
   cd "sdf/Vendor Sourcing Records/src"
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
   # Use auth ID: next-products
   ```

3. **Validate Project**
   ```bash
   suitecloud project:validate --server
   ```

4. **Deploy to NetSuite**
   ```bash
   suitecloud project:deploy
   ```

5. **Post-Deployment Configuration**
   - Verify custom record "Sourcing Tracker" is available
   - Confirm custom list "Sourcing Status" values are correct
   - Test creating a sample sourcing record
   - **Add Vendor Sourcing History Subtab to Vendor Form**:
     1. Navigate to Customization > Forms > Entry Forms > Vendor
     2. Select the Standard Vendor Form (or your custom vendor form)
     3. Click "Customize"
     4. Go to Custom Subtabs
     5. Add New Subtab
     6. Tab Label: "Sourcing History"
     7. Tab Type: Saved Search
     8. Saved Search: Select "Vendor Sourcing History"
     9. Save the form
   - Create additional custom saved searches for common procurement reports (optional):
     - Active sourcing efforts by buyer
     - Vendor pricing comparison by item
     - Average lead times by vendor
     - Approved vendors by item category

---

## Usage

### Getting Started

After deployment, procurement team members can begin creating Sourcing Tracker records for each vendor evaluation effort. Each record represents one vendor's bid on one item/model combination.

### Common Workflows

**Evaluating Multiple Vendors for Same Item**
1. Procurement manager identifies need to source new sunglasses model
2. Creates 3 Sourcing Tracker records:
   - Vendor A + Sunglasses Item + Model "SG-2024A"
   - Vendor B + Sunglasses Item + Model "SG-PRO-X"
   - Vendor C + Sunglasses Item + Model "CLASSIC-100"
3. Sets status to "Contacted" for all three
4. As quotes arrive, updates status to "Quote Received" and captures pricing
5. Reviews quoted cost vs. target cost, MOQ requirements, lead times
6. Updates status to "Approved" for winning vendor, "Rejected" for others
7. Notes field captures decision rationale for future reference

**Tracking Vendor Negotiation**
1. Sourcing record created with initial quote ($25/unit)
2. Status set to "Negotiating"
3. Buyer adds notes: "Initial quote $25, requested $22 based on volume commitment"
4. Updates quoted cost field as negotiations progress
5. Final agreed price captured in quoted cost ($23/unit)
6. Status changed to "Approved" when terms accepted
7. MOQ and lead time fields updated with final agreement terms

**Reviewing Vendor Performance History**
1. Procurement analyst searches Sourcing Tracker for "Vendor ABC"
2. Reviews all historical sourcing records for this vendor
3. Analyzes pricing trends, lead time consistency, MOQ flexibility
4. Identifies patterns: Vendor consistently delivers in 14 days vs. quoted 21 days
5. Uses insights to negotiate better terms on next sourcing round

### User Roles

- **Procurement Managers**: Create sourcing records, assign buyers, review approvals
- **Buyers**: Update sourcing records throughout evaluation lifecycle, capture quotes, negotiate terms
- **Finance Team**: Review pricing vs. budget targets, approve high-value vendor selections
- **Inventory Planners**: Review lead times and MOQ requirements for supply planning

---

## Configuration

### Settings

**Sourcing Status List**:
- Pre-configured with 8 status values
- Can be customized to match your procurement workflow
- Status order can be resequenced as needed

**Record Auto-Numbering**:
- Prefix: "ST-" (can be changed in custom record settings)
- Format: ST-0001, ST-0002, etc.

**Field Defaults**:
- Assigned Buyer: Defaults to current user
- Initial Contact Date: Defaults to today
- Sourcing Status: Defaults to "Contacted"

### Customization

The solution can be extended to support:
- Additional fields for payment terms, warranty terms, certifications
- Approval workflows requiring manager sign-off for high-value sourcing decisions
- Email alerts to buyers when status changes or quotes are overdue
- Dashboards showing active sourcing efforts by buyer workload
- Integration with RFQ (Request for Quote) generation
- Vendor scorecard calculations based on historical performance
- Reporting on cost savings achieved vs. target costs

---

## Support & Documentation

### Resources
- **Repository**: Local SDF project in `/sdf/Vendor Sourcing Records/`
- **Documentation**: NetSuite SuiteAnswers for custom record best practices

### Contact
- **Manager**: NetSuite Professional Services
- **Project Auth ID**: next-products

---

## Technical Architecture

### Component Overview

```
Procurement Team
    ↓
Create Sourcing Tracker Record
    ├→ Vendor (SELECT from vendors)
    ├→ Item (SELECT from items)
    ├→ Model/Style Code (TEXT entry)
    ├→ Status (SELECT from custom list)
    └→ Pricing, MOQ, Lead Time fields
        ↓
Status Workflow Progression:
Contacted → Awaiting Quote → Quote Received → Negotiating → Approved/Rejected/On Hold/Cancelled
    ↓
Reporting & Analytics
    ├→ Vendor Pricing Comparisons
    ├→ Lead Time Analysis
    ├→ Buyer Workload Distribution
    └→ Approved Vendor Lists by Item
```

### Data Flow

1. **Sourcing Initiation**: Buyer identifies need to evaluate vendor for item
2. **Record Creation**: Sourcing Tracker record created with vendor, item, model, buyer assignment
3. **Contact Tracking**: Initial contact date captured, status set to "Contacted"
4. **Quote Management**: When quote received, status updated, pricing captured
5. **Negotiation**: Status moves to "Negotiating", notes field captures conversation details
6. **Decision**: Final status set (Approved/Rejected/etc.), quoted cost and terms finalized
7. **Audit Trail**: Complete record maintained for future vendor performance reviews

### Integration Points

- **Vendor Records**: Links to NetSuite vendor master data
  - Sourcing History subtab displays all sourcing records for the vendor
  - Provides visibility into past quotes, pricing trends, and sourcing decisions
- **Item Master**: Links to inventory items being sourced
- **Employee Records**: Buyer assignment from employee list
- **Purchase Orders**: Approved vendors can be referenced when creating POs (manual process)
- **Reporting**: Data available for custom reports and saved searches

---

## Changelog

### Version 1.1 (2026-02-05)
- Added saved search: "Vendor Sourcing History" (customsearch_vendor_sourcing_history)
- Vendor record integration: Subtab shows all sourcing records for vendor
- Search displays: Record ID, Item, Model Code, Status, Buyer, Contact Date, Quoted Cost, MOQ, Lead Time
- Available filters: Status, Buyer, Contact Date range
- Sorted by contact date (most recent first)
- Addresses requirement from Tom (Operations Director) for vendor record visibility

### Version 1.0
- Custom record deployed with 11 fields
- 8-step sourcing status workflow
- Auto-numbering with "ST-" prefix
- Inline editing and attachment support
- Custom list for status values
- Quick search enabled
- Initial deployment to account "next-products"
- 2 deployment attempts logged (account setup required for success)

---

## Deployment History

**Deployment Attempts**:
- 2026-01-30 20:54:47 UTC - Initial attempt
- 2026-02-04 22:59:57 UTC - Failed: "No account has been set up for this project"

**Note**: Account authentication must be configured via `suitecloud account:setup` before deployment can succeed.

---

## Credits

**Developed by**: NetSuite Professional Services
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: 2026-02-05
**Deployment Status**: Ready for deployment (pending account setup)
**Object Count**: 3 objects (1 custom record + 1 custom list + 1 saved search)
