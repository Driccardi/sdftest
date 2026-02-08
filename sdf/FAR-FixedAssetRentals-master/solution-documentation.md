# Fixed Asset Rentals (FAR)

**Version**: 1.0 | **By**: NetSuite Professional Services

---

## Description

Fixed Asset Rentals (FAR) is a comprehensive solution that bridges NetSuite's Fixed Asset Management (FAM) module with real-time serialized inventory tracking for rental operations. Designed for companies that rent equipment, bottles, containers, or other fixed assets to customers, FAR automates the entire rental lifecycle from initial asset creation through customer assignment, fulfillment, return, and eventual disposal.

The solution solves critical pain points in rental asset management: preventing double-booking of assets, maintaining accurate inventory counts by location, tracking customer deposits and liabilities, and reconciling physical assets with system records. FAR automatically creates inventory adjustments when assets enter or leave the rental pool, validates that assets aren't assigned to multiple customers simultaneously, and clears customer assignments upon fulfillment to prepare assets for the next rental cycle.

Organizations gain real-time visibility into rental asset availability, automated batch disposal processing for retired equipment, and comprehensive audit trails linking fixed assets to inventory transactions. The solution supports multi-subsidiary operations with cross-subsidiary transfer validation and location-based inventory tracking.

---

## Solution Details

### Solution Type
- **Inventory & Warehouse**

### Target Industries
- **Wholesale Distribution** (bottle/keg rentals)
- **Manufacturing** (equipment rentals)
- **Retail** (rental inventory management)

### Dependencies
- **NetSuite Fixed Asset Management (FAM)** - Core asset record structure and depreciation tracking

---

## Features

### Asset-to-Inventory Bridge
Automatically synchronizes FAM asset records with serialized inventory, creating inventory adjustments when rental assets are added to or removed from the available pool.

### Duplicate Rental Prevention
Client-side validation on Sales Orders and Return Authorizations prevents users from assigning the same item-customer combination multiple times, eliminating double-booking errors.

### Automated Lifecycle Tracking
User Event scripts trigger on asset creation/deletion to maintain inventory accuracy, creating +1 adjustments for new assets and -1 adjustments upon disposal.

### Batch Disposal Processing
Map/Reduce script efficiently processes large volumes of retired assets, creating inventory adjustments and marking disposal status for financial reporting.

### Customer Assignment Management
Automatically clears customer assignments from assets when Item Fulfillments or Invoices are created, returning assets to the available rental pool.

### Multi-Subsidiary Validation
Validates cross-subsidiary inventory transfers with configurable rules to prevent invalid inter-company asset movements.

### Serial Number Tracking
Maintains detailed serial number records through all inventory transactions, enabling precise asset location and status tracking.

### Route Manifest Integration
Designed to integrate with route delivery systems for bottle exchange and equipment swap workflows.

---

## Technical Details

### Script Files

**Library Module** (1 file)
- `NSCreateInventory.js` - Reusable library for creating/updating inventory adjustment records with serial number and location support

**Client Scripts** (1 file)
- `NSTS_CS_Transaction_Item_And_Customer_On_FAM.js` - Validates against duplicate item-customer assignments on SO/RMA

**User Event Scripts** (3 files)
- `NSTS_FA_Inventory_Item_Creation.js` - Creates inventory adjustments when FAM assets are created/deleted (afterSubmit)
- `NSTS_UE_Nullify_Customer_Location.js` - Clears customer assignments on Item Receipts, Item Fulfillments, and Invoices (afterSubmit)
- `NSTS_UE_Validate_Cross_Subsidiaries.js` - Validates subsidiary matching on Intercompany Transfer Orders (beforeSubmit)

**Map/Reduce Scripts** (1 file)
- `NSTS_MR_FA_Asset_Disposal.js` - Batch processes disposed assets, creating inventory adjustments and marking disposal status

**Total**: 6 SuiteScript 2.x files

### Custom Records
None (leverages existing FAM custom records)

### Workflows
None (workflow logic handled via scripts)

### Custom Fields
None (uses standard FAM fields and native NetSuite fields)

### Saved Searches
- **customsearch_ns_fam_asset_search** - Identifies FAM assets marked for disposal (used by Map/Reduce script)

### Other Objects
- **Script Deployments**: 5 deployment XMLs for client, user event, and map/reduce scripts
- **Script Parameters**: Location selector, adjustment account, subsidiary, search reference, cross-sub flag

---

## System Requirements

### NetSuite Version
- **Minimum**: 2020.2 (SuiteScript 2.1 support)
- **Recommended**: Latest stable release

### NetSuite Edition
- **Required**: OneWorld (multi-subsidiary support)

### Required Features
- **Fixed Asset Management (FAM)**
- **Multi-Location Inventory**
- **Server-Side Scripting**
- **Subsidiaries**
- **Accounting**
- **CRM** (optional, enhances customer assignment tracking)

### Optional Features
- **Advanced Inventory** - Enhances serial number tracking capabilities

---

## Installation

### Prerequisites
1. NetSuite OneWorld account with FAM enabled
2. Administrator or Developer role access
3. SuiteCloud Development Framework (SDF) CLI installed
4. Fixed Asset Management configuration complete (asset types, depreciation methods)
5. Inventory locations configured
6. Serialized inventory items created for rental assets

### Deployment Steps

1. **Navigate to Project**
   ```bash
   cd "sdf/FAR-FixedAssetRentals-master/src"
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
   # Follow prompts to authenticate
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
   - Configure script parameter `custscript_ns_location_param` to default rental location
   - Set `custscript_ns_fam_adj_acc_param` to inventory adjustment GL account
   - Configure `custscript_ns_fam_subsidiary` for multi-sub deployments
   - Update `custscript_is_cross_sub` checkbox if cross-subsidiary transfers are allowed
   - Test asset creation workflow to verify inventory adjustment creation
   - Configure FAM asset types with serialized inventory item mappings

---

## Usage

### Getting Started

After deployment, create or import FAM asset records for your rental inventory. The solution will automatically create corresponding inventory adjustments and track assets through their lifecycle.

### Common Workflows

**Adding New Rental Assets**
1. Create FAM asset record with rentable flag enabled
2. Assign serial number and asset type
3. User Event script triggers and creates +1 inventory adjustment automatically
4. Asset becomes available in rental pool with serialized inventory tracking

**Renting Assets to Customers**
1. Create Sales Order for customer
2. Add rental item to line items
3. Client Script validates no duplicate item-customer combinations exist
4. Sales Order is saved and fulfilled
5. Item Fulfillment triggers User Event that clears customer assignment
6. Asset returns to available pool for next rental

**Processing Asset Returns**
1. Create Return Authorization or Item Receipt
2. System identifies assets associated with customer
3. User Event clears customer assignment upon transaction save
4. Asset is available for next rental

**Batch Disposing Retired Assets**
1. Mark FAM assets with disposal status
2. Run Map/Reduce script `customscript_ns_mr_fa_asset_disposal`
3. Script processes all disposed assets found by saved search
4. Creates -1 inventory adjustments for each disposed asset
5. Marks assets as disposal adjustment created

### User Roles

- **Warehouse Staff**: Create/receive assets, process fulfillments and returns
- **Sales Representatives**: Create rental orders, view available asset inventory
- **Finance Team**: Run disposal scripts, review inventory adjustments and GL impacts
- **Administrators**: Configure script parameters, manage locations and subsidiaries

---

## Configuration

### Settings

**Script Parameters**:
- **Location Parameter** (`custscript_ns_location_param`): Default warehouse/location for inventory adjustments
- **FAM Asset Search** (`custscript_ns_fam_asset_search_param`): Saved search identifying disposed assets
- **Adjustment Account** (`custscript_ns_fam_adj_acc_param`): GL account for inventory adjustments
- **Subsidiary** (`custscript_ns_fam_subsidiary`): Operating subsidiary for transactions
- **Cross-Subsidiary Flag** (`custscript_is_cross_sub`): Enable/disable cross-subsidiary transfer validation

**FAM Configuration**:
- Configure FAM asset types with corresponding serialized inventory items
- Set up depreciation methods for rental assets
- Define asset status values (e.g., Available, Rented, Disposed, Damaged)

### Customization

The solution can be extended to support:
- Custom rental pricing workflows
- Damage assessment and repair tracking
- Deposit liability management
- Route driver check-in/check-out workflows
- Customer deposit credit application

---

## Support & Documentation

### Resources
- **Repository**: Local SDF project in `/sdf/FAR-FixedAssetRentals-master/`
- **Documentation**: NetSuite Fixed Asset Management documentation
- **Issues**: Track deployment and configuration issues in your issue management system

### Contact
- **Manager**: NetSuite Professional Services

---

## Technical Architecture

### Component Overview

```
FAM Asset Record (Create/Delete)
    ↓
User Event: NSTS_FA_Inventory_Item_Creation
    ↓
Library: NSCreateInventory.createInventoryAdjustment()
    ↓
Inventory Adjustment Record (+1 or -1 qty with serial#)
    ↓
Serialized Inventory by Location

Sales Order → Item Fulfillment
    ↓
User Event: NSTS_UE_Nullify_Customer_Location
    ↓
Clear Customer Assignment on FAM Asset
    ↓
Asset Available for Next Rental

Disposed Assets
    ↓
Saved Search: customsearch_ns_fam_asset_search
    ↓
Map/Reduce: NSTS_MR_FA_Asset_Disposal
    ↓
Batch Create Inventory Adjustments (-1 qty)
```

### Data Flow

1. **Asset Creation**: FAM asset created → User Event triggers → Inventory adjustment (+1) created → Serial# tracked by location
2. **Rental Assignment**: SO created with item/customer → Client Script validates no duplicates → Customer assigned to asset
3. **Fulfillment**: Item Fulfillment created → User Event triggers → Customer cleared from asset → Asset available
4. **Disposal**: Assets marked for disposal → Map/Reduce batch processes → Inventory adjustments (-1) created → Assets removed from pool

### Integration Points

- **FAM Asset Records** (`customrecord_ncfar_asset`): Source of truth for rental assets
- **FAM Asset Types** (`customrecord_ncfar_assettype`): Links assets to inventory items
- **Sales Orders**: Customer assignment and rental order creation
- **Item Fulfillments**: Trigger customer assignment clearing
- **Item Receipts**: Trigger customer assignment clearing on returns
- **Invoices**: Trigger customer assignment clearing
- **Inventory Adjustments**: Automatically created for all asset lifecycle events
- **Transfer Orders**: Cross-subsidiary validation (if enabled)

---

## Changelog

### Version 1.0
- Initial release with 6 SuiteScript files
- Asset lifecycle automation (create, assign, fulfill, dispose)
- Duplicate rental prevention
- Batch disposal processing
- Multi-subsidiary support
- Serial number tracking
- FAM integration complete

---

## Credits

**Developed by**: NetSuite Professional Services
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: 2026-02-04
