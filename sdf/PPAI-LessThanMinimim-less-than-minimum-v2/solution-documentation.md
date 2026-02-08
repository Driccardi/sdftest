# Less Than Minimum (LTM) Order Enforcement

**Version**: 2.0 | **By**: Production Plus AI (PPAI)

---

## Description

The Less Than Minimum (LTM) Order Enforcement solution automates minimum order quantity requirements on NetSuite Sales Orders by applying configurable surcharge fees when line items fall below defined thresholds. Designed for distributors and manufacturers who enforce minimum order quantities or values, the solution validates quantities in real-time and automatically adds "Other Charge" line items to compensate for small order processing costs.

The solution operates at the line-item level, comparing ordered quantities against minimum thresholds configured in the item master. When quantities fall short, the system displays the cost impact to the user and either warns them (allowing confirmation) or enforces the surcharge automatically. Charges can be configured as flat-rate fees or percentage-based calculations, providing flexibility for different pricing strategies. The solution also supports matrix item consolidation, where child variants are summed at the parent level to determine if minimums are met.

Organizations benefit from automated minimum order enforcement without manual intervention, consistent application of pricing policies, improved order profitability on small orders, and full transparency to sales representatives about surcharge impacts during order entry.

---

## Solution Details

### Solution Type
- **Sales & CRM**

### Target Industries
- **Wholesale Distribution** (minimum order values, case quantities)
- **Manufacturing** (bulk order requirements)
- **Retail** (minimum purchase thresholds)

### Dependencies
- None (standalone solution)

---

## Features

### Line-Level Quantity Validation
Monitors each line item on sales orders in real-time, comparing actual quantities against minimum thresholds stored in the item master.

### Automatic Surcharge Application
Adds "Other Charge" line items automatically when quantities fall below minimums, using either flat-rate fees or percentage-based calculations.

### Warning vs. Enforcement Modes
Configurable handling options: "Warn" mode shows confirmation dialogs allowing users to accept or decline charges, while "Enforce" mode applies charges automatically with an informational alert.

### Matrix Item Consolidation
Optionally consolidates quantities across matrix child items at the parent level, enabling minimum quantity checks based on total parent item quantities rather than individual variants.

### Real-Time Cost Impact Display
Shows users the exact surcharge amount during order entry, providing full transparency about the financial impact of below-minimum orders.

### Flexible Charge Calculation
Supports both flat-rate charges (e.g., $50 handling fee) and percentage-based charges (e.g., 10% surcharge on line amount) configured at the item level.

### Configuration Repository
Central LTM Setup custom record stores default charge items, handling preferences, and consolidation options for easy management.

### Dynamic Charge Management
Automatically removes LTM charge lines if quantities are increased to meet minimums, preventing over-charging customers.

---

## Technical Details

### Script Files

**Client Script** (1 file)
- `NSTS_CS_Less_Than_Minimum_Validation_v2.js` (950 lines) - Core validation and UI logic
  - Functions: `pageInit()`, `sublistChanged()`, `validateDelete()`, `saveRecord()`
  - Real-time quantity tracking with matrix consolidation
  - Currency formatting and item management
  - Confirmation dialogs with cost impact display

**Total**: 1 SuiteScript 2.1 Client Script

### Custom Records

**customrecord_ns_ppai_ltm_setup** - LTM Configuration Repository
- Stores solution settings (charge item, warn vs. enforce, matrix consolidation)
- Single instance preconfigured for immediate use

### Workflows
None (all logic in Client Script)

### Custom Fields

**Transaction Body Fields** (4 fields):
- `custbody_ns_ppai_ltm_config` - Links transaction to LTM configuration (defaults to setup record)
- `custbody_ns_ppai_ltm_config_item` - Default "Other Charge" item for LTM fees
- `custbody_ns_ppai_ltm_config_option` - Warn vs. Enforce handling option (from custom list)
- `custbody_ns_ppai_ltm_config_consolidat` - Matrix item quantity consolidation checkbox

**Transaction Column Fields** (4 fields):
- `custcol_ns_ppai_ltm_qty` - Minimum quantity threshold (locked, pulled from item master)
- `custcol_ns_ppai_ltm_item` - References the LTM charge item applied (locked)
- `custcol_ns_ppai_ltm_rate` - Flat-rate charge amount (locked, from item master)
- `custcol_ns_ppai_ltm_percentage` - Percentage-based charge (locked, from item master)
- `custcol_ns_ppai_parentitem` - Parent item reference for matrix consolidation

**Item Master Fields** (3 fields):
- `custitem_ns_ppai_ltm_qty` - Minimum quantity required for this item
- `custitem_ns_ppai_ltm_rate` - Flat LTM surcharge amount
- `custitem_ns_ppai_ltm_percent` - LTM surcharge percentage

### Saved Searches
None

### Other Objects
- **Custom List**: `customlist_ns_ppai_ltm_handling_opt` - 2 values (Warn, Enforce)
- **Custom Form**: `custform_ns_ppai_ltm_setup_form` - LTM Setup data entry form
- **Script Deployment**: Deploys to Sales Order record type, available to all roles
- **UI Components**: Custom center category, center tab, subtab for organization

---

## System Requirements

### NetSuite Version
- **Minimum**: 2023.1 (SuiteScript 2.1 Client Script support)
- **Recommended**: Latest stable release

### NetSuite Edition
- **Required**: N/A (compatible with all editions)

### Required Features
- **Custom Records** (for LTM Setup record)
- **Server-Side Scripting** (for Client Script deployment)

### Optional Features
- **Matrix Items** - Required only if using matrix item consolidation feature

---

## Installation

### Prerequisites
1. NetSuite account with Administrator or Developer role
2. SuiteCloud Development Framework (SDF) CLI installed
3. "Other Charge" type items created for LTM fees
4. Item master populated with minimum quantities where applicable

### Deployment Steps

1. **Navigate to Project**
   ```bash
   cd "sdf/PPAI-LessThanMinimim-less-than-minimum-v2/src"
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
   # Authenticate to TSTDRV2534678 or your target account
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
   - Navigate to LTM Setup custom record (preconfigured instance exists)
   - Set "Default Other Charge Item" to your LTM fee SKU
   - Choose "Warn" or "Enforce" handling option
   - Enable "Consolidate Matrix Items" if using matrix items
   - Populate item master fields for products with minimum quantities:
     - Set `custitem_ns_ppai_ltm_qty` (minimum quantity)
     - Set EITHER `custitem_ns_ppai_ltm_rate` (flat fee) OR `custitem_ns_ppai_ltm_percent` (percentage)
   - Test on a sample sales order to verify behavior

---

## Usage

### Getting Started

After deployment and configuration, the solution works automatically on Sales Orders. When users add items with minimum quantity requirements, the system validates quantities and applies charges as needed.

### Common Workflows

**Sales Order Entry with LTM Enforcement**
1. Sales rep creates new Sales Order
2. Adds item with `custitem_ns_ppai_ltm_qty` = 100 (minimum)
3. Enters quantity = 50 (below minimum)
4. Client Script detects below-minimum quantity
5. System displays dialog: "This item has a minimum quantity of 100. Current quantity: 50. An LTM charge of $25.00 will be applied. Continue?"
6. If "Warn" mode: User clicks OK to accept or Cancel to revise
7. If "Enforce" mode: Alert shown, charge applied automatically
8. "Other Charge" line added with `custcol_ns_ppai_ltm_item` linking to original item
9. If user later increases quantity to 100+, charge line is automatically removed

**Matrix Item Consolidation**
1. Sales order includes matrix child items (e.g., T-shirt sizes S, M, L)
2. Parent item has `custitem_ns_ppai_ltm_qty` = 100
3. Consolidation enabled in LTM Setup
4. System sums all child quantities: S=20, M=30, L=40 = Total 90
5. Total is below minimum of 100
6. Single LTM charge applied for the parent item deficiency

### User Roles

- **Sales Representatives**: Enter orders, receive LTM warnings/alerts, confirm charges
- **Sales Managers**: Configure handling options (warn vs. enforce)
- **Pricing Analysts**: Set minimum quantities and charge rates in item master
- **Administrators**: Manage LTM Setup record, deploy script

---

## Configuration

### Settings

**LTM Setup Custom Record**:
- **Default Other Charge Item**: SKU for LTM surcharge line items
- **Handling Option**: "Warn" (confirmation dialog) or "Enforce" (automatic application)
- **Consolidate Matrix Items**: Checkbox to enable parent-level quantity summing

**Item Master Configuration**:
- **Minimum Quantity** (`custitem_ns_ppai_ltm_qty`): Threshold for LTM enforcement
- **Flat Rate** (`custitem_ns_ppai_ltm_rate`): Fixed dollar amount (e.g., $50)
- **Percentage** (`custitem_ns_ppai_ltm_percent`): Percentage of line amount (e.g., 10 = 10%)

**Note**: Use either flat rate OR percentage, not both. If both are populated, script logic will prioritize one method (typically flat rate).

### Customization

The solution can be extended to support:
- Different LTM thresholds by customer class or price level
- Tiered surcharge amounts based on deficiency magnitude
- Email notifications to sales managers for LTM orders
- Reporting on LTM charge frequency and revenue impact
- Integration with order approval workflows for large LTM charges

---

## Support & Documentation

### Resources
- **Repository**: Local SDF project in `/sdf/PPAI-LessThanMinimim-less-than-minimum-v2/`
- **Documentation**: Internal PPAI documentation

### Contact
- **Manager**: Production Plus AI (PPAI)

---

## Technical Architecture

### Component Overview

```
Sales Order Form Load
    ↓
Client Script: pageInit() - Loads LTM configuration
    ↓
User Adds/Modifies Line Item
    ↓
Client Script: sublistChanged() - Validates quantity vs. minimum
    ↓
Below Minimum Detected
    ↓
Calculate Charge Amount (Flat or Percentage)
    ↓
Display Dialog (Warn Mode) or Alert (Enforce Mode)
    ↓
Add "Other Charge" Line Item with LTM fields populated
    ↓
User Saves Order
    ↓
Client Script: saveRecord() - Final validation, allow save
```

### Data Flow

1. **Configuration Load**: On page init, load LTM Setup record values
2. **Quantity Tracking**: Monitor item sublist for line additions/changes
3. **Threshold Comparison**: Compare actual qty vs. `custcol_ns_ppai_ltm_qty`
4. **Matrix Consolidation** (if enabled): Sum child item quantities by parent
5. **Charge Calculation**: Apply flat rate or percentage formula
6. **UI Interaction**: Show confirmation or alert with cost impact
7. **Line Management**: Add/update/remove LTM charge lines dynamically
8. **Persistence**: Store popped line history in `custbody_ns_acc_poppedlines` to prevent duplicate prompts

### Integration Points

- **Sales Orders**: Primary transaction type for LTM enforcement
- **Item Master**: Source of minimum quantities and charge rates
- **LTM Setup Record**: Central configuration for handling options
- **Other Charge Items**: Line items added for surcharges
- **Matrix Items**: Parent-child relationships for consolidation (if applicable)

---

## Changelog

### Version 2.0 (Current Release)
- Client Script rewritten for improved performance (950 lines)
- Matrix item consolidation support added
- Real-time cost impact display in dialogs
- Configuration repository via LTM Setup custom record
- Warn vs. Enforce mode selection
- 20 custom objects deployed (fields, lists, forms, scripts)
- Production-ready for Test Drive account TSTDRV2534678

### Version 1.0 (Legacy)
- Initial release with basic LTM enforcement

---

## Credits

**Developed by**: Production Plus AI (PPAI) - aanchaud
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: 2026-02-04
**Script Version**: 1.00 (September 2025)
