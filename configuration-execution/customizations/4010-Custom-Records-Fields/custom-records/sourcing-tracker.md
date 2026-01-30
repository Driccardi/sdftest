# Custom Record: Sourcing Tracker

---
**Record Type**: Custom Record
**Script ID**: `customrecord_sourcing_tracker`
**Project Code**: csi
**Client**: Coastal Shades Inc.
**Created**: 2026-01-30
**Status**: Ready for Build
**Source**: Discovery notes from M. Rivera, 2026-01-28
**Related**:
  - [Business Process: Vendor Sourcing](../../customer-knowledgebase/03-functional-processes/vendor-sourcing-process.md)
  - [Custom List: Sourcing Status](../custom-lists/sourcing-status.md)
---

## Purpose

Tracks vendor qualification and product sourcing attempts. Each record represents a unique Vendor + Item + Model combination for a specific sourcing round.

## Record Configuration

### Basic Settings
- **Record Name**: Sourcing Tracker
- **Record ID**: `customrecord_sourcing_tracker`
- **Include Name Field**: Yes
- **Show ID**: Yes
- **Allow Attachments**: Yes (for future quote PDF uploads)
- **Allow Inline Editing**: Yes
- **Allow Numbering Override**: No

### Naming
- **Auto-Numbering**: Yes
- **Prefix**: `ST-`
- **Number Format**: `{prefix}{yyyy}{seqnum[4]}`
- **Example**: `ST-20260001`

## Custom Fields

### Vendor and Item Information

#### 1. Vendor
- **Field Label**: Vendor
- **Script ID**: `custrecord_st_vendor`
- **Type**: List/Record (Vendor)
- **Description**: The vendor being evaluated for this item
- **Required**: Yes
- **Display Type**: Normal
- **Help Text**: Select the vendor you are sourcing this item from

#### 2. Item
- **Field Label**: Item
- **Script ID**: `custrecord_st_item`
- **Type**: List/Record (Inventory Item)
- **Description**: The inventory item being sourced
- **Required**: Yes
- **Display Type**: Normal
- **Help Text**: Select the NetSuite item record for this product
- **Sourcing**: All inventory item types

#### 3. Model/Style Code
- **Field Label**: Model/Style Code
- **Script ID**: `custrecord_st_model_code`
- **Type**: Free-Form Text
- **Description**: Vendor's model or style identifier
- **Required**: No
- **Max Length**: 50 characters
- **Display Type**: Normal
- **Help Text**: Enter the vendor's model or style number (may differ from NetSuite SKU)

### Status and Workflow

#### 4. Sourcing Status
- **Field Label**: Sourcing Status
- **Script ID**: `custrecord_st_status`
- **Type**: List/Record (Custom List)
- **List**: `customlist_sourcing_status`
- **Description**: Current stage in the sourcing workflow
- **Required**: Yes
- **Default Value**: Contacted
- **Display Type**: Normal
- **Help Text**: Select the current status of this sourcing effort

#### 5. Assigned Buyer
- **Field Label**: Assigned Buyer
- **Script ID**: `custrecord_st_buyer`
- **Type**: List/Record (Employee)
- **Description**: Employee responsible for this sourcing effort
- **Required**: Yes
- **Display Type**: Normal
- **Default to Current User**: Yes
- **Help Text**: Select the buyer or purchasing agent managing this sourcing request

### Dates

#### 6. Initial Contact Date
- **Field Label**: Initial Contact Date
- **Script ID**: `custrecord_st_contact_date`
- **Type**: Date
- **Description**: Date when vendor was first contacted
- **Required**: Yes
- **Default to Today**: Yes
- **Display Type**: Normal
- **Help Text**: Date you first reached out to the vendor for this item

#### 7. Quote Received Date
- **Field Label**: Quote Received Date
- **Script ID**: `custrecord_st_quote_date`
- **Type**: Date
- **Description**: Date vendor responded with pricing
- **Required**: No
- **Display Type**: Normal
- **Help Text**: Date the vendor provided a formal quote

### Pricing and Terms

#### 8. Quoted Unit Cost
- **Field Label**: Quoted Unit Cost
- **Script ID**: `custrecord_st_quoted_cost`
- **Type**: Currency
- **Description**: Vendor's quoted price per unit
- **Required**: No
- **Currency**: USD (multi-currency: base currency)
- **Display Type**: Normal
- **Help Text**: Enter the vendor's quoted unit price

#### 9. Target Cost
- **Field Label**: Target Cost
- **Script ID**: `custrecord_st_target_cost`
- **Type**: Currency
- **Description**: Internal target or budget price
- **Required**: No
- **Currency**: USD (multi-currency: base currency)
- **Display Type**: Normal
- **Help Text**: Enter your target or maximum cost for this item

#### 10. MOQ (Minimum Order Quantity)
- **Field Label**: MOQ
- **Script ID**: `custrecord_st_moq`
- **Type**: Integer
- **Description**: Minimum order quantity required by vendor
- **Required**: No
- **Display Type**: Normal
- **Help Text**: Enter the vendor's minimum order quantity

#### 11. Lead Time (Days)
- **Field Label**: Lead Time (Days)
- **Script ID**: `custrecord_st_lead_time`
- **Type**: Integer
- **Description**: Quoted lead time in calendar days
- **Required**: No
- **Display Type**: Normal
- **Help Text**: Number of days from PO to delivery (per vendor quote)

### Notes and Documentation

#### 12. Notes
- **Field Label**: Notes
- **Script ID**: `custrecord_st_notes`
- **Type**: Long Text
- **Description**: Free-form notes, email snippets, conversation summaries
- **Required**: No
- **Max Length**: Unlimited (Long Text)
- **Display Type**: Text Area
- **Help Text**: Record notes, key conversation points, or email excerpts related to this sourcing effort

## Form Layout

### Main Tab: Sourcing Details

**Section 1: Vendor & Item**
- Vendor (full width)
- Item (full width)
- Model/Style Code (full width)

**Section 2: Status & Assignment**
- Sourcing Status (half width)
- Assigned Buyer (half width)

**Section 3: Timeline**
- Initial Contact Date (half width)
- Quote Received Date (half width)

**Section 4: Pricing & Terms**
- Quoted Unit Cost (half width)
- Target Cost (half width)
- MOQ (half width)
- Lead Time (Days) (half width)

**Section 5: Notes**
- Notes (full width, text area)

### Subtabs
- **Communication** (future) - Related emails or messages
- **Related POs** (future) - Purchase orders issued to this vendor for this item

## Access and Permissions

### Purchasing Team
- **Create**: Yes
- **Edit**: Yes (own records)
- **Edit**: Yes (all records) - for purchasing managers
- **View**: Yes (all records)
- **Delete**: No (archive instead)

### Sales Team
- **Create**: No
- **Edit**: No
- **View**: Yes (all records)
- **Delete**: No

### Executives
- **Create**: No
- **Edit**: No
- **View**: Via Reports Only (no direct record access needed)
- **Delete**: No

## Search Columns

### Default Search Columns
1. ID (Record ID)
2. Vendor
3. Item
4. Model/Style Code
5. Sourcing Status
6. Assigned Buyer
7. Initial Contact Date
8. Quote Received Date
9. Quoted Unit Cost
10. Target Cost

### Sortable Fields
- Initial Contact Date (default sort: descending)
- Quote Received Date
- Quoted Unit Cost
- Vendor name

## Future Enhancements (Phase 2)

> ⚠️ **Attachment folder field**: For quote PDFs - deferred to phase 2

> ⚠️ **Formula fields**:
> - Cost Variance: `(Quoted Cost - Target Cost) / Target Cost * 100`
> - Days to Quote: `Quote Received Date - Initial Contact Date`

> ⚠️ **Vendor record integration**: Subtab or related list on vendor record showing sourcing history

> ⚠️ **Quote versioning**: Track multiple quote iterations per sourcing round

## Implementation Notes

### SDF Build Command
```bash
# From project root:
/sdf-build custrecord_sourcing_tracker "custom record for tracking vendor sourcing by item with fields: vendor (vendor), item (item), model code (text 50 chars), status (list customlist_sourcing_status), buyer (employee default current user), initial contact date (date default today), quote date (date), quoted cost (currency), target cost (currency), moq (integer), lead time days (integer), notes (long text). Project code: csi"
```

### Dependencies
- Custom list `customlist_sourcing_status` must be created first (see [sourcing-status.md](../custom-lists/sourcing-status.md))

### Testing Checklist
- [ ] Create record with all required fields
- [ ] Verify vendor and item lookups populate correctly
- [ ] Test status dropdown shows all values
- [ ] Verify assigned buyer defaults to current user
- [ ] Test date fields default correctly
- [ ] Confirm currency fields display in USD
- [ ] Verify integer fields reject decimal input
- [ ] Test notes field accepts long-form text
- [ ] Verify search results show correct columns
- [ ] Test permissions by role (Purchasing, Sales, Exec)

## Changelog

- **2026-01-30**: Initial specification created from discovery notes (M. Rivera, 2026-01-28)

---

*Last Updated: 2026-01-30*
*Version: 1.0.0*
*Status: Ready for Build*
