# Fixed Asset Rentals (FAR)
## NetSuite Solution Documentation

---

## Executive Summary

**Solution Name:** Fixed Asset Rentals (FAR)
**Solution Type:** Fixed Asset Management Extension
**Version:** 1.0
**Industry Focus:** Equipment Rental, Asset Leasing, Industrial Equipment Rental

### Overview

Fixed Asset Rentals (FAR) is a comprehensive NetSuite customization that bridges the gap between Fixed Asset Management (FAM) and Inventory Management for companies that rent or lease physical assets to customers. The solution enables dual-tracking of assets as both fixed assets (for depreciation and book value) and serialized inventory items (for rental operations and customer assignments).

### Value Proposition

Companies that rent equipment face a unique challenge: assets must be tracked as fixed assets for accounting and depreciation purposes, while simultaneously being managed as inventory for rental operations. Manual synchronization between FAM and Inventory is error-prone and time-consuming.

Fixed Asset Rentals solves this problem by:
- **Automated Dual Tracking**: Automatically creates serialized inventory items from FAM assets when flagged as rentable
- **Preventing Double Bookings**: Client-side validation ensures rental assets aren't assigned to multiple customers
- **Simplified Returns Processing**: Automatically updates asset availability when customers return equipment
- **Streamlined Disposals**: Batch processes disposed assets to remove from inventory while maintaining accounting accuracy
- **Subsidiary Compliance**: Enforces same-subsidiary constraints to prevent accounting errors in multi-subsidiary environments
- **Serial Number Integrity**: Maintains serial number tracking from asset acquisition through rental lifecycle to disposal

---

## Solution Architecture

### Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    FAM Asset Record                              │
│              (customrecord_ncfar_asset)                          │
│                                                                   │
│  - custrecord_asset_rentable [CHECKBOX]                          │
│  - custrecord_assetserialno [TEXT]                               │
│  - custrecord_assettype [LIST] ──────────────┐                   │
│  - custrecord_assetcost [CURRENCY]           │                   │
│  - custrecord_assetsubsidiary [LIST]         │                   │
│  - custrecord_asset_itemlink [LIST] ─────┐   │                   │
│  - custrecord_asset_customer [LIST]      │   │                   │
│  - custrecordnsps_disp_adj_created [CHK] │   │                   │
└──────────────────────────────────────────┼───┼───────────────────┘
                                           │   │
                    ┌──────────────────────┘   │
                    │                          │
                    ▼                          ▼
    ┌───────────────────────────┐  ┌──────────────────────────────┐
    │ Serialized Inventory Item │  │  Asset Type Mapping          │
    │                           │  │  (custom record)             │
    │ - Serial Number           │  │                              │
    │ - Subsidiary              │  │ - custrecord_serialized_     │
    │ - Location                │  │   inv_item [LIST]            │
    │ - Customer (via txn)      │  │ - custrecord_inv_adj_acct    │
    └───────────────┬───────────┘  │   [LIST]                     │
                    │              └──────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────┐
    │ Inventory Adjustment      │
    │                           │
    │ - custbody_fam_asset_     │
    │   record [LIST]           │
    │ - Account                 │
    │ - Subsidiary              │
    │ - Location                │
    │ - Serial Number (detail)  │
    │ - Quantity (+1 or -1)     │
    └───────────────────────────┘
```

### Process Flow Diagram

```
[1. Asset Creation]
        │
        ▼
[Flag as Rentable] ─────► [User Event: Inv Item Create]
        │                           │
        │                           ▼
        │                   [Lookup Asset Type Mapping]
        │                           │
        │                           ▼
        │                   [Create Inv Adjustment +1]
        │                           │
        ▼                           ▼
[FAM Asset Record] ◄──── [Update asset_itemlink]
        │
        ▼
[2. Customer Rental]
        │
        ▼
[Sales Order Entry] ─────► [Client Script: Validate]
        │                           │
        │                           ▼
        │                   [Check for duplicate assignment]
        │                           │
        │                   [Allow if no conflict]
        │                           │
        ▼                           ▼
[Update asset_customer] ◄─── [Item Fulfillment]
        │
        ▼
[3. Customer Return]
        │
        ▼
[Item Receipt / RMA] ─────► [User Event: Nullify Customer]
        │                           │
        │                           ▼
        │                   [Search FAM assets by customer+items]
        │                           │
        ▼                           ▼
[Clear asset_customer] ◄──── [Asset marked available]
        │
        ▼
[4. Asset Disposal]
        │
        ▼
[Change FAM Status] ─────► [Map/Reduce: Asset Disposal]
        │                           │
        │                           ▼
        │                   [Search disposed assets]
        │                           │
        │                           ▼
        │                   [Create Inv Adjustment -1]
        │                           │
        ▼                           ▼
[Set disp_adj_created] ◄──── [Remove from inventory]
```

---

## Custom Records

### 1. FAM Asset Record (`customrecord_ncfar_asset`)

**Source:** NetSuite Fixed Asset Management (FAM) module
**Extended By:** FAR solution with rental-specific fields

**Purpose:** Core fixed asset record extended to support rental operations. Tracks asset depreciation, book value, and accounting while enabling rental-specific workflows.

**Key Fields:**

#### Rental-Specific Fields (Added by FAR)

| Field Script ID | Label | Type | Description |
|----------------|-------|------|-------------|
| `custrecord_asset_rentable` | Rentable | Checkbox | Flags asset as available for rental. When checked, triggers automatic inventory item creation. |
| `custrecord_asset_itemlink` | Linked Inventory Item | List/Record | Reference to serialized inventory item created from this asset. Populated automatically by User Event script. |
| `custrecord_asset_customer` | Customer | List/Record | Customer currently assigned to this rental asset. Populated on sales order, cleared on return. |
| `custrecordnsps_disp_adj_created` | Disposal Adjustment Created | Checkbox | Flag indicating disposal inventory adjustment was created. Prevents reprocessing by Map/Reduce script. |

#### Standard FAM Fields (Required by FAR)

| Field Script ID | Label | Type | Description |
|----------------|-------|------|-------------|
| `custrecord_assetserialno` | Serial Number | Text | Serial number for tracking. **Required** for inventory creation. |
| `custrecord_assettype` | Asset Type | List/Record | Link to Asset Type. **Required** to lookup asset type mapping. |
| `custrecord_assetcost` | Asset Cost | Currency | Original acquisition cost. Used for initial inventory adjustment amount. |
| `custrecord_assetcurrentcost` | Current Cost | Currency | Current book value after depreciation. |
| `custrecord_assetsubsidiary` | Subsidiary | List/Record | Asset subsidiary. **Required** for multi-subsidiary environments. |
| `custrecord_assetstatus` | Asset Status | List | Asset status (Active, Disposed, etc.). Used by disposal search. |
| `custrecord_assetlifetime` | Asset Lifetime | Integer | Useful life in months for depreciation. |
| `custrecord_assetaccmethod` | Depreciation Method | List/Record | Depreciation calculation method. |
| `custrecord_componentof` | Component Of | List/Record | Parent asset if this is a component. |
| `custrecord_ncfar_quantity` | Quantity | Integer | Asset quantity. |
| `custrecord_assetdescr` | Description | Text | Asset description. |

**Record Lifecycle:**

1. **Creation**: FAM asset created with standard fields (type, serial, subsidiary, cost)
2. **Rental Enablement**: custrecord_asset_rentable checked → triggers inventory creation
3. **Inventory Linkage**: custrecord_asset_itemlink populated with serialized inventory item ID
4. **Customer Assignment**: custrecord_asset_customer set when rented
5. **Return Processing**: custrecord_asset_customer cleared when returned
6. **Disposal**: custrecord_assetstatus = Disposed → triggers disposal Map/Reduce
7. **Disposal Completion**: custrecordnsps_disp_adj_created = true → prevents reprocessing

---

### 2. Asset Type Mapping (`customrecord_ns_asset_type_mapping`)

**Purpose:** Configuration record mapping FAM asset types to their corresponding serialized inventory items and accounting configuration.

**Key Fields:**

| Field Script ID | Label | Type | Description |
|----------------|-------|------|-------------|
| `custrecord_serialized_inv_item` | Serialized Inventory Item | List/Record | **Required**. Serialized inventory item to create when assets of this type are marked rentable. Must be pre-created. |
| `custrecord_inv_adj_acct` | Inventory Adjustment Account | List/Record | **Required**. GL account for inventory adjustments. Used when creating/disposing inventory. |

**Configuration Example:**

| Asset Type | Serialized Inventory Item | Inventory Adjustment Account |
|-----------|---------------------------|------------------------------|
| Construction Equipment - Excavator | Rental Excavator (Serial) | 5000 - Inventory Asset |
| Event Equipment - Sound System | Rental Sound System (Serial) | 5000 - Inventory Asset |
| Medical Equipment - Ventilator | Rental Ventilator (Serial) | 5010 - Medical Equipment Inventory |

**Setup Requirements:**
1. Create serialized inventory item records first
2. Create asset type mapping records
3. Link asset type (from FAM) to serialized inventory item
4. Specify GL account for inventory movements
5. Ensure subsidiary assignments match between FAM assets and inventory items

---

### 3. FAM Asset Type (`customrecord_ncfar_assettype`)

**Source:** NetSuite Fixed Asset Management (FAM)
**Purpose:** Classification of asset types for depreciation and reporting

---

### 4. Depreciation Method (`customrecord_ncfar_deprmethod`)

**Source:** NetSuite Fixed Asset Management (FAM)
**Purpose:** Defines depreciation calculation methods (straight-line, declining balance, etc.)

---

## Scripts and Automation

### Core Scripts

#### 1. NS|UE|FA Inventory Item Creation (`customscript_ns_ue_inv_item_create`)

**Type:** User Event Script
**File:** `NSTS_FA_Inventory_Item_Creation.js`
**API Version:** 2.1
**Record Type:** `customrecord_ncfar_asset`

**Purpose:** Automatically creates serialized inventory items when FAM assets are marked as rentable, and removes inventory when assets are deleted.

**Event Types:**
- **afterSubmit (create)**: Creates inventory when new rentable asset is created
- **afterSubmit (delete)**: Removes inventory when asset is deleted

**Workflow:**

```javascript
// Simplified logic flow
afterSubmit(context) {
  if (context.type === 'create' || context.type === 'delete') {
    // 1. Load current FAM asset record
    let asset = record.load({ type: context.newRecord.type, id: context.newRecord.id });

    // 2. Extract rental-specific fields
    let isRentable = asset.getValue('custrecord_asset_rentable');
    let serialNumber = asset.getValue('custrecord_assetserialno');
    let assetType = asset.getValue('custrecord_assettype');
    let amount = asset.getValue('custrecord_assetcurrentcost');
    let subsidiary = asset.getValue('custrecord_assetsubsidiary');

    // 3. Validate required fields
    if (isRentable && serialNumber && assetType) {

      // 4. Lookup asset type mapping
      let mapping = search.lookupFields({
        type: 'customrecord_ns_asset_type_mapping',
        id: assetType,
        columns: ['custrecord_serialized_inv_item', 'custrecord_inv_adj_acct']
      });

      let serializedItemId = mapping.custrecord_serialized_inv_item[0].value;
      let adjustmentAccount = mapping.custrecord_inv_adj_acct[0].value;

      // 5. Get location from script parameter
      let location = runtime.getCurrentScript().getParameter('custscript_ns_location_param');

      // 6. Create inventory adjustment
      if (context.type === 'delete') {
        // Negative adjustment to remove from inventory
        createInventoryAdjustment({
          assetId: asset.id,
          account: adjustmentAccount,
          subsidiary: subsidiary,
          itemId: serializedItemId,
          location: location,
          serialNumber: serialNumber,
          amount: amount,
          quantity: -1  // Remove from stock
        });
      } else {
        // Positive adjustment to add to inventory
        let invAdjId = createInventoryAdjustment({
          assetId: asset.id,
          account: adjustmentAccount,
          subsidiary: subsidiary,
          itemId: serializedItemId,
          location: location,
          serialNumber: serialNumber,
          amount: amount,
          quantity: 1  // Add to stock
        });

        // 7. Update asset with inventory item link
        asset.setValue('custrecord_asset_itemlink', serializedItemId);
        asset.save();
      }
    }
  }
}
```

**Script Parameters:**

| Parameter ID | Label | Type | Required | Description |
|-------------|-------|------|----------|-------------|
| `custscript_ns_location_param` | Location | SELECT (Location) | Yes | Default location for inventory adjustments. All rental inventory will be added to this location. |

**Deployment:**
- **Deployment ID:** `customdeploy_ns_ue_inv_item_create`
- **Record Type:** `customrecord_ncfar_asset`
- **Status:** TESTING
- **Execution Context:** All contexts
- **Log Level:** DEBUG

**Key Functions:**
- Validates rentable flag, serial number, and asset type are present
- Looks up asset type mapping to get serialized inventory item
- Calls NSCreateInventory module to create adjustment
- Updates asset with custrecord_asset_itemlink reference

**Error Handling:**
- Logs errors with full context
- Script fails gracefully if mapping doesn't exist
- Validates all required fields before processing

---

#### 2. NS|MR|FA Asset Disposal (`customscript_ns_mr_fa_asset_disposal`)

**Type:** Map/Reduce Script
**File:** `NSTS_MR_FA_Asset_Disposal.js`
**API Version:** 2.1

**Purpose:** Batch processes disposed FAM assets to automatically create negative inventory adjustments, removing serialized items from stock.

**Map/Reduce Stages:**

**getInputData:**
```javascript
getInputData() {
  // Returns saved search ID from script parameter
  let searchId = runtime.getCurrentScript()
    .getParameter('custscript_ns_fam_asset_search_param');

  return {
    type: 'search',
    id: searchId  // customsearch_ns_fam_asset_search
  };
}
```

**reduce:**
```javascript
reduce(context) {
  // 1. Parse asset data from search results
  let asset = JSON.parse(context.values[0]);
  let assetId = asset.id;
  let assetType = asset.values.custrecord_assettype.value;
  let amount = asset.values.custrecord_assetcost;
  let serialNumber = asset.values.custrecord_assetserialno;
  let subsidiary = asset.values.custrecord_assetsubsidiary.value;

  // 2. Validate required fields
  if (serialNumber && assetType) {

    // 3. Lookup asset type mapping
    let mapping = search.lookupFields({
      type: 'customrecord_ns_asset_type_mapping',
      id: assetType,
      columns: ['custrecord_serialized_inv_item', 'custrecord_inv_adj_acct']
    });

    let serializedItemId = mapping.custrecord_serialized_inv_item[0].value;
    let adjustmentAccount = mapping.custrecord_inv_adj_acct[0].value;

    // 4. Get location from script parameter
    let location = runtime.getCurrentScript()
      .getParameter('custscript_ns_location_parameter');

    // 5. Create negative inventory adjustment
    if (serializedItemId && location && subsidiary) {
      let invAdjId = createInventoryAdjustment({
        assetId: assetId,
        account: adjustmentAccount,
        subsidiary: subsidiary,
        itemId: serializedItemId,
        location: location,
        serialNumber: serialNumber,
        amount: amount,
        quantity: -1  // Remove from stock
      });

      // 6. Flag asset as processed
      let assetRec = record.load({
        type: 'customrecord_ncfar_asset',
        id: assetId
      });
      assetRec.setValue('custrecordnsps_disp_adj_created', true);
      assetRec.save();
    }
  }
}
```

**Script Parameters:**

| Parameter ID | Label | Type | Required | Description |
|-------------|-------|------|----------|-------------|
| `custscript_ns_fam_asset_search_param` | FAM Asset Search Param | SELECT (Saved Search) | Yes | Saved search returning disposed assets needing inventory removal. Default: `customsearch_ns_fam_asset_search` |
| `custscript_ns_location_parameter` | Location | SELECT (Location) | Yes | Location to remove inventory from (should match creation location) |
| `custscript_ns_fam_adj_acc_param` | Adjustment Account | SELECT (Account) | No | Optional override for disposal GL account |
| `custscript_ns_fam_subsidiary` | Subsidiary | SELECT (Subsidiary) | No | Optional subsidiary filter for processing |

**Deployment:**
- **Deployment ID:** `customdeploy_ns_mr_fa_asset_disposal`
- **Status:** NOTSCHEDULED (manual execution)
- **Run As Role:** ADMINISTRATOR
- **Concurrency Limit:** 1
- **Queue All Stages:** Yes
- **Yield After:** 60 minutes

**Scheduling Recommendations:**
- Run manually initially to validate configuration
- Schedule nightly or weekly during off-peak hours
- Monitor execution log for errors before automating

**Performance Considerations:**
- Processes assets in parallel during reduce stage
- Each reduce invocation handles one asset
- Governance units: ~10-15 per asset processed
- Estimated capacity: 200-300 assets per execution

---

#### 3. NS|CS|Transaction Item&Customer On FAM (`customscript_ns_ce_validate_txn_itm_cust`)

**Type:** Client Script
**File:** `NSTS_CS_Transaction_Item_And_Customer_On_FAM.js`
**API Version:** 2.1

**Purpose:** Prevents double-booking rental assets by validating that an item is not already assigned to the customer on another FAM asset record.

**Event:** `fieldChanged`
**Sublist:** `item`
**Field:** `item`

**Validation Logic:**

```javascript
fieldChanged(context) {
  const { currentRecord, fieldId, sublistId } = context;

  if (sublistId === 'item' && fieldId === 'item') {
    // 1. Get selected item and customer
    let item = currentRecord.getCurrentSublistValue('item', 'item');
    let customer = currentRecord.getValue('entity');

    if (item && customer) {
      // 2. Search FAM assets for conflicts
      let assetSearch = search.create({
        type: 'customrecord_ncfar_asset',
        filters: [
          ['custrecord_asset_customer', 'anyof', customer],
          'AND',
          ['custrecord_asset_itemlink', 'anyof', item]
        ],
        columns: [
          search.createColumn({ name: 'internalid' })
        ]
      });

      let results = executeSearch(assetSearch);

      // 3. If conflict found, show error and clear item
      if (results.length > 0) {
        let itemText = currentRecord.getCurrentSublistText('item', 'item');
        let customerText = currentRecord.getText('entity');

        alert(`The Item ${itemText} is already assigned to Customer ${customerText} for a FAM record`);

        currentRecord.setCurrentSublistValue('item', 'item', '');
      }
    }
  }
}
```

**Deployments:**

| Deployment ID | Record Type | Status | Use Case |
|--------------|-------------|--------|----------|
| `customdeploy_ns_ce_validate_txn_so` | SALESORDER | RELEASED | Validate rentals on new sales orders |
| `customdeploy_ns_ce_validate_txn_rma` | RETURNAUTHORIZATION | RELEASED | Validate returns on RMAs |

**User Experience:**
- Validation runs in real-time as user selects item
- Alert message displays immediately if conflict found
- Item field cleared automatically to prevent save
- User must select different item or different customer

**Performance:**
- Search executes on every item selection
- Uses paged search for efficiency
- Results cached during page session
- Minimal performance impact (< 1 second)

---

#### 4. NS|UE|Nullify Customer Location (`customscript_ns_ue_nullify_cust_loc`)

**Type:** User Event Script
**File:** `NSTS_UE_Nullify_Customer_Location.js`
**API Version:** 2.x

**Purpose:** Automatically clears customer assignments on FAM assets when item receipts, item fulfillments, or invoices are created/edited. Marks assets as available for rental after customer returns.

**Event:** `afterSubmit`
**Trigger Types:** `create`, `edit`

**Workflow:**

```javascript
afterSubmit(context) {
  if (context.type === 'create' || context.type === 'edit') {
    let transaction = context.newRecord;

    // 1. Extract customer and all items from transaction
    let customer = transaction.getValue('entity');
    let lineCount = transaction.getLineCount('item');
    let items = [];

    for (let i = 0; i < lineCount; i++) {
      items.push(transaction.getSublistValue('item', 'item', i));
    }

    // 2. Search FAM assets matching customer + items
    let assetSearch = search.create({
      type: 'customrecord_ncfar_asset',
      filters: [
        ['custrecord_asset_customer', 'anyof', customer],
        'AND',
        ['custrecord_asset_itemlink', 'anyof', items]
      ],
      columns: [
        search.createColumn({ name: 'internalid' })
      ]
    });

    let results = executeSearch(assetSearch);

    // 3. Clear customer on all matching assets
    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        record.submitFields({
          type: 'customrecord_ncfar_asset',
          id: results[i].id,
          values: {
            'custrecord_asset_customer': ''  // Nullify customer
          }
        });
      }
    }
  }
}
```

**Deployments:**

| Deployment ID | Record Type | Status | Scenario |
|--------------|-------------|--------|----------|
| `customdeploy_ns_ue_nullify_cust_loc_ir` | ITEMRECEIPT | TESTING | Customer returns rental via item receipt |
| `customdeploy_ns_ue_nullify_cust_loc_if` | ITEMFULFILLMENT | TESTING | Rental fulfilled to customer |
| `customdeploy_ns_ue_nullify_cust_loc_inv` | INVOICE | TESTING | Rental invoiced |

**Business Logic:**
- Item Receipt: Customer returning rental → clear customer assignment
- Item Fulfillment: Rental shipped to customer → clear customer (asset in transit)
- Invoice: Rental invoiced → clear customer (asset now with customer)

**Note:** The "nullify on fulfillment/invoice" behavior may seem counterintuitive, but supports workflow where customer assignment is temporary staging before transaction processing.

---

#### 5. NS|UE|Validate Cross Subsidiary (`customscript_ns_ue_valdt_cross_sub`)

**Type:** User Event Script
**File:** `NSTS_UE_Validate_Cross_Subsidiaries.js`
**API Version:** 2.x

**Purpose:** Prevents cross-subsidiary inventory movements when enabled via script parameter. Ensures rental assets remain within single subsidiary for proper accounting.

**Event:** `beforeSubmit`
**Trigger Type:** `create`

**Validation Logic:**

```javascript
beforeSubmit(context) {
  if (context.type === 'create') {
    // 1. Check if cross-subsidiary validation enabled
    let isCrossSubsidiary = runtime.getCurrentScript()
      .getParameter('custscript_is_cross_sub');

    if (isCrossSubsidiary === true || isCrossSubsidiary === 'T') {
      let transaction = context.newRecord;

      // 2. Compare from-subsidiary to to-subsidiary
      let fromSubsidiary = transaction.getValue('subsidiary');
      let toSubsidiary = transaction.getValue('tosubsidiary');

      // 3. Throw error if different
      if (fromSubsidiary !== toSubsidiary) {
        throw "From Subsidiary and To Subsidiary must be same";
      }
    }
  }
}
```

**Script Parameters:**

| Parameter ID | Label | Type | Default | Description |
|-------------|-------|------|---------|-------------|
| `custscript_is_cross_sub` | Cross-subsidiary inventory assets | CHECKBOX | true | Enable to enforce same-subsidiary constraint |

**Deployments:**

| Deployment ID | Record Type | Status | Purpose |
|--------------|-------------|--------|---------|
| `customdeploy_ns_ue_valdt_cross_sub_ito` | INTERCOMPANYTRANSFERORDER | RELEASED | Prevent cross-subsidiary transfer orders |
| `customdeploy_ns_ue_valdt_cross_sub_ia` | INVENTORYADJUSTMENT | RELEASED | Prevent cross-subsidiary adjustments |

**Use Cases:**
- **Enable** (default): Rental assets must stay within subsidiary
- **Disable**: Allow rental assets to move between subsidiaries (use with caution)

**Accounting Impact:**
- Enabled: Maintains clean subsidiary-specific asset accounting
- Disabled: Requires manual intercompany elimination entries

---

### Supporting Modules

#### NSCreateInventory Module (`NSCreateInventory.js`)

**Type:** Shared Library Module
**API Version:** 2.x
**Scope:** Public

**Purpose:** Reusable function for creating inventory adjustments with serial number tracking and FAM asset linkage.

**Function: createInventoryAdjustment**

**Parameters:**
```javascript
{
  assetId: <Internal ID>,        // FAM asset internal ID
  account: <Internal ID>,        // GL account for adjustment
  subsidiary: <Internal ID>,     // Subsidiary for adjustment
  itemId: <Internal ID>,         // Serialized inventory item
  location: <Internal ID>,       // Inventory location
  serialNumber: <String>,        // Serial number to assign/remove
  amount: <Number>,              // Unit cost for adjustment
  quantity: <Number>             // +1 to add, -1 to remove
}
```

**Returns:** Inventory Adjustment Internal ID

**Implementation:**

```javascript
createInventoryAdjustment(params) {
  let { assetId, account, subsidiary, itemId, location, serialNumber, amount, quantity } = params;

  // 1. Create inventory adjustment record
  let invAdj = record.create({ type: 'inventoryadjustment', isDynamic: true });

  // 2. Set header fields
  invAdj.setValue('subsidiary', subsidiary);
  invAdj.setValue('tosubsidiary', subsidiary);
  invAdj.setValue('account', account);
  invAdj.setValue('adjlocation', location);
  invAdj.setValue('custbody_fam_asset_record', assetId);  // Link to FAM asset

  // 3. Add inventory line
  invAdj.selectNewLine({ sublistId: 'inventory' });
  invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: itemId });
  invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: location });
  invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: quantity });
  invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: amount });

  // 4. Add serial number detail
  let invDetail = invAdj.getCurrentSublistSubrecord({
    sublistId: 'inventory',
    fieldId: 'inventorydetail'
  });

  invDetail.selectLine({ sublistId: 'inventoryassignment', line: 0 });

  if (quantity > 0) {
    // Positive adjustment: assign new serial number
    invDetail.setCurrentSublistValue({
      sublistId: 'inventoryassignment',
      fieldId: 'receiptinventorynumber',
      value: serialNumber
    });
  } else {
    // Negative adjustment: remove existing serial number
    invDetail.setCurrentSublistText({
      sublistId: 'inventoryassignment',
      fieldId: 'receiptinventorynumber',
      text: serialNumber
    });
  }

  invDetail.setCurrentSublistValue({
    sublistId: 'inventoryassignment',
    fieldId: 'quantity',
    value: quantity
  });
  invDetail.commitLine({ sublistId: 'inventoryassignment' });

  // 5. Commit line and save
  invAdj.commitLine({ sublistId: 'inventory' });

  return invAdj.save();
}
```

**Key Features:**
- Handles both positive (+1) and negative (-1) quantity adjustments
- Different serial number assignment method based on quantity direction
- Links inventory adjustment to originating FAM asset
- Posts to specified GL account
- Maintains subsidiary consistency

**Error Handling:**
- Throws errors if record creation fails
- Logs full error context
- Caller responsible for catching exceptions

---

## Custom Fields

### Transaction Body Fields

| Script ID | Label | Applied To | Type | Description |
|-----------|-------|------------|------|-------------|
| `custbody_fam_asset_record` | FAM Asset Record | Inventory Adjustment | List/Record | Links inventory adjustment back to originating FAM asset. Enables traceability from adjustment to asset. |

**Usage:** Automatically set by NSCreateInventory module when creating adjustments

---

### Custom Record Fields

#### FAM Asset Record Fields

| Script ID | Label | Type | Required | Source Tab | Description |
|-----------|-------|------|----------|------------|-------------|
| `custrecord_asset_rentable` | Rentable | Checkbox | No | Rental | Flags asset as available for rental. Triggers inventory creation when checked. |
| `custrecord_assetserialno` | Serial Number | Text | Yes* | Main | Serial number for tracking. Required for inventory creation. |
| `custrecord_assettype` | Asset Type | List/Record | Yes* | Main | Link to Asset Type. Required to lookup asset type mapping. |
| `custrecord_asset_itemlink` | Linked Inventory Item | List/Record | No | Rental | Auto-populated reference to serialized inventory item created from asset. |
| `custrecord_asset_customer` | Customer | List/Record | No | Rental | Customer currently assigned to rental asset. Cleared on return. |
| `custrecordnsps_disp_adj_created` | Disposal Adjustment Created | Checkbox | No | Rental | Flag indicating disposal adjustment created. Prevents Map/Reduce reprocessing. |

*Required when custrecord_asset_rentable = true

#### Asset Type Mapping Fields

| Script ID | Label | Type | Required | Description |
|-----------|-------|------|----------|-------------|
| `custrecord_serialized_inv_item` | Serialized Inventory Item | List/Record | Yes | Inventory item to create for assets of this type |
| `custrecord_inv_adj_acct` | Inventory Adjustment Account | List/Record | Yes | GL account for inventory movements |

---

### Custom Lists

| Script ID | Name | Source | Values |
|-----------|------|--------|--------|
| `customlist_ncfar_assetstatus` | FAM Asset Status | NetSuite FAM | Active, Disposed, In Rental, Maintenance, etc. |

---

## Saved Searches

### customsearch_ns_fam_asset_search

**Type:** `customrecord_ncfar_asset`
**Purpose:** Returns disposed FAM assets needing inventory removal for Map/Reduce processing

**Criteria:**
- `custrecord_assetstatus` = Disposed (or equivalent status value)
- `custrecordnsps_disp_adj_created` = false (or empty)
- `custrecord_asset_rentable` = true (optional filter)
- `custrecord_asset_itemlink` is not empty

**Columns:**
- Internal ID
- `custrecord_assettype`
- `custrecord_assetcost`
- `custrecord_assetserialno`
- `custrecord_assetsubsidiary`
- `custrecord_assetstatus`
- `custrecord_asset_itemlink`
- `custrecordnsps_disp_adj_created`

**Usage:** Script parameter for `customscript_ns_mr_fa_asset_disposal`

**Customization:** Modify criteria to match your FAM status values for "Disposed" state

---

## Business Processes

### Process 1: Asset Onboarding to Rental Inventory

**Trigger:** New fixed asset acquired and ready for rental

**Prerequisites:**
- Asset Type Mapping record exists for asset type
- Serialized inventory item created
- FAM module configured

**Steps:**

1. **Create FAM Asset Record**
   - Navigate to: Fixed Assets > Assets > New
   - Enter asset details:
     - Asset Type: Select type (e.g., "Construction Equipment - Excavator")
     - Serial Number: Enter unique serial (e.g., "EX-2024-001")
     - Subsidiary: Select subsidiary
     - Asset Cost: Enter acquisition cost
     - Description: Asset details
   - Save record

2. **Enable Rental**
   - Edit FAM asset record
   - Check `custrecord_asset_rentable` = true
   - Save record

3. **Automatic Inventory Creation** (behind the scenes)
   - User Event script triggers on afterSubmit
   - Script validates: rentable=true, serial number exists, asset type exists
   - Script looks up Asset Type Mapping for asset type
   - Script retrieves serialized inventory item ID and GL account
   - Script calls NSCreateInventory.createInventoryAdjustment:
     - Creates inventory adjustment record
     - Sets subsidiary, location (from script parameter), GL account
     - Adds inventory line with serialized item
     - Sets quantity = +1 (add to stock)
     - Sets unit cost = asset current cost
     - Adds serial number to inventory detail
     - Links adjustment to FAM asset via custbody_fam_asset_record
   - Inventory adjustment posts to GL
   - Script updates FAM asset custrecord_asset_itemlink = serialized item ID
   - Asset now available for rental

4. **Verification**
   - Open FAM asset record
   - Verify custrecord_asset_itemlink populated
   - Navigate to inventory item
   - Verify on-hand quantity = 1 with serial number
   - Review inventory adjustment transaction

**Outcome:** FAM asset tracked in Fixed Assets for depreciation AND in Inventory for rental operations

---

### Process 2: Customer Rental Assignment

**Trigger:** Customer orders rental equipment

**Prerequisites:**
- FAM asset marked as rentable
- Inventory created and on-hand
- Customer record exists

**Steps:**

1. **Create Sales Order**
   - Navigate to: Transactions > Sales > Enter Sales Orders > New
   - Select customer
   - Add item lines for rental items

2. **Client Validation** (automatic)
   - When user selects item in item sublist
   - Client script triggers on fieldChanged
   - Script searches FAM assets for:
     - custrecord_asset_customer = current customer
     - custrecord_asset_itemlink = selected item
   - If found: Display alert "Item already assigned to Customer"
   - If found: Clear item field
   - User must select different item or different customer

3. **Save Sales Order**
   - Complete sales order entry
   - Save record

4. **Optional: Update FAM Asset Customer Assignment**
   - This can be done manually or via workflow
   - Edit FAM asset record
   - Set custrecord_asset_customer = customer
   - Save record
   - Note: This step is optional in current implementation

5. **Create Item Fulfillment**
   - Navigate to sales order
   - Click Fulfill
   - Select items to fulfill
   - Enter serial numbers
   - Save item fulfillment

6. **Asset Customer Nullification** (automatic on IF save)
   - User Event script triggers on item fulfillment afterSubmit
   - Script extracts customer and items from transaction
   - Script searches FAM assets matching customer + items
   - Script clears custrecord_asset_customer on matching assets
   - Assets marked as "in transit" or "with customer"

**Outcome:**
- Sales order created without duplicate assignment errors
- Rental fulfilled to customer
- Inventory reduced by serialized item
- FAM asset customer reference cleared (or set based on workflow)

---

### Process 3: Customer Rental Return

**Trigger:** Customer returns rental equipment

**Prerequisites:**
- Rental previously fulfilled to customer
- Return expected

**Steps:**

1. **Create Item Receipt or Return Authorization**
   - Navigate to: Transactions > Purchases > Enter Item Receipts > New
   - Or: Transactions > Sales > Enter Return Authorizations > New
   - Select customer
   - Select items being returned
   - Enter serial numbers
   - Save transaction

2. **Asset Availability Update** (automatic)
   - User Event script triggers on afterSubmit
   - Script extracts customer and items from transaction
   - Script searches FAM assets for:
     - custrecord_asset_customer = customer (if set)
     - custrecord_asset_itemlink = items on transaction
   - Script clears custrecord_asset_customer = "" on all matches
   - Assets now marked as available for rental

3. **Inventory Updated**
   - Serialized item received back into stock
   - On-hand quantity increased
   - Serial number available for next rental

4. **Verification**
   - Open FAM asset record
   - Verify custrecord_asset_customer is blank
   - Navigate to inventory item
   - Verify on-hand quantity increased
   - Verify serial number shows available status

**Outcome:**
- Asset marked as available for next rental
- Inventory replenished
- Ready for next customer assignment

---

### Process 4: Asset Disposal Processing

**Trigger:** Fixed asset retired, sold, or disposed

**Prerequisites:**
- FAM asset marked as disposed in FAM module
- Disposal Map/Reduce script configured

**Steps:**

1. **Dispose Asset in FAM**
   - Navigate to FAM asset record
   - Change custrecord_assetstatus = "Disposed" (or equivalent)
   - Process FAM depreciation and disposal transactions
   - Save record

2. **Run Disposal Map/Reduce Script**

   **Option A: Manual Execution**
   - Navigate to: Customization > Scripting > Scripts
   - Search for "NS|MR|FA Asset Disposal"
   - Click deployments
   - Select deployment
   - Click "Save & Execute"
   - Monitor execution status

   **Option B: Scheduled Execution**
   - Script runs on schedule (e.g., nightly at 2 AM)
   - Processes all disposed assets in batch

3. **Map/Reduce Processing** (automatic)

   **getInputData stage:**
   - Executes customsearch_ns_fam_asset_search
   - Returns disposed assets where custrecordnsps_disp_adj_created = false

   **reduce stage (per asset):**
   - Extracts asset details (ID, type, serial, cost, subsidiary)
   - Looks up Asset Type Mapping for asset type
   - Retrieves serialized inventory item and GL account
   - Gets location from script parameter
   - Calls NSCreateInventory.createInventoryAdjustment:
     - Creates inventory adjustment
     - Sets quantity = -1 (remove from stock)
     - Adds serial number detail
     - Posts to GL account
   - Updates FAM asset: custrecordnsps_disp_adj_created = true
   - Asset flagged as processed (won't reprocess on next run)

4. **Verification**
   - Review Map/Reduce execution log
   - Check for errors
   - Open FAM asset record
   - Verify custrecordnsps_disp_adj_created = checked
   - Navigate to inventory item
   - Verify on-hand quantity decreased by 1
   - Verify serial number no longer shows as available
   - Review inventory adjustment GL impact

**Outcome:**
- Disposed asset removed from rental inventory
- Serial number no longer available
- FAM asset flagged as processed
- Proper GL accounting for disposal

---

### Process 5: Cross-Subsidiary Validation

**Trigger:** Attempt to create inventory transfer order or adjustment across subsidiaries

**Prerequisites:**
- Multi-subsidiary feature enabled
- Cross-subsidiary validation parameter = true

**Steps:**

1. **Attempt Cross-Subsidiary Transfer**
   - User tries to create inventory transfer order
   - From Subsidiary: Subsidiary A
   - To Subsidiary: Subsidiary B
   - Adds rental asset items to transfer

2. **Validation Triggers** (automatic)
   - User Event script fires on beforeSubmit (create)
   - Script checks custscript_is_cross_sub parameter = true
   - Script compares subsidiary != tosubsidiary
   - Script throws error: "From Subsidiary and To Subsidiary must be same"
   - Transaction save blocked

3. **User Correction**
   - Change To Subsidiary = From Subsidiary
   - Or move asset via alternative method (asset transfer, disposal/re-acquisition)
   - Or have administrator disable cross-subsidiary validation

**Outcome:**
- Rental assets remain within single subsidiary
- Clean subsidiary accounting maintained
- No unintended intercompany transactions

---

## Configuration Guide

### Initial Setup Checklist

#### Prerequisites

1. **NetSuite Features Enabled**
   - Fixed Assets (FIXEDASSETS)
   - Inventory Management (INVENTORY)
   - Serialized Inventory (SERIALNUMBERS)
   - Multi-Location Inventory (LOCATIONS)
   - Server-Side Scripting (SERVERSIDESCRIPTING)
   - Subsidiaries (SUBSIDIARIES)
   - Accounting (ACCOUNTING)

2. **NetSuite Fixed Asset Management (FAM) Configured**
   - FAM module installed
   - Asset types created
   - Depreciation methods defined
   - FAM accounting configured
   - Test assets created

#### Step-by-Step Configuration

**Step 1: Create Serialized Inventory Items**

For each category of rental asset:

1. Navigate to: Lists > Accounting > Items > New > Inventory Item
2. Item Name: "Rental [Asset Category]"
   - Example: "Rental Excavator", "Rental Sound System"
3. Item Type: Inventory Item
4. Check: "Serial Numbers"
5. Set Subsidiary assignments
6. Set COGS Account, Asset Account, Income Account
7. Set location defaults
8. Save

**Step 2: Create Asset Type Mapping Custom Record Type**

1. Navigate to: Customization > Lists, Records, & Fields > Record Types > New
2. Record Type ID: `customrecord_ns_asset_type_mapping`
3. Name: "Asset Type Mapping"
4. Click: "Use as" = None (standalone record type)
5. Save

**Step 3: Create Asset Type Mapping Fields**

1. On Asset Type Mapping record type, click "Fields" subtab
2. Click "New Field"

Field 1:
- Label: "Serialized Inventory Item"
- ID: `custrecord_serialized_inv_item`
- Type: List/Record
- List/Record: Inventory Item
- Store Value: Checked
- Mandatory: Checked

Field 2:
- Label: "Inventory Adjustment Account"
- ID: `custrecord_inv_adj_acct`
- Type: List/Record
- List/Record: Account
- Store Value: Checked
- Mandatory: Checked

**Step 4: Create custbody_fam_asset_record Field**

1. Navigate to: Customization > Lists, Records, & Fields > Transaction Body Fields > New
2. Label: "FAM Asset Record"
3. ID: `custbody_fam_asset_record`
4. Type: List/Record
5. List/Record: FAM Asset Record (`customrecord_ncfar_asset`)
6. Applies To: Inventory Adjustment
7. Store Value: Checked
8. Save

**Step 5: Create Rental Fields on FAM Asset Record**

1. Navigate to FAM Asset custom record type
2. Add fields:

Field 1:
- Label: "Rentable"
- ID: `custrecord_asset_rentable`
- Type: Checkbox
- Default: Unchecked

Field 2:
- Label: "Linked Inventory Item"
- ID: `custrecord_asset_itemlink`
- Type: List/Record
- List/Record: Inventory Item
- Display Type: Inline Text (read-only for users)

Field 3:
- Label: "Customer"
- ID: `custrecord_asset_customer`
- Type: List/Record
- List/Record: Customer

Field 4:
- Label: "Disposal Adjustment Created"
- ID: `custrecordnsps_disp_adj_created`
- Type: Checkbox
- Default: Unchecked

**Step 6: Populate Asset Type Mapping Records**

For each asset type:

1. Navigate to: Asset Type Mapping (custom list)
2. Click: New
3. Name: [Asset Type Name] (e.g., "Excavator Mapping")
4. Serialized Inventory Item: Select corresponding inventory item
5. Inventory Adjustment Account: Select GL account (e.g., "5000 - Inventory Asset")
6. Save
7. Note the FAM Asset Type this maps to

**Step 7: Create Saved Search for Disposal Processing**

1. Navigate to: Lists > Search > Saved Searches > New
2. Search Type: FAM Asset Record (`customrecord_ncfar_asset`)
3. Search Title: "FAM Asset Search"
4. ID: `customsearch_ns_fam_asset_search`

Criteria:
- custrecord_assetstatus = Disposed (or your status value)
- custrecordnsps_disp_adj_created = false (or is empty)
- custrecord_asset_itemlink is not empty

Results:
- Internal ID
- custrecord_assettype
- custrecord_assetcost
- custrecord_assetserialno
- custrecord_assetsubsidiary
- custrecord_assetstatus
- custrecord_asset_itemlink
- custrecordnsps_disp_adj_created

5. Save search
6. Note the internal ID

**Step 8: Upload and Deploy Scripts**

Upload all script files to File Cabinet:

1. Navigate to: Documents > Files > SuiteScripts
2. Create folder: "FAR" (optional organization)
3. Upload files:
   - NSCreateInventory.js
   - NSTS_FA_Inventory_Item_Creation.js
   - NSTS_MR_FA_Asset_Disposal.js
   - NSTS_CS_Transaction_Item_And_Customer_On_FAM.js
   - NSTS_UE_Nullify_Customer_Location.js
   - NSTS_UE_Validate_Cross_Subsidiaries.js

**Step 9: Create Script Records**

For each script:

1. Navigate to: Customization > Scripting > Scripts > New
2. Select script file
3. Configure script record:
   - Name: [From script XML]
   - Script ID: [From script XML]
   - Script File: [Uploaded file]
4. Configure script parameters (where applicable)
5. Save

**Step 10: Create Script Deployments**

For each script deployment:

1. Open script record
2. Click: Deployments subtab
3. Click: Create Script Deployment (or import from XML)
4. Configure deployment:
   - Deployment ID: [From XML]
   - Status: Testing (initially)
   - Record Type: [From XML]
   - Execution Context: All
   - Role: All Roles (or specific roles)
   - Log Level: Debug (initially)
5. Configure script parameters:
   - custscript_ns_location_param = [Select default location]
   - custscript_ns_fam_asset_search_param = [Select saved search]
   - custscript_is_cross_sub = Checked (enable validation)
6. Save deployment

**Step 11: Customize Forms**

**FAM Asset Form:**
1. Navigate to: Customization > Forms > Entry Forms > Custom Record Entry Forms
2. Find FAM Asset form
3. Click: Customize
4. Add new subtab: "Rental Information"
5. Add fields to subtab:
   - custrecord_asset_rentable
   - custrecord_asset_itemlink (read-only)
   - custrecord_asset_customer
   - custrecordnsps_disp_adj_created (read-only)
6. Save custom form
7. Set as preferred form

**Inventory Adjustment Form:**
1. Navigate to: Customization > Forms > Transaction Forms
2. Find Inventory Adjustment form
3. Click: Customize
4. Add field to main tab:
   - custbody_fam_asset_record (read-only)
5. Save custom form

**Step 12: Testing**

**Test 1: Inventory Creation**
1. Create test FAM asset
2. Enter serial number, asset type, cost, subsidiary
3. Check "Rentable"
4. Save
5. Verify: custrecord_asset_itemlink populated
6. Verify: Inventory adjustment created
7. Verify: Serialized item shows on-hand = 1

**Test 2: Customer Assignment Validation**
1. Create sales order for customer A
2. Add rental item already assigned to customer A
3. Verify: Alert displayed
4. Verify: Item field cleared

**Test 3: Return Processing**
1. Create item receipt for rental return
2. Save
3. Verify: FAM asset custrecord_asset_customer cleared

**Test 4: Disposal Processing**
1. Set FAM asset status = Disposed
2. Run disposal Map/Reduce manually
3. Verify: Inventory adjustment created with -1 quantity
4. Verify: custrecordnsps_disp_adj_created = checked

**Test 5: Cross-Subsidiary Validation**
1. Try to create transfer order from Sub A to Sub B
2. Verify: Error displayed preventing save

**Step 13: Production Rollout**

1. Change script deployment status from "Testing" to "Released"
2. Update log levels to "Error" or "Audit"
3. Schedule disposal Map/Reduce (if desired)
4. Train users
5. Monitor execution logs
6. Review first week of transactions

---

## User Roles and Permissions

### Fixed Asset Manager

**Responsibilities:**
- Create and maintain FAM asset records
- Flag assets as rentable
- Assign serial numbers and asset types
- Monitor asset lifecycle from acquisition through disposal
- Review disposal processing results

**Required Permissions:**
- Full access to FAM Asset records (customrecord_ncfar_asset)
- Edit access to custrecord_asset_rentable, custrecord_assetserialno, custrecord_assettype
- View access to custrecord_asset_itemlink, custrecordnsps_disp_adj_created
- View access to Inventory Adjustment transactions
- Execute permission on Map/Reduce scripts (for manual runs)

---

### Rental Operations Manager

**Responsibilities:**
- Process rental sales orders
- Fulfill rental items to customers
- Process rental returns via item receipts
- Monitor asset availability
- Handle customer assignments

**Required Permissions:**
- Create/Edit Sales Orders
- Create/Edit Item Fulfillments
- Create/Edit Item Receipts
- Create/Edit Return Authorizations
- View access to FAM Asset records
- Edit access to custrecord_asset_customer (if manually managed)

---

### Accounting Manager

**Responsibilities:**
- Configure asset type mappings
- Set GL accounts for inventory adjustments
- Review disposal processing
- Ensure proper subsidiary accounting
- Reconcile FAM to Inventory

**Required Permissions:**
- Full access to Asset Type Mapping records
- View access to FAM Asset records
- View access to Inventory Adjustment transactions
- View script execution logs
- Access to GL reconciliation reports

---

### Sales Representative

**Responsibilities:**
- Create sales orders for rental items
- Validate item availability through client script
- Process customer rentals

**Required Permissions:**
- Create/Edit Sales Orders
- View access to Inventory Items
- View access to FAM Asset records (for availability)

---

### System Administrator

**Responsibilities:**
- Deploy and configure scripts
- Maintain asset type mappings
- Troubleshoot script errors
- Schedule Map/Reduce scripts
- Monitor system performance

**Required Permissions:**
- Full access to SuiteCloud Development Framework
- Script deployment permissions
- Script execution log access
- System log access
- Full access to all custom records and fields

---

## Troubleshooting Guide

### Issue: Inventory Item Not Created When Asset Marked Rentable

**Symptoms:**
- FAM asset saved with rentable checked
- custrecord_asset_itemlink remains empty
- No inventory adjustment created
- No error message displayed

**Possible Causes & Solutions:**

1. **Missing Serial Number**
   - Check: custrecord_assetserialno populated?
   - Fix: Add serial number, save again

2. **Missing Asset Type**
   - Check: custrecord_assettype populated?
   - Fix: Select asset type, save again

3. **Asset Type Mapping Not Found**
   - Check: Does mapping record exist for this asset type?
   - Fix: Create asset type mapping record

4. **Missing Location Parameter**
   - Check: Script deployment has custscript_ns_location_param set?
   - Fix: Edit deployment, set location parameter, redeploy

5. **Script Not Deployed**
   - Check: customscript_ns_ue_inv_item_create deployment status = Released?
   - Fix: Change deployment status to Released

6. **Script Execution Error**
   - Check: Customization > Scripting > Script Execution Log
   - Look for: customscript_ns_ue_inv_item_create errors
   - Review: Error details and stack trace
   - Fix: Address specific error (permissions, field access, etc.)

**Resolution Steps:**
1. Open FAM asset record
2. Verify all required fields populated
3. Enable debug logging on script
4. Save asset again
5. Review execution log
6. Fix identified issue
7. Retest

---

### Issue: Disposal Map/Reduce Not Processing Assets

**Symptoms:**
- Disposed assets not being processed
- Inventory not removed
- custrecordnsps_disp_adj_created remains unchecked

**Possible Causes & Solutions:**

1. **Script Not Scheduled/Executed**
   - Check: Script status page - is script running?
   - Fix: Manually execute deployment or set schedule

2. **Saved Search Returns No Results**
   - Check: Run customsearch_ns_fam_asset_search manually
   - Verify: Search criteria matches disposed asset status values
   - Fix: Update search criteria to match your FAM status configuration

3. **Assets Already Processed**
   - Check: custrecordnsps_disp_adj_created already checked?
   - Explanation: Script only processes assets where flag = false
   - Fix: If reprocessing needed, manually uncheck flag

4. **Missing Asset Type Mapping**
   - Check: Disposed asset has valid asset type?
   - Check: Asset type has corresponding mapping record?
   - Fix: Create missing mapping record

5. **Script Parameter Not Set**
   - Check: custscript_ns_fam_asset_search_param points to correct search?
   - Check: custscript_ns_location_parameter set?
   - Fix: Update deployment parameters

6. **Governance Limit Exceeded**
   - Check: Script execution log for governance errors
   - Fix: Reduce concurrent processing, schedule during off-peak

**Resolution:**
1. Navigate to: Customization > Scripting > Script Status
2. Find: NS|MR|FA Asset Disposal
3. Check status: Pending, Processing, Complete, Failed
4. If Failed: Review error log
5. If Complete: Review summary - how many processed?
6. Run saved search manually to verify candidates
7. Fix configuration issue
8. Re-execute script

---

### Issue: Client Validation Not Preventing Duplicate Assignments

**Symptoms:**
- User can add item to sales order even though already assigned
- No alert displayed
- Duplicate assignments created

**Possible Causes & Solutions:**

1. **Script Not Deployed**
   - Check: customscript_ns_ce_validate_txn_itm_cust deployment status = Released?
   - Fix: Change deployment status

2. **User Role Not Included**
   - Check: Deployment "All Roles" checked? Or user's role in selected roles?
   - Fix: Update deployment to include role

3. **custrecord_asset_customer Not Populated**
   - Explanation: Script searches for customer + item combination
   - Check: FAM asset records have custrecord_asset_customer set?
   - Fix: Ensure customer assignment workflow populates field

4. **custrecord_asset_itemlink Not Populated**
   - Explanation: Script searches by item link, not asset serial
   - Check: Assets have custrecord_asset_itemlink populated?
   - Fix: Ensure inventory creation workflow completed

5. **Browser Caching**
   - Try: Hard refresh (Ctrl+F5)
   - Try: Clear browser cache
   - Try: Test in incognito/private mode

6. **Script Execution Context**
   - Check: Deployment execution contexts include "CLIENT"
   - Fix: Update deployment execution context

**Resolution:**
1. Open browser console (F12)
2. Attempt to add duplicate item
3. Watch for console.log messages
4. Check for JavaScript errors
5. Review script deployment configuration
6. Test with different user role
7. Verify FAM asset data populated

---

### Issue: Customer Not Cleared on Return

**Symptoms:**
- Item receipt created for rental return
- custrecord_asset_customer still populated
- Asset not available for next rental

**Possible Causes & Solutions:**

1. **Script Not Deployed or Status = Testing**
   - Check: Deployment status = Released?
   - Fix: Change deployment status

2. **Wrong Transaction Type**
   - Check: Are you using Item Receipt, Item Fulfillment, or Invoice?
   - Explanation: Script has separate deployments for each type
   - Fix: Verify correct deployment is Released

3. **Customer Mismatch**
   - Explanation: Script searches for assets where customer = transaction customer
   - Check: FAM asset custrecord_asset_customer matches transaction customer?
   - Fix: Ensure customer assignment was done correctly

4. **Item Mismatch**
   - Explanation: Script searches for assets where itemlink = transaction items
   - Check: Transaction items match asset custrecord_asset_itemlink?
   - Fix: Verify items on transaction are correct

5. **Script Execution Error**
   - Check: Script execution log for errors
   - Common issue: Permission error updating FAM asset
   - Fix: Ensure deployment "Run As" has edit permission on FAM assets

**Resolution:**
1. Create test item receipt
2. Review script execution log
3. Search for script execution for your transaction
4. Review any errors
5. Manually run search that script uses to verify results
6. Fix data or configuration issue
7. Reprocess transaction (edit and save again)

---

### Issue: Cross-Subsidiary Validation Not Working

**Symptoms:**
- Can create transfer orders across subsidiaries
- No error displayed
- Validation not enforcing same-subsidiary rule

**Possible Causes & Solutions:**

1. **Script Parameter Disabled**
   - Check: custscript_is_cross_sub = true?
   - Fix: Edit deployment, check parameter, save

2. **Script Not Deployed**
   - Check: Deployment status = Released?
   - Fix: Change deployment status

3. **Wrong Transaction Type**
   - Explanation: Only validates Intercompany Transfer Orders and Inventory Adjustments
   - Check: Are you using correct transaction type?

4. **Script Parameter Type Mismatch**
   - Explanation: Script checks for true OR "T"
   - Check: Parameter value is boolean true, not string "true"
   - Fix: Use checkbox parameter type, not text

**Resolution:**
1. Edit script deployment
2. Verify custscript_is_cross_sub parameter = checked
3. Verify deployment status = Released
4. Verify deployment record type matches transaction type
5. Attempt transaction again
6. Review script execution log

---

## Performance Optimization

### Map/Reduce Script Governance

**Challenge:** Disposal processing can consume significant governance units

**Solutions:**

1. **Schedule During Off-Peak Hours**
   - Set deployment schedule to run at 2-4 AM
   - Reduces impact on user operations
   - Allows maximum governance allocation

2. **Filter Saved Search Tightly**
   - Only return truly disposed assets
   - Add date range filters (e.g., disposed in last 90 days)
   - Exclude already-processed assets (custrecordnsps_disp_adj_created = false)

3. **Monitor Governance Usage**
   - Review script execution logs
   - Check "Remaining Usage" metrics
   - Adjust batch size if approaching limits

4. **Batch Processing**
   - Process disposal in smaller batches if needed
   - Use date range parameters to process by quarter or month

**Governance Estimates:**
- Per asset: 10-15 governance units
- 100 assets: 1,000-1,500 units
- 1,000 assets: 10,000-15,000 units

---

### Client Script Performance

**Challenge:** fieldChanged search on every item selection

**Solutions:**

1. **Optimize Search**
   - Use indexed fields (custrecord_asset_customer, custrecord_asset_itemlink)
   - Request NetSuite index these custom fields
   - Limit search columns to ID only

2. **Caching**
   - Consider caching validation results during session
   - Clear cache on form refresh

3. **Paged Search**
   - Already implemented via executeSearch() function
   - Handles large result sets efficiently

**Performance Impact:**
- Typical search: < 500ms
- Large datasets (1000+ assets): 500ms - 1s
- User experience: Acceptable for data validation

---

### Database Performance

**Large Record Volumes:**

1. **Index Custom Fields**
   - Request NetSuite index:
     - custrecord_asset_customer
     - custrecord_asset_itemlink
     - custrecordnsps_disp_adj_created
     - custrecord_asset_rentable

2. **Saved Search Optimization**
   - Use summary searches where possible
   - Limit columns to essential fields
   - Add date range filters

3. **Archival Strategy**
   - Archive disposed assets after retention period
   - Move to "Archived" status
   - Exclude from active searches

---

## Maintenance and Support

### Regular Maintenance Tasks

#### Daily
- Monitor script execution logs for errors
- Review failed disposal processing attempts
- Check inventory adjustment creation

#### Weekly
- Review assets marked as rentable but no inventory created
- Validate customer assignments
- Check for orphaned inventory adjustments

#### Monthly
- Review and update asset type mappings for new categories
- Archive disposed assets older than retention policy
- Verify FAM-to-inventory reconciliation
- Review script parameter configurations

#### Quarterly
- Performance review of Map/Reduce disposal processing
- User feedback on validation effectiveness
- Review cross-subsidiary validation configuration
- Update documentation for any configuration changes

---

### NetSuite Version Upgrades

**Before Each Release:**

1. **Review Release Notes**
   - Check for changes to FAM module
   - Check for changes to Inventory Management
   - Note any SuiteScript API changes
   - Review deprecated functionality

2. **Sandbox Testing**
   - Deploy release to Sandbox
   - Test all workflows:
     - Asset creation → inventory creation
     - Customer assignment validation
     - Return processing → customer nullification
     - Disposal processing → inventory removal
     - Cross-subsidiary validation
   - Validate saved searches return expected results
   - Test each script deployment

3. **Script Validation**
   - Run SuiteCloud validation on scripts
   - Check for API deprecation warnings
   - Validate custom field references still valid

**After Production Deployment:**

1. Monitor script execution logs for errors
2. Verify custom records accessible
3. Test user workflows
4. Communicate any changes to users

---

### Common Customization Requests

#### Add New Rental Asset Category

1. Create serialized inventory item for new category
2. Create asset type mapping record
3. Link mapping to FAM asset type
4. Set GL account for adjustments
5. Test with sample asset

#### Change Default Location

1. Edit script deployment
2. Update custscript_ns_location_param
3. Save deployment
4. Test with new asset

#### Disable Cross-Subsidiary Validation

1. Edit script deployment for customscript_ns_ue_valdt_cross_sub
2. Uncheck custscript_is_cross_sub parameter
3. Save deployment
4. Document business justification

#### Add Additional Transaction Types for Customer Nullification

1. Copy NSTS_UE_Nullify_Customer_Location.js
2. Update record type in script deployment
3. Test on new transaction type
4. Deploy to production

---

## Training Resources

### Fixed Asset Manager Training (2-3 hours)

**Module 1: FAR Overview (30 minutes)**
- Solution purpose and benefits
- Data model: FAM ↔ Inventory linkage
- Navigation and interface tour

**Module 2: Asset Onboarding (45 minutes)**
- Creating FAM assets for rental
- Flagging assets as rentable
- Understanding automatic inventory creation
- Verifying inventory link

**Module 3: Asset Type Mapping (30 minutes)**
- Configuring asset type mappings
- Setting serialized inventory items
- Setting GL accounts
- Testing configurations

**Module 4: Disposal Processing (30 minutes)**
- Marking assets as disposed
- Running disposal Map/Reduce script
- Monitoring processing
- Verifying inventory removal

**Module 5: Troubleshooting (15 minutes)**
- Common issues
- Script execution logs
- Where to find help

---

### Rental Operations Training (1-2 hours)

**Module 1: Rental Process Overview (20 minutes)**
- Solution benefits for operations
- Customer assignment workflow
- Return processing workflow

**Module 2: Creating Rental Sales Orders (30 minutes)**
- Selecting rental items
- Understanding validation alerts
- What to do if item already assigned
- Best practices

**Module 3: Processing Returns (30 minutes)**
- Creating item receipts
- How customer assignments are cleared
- Verifying asset availability
- Processing return authorizations

**Module 4: Checking Asset Availability (15 minutes)**
- Finding available rental assets
- Understanding customer assignments
- Inventory availability

---

### Accounting Manager Training (2-4 hours)

**Module 1: FAR Architecture (45 minutes)**
- Dual tracking: FAM and Inventory
- Data flow diagrams
- GL impact of each transaction type

**Module 2: Asset Type Mapping Configuration (1 hour)**
- Creating mapping records
- Setting GL accounts
- Subsidiary considerations
- Testing mappings

**Module 3: Disposal Processing and Accounting (1 hour)**
- Disposal Map/Reduce workflow
- GL entries created
- Reconciling FAM to Inventory
- Period-end close procedures

**Module 4: Cross-Subsidiary Accounting (30 minutes)**
- Cross-subsidiary validation purpose
- When to enable/disable
- Intercompany implications
- Accounting best practices

**Module 5: Reporting and Reconciliation (30 minutes)**
- FAM asset reports
- Inventory reports
- Reconciliation techniques
- Month-end checklist

---

### System Administrator Training (4-6 hours)

**Module 1: Solution Architecture Deep Dive (1 hour)**
- Complete data model
- Script dependencies
- Module relationships
- Integration points

**Module 2: Script Deployment and Configuration (1.5 hours)**
- Uploading scripts
- Creating script records
- Configuring deployments
- Setting parameters
- Testing deployments

**Module 3: Saved Search Configuration (45 minutes)**
- Disposal search criteria
- Adding custom filters
- Performance optimization
- Testing searches

**Module 4: Custom Field Configuration (45 minutes)**
- Adding rental fields to FAM
- Creating asset type mapping record type
- Form customization
- Field-level security

**Module 5: Troubleshooting and Maintenance (1 hour)**
- Reading script execution logs
- Common error patterns
- Debugging techniques
- Performance monitoring

**Module 6: Disaster Recovery (30 minutes)**
- Backup considerations
- Data migration
- Script redeployment
- Configuration export/import

---

## Appendices

### Appendix A: Complete Field Reference

#### FAM Asset Record Fields

| Script ID | Label | Type | Source Tab | Required | Auto-Set | Description |
|-----------|-------|------|------------|----------|----------|-------------|
| custrecord_asset_rentable | Rentable | Checkbox | Rental | No | No | Flags asset for rental operations |
| custrecord_assetserialno | Serial Number | Text | Main | Yes* | No | Unique serial number for tracking |
| custrecord_assettype | Asset Type | List/Record | Main | Yes* | No | FAM asset type classification |
| custrecord_assetcost | Asset Cost | Currency | Main | Yes | No | Original acquisition cost |
| custrecord_assetcurrentcost | Current Cost | Currency | Main | No | No | Current book value |
| custrecord_assetsubsidiary | Subsidiary | List/Record | Main | Yes | No | Asset subsidiary |
| custrecord_asset_itemlink | Linked Inventory Item | List/Record | Rental | No | Yes | Auto-set by User Event script |
| custrecord_asset_customer | Customer | List/Record | Rental | No | No | Customer currently renting asset |
| custrecordnsps_disp_adj_created | Disposal Adjustment Created | Checkbox | Rental | No | Yes | Auto-set by Map/Reduce script |
| custrecord_assetstatus | Asset Status | List | Main | Yes | No | Asset lifecycle status |
| custrecord_assetlifetime | Asset Lifetime | Integer | Main | No | No | Useful life in months |
| custrecord_assetaccmethod | Depreciation Method | List/Record | Main | No | No | Depreciation calculation method |
| custrecord_componentof | Component Of | List/Record | Main | No | No | Parent asset if component |
| custrecord_ncfar_quantity | Quantity | Integer | Main | No | No | Asset quantity |
| custrecord_assetdescr | Description | Text | Main | No | No | Asset description |

*Required when custrecord_asset_rentable = true

---

### Appendix B: Script Reference

| Script ID | Type | File | Entry Points | Parameters | Deployments |
|-----------|------|------|--------------|------------|-------------|
| customscript_ns_ue_inv_item_create | User Event | NSTS_FA_Inventory_Item_Creation.js | afterSubmit | custscript_ns_location_param | FAM Asset (create, delete) |
| customscript_ns_mr_fa_asset_disposal | Map/Reduce | NSTS_MR_FA_Asset_Disposal.js | getInputData, reduce, summarize | custscript_ns_fam_asset_search_param, custscript_ns_location_parameter, custscript_ns_fam_adj_acc_param, custscript_ns_fam_subsidiary | Manual/Scheduled |
| customscript_ns_ce_validate_txn_itm_cust | Client Script | NSTS_CS_Transaction_Item_And_Customer_On_FAM.js | fieldChanged | None | Sales Order, Return Authorization |
| customscript_ns_ue_nullify_cust_loc | User Event | NSTS_UE_Nullify_Customer_Location.js | afterSubmit | None | Item Receipt, Item Fulfillment, Invoice |
| customscript_ns_ue_valdt_cross_sub | User Event | NSTS_UE_Validate_Cross_Subsidiaries.js | beforeSubmit | custscript_is_cross_sub | Transfer Order, Inventory Adjustment |

---

### Appendix C: Transaction Type Impact Matrix

| Transaction Type | Script Triggered | Action Taken | FAM Field Updated | Inventory Impact |
|-----------------|------------------|--------------|-------------------|------------------|
| FAM Asset Create (rentable=true) | NS\|UE\|FA Inventory Item Creation | Create inv adjustment +1 | custrecord_asset_itemlink | On-hand +1 with serial |
| FAM Asset Delete | NS\|UE\|FA Inventory Item Creation | Create inv adjustment -1 | N/A (deleted) | On-hand -1 with serial |
| Sales Order (item add) | NS\|CS\|Transaction Item&Customer | Validate no duplicate | None | None (validation only) |
| Item Fulfillment | NS\|UE\|Nullify Customer Location | Clear customer assignment | custrecord_asset_customer | None (fulfillment handles) |
| Item Receipt | NS\|UE\|Nullify Customer Location | Clear customer assignment | custrecord_asset_customer | None (receipt handles) |
| Invoice | NS\|UE\|Nullify Customer Location | Clear customer assignment | custrecord_asset_customer | None |
| Return Authorization (item add) | NS\|CS\|Transaction Item&Customer | Validate no duplicate | None | None (validation only) |
| Transfer Order (cross-sub) | NS\|UE\|Validate Cross Subsidiary | Prevent if enabled | None | None (blocked) |
| Inventory Adjustment (cross-sub) | NS\|UE\|Validate Cross Subsidiary | Prevent if enabled | None | None (blocked) |
| FAM Asset Status = Disposed | NS\|MR\|FA Asset Disposal (scheduled) | Create inv adjustment -1 | custrecordnsps_disp_adj_created | On-hand -1 with serial |

---

### Appendix D: Integration Flow Diagrams

#### Asset Creation Flow
```
User Creates FAM Asset
        ↓
Enter: Type, Serial, Cost, Subsidiary
        ↓
Check: Rentable = true
        ↓
Save Asset
        ↓
[User Event: afterSubmit]
        ↓
Validate: rentable && serial && type
        ↓
Lookup: Asset Type Mapping
        ↓
Get: Serialized Item ID, GL Account
        ↓
Call: NSCreateInventory.createInventoryAdjustment
        ↓
Create: Inventory Adjustment Record
        ↓
Set: Subsidiary, Location, Account, Asset Link
        ↓
Add: Inventory Line (Item, Location, Qty=+1, Cost)
        ↓
Add: Serial Number Detail
        ↓
Post: GL Entry (Dr Inventory Asset, Cr Adjustment Account)
        ↓
Update: FAM Asset.custrecord_asset_itemlink
        ↓
Complete
```

#### Disposal Processing Flow
```
User Sets FAM Asset Status = Disposed
        ↓
FAM Disposal Transactions Processed
        ↓
[Scheduled Map/Reduce Runs]
        ↓
getInputData: Execute customsearch_ns_fam_asset_search
        ↓
Returns: Disposed assets where disp_adj_created = false
        ↓
[reduce: Per Asset]
        ↓
Extract: Asset ID, Type, Serial, Cost, Subsidiary
        ↓
Lookup: Asset Type Mapping
        ↓
Get: Serialized Item ID, GL Account
        ↓
Call: NSCreateInventory.createInventoryAdjustment (qty = -1)
        ↓
Create: Inventory Adjustment Record
        ↓
Set: Subsidiary, Location, Account, Asset Link
        ↓
Add: Inventory Line (Item, Location, Qty=-1, Cost)
        ↓
Add: Serial Number Detail (remove from stock)
        ↓
Post: GL Entry (Dr Adjustment Account, Cr Inventory Asset)
        ↓
Update: FAM Asset.custrecordnsps_disp_adj_created = true
        ↓
Complete
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | NetSuite Solution Cataloger | Initial comprehensive documentation |

---

## Support and Contact

**Technical Support:**
- NetSuite Developer Resources
- Custom solution - requires internal developer support
- No vendor support available

**Documentation:**
- This comprehensive solution documentation
- solution-catalog-entry.json for technical specifications
- NetSuite SuiteAnswers for platform features

**Additional Resources:**
- NetSuite Help Center: Fixed Asset Management
- NetSuite Help Center: Inventory Management
- NetSuite Help Center: Serialized Inventory
- SuiteScript 2.1 API Documentation

---

*End of Document*
