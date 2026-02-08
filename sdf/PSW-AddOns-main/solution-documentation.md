# Add-Ons & Accessories Upsell Pop-up

**Version**: 1.0 | **By**: NetSuite Professional Services

---

## Description

The Add-Ons & Accessories Upsell Pop-up solution transforms sales order entry into an intelligent cross-selling opportunity by automatically recommending complementary accessories when primary items are added. Designed for fashion retail, eyewear, and consumer goods industries, the solution displays an interactive pop-up window with relevant add-on products (cases, lens cleaners, display stands) that sales representatives can add to orders with a single click.

The solution uses a flexible configuration model where accessories can be mapped either to specific parent items or to entire item classes, enabling both product-specific and category-wide recommendations. Price-aware filtering ensures that accessories are only suggested when the order value falls within configured minimum and maximum price thresholds, allowing for tiered upsell strategies. The system tracks parent-child relationships between main items and add-ons, preventing accidental deletion of parent items that would orphan attached accessories.

Organizations benefit from increased average order values through automated upsell prompts, consistent accessory attachment across the sales team, prevented order entry errors through relationship validation, and comprehensive reporting on add-on performance and attachment rates.

---

## Solution Details

### Solution Type
- **Sales & CRM**

### Target Industries
- **Retail** (fashion accessories, eyewear, consumer electronics)
- **Wholesale Distribution** (product bundles and accessories)

### Dependencies
- None (standalone solution)

---

## Features

### Contextual Accessory Recommendations
Displays relevant add-on products automatically when primary items are added to sales orders, based on item-specific or class-level configuration.

### Interactive Pop-up Interface
Clean, user-friendly pop-up window with product names, descriptions, and one-click "Add" buttons with quantity inputs for fast order entry.

### Price-Aware Filtering
Configurable minimum and maximum price thresholds ensure accessories are only suggested for orders within target value ranges, enabling tiered upsell strategies.

### Item-Level or Class-Level Configuration
Flexible setup allows mapping accessories to individual parent items or entire item classes, supporting both specific and broad recommendation strategies.

### Parent-Child Relationship Tracking
Maintains line-level relationships between parent items and attached add-ons using custom line keys, enabling accurate reporting and preventing orphaned accessories.

### Duplicate Pop-up Prevention
Optional "Pop Once" parameter prevents repeated pop-ups for the same line item, improving user experience during order modifications.

### Deletion Protection
Prevents users from deleting parent line items that have associated add-ons, ensuring order integrity and preventing incomplete orders.

### SuiteQL-Based Dynamic Queries
Uses advanced SuiteQL queries to efficiently retrieve matching accessories based on parent item, class, price level, and price range constraints.

### Multi-Channel Compatibility
Works across all sales channels (e-commerce, mobile, in-store, phone) configured in NetSuite with price level awareness.

### Workflow-Managed Configuration
Custom workflow ensures proper field visibility and mutual exclusivity between parent item and parent class selection in the add-on configuration record.

---

## Technical Details

### Script Files

**Total**: 2 SuiteScript 2.1 files

**Client Script** (1 file):
- `accessorypop.js` - Manages pop-up trigger logic, line item validation, parent-child relationships
  - Functions: Field validation, line deletion prevention, parent key generation, popped line tracking

**Suitelet** (1 file):
- `ns_su_accessories.js` - Renders pop-up HTML form with accessories, SuiteQL queries for matching products
  - Generates interactive "Add" buttons with quantity inputs
  - Returns no UI if no accessories match criteria (auto-closes window)

### Custom Records

**customrecord_drss_accessories** - Add-On Configuration Repository

**Fields**:
- `custrecord_drss_accessoryitem` (SELECT) - Which item is the accessory
- `custrecord_drss_parentitem` (SELECT) - Parent item that triggers this accessory (mutually exclusive with class)
- `custrecord_drss_parentclass` (MULTISELECT) - Item classes that trigger this accessory (mutually exclusive with item)
- `custrecord_drss_accessoryprice` (SELECT) - Price level association
- `custrecord_drss_minprice` (CURRENCY) - Minimum order price threshold
- `custrecord_drss_maxprice` (CURRENCY) - Maximum order price threshold

### Workflows

**customworkflow_nsps_addonmanager** - Add-On Configuration Workflow
- Enforces mutual exclusivity between parent item and parent class selection
- Sets price level field mandatory on record creation
- Manages field visibility and validation messages

### Custom Fields

**Item Field** (1):
- `custitem_ns_accessorypopup` (CHECKBOX) - Flags items that should trigger the accessory pop-up

**Transaction Body Field** (1):
- `custbody_ns_acc_poppedlines` (CLOBTEXT) - Stores JSON array of line keys that have shown pop-ups (hidden field for persistence)

**Transaction Column Fields** (3):
- `custcol_ns_lineparentkey` (TEXT) - Unique timestamp-based identifier for each line (LOCKED)
- `custcol_ns_linechildkey` (TEXT) - Links add-on items to their parent line (LOCKED)
- `custcol_ns_addonparent` (SELECT) - References the parent item ID (visible for reporting)

### Saved Searches

**customsearch_ns_addonsublist** - Displays accessories in custom record list view

### Other Objects
- **Script Deployments** (2): Client Script and Suitelet deployments
- **Custom Import** (1): System-generated import definition

---

## System Requirements

### NetSuite Version
- **Minimum**: 2022.1 (for SuiteQL support)
- **Recommended**: Latest stable release

### NetSuite Edition
- **Required**: N/A (compatible with all editions)

### Required Features
- **Custom Records**
- **Server-Side Scripting**
- **Classes** (for class-level accessory mapping)
- **Multi-Price Levels** (for price-aware filtering)
- **Workflow Engine**

---

## Installation

### Prerequisites
1. NetSuite account with Administrator or Developer role
2. SDF CLI installed
3. Item classes configured (if using class-level mapping)
4. Price levels configured for target channels

### Deployment Steps

1. **Navigate to Project**
   ```bash
   cd "sdf/PSW-AddOns-main/add-ons/src"
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
   # Use auth ID: 8272468-Adm-Prod
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
   - Create Add-On configuration records (`customrecord_drss_accessories`):
     - Select accessory item
     - Choose EITHER parent item OR parent class (mutually exclusive)
     - Set price level (mandatory)
     - Optionally set min/max price thresholds
   - Flag primary items with `custitem_ns_accessorypopup` checkbox
   - Test on a sample sales order
   - Configure "Pop Once" script parameter if desired

---

## Usage

### Common Workflows

**Sales Order Entry with Add-On Pop-up**
1. Sales rep creates new Sales Order
2. Adds item with `custitem_ns_accessorypopup` = TRUE (e.g., sunglasses)
3. Client Script triggers pop-up window via Suitelet
4. Pop-up displays matching accessories (sunglass case, lens cleaner, display stand)
5. Rep clicks "Add" button next to desired accessories, adjusts quantities
6. Accessories added as child lines with `custcol_ns_linechildkey` linking to parent
7. If rep tries to delete parent item, system prevents deletion (error message)
8. Order saved with parent-child relationships intact

**Class-Level Accessory Configuration**
1. Admin creates Add-On record for "Lens Cleaner"
2. Selects parent class = "Eyewear"
3. Sets price level and price range ($50-$500)
4. Any eyewear item added to SO (within price range) triggers lens cleaner pop-up

### User Roles

- **Sales Representatives**: Enter orders, interact with pop-ups, add accessories
- **Sales Managers**: Review add-on attachment rates, configure pop-up behavior
- **Merchandising Team**: Configure accessory mappings, set price thresholds
- **Administrators**: Manage Add-On records, deploy scripts, configure workflows

---

## Configuration

### Settings

**Add-On Configuration Records**:
- **Accessory Item**: The item to suggest (e.g., sunglass case SKU)
- **Parent Item**: Specific item that triggers this accessory (mutually exclusive with class)
- **Parent Class**: Item class that triggers this accessory (mutually exclusive with item)
- **Price Level**: Price level for accessory (base, MSRP, wholesale, etc.)
- **Min/Max Price**: Order value range for displaying this accessory

**Script Parameters**:
- **Pop Once**: Checkbox to prevent duplicate pop-ups for same line (configurable in script deployment)

**Item Master**:
- **Add-On Pop-up Checkbox** (`custitem_ns_accessorypopup`): Enable on items that should trigger pop-ups

### Customization

The solution can be extended to support:
- Customer-specific accessory recommendations
- Quantity-based triggers (e.g., pop-up only for orders of 10+ units)
- Multi-tiered recommendations (primary and secondary accessories)
- Reporting on add-on attachment rates and revenue impact
- Integration with inventory availability checks
- Mobile-optimized pop-up interfaces

---

## Technical Architecture

### Component Overview

```
Sales Order Line Item Added
    ↓
Client Script: accessorypop.js (validateLine event)
    ↓
Check if item has custitem_ns_accessorypopup = TRUE
    ↓
Generate unique line parent key (timestamp-based)
    ↓
Open Pop-up Window → Suitelet: ns_su_accessories.js
    ↓
SuiteQL Query: Find matching accessories
    - By parent item OR parent class
    - Filter by price level
    - Filter by min/max price range
    ↓
Render HTML Form with Accessories and "Add" Buttons
    ↓
User Clicks "Add" → Accessories added as child lines
    ↓
Client Script: Populate custcol_ns_linechildkey (link to parent)
    ↓
User Tries to Delete Parent → Client Script Prevents Deletion
```

### Integration Points

- **Sales Orders**: Primary transaction type for add-on attachments
- **Item Master**: Source of accessory items and pop-up flags
- **Add-On Configuration Records**: Central repository of accessory mappings
- **Price Levels**: Price-aware filtering for accessory suggestions
- **Item Classes**: Class-level accessory recommendations
- **Workflow Engine**: Configuration record field validation

---

## Changelog

### Version 1.0
- 2 SuiteScript files (Client Script, Suitelet)
- 12 custom objects (records, fields, workflows, searches, scripts)
- SuiteQL-based dynamic accessory queries
- Price-aware filtering with min/max thresholds
- Item-level and class-level configuration support
- Parent-child relationship tracking
- Deletion protection for parent items
- Pop-once functionality
- Production-ready for account 8272468

---

## Credits

**Developed by**: NetSuite Professional Services (DRSS namespace)
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: 2026-02-04
**Use Case**: Fashion retail, eyewear, consumer goods upselling
