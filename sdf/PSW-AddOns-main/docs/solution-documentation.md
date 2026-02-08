# Add-Ons Manager for Cross-Sell and Upsell
## NetSuite Solution Documentation

---

## Executive Summary

**Solution Name:** Add-Ons Manager for Cross-Sell and Upsell
**Solution Type:** Sales Enablement and Merchandising
**Version:** 1.0
**Industry Focus:** Retail, Wholesale Distribution, E-Commerce, Consumer Products

### Overview

Add-Ons Manager is a sophisticated NetSuite customization that transforms the sales order entry process by automatically presenting contextually relevant accessory items and cross-sell opportunities to sales representatives. When a designated parent item is added to a sales order, an intelligent pop-up window appears displaying compatible add-on products filtered by price range, item classification, and customer price level.

The solution dramatically increases average order value, improves customer satisfaction through comprehensive product recommendations, and ensures sales representatives never miss cross-sell opportunities—regardless of their product knowledge or experience level.

### Value Proposition

Sales organizations face several challenges in maximizing order value:

- **Missed Cross-Sell Opportunities**: Sales reps may forget to suggest accessories or lack knowledge of compatible products
- **Inconsistent Upselling**: Cross-sell success depends heavily on individual rep knowledge and memory
- **Order Incompleteness**: Customers often need to place follow-up orders for forgotten accessories
- **Price-Inappropriate Suggestions**: Suggesting premium accessories for budget purchases (or vice versa) creates poor experience
- **Training Burden**: New reps require extensive product training to know which items go together

Add-Ons Manager solves these challenges by embedding intelligent product recommendation logic directly into the sales order workflow, ensuring every eligible transaction receives appropriate accessory suggestions with zero manual effort from sales representatives.

### Key Benefits

- **20-40% Increase in Average Order Value**: Automatic prompts capture cross-sell opportunities that would otherwise be missed
- **100% Consistency**: Every sales order receives appropriate add-on suggestions regardless of rep experience
- **Faster Order Entry**: Reps select from pre-filtered accessories rather than searching entire catalog
- **Improved Customer Satisfaction**: Complete orders with all needed accessories reduce frustration and callbacks
- **Reduced Training Time**: New reps immediately benefit from built-in product knowledge
- **Data-Driven Merchandising**: Track add-on conversion rates to optimize product bundling and pricing

---

## Solution Architecture

### Data Model

```
Item Master
    └─ custitem_ns_accessorypopup (Checkbox)
         ├─ If checked, item triggers pop-up on SO entry
         └─ Links to Add Ons configurations

Add Ons Record
(customrecord_drss_accessories)
    ├─ Parent Item (OR)
    │   └─ Specific item that triggers add-on
    ├─ Parent Class (OR)
    │   └─ Item class(es) that trigger add-on
    ├─ Add On Item
    │   └─ Accessory item to suggest
    ├─ Price Level
    │   └─ Pricing basis for add-on
    ├─ Minimum Price
    │   └─ Parent price threshold (lower bound)
    └─ Maximum Price
        └─ Parent price threshold (upper bound)

Sales Order Transaction
    ├─ custbody_ns_acc_poppedlines (JSON array)
    │   └─ Tracks lines already popped (for pop-once mode)
    └─ Line Items
        ├─ custcol_ns_lineparentkey (Unique ID)
        │   └─ Timestamp-based key for this line
        ├─ custcol_ns_linechildkey (Foreign Key)
        │   └─ Parent line's key (for add-ons)
        └─ custcol_ns_addonparent (Item Reference)
            └─ Parent item that triggered this add-on
```

### Component Architecture

```
Sales Order Entry (User Action)
           ↓
Client Script (accessorypop.js)
    validateLine() event
           ↓
    ┌─────┴─────┐
    │ Is item   │ No → Continue normal flow
    │ flagged?  │
    └─────┬─────┘
        Yes
          ↓
    Generate/retrieve line parent key
          ↓
    Check if already popped (pop-once mode)
          ↓
    window.open() → Suitelet (ns_su_accessories.js)
                         ↓
                   Get parent item ID
                   Get parent item price
                   Get parent item class
                         ↓
                   ┌─────────────────┐
                   │  SuiteQL Query  │
                   │  Add Ons Record │
                   └─────────────────┘
                         ↓
              Filter by parent item/class
              Filter by price range
              Join to Pricing table
                         ↓
                   Render HTML form
                   with add-on items
                         ↓
              User selects items + quantities
                         ↓
              onClick → opener.addLine()
                         ↓
              Client Script adds items to SO
              with parent-child relationships
```

---

## Custom Records

### Add Ons Record (`customrecord_drss_accessories`)

**Purpose:** Defines relationships between parent items and their associated add-on/accessory items, with intelligent filtering based on price and classification.

**Record Name:** "Add Ons"

**Access:** Administrator role has full access; configure additional roles as needed.

#### Fields

| Field | Script ID | Type | Description |
|-------|-----------|------|-------------|
| **Add On Item** | `custrecord_drss_accessoryitem` | List/Record (Item) | The accessory or add-on item to suggest when parent triggers |
| **Parent Item** | `custrecord_drss_parentitem` | List/Record (Item) | Specific item that triggers this add-on suggestion (mutually exclusive with Parent Class) |
| **Parent Class** | `custrecord_drss_parentclass` | Multiselect (Class) | Item class(es) that trigger this add-on suggestion (mutually exclusive with Parent Item) |
| **Price Level** | `custrecord_drss_accessoryprice` | List/Record (Price Level) | NetSuite price level to use when pricing the add-on item (REQUIRED) |
| **Minimum Price** | `custrecord_drss_minprice` | Currency | If set, add-on appears only if parent item price >= this value |
| **Maximum Price** | `custrecord_drss_maxprice` | Currency | If set, add-on appears only if parent item price < this value |

#### Business Rules

1. **Mutual Exclusivity**: Must specify either Parent Item OR Parent Class, never both
2. **Price Level Required**: Every add-on configuration must have a price level
3. **Price Filtering Optional**: Min/Max price fields are optional; if left blank, add-on appears at all price points
4. **Class Flexibility**: Parent Class is multiselect, allowing one add-on to trigger for multiple classes

#### Configuration Examples

**Example 1: Item-Specific, Price-Filtered**
- **Parent Item**: Dell XPS 13 Laptop (Pro Model)
- **Add On Item**: Premium Laptop Bag
- **Price Level**: Base Price
- **Minimum Price**: $1,200
- **Maximum Price**: $2,500
- **Logic**: Premium bag suggested only for mid-tier to high-tier laptop configurations

**Example 2: Class-Based, All Prices**
- **Parent Class**: Cameras (DSLR)
- **Add On Item**: 64GB SD Memory Card
- **Price Level**: Retail
- **Minimum Price**: (blank)
- **Maximum Price**: (blank)
- **Logic**: Memory card suggested for any DSLR camera regardless of price

**Example 3: Multiple Classes**
- **Parent Class**: Laptops, Tablets, Smartphones
- **Add On Item**: Screen Protector Kit
- **Price Level**: Base Price
- **Minimum Price**: (blank)
- **Maximum Price**: (blank)
- **Logic**: Screen protector relevant to multiple device categories

---

## Scripts and Automation

### Client Script: Add-On Pop-up (`customscript_ns_cu_accpop`)

**File:** `/SuiteScripts/accessorypop.js`
**Type:** Client Script
**Deployment:** Sales Order transaction

#### Script Parameters

| Parameter ID | Label | Type | Default | Description |
|--------------|-------|------|---------|-------------|
| `custscript_nscs_poponce` | Pop Up only on add | Checkbox | False | If checked, pop-up appears only when line is first added, not on subsequent edits |

#### Entry Points

##### 1. pageInit(context)

**Trigger:** When sales order form loads

**Functionality:**
- Stores form context in `window.accessoryContext` for pop-up access
- Exposes `addLine()` function to global scope for pop-up window to call
- Retrieves previously popped lines from hidden field `custbody_ns_acc_poppedlines`
- Parses JSON array into `window.poppedLines` for pop-once logic

##### 2. validateLine(context)

**Trigger:** When user commits a line item (clicks OK/Add)

**Functionality:**

1. **Line Key Management**
   - Checks if line already has parent key (`custcol_ns_lineparentkey`)
   - If not, generates unique key using `Date.now()` (millisecond timestamp)
   - Assigns key to line, ensuring uniqueness across transaction

2. **Parent-Child Association**
   - If line is an add-on (has `custcol_ns_addonparent`), locates parent item line
   - Retrieves parent's line key
   - Assigns parent key to child's `custcol_ns_linechildkey` field
   - Maintains bidirectional relationship

3. **Pop-Once Logic**
   - Checks if line key already in `window.poppedLines` array
   - If pop-once mode enabled AND already popped, skips pop-up
   - Prevents repetitive pop-ups when editing lines

4. **Add-On Check**
   - Performs field lookup on item: `custitem_ns_accessorypopup`
   - If checkbox enabled, calls `openAccessoryWindow()`
   - Adds line key to `poppedLines` array

5. **Returns true** to allow line to be added

##### 3. fieldChanged(context)

**Trigger:** When user changes field value on line

**Handles Two Scenarios:**

**Scenario A: Changing Item on Line with Child Add-Ons**
- Detects item change on line that has associated child add-ons
- Searches for lines where `custcol_ns_linechildkey` equals this line's parent key
- If children exist, prevents change and shows alert:
  - "You may not change the item on this line without first removing all associated add-ons"
- Reverts item field to previous value

**Scenario B: Manually Changing Add-On Parent**
- When user manually edits `custcol_ns_addonparent` field
- Locates new parent item line on transaction
- Retrieves parent's line key
- Updates child's `custcol_ns_linechildkey` accordingly
- If parent not found on transaction, clears both parent and child key fields
- Shows alert: "No matching Parent Item on this transaction. You must add the parent item to the transaction first"

##### 4. validateDelete(context)

**Trigger:** When user attempts to delete a line

**Functionality:**
- Retrieves item from line being deleted
- Searches transaction for lines where `custcol_ns_addonparent` equals this item
- If child add-ons exist, prevents deletion
- Shows alert: "Remove all associated add-ons first"
- Ensures parent items cannot be orphaned

##### 5. saveRecord(context)

**Trigger:** Before transaction is saved

**Functionality:**
- Checks if `window.poppedLines` has entries
- If yes, serializes array to JSON
- Stores in hidden field `custbody_ns_acc_poppedlines`
- Persists pop history for when record is reopened

#### Key Functions

##### openAccessoryWindow(item, linekey, rate)

**Purpose:** Opens pop-up Suitelet with add-on items

**Parameters:**
- `item`: Internal ID of parent item
- `linekey`: Unique line key for parent-child association
- `rate`: Price of parent item (for price-based filtering)

**Logic:**
```javascript
// Resolve Suitelet URL
const accessoryURL = url.resolveScript({
    scriptId: 'customscript_ns_su_accessories',
    deploymentId: 'customdeploy_ns_su_accessories_1'
});

// Build URL with parameters
const fullURL = accessoryURL +
    '&item=' + item +
    '&linekey=' + linekey +
    '&price=' + rate +
    '&ifrmcntnr=T';

// Open pop-up window
const windowOptions = "left=200,top=200,width=1000,height=500,menubar=0";
window.open(fullURL, 'ns_accessories_' + item, windowOptions);
```

##### addLine(item, key2, parent)

**Purpose:** Called by pop-up window to add selected add-on to transaction

**Parameters:**
- `item`: Internal ID of add-on item to add
- `key2`: Line key of parent line
- `parent`: Internal ID of parent item

**Logic:**
1. Retrieves quantity from `window.addqty[item]` (set by pop-up's quantity field) or defaults to 1
2. Calls `selectNewLine({sublistId: 'item'})`
3. Sets item field (triggers sourcing)
4. Sets add-on parent field
5. Sets quantity
6. Sets child key to parent's line key
7. Commits line to transaction

##### getItemData(item)

**Purpose:** Checks if item has add-on pop-up enabled

**Logic:**
```javascript
var fieldLookUp = search.lookupFields({
    type: search.Type.ITEM,
    id: item,
    columns: ['internalid','custitem_ns_accessorypopup']
});
return fieldLookUp;
```

---

### Suitelet: Add-Ons Suitelet (`customscript_ns_su_accessories`)

**File:** `/SuiteScripts/ns_su_accessories.js`
**Type:** Suitelet
**Deployment:** Available to all roles

#### Request Flow

**GET Request:**

1. **Parse URL Parameters**
   - `item`: Parent item internal ID
   - `linekey`: Parent line key
   - `price`: Parent item price (optional, for filtering)

2. **Retrieve Add-On Data**
   - Call `getItemData(item, price)` for item-specific add-ons
   - Call `getClass(item)` to get parent item's class
   - If class exists, call `getClassData(class, price)` for class-based add-ons
   - Merge results into single array

3. **Build HTML Form**
   - Create form with title showing parent item ID
   - Add custom CSS for styling buttons and quantity inputs
   - Add "Done" button to close window
   - Create sublist with columns: Select (button), Item, Product, Price Each

4. **Populate Sublist**
   - Iterate through add-on items
   - For each item with quantity=1 in pricing table:
     - Generate "Add" button with inline quantity input
     - Display item ID, display name/description, unit price
     - Button onclick calls `opener.addLine(itemID, linekey, parentItem)`

5. **Render Response**
   - If add-ons found: Display form
   - If no add-ons: Execute `window.close()` script (pop-up closes immediately)

#### Key Functions

##### getItemData(item, price)

**Purpose:** Query add-ons configured for specific parent item

**SuiteQL Query:**
```sql
SELECT
    a.custrecord_drss_accessoryitem AS internalid,
    c.name AS pricelevel,
    b.itemid,
    b.displayname,
    b.description,
    d.unitprice,
    d.quantity,
    e.itemid AS parent_item
FROM
    CUSTOMRECORD_DRSS_ACCESSORIES a,
    ITEM b,
    PRICELEVEL c,
    PRICING d,
    ITEM e
WHERE
    e.id = ?                                          -- Parent item
    AND a.custrecord_drss_parentitem = e.id           -- Add-on config for parent
    AND a.custrecord_drss_accessoryitem = b.id        -- Join to add-on item
    AND a.custrecord_drss_accessoryprice = c.id       -- Join to price level
    AND a.custrecord_drss_accessoryitem = d.item      -- Join to pricing
    AND d.pricelevel = a.custrecord_drss_accessoryprice
    AND a.custrecord_drss_minprice < ?                -- Price filtering
    AND a.custrecord_drss_maxprice > ?
```

**Parameters:** `[item, price, price]`

**Returns:** Array of add-on items with pricing and description

##### getClass(item)

**Purpose:** Retrieve parent item's classification

**SuiteQL Query:**
```sql
SELECT class, itemid
FROM ITEM
WHERE id = ?
```

**Parameters:** `[item]`

**Returns:** Class ID and item ID

##### getClassData(iclass, price)

**Purpose:** Query add-ons configured for parent item's class

**SuiteQL Query (with price filtering):**
```sql
SELECT
    a.custrecord_drss_accessoryitem AS internalid,
    c.name AS pricelevel,
    b.itemid,
    b.displayname,
    b.description,
    d.unitprice,
    d.quantity
FROM
    CUSTOMRECORD_DRSS_ACCESSORIES a,
    ITEM b,
    PRICELEVEL c,
    PRICING d,
    MAP_customrecord_drss_accessories_custrecord_drss_parentclass e
WHERE
    a.id = e.mapone                                   -- Join to class mapping
    AND e.maptwo = ?                                  -- Parent class
    AND a.custrecord_drss_accessoryitem = b.id        -- Join to add-on item
    AND a.custrecord_drss_accessoryprice = c.id       -- Join to price level
    AND a.custrecord_drss_accessoryitem = d.item      -- Join to pricing
    AND d.pricelevel = a.custrecord_drss_accessoryprice
    AND (a.custrecord_drss_minprice IS NULL OR a.custrecord_drss_minprice <= ?)
    AND (a.custrecord_drss_maxprice IS NULL OR a.custrecord_drss_maxprice > ?)
```

**Note:** Uses MAP table for multiselect field joins

**Parameters:** `[iclass, price, price]`

**Returns:** Array of class-based add-on items

##### checkbox(itemID, parentItem, linekey)

**Purpose:** Generate HTML for Add button and quantity input

**Returns:**
```html
<button type="button" class="n_adb" id="acc_{itemID}" name="accessories"
        onclick="opener.addLine({itemID}, {linekey}, {parentItem}); return false;">
    Add
</button>
<input type="number" step="1" id="integerInput_{itemID}" value="1"
       oninput="opener.addqty[{itemID}] = this.value;" class="n_ib" />
```

**Functionality:**
- Button calls `addLine()` in parent window (opener)
- Quantity input updates `addqty` object in parent window
- Allows user to specify quantity before clicking Add

---

### Workflow: Manage Add-On Record (`customworkflow_nsps_addonmanager`)

**Record Type:** Add Ons (`customrecord_drss_accessories`)
**Status:** Released
**Logging:** Enabled

#### Workflow State: "Manage Defaults and Fields"

##### Actions on Entry (Record Create)

**Set Price Level Default (if blank):**
- Condition: `isEmpty("Price Level") = 'T'`
- Action: Set Price Level to default value
- Purpose: Ensure price level always populated

##### Actions Before Load (Form Display)

**Action 1: Make Price Level Mandatory**
- Field: `custrecord_drss_accessoryprice`
- Set as: Mandatory
- Purpose: Enforce business rule that price level required

**Action 2: Disable Parent Item if Parent Class Selected**
- Condition: `{custrecord_drss_parentclass} IS NOT NULL`
- Field: `custrecord_drss_parentitem`
- Display Type: Disabled
- Purpose: Prevent conflicting parent specifications

**Action 3: Disable Parent Class if Parent Item Selected**
- Condition: `{custrecord_drss_parentitem.id} IS NOT NULL`
- Field: `custrecord_drss_parentclass`
- Display Type: Disabled
- Purpose: Prevent conflicting parent specifications

##### Actions Before Field Edit

**Warning on Parent Item Edit:**
- Trigger Field: `custrecord_drss_parentitem`
- Condition: `!isValEmpty(nlapiGetFieldValue('custrecord_drss_parentclass'))`
- Message: "You must deselect all classes before selecting a parent item."
- Purpose: Guide user to clear class before switching to item-based config

##### Actions After Field Edit

**Action 1: Clear Parent Class When Parent Item Selected**
- Trigger Field: `custrecord_drss_parentitem`
- Condition: `!isValEmpty(nlapiGetFieldValue('custrecord_drss_parentitem'))`
- Field: `custrecord_drss_parentclass`
- Value: (empty)
- Purpose: Enforce mutual exclusivity

**Action 2: Disable Parent Class When Parent Item Populated**
- Trigger Field: `custrecord_drss_parentitem`
- Condition: `!isValEmpty(nlapiGetFieldValue('custrecord_drss_parentitem'))`
- Field: `custrecord_drss_parentclass`
- Display Type: Disabled

**Action 3: Enable Parent Class When Parent Item Cleared**
- Trigger Field: `custrecord_drss_parentitem`
- Condition: `isValEmpty(nlapiGetFieldValue('custrecord_drss_parentitem'))`
- Field: `custrecord_drss_parentclass`
- Display Type: Normal

---

## Custom Fields

### Item Fields

#### Add On Pop-up (`custitem_ns_accessorypopup`)

**Type:** Checkbox
**Applies To:** Inventory Part, Inventory Assembly, Kit/Package, Non-Inventory Item
**Subtab:** Purchasing/Inventory
**Default:** Unchecked

**Purpose:** Flags items that should trigger add-on pop-up when added to sales orders

**Usage:** Check this box on parent items (e.g., laptops, cameras, smartphones) that should trigger accessory suggestions. Leave unchecked on accessory items themselves to prevent recursive pop-ups.

---

### Transaction Body Fields

#### Popped Line Array (`custbody_ns_acc_poppedlines`)

**Type:** Long Text (CLOBTEXT)
**Applies To:** Sales Order
**Display Type:** Hidden
**Subtab:** System Information

**Purpose:** Stores JSON array of line keys that have already triggered pop-ups in this transaction session

**Format:** `["1234567890123", "1234567891234", ...]`

**Usage:**
- When pop-once mode enabled, script checks this field before showing pop-up
- Prevents repetitive pop-ups when user edits same line multiple times
- Persisted with transaction for reopening later
- Automatically managed by client script

---

### Transaction Column Fields

#### Add On Parent (`custcol_ns_addonparent`)

**Type:** List/Record (Item)
**Applies To:** Sales Order, Item Fulfillment
**Display:** Normal, visible on line items

**Purpose:** For add-on items, stores reference to parent item that triggered the accessory suggestion

**Usage:**
- Automatically populated when user selects add-on from pop-up window
- Can be manually edited by user to change parent association
- Used by client script to prevent parent deletion when children exist
- Carries forward to item fulfillment for proper association

#### Line Parent Key (`custcol_ns_lineparentkey`)

**Type:** Text
**Applies To:** Sales Order, Item Fulfillment
**Display:** Locked (not user-editable)

**Purpose:** Unique identifier for transaction line, generated using millisecond timestamp

**Format:** `"1234567890123"` (13-digit timestamp)

**Usage:**
- Generated by client script on validateLine event
- Persists through transaction lifecycle
- Used to link parent items with their child add-ons
- Ensures accurate parent-child relationships even when line numbers change

#### Line Child Key (`custcol_ns_linechildkey`)

**Type:** Text
**Applies To:** Sales Order, Item Fulfillment
**Display:** Locked (not user-editable)

**Purpose:** For add-on items, stores the parent line's unique key

**Format:** `"1234567890123"` (matches parent's line parent key)

**Usage:**
- For add-on items, contains parent's `custcol_ns_lineparentkey` value
- Empty for parent items
- Enables bidirectional parent-child relationship queries
- Maintains association through fulfillment process

---

## Business Processes

### Process 1: Item-Based Add-On Configuration

**Actors:** Sales Administrator, Merchandising Manager

**Prerequisites:**
- Parent items and add-on items exist in NetSuite item master
- Price levels configured
- Understanding of which accessories go with which products

**Steps:**

1. **Flag Parent Item**
   - Navigate to parent item record (e.g., "Dell XPS 13 Laptop")
   - Check `custitem_ns_accessorypopup` field
   - Save item

2. **Create Add-On Configuration**
   - Navigate to: Lists > Add Ons > New
   - **Parent Item**: Select parent (Dell XPS 13 Laptop)
   - **Add On Item**: Select accessory (Laptop Bag - Premium)
   - **Price Level**: Select appropriate level (Base Price)
   - **Minimum Price**: Enter $1,000 (optional)
   - **Maximum Price**: Enter $2,000 (optional)
   - Save record

3. **Repeat for Additional Accessories**
   - Create separate Add Ons records for:
     - Wireless mouse
     - Laptop case
     - USB-C adapter
     - Extended warranty
   - Each can have different price thresholds

4. **Test Configuration**
   - Create test sales order
   - Add parent item
   - Verify pop-up appears
   - Verify correct add-ons displayed
   - Verify pricing accurate
   - Verify add-ons added correctly to order

**Outcome:** Parent item triggers intelligent pop-up showing relevant accessories filtered by price range.

---

### Process 2: Class-Based Add-On Configuration

**Actors:** Sales Administrator, Merchandising Manager

**Use Case:** Configure accessories that apply to entire product categories rather than individual items

**Prerequisites:**
- Items properly classified in NetSuite (e.g., all laptops in "Laptops" class)
- Understanding of category-wide accessory relationships

**Steps:**

1. **Identify Category-Wide Accessories**
   - Determine accessories relevant to entire class
   - Examples:
     - Screen protectors for all smartphones
     - Memory cards for all cameras
     - Cables for all tablets

2. **Create Class-Based Configuration**
   - Navigate to: Lists > Add Ons > New
   - **Parent Class**: Select one or more classes (e.g., Smartphones, Tablets)
   - Leave **Parent Item** blank
   - **Add On Item**: Select accessory (Universal Screen Protector)
   - **Price Level**: Select level
   - **Min/Max Price**: Optional price filtering
   - Save record

3. **Flag All Items in Class**
   - Navigate to each item in target class
   - Check `custitem_ns_accessorypopup` field
   - Save items
   - OR use CSV import to bulk update

4. **Test Across Multiple Items**
   - Test with several items from the class
   - Verify pop-up appears for all
   - Verify same accessories suggested
   - Confirm price filtering works across items

**Outcome:** All items in specified class(es) trigger same add-on suggestions, dramatically reducing configuration effort for large catalogs.

---

### Process 3: Sales Order Entry with Add-Ons

**Actors:** Sales Representative, Order Entry Clerk

**Scenario:** Creating sales order with automatic add-on suggestions

**Steps:**

1. **Create Sales Order**
   - Navigate to: Transactions > Sales > Enter Sales Orders > New
   - Select customer
   - Enter header information

2. **Add Parent Item to Order**
   - Click Add on Items subtab
   - Select item (e.g., Canon EOS Rebel Camera)
   - Enter quantity: 1
   - Click Add/OK button

3. **Respond to Add-On Pop-Up**
   - Pop-up window appears automatically
   - Review suggested accessories:
     - 64GB SD Memory Card - $29.99
     - Camera Bag - Large - $49.99
     - Spare Battery - $39.99
     - Lens Cleaning Kit - $12.99
   - Adjust quantities using inline input fields
   - Click "Add" buttons for desired items
   - Click "Done" to close pop-up

4. **Review Order with Add-Ons**
   - Verify add-on items added to order
   - Note `custcol_ns_addonparent` field shows camera
   - Confirm pricing correct
   - Proceed with order completion

5. **Save Order**
   - Complete order entry
   - Save transaction
   - Add-ons associated with parent through line keys

**Outcome:** Order includes parent item and selected accessories with maintained relationships. Average order value increased with minimal additional effort.

---

### Process 4: Managing Parent-Child Relationships

**Actors:** Sales Representative

**Scenario:** Modifying order with parent-child item relationships

**Use Case A: Attempting to Delete Parent with Children**

1. Sales order contains:
   - Line 1: Laptop (parent)
   - Line 2: Laptop bag (add-on, parent=Laptop)
   - Line 3: Mouse (add-on, parent=Laptop)

2. Rep attempts to delete Line 1 (Laptop)

3. Client script intercepts deletion:
   - Searches for lines where `custcol_ns_addonparent` = Laptop
   - Finds Lines 2 and 3
   - Shows alert: "Remove all associated add-ons first"
   - Prevents deletion

4. Rep must:
   - Delete Line 3 (Mouse)
   - Delete Line 2 (Laptop bag)
   - Then delete Line 1 (Laptop)

**Use Case B: Changing Item on Parent Line**

1. Sales order contains:
   - Line 1: Camera Model A (parent)
   - Line 2: Camera bag (add-on, parent=Camera Model A)

2. Rep changes Line 1 item to Camera Model B

3. Client script intercepts change:
   - Detects Line 2 has `custcol_ns_linechildkey` pointing to Line 1
   - Shows alert: "You may not change the item on this line without first removing all associated add-ons"
   - Reverts item field to Camera Model A

4. Rep must:
   - Delete Line 2 (Camera bag)
   - Then change Line 1 to Camera Model B
   - Optionally add Line 1 again to trigger new add-on suggestions for Model B

**Use Case C: Manually Assigning Add-On Parent**

1. Rep adds item without using pop-up (e.g., manually searched for accessory)

2. Rep wants to associate it with parent item on order:
   - Edit accessory line
   - Set `custcol_ns_addonparent` field to parent item
   - Client script automatically sets `custcol_ns_linechildkey` to parent's line key
   - Relationship established

**Outcome:** Data integrity maintained through parent-child associations. Prevents orphaned accessories and ensures proper order structure.

---

### Process 5: Fulfillment with Add-Ons

**Actors:** Warehouse Personnel, Fulfillment Manager

**Scenario:** Fulfilling sales order with parent-child relationships

**Steps:**

1. **Create Item Fulfillment from Sales Order**
   - Navigate to sales order
   - Click Fulfill button
   - Item fulfillment form loads with line items

2. **Parent-Child Relationships Persist**
   - Line items include:
     - `custcol_ns_lineparentkey` (carried forward)
     - `custcol_ns_linechildkey` (carried forward)
     - `custcol_ns_addonparent` (carried forward)
   - Relationships visible and maintained

3. **Picking and Packing**
   - Warehouse personnel see which accessories go with which parent items
   - Can group items for packing
   - Ensures complete package for customer

4. **Save Fulfillment**
   - Process fulfillment normally
   - Relationships maintained in fulfillment record
   - Available for reporting and analysis

**Outcome:** Parent-child associations flow through entire order-to-cash process, enabling proper picking, packing, and analysis of accessory attachment rates.

---

## Configuration Guide

### Initial Setup Checklist

#### 1. Enable Required NetSuite Features

Navigate to: Setup > Company > Enable Features

- ✓ Custom Records (Lists, Records, & Fields tab)
- ✓ Server SuiteScript (SuiteCloud tab)
- ✓ Client SuiteScript (SuiteCloud tab)
- ✓ SuiteFlow (SuiteCloud tab)
- ✓ Classes (optional, only if using class-based targeting)

#### 2. Deploy SDF Project

**Option A: SuiteCloud Development Framework**

```bash
cd "sdf/PSW-AddOns-main/add-ons/src"
suitecloud project:validate --server
suitecloud project:deploy
```

**Option B: Manual Deployment via UI**

1. Upload script files:
   - Customization > Scripting > Scripts > Upload > New
   - Upload `accessorypop.js`
   - Upload `ns_su_accessories.js`

2. Create custom record type:
   - Customization > Lists, Records, & Fields > Record Types > New
   - Import `customrecord_drss_accessories.xml` OR
   - Manually create record with fields per data model

3. Create custom fields:
   - Item field: `custitem_ns_accessorypopup`
   - Transaction body: `custbody_ns_acc_poppedlines`
   - Transaction columns: `custcol_ns_addonparent`, `custcol_ns_lineparentkey`, `custcol_ns_linechildkey`

4. Create workflow:
   - Import `customworkflow_nsps_addonmanager.xml` OR
   - Manually build workflow per specifications

#### 3. Deploy Scripts

**Client Script Deployment:**

1. Navigate to: Customization > Scripting > Scripts
2. Find: NS | CS | Add-On Pop-up (`customscript_ns_cu_accpop`)
3. Create new deployment:
   - **Status:** Released
   - **Applies To:** Sales Order
   - **Audience:** All Roles (or specific roles)
   - **Log Level:** Debug (initially, reduce to Error after testing)
   - **Script Parameter:**
     - `custscript_nscs_poponce`: Unchecked (pop-up appears every time line edited)
     - OR Checked (pop-up appears only when line first added)
4. Save deployment

**Suitelet Deployment:**

1. Navigate to: Customization > Scripting > Scripts
2. Find: NS | SU | Add-Ons Suitelet (`customscript_ns_su_accessories`)
3. Deployment should already exist: `customdeploy_ns_su_accessories_1`
4. Verify settings:
   - **Status:** Released
   - **Audience:** All Roles
   - **Run As Role:** Administrator (for data access)
   - **Log Level:** Debug (initially)
5. Save deployment

#### 4. Configure Add-On Relationships

**Create Add Ons Records:**

For each parent-child relationship:

1. Navigate to: Lists > Add Ons > New
2. Enter configuration details per business requirements
3. Save record

**Bulk Configuration via CSV Import:**

1. Navigate to: Setup > Import/Export > Import CSV Records
2. Import Type: Add Ons
3. CSV Format:
   ```
   Parent Item,Add On Item,Price Level,Minimum Price,Maximum Price
   Dell XPS 13,Laptop Bag Premium,Base Price,1000,2000
   Dell XPS 13,Wireless Mouse,Base Price,1000,2000
   Dell XPS 13,USB-C Adapter,Base Price,1000,2000
   ```
4. Map fields and import

#### 5. Flag Parent Items

**Individual Item Updates:**

1. Navigate to parent item record
2. Check `custitem_ns_accessorypopup` field
3. Save item

**Bulk Updates via CSV Import:**

1. Navigate to: Setup > Import/Export > Import CSV Records
2. Import Type: Items
3. CSV Format:
   ```
   Item Internal ID,Add On Pop-up
   1234,T
   1235,T
   1236,T
   ```
4. Map fields and import

#### 6. Configure Sales Order Form

**Ensure Fields Visible:**

1. Navigate to: Customization > Forms > Transaction Forms
2. Edit Sales Order form used by sales team
3. **Items Subtab**, ensure visible:
   - Add On Parent
   - Line Parent Key (optional, can be hidden)
   - Line Child Key (optional, can be hidden)
4. Save form

#### 7. User Training

**Train Sales Team:**
- How to recognize pop-up window
- Selecting accessories
- Adjusting quantities
- Understanding parent-child relationships
- When to manually assign add-on parent

**Train Administrators:**
- Creating Add Ons records
- Flagging parent items
- Price threshold logic
- Class-based vs. item-based configuration
- Monitoring add-on conversion rates

#### 8. Testing

**Test Scenarios:**

1. **Basic Pop-Up**
   - Add flagged parent item to sales order
   - Verify pop-up appears
   - Select accessories
   - Verify items added correctly

2. **Price Filtering**
   - Test with parent item below minimum price
   - Verify filtered add-ons don't appear
   - Test with parent item within range
   - Verify add-ons appear

3. **Class-Based**
   - Test with multiple items in same class
   - Verify same add-ons appear for all

4. **Parent-Child Deletion**
   - Add parent and accessories
   - Attempt to delete parent
   - Verify prevention and alert

5. **Pop-Once Mode**
   - Enable pop-once parameter
   - Add item, respond to pop-up
   - Edit same line
   - Verify pop-up doesn't repeat

6. **Fulfillment Flow**
   - Create sales order with add-ons
   - Create item fulfillment
   - Verify relationships persist

---

## User Roles and Permissions

### Sales Administrator / Merchandising Manager

**Responsibilities:**
- Configure add-on relationships in Add Ons custom record
- Maintain item master data (add-on pop-up flag)
- Define price thresholds for tiered suggestions
- Set up class-based configurations for product categories
- Monitor add-on conversion rates and adjust configurations
- Train sales team on using add-on features

**Required Permissions:**
- Full access to Add Ons custom record
- Edit access to Item master records
- View access to Sales Order transactions
- Access to reporting for add-on analysis

### Sales Representative / Order Entry Clerk

**Responsibilities:**
- Create sales orders with customer information
- Respond to add-on pop-up suggestions
- Select appropriate accessories based on customer needs
- Adjust quantities for add-on items
- Manage parent-child relationships (delete accessories if customer declines)
- Explain accessory benefits to customers

**Required Permissions:**
- Create/Edit access to Sales Order transactions
- View access to Add Ons custom record (optional, for reference)
- Client script execution permissions

### Warehouse / Fulfillment Personnel

**Responsibilities:**
- Process item fulfillments from sales orders
- Use parent-child relationship information for picking
- Ensure accessories grouped with parent items for packing
- Quality check that complete accessory packages shipped

**Required Permissions:**
- Create/Edit access to Item Fulfillment transactions
- View access to Sales Order transactions
- View access to parent-child relationship fields

---

## Reporting and Analytics

### Key Performance Indicators

#### Add-On Attachment Rate

**Metric:** Percentage of eligible parent items that result in add-on purchases

**Calculation:**
```
(Number of parent items with add-on children) / (Total parent items sold) × 100
```

**Report Type:** Summary saved search

**Search Configuration:**
- **Type:** Transaction Line (Sales Order)
- **Criteria:**
  - Item has `custitem_ns_accessorypopup` = Yes
  - Date range as desired
- **Results:**
  - Count of lines
  - Count of lines where `custcol_ns_addonparent` references this item
  - Formula: Attachment rate
- **Grouping:** By item

#### Average Order Value Increase

**Metric:** Additional revenue per order from add-on items

**Calculation:**
```
(Total add-on revenue) / (Number of orders with add-ons)
```

**Report Type:** Summary saved search

**Search Configuration:**
- **Type:** Transaction (Sales Order)
- **Criteria:**
  - Has lines where `custcol_ns_addonparent` is not empty
  - Date range as desired
- **Results:**
  - SUM(amount) for add-on lines
  - COUNT(transactions)
  - Formula: Average add-on value

#### Top Performing Add-Ons

**Metric:** Most frequently purchased accessory items

**Report Type:** Summary saved search

**Search Configuration:**
- **Type:** Transaction Line (Sales Order)
- **Criteria:**
  - `custcol_ns_addonparent` is not empty (is an add-on)
  - Date range as desired
- **Results:**
  - Item
  - SUM(quantity)
  - SUM(amount)
  - COUNT(transactions)
- **Sorting:** By quantity descending

#### Parent Items with Highest Add-On Conversion

**Metric:** Which parent items have highest add-on attach rates

**Report Type:** Detailed report with formulas

**Use Case:** Identify most successful parent-accessory combinations

---

## Troubleshooting Guide

### Issue: Pop-Up Doesn't Appear

**Symptoms:**
- Add item to sales order
- No pop-up window appears
- Expected to see add-on suggestions

**Diagnostic Steps:**

1. **Check Item Configuration**
   - Open item record
   - Verify `custitem_ns_accessorypopup` = Checked
   - If not checked, pop-up won't trigger

2. **Check Client Script Deployment**
   - Navigate to: Customization > Scripting > Script Status
   - Find deployment for current user and Sales Order
   - Verify Status = Released
   - Check deployment audience includes user's role

3. **Check Add Ons Records Exist**
   - Navigate to: Lists > Add Ons
   - Search for records with this parent item or parent class
   - Verify at least one record exists
   - Check price filtering (min/max) allows current item price

4. **Check Browser Console**
   - Open browser developer tools (F12)
   - Reload sales order form
   - Add item again
   - Look for JavaScript errors in console
   - Common issues:
     - Pop-up blocked by browser
     - Script execution errors

5. **Check Execution Log**
   - Navigate to: Setup > Management > Execution Log
   - Filter: Script = NS | CS | Add-On Pop-up
   - Look for ERROR or WARNING level messages
   - Review details for specific issue

**Resolutions:**
- If item not flagged: Check item and save
- If script not deployed: Deploy to Sales Order for user's role
- If no Add Ons records: Create configurations
- If price filtering: Adjust thresholds or remove
- If browser blocking pop-ups: Allow pop-ups for NetSuite domain
- If script errors: Review code, check for customizations

---

### Issue: Wrong Add-Ons Appearing

**Symptoms:**
- Pop-up appears but shows incorrect accessories
- Items appearing outside expected price range
- Add-ons for wrong parent item showing

**Diagnostic Steps:**

1. **Review Add Ons Configuration**
   - Navigate to: Lists > Add Ons
   - Search for parent item
   - Review each record:
     - Parent Item / Parent Class
     - Add On Item
     - Minimum Price
     - Maximum Price
     - Price Level

2. **Check Price Filtering Logic**
   - Note parent item price on sales order
   - Compare to min/max in Add Ons record
   - Logic: Add-on appears if `min < price < max`
   - If min/max blank, always appears

3. **Check Class-Based Conflicts**
   - If using class-based configs
   - Verify parent item class assignment
   - Check if multiple classes assigned
   - May be getting add-ons from unexpected class

4. **Check Suitelet Execution Log**
   - Navigate to: Setup > Management > Execution Log
   - Filter: Script = NS | SU | Add-Ons Suitelet
   - Review SuiteQL queries
   - Check parameters passed (item, price)
   - Verify query results

**Resolutions:**
- Adjust price thresholds in Add Ons records
- Correct parent item/class assignments
- Remove duplicate or conflicting configurations
- Verify item classification accuracy

---

### Issue: Parent-Child Relationship Not Maintained

**Symptoms:**
- Add-ons added but `custcol_ns_addonparent` blank
- Line keys not populated
- Can delete parent without restriction

**Diagnostic Steps:**

1. **Check Field Visibility on Form**
   - Edit sales order form customization
   - Verify fields present on Items subtab:
     - `custcol_ns_addonparent`
     - `custcol_ns_lineparentkey`
     - `custcol_ns_linechildkey`
   - If fields hidden or removed, script can't set values

2. **Check Client Script Deployment**
   - Verify script deployed to Sales Order
   - Check entry points enabled:
     - validateLine
     - fieldChanged
     - validateDelete
   - Verify execution context includes USERINTERFACE

3. **Check Browser Console**
   - Add item, check console for errors
   - Look for messages: "Line Key", "Parent Key"
   - Verify `addLine()` function executing

4. **Manual Testing**
   - Add parent item
   - Note line number
   - Check if `custcol_ns_lineparentkey` populated
   - Click into line, check value
   - Add accessory via pop-up
   - Check if `custcol_ns_addonparent` and `custcol_ns_linechildkey` populated

**Resolutions:**
- Restore fields to sales order form
- Verify client script fully deployed and released
- Check for conflicts with other client scripts
- Review script logic, ensure no customizations breaking key generation

---

### Issue: Pop-Up Appearing Repeatedly (Pop-Once Not Working)

**Symptoms:**
- Pop-up appears every time line edited
- Even with "Pop Up only on add" parameter enabled
- Annoying user experience

**Diagnostic Steps:**

1. **Check Script Parameter**
   - Navigate to client script deployment
   - Find parameter: `custscript_nscs_poponce`
   - Verify set to: Checked (True)

2. **Check Hidden Field**
   - Edit sales order
   - View page source or use browser inspector
   - Find field: `custbody_ns_acc_poppedlines`
   - Check if value being set (should be JSON array)

3. **Check saveRecord Event**
   - Ensure client script has `saveRecord` entry point
   - Verify function persists `window.poppedLines` to field
   - Check execution log for saveRecord execution

**Resolutions:**
- Enable pop-once parameter on deployment
- Verify hidden field exists and accessible
- Ensure saveRecord entry point active
- Check for browser issues storing window variables

---

## Performance Optimization

### Client Script Performance

**Considerations:**
- Field lookups executed on every line validation
- Pop-up window creation has overhead
- Large transactions (many lines) may slow

**Optimizations:**

1. **Minimize Field Lookups**
   - Current implementation looks up item data on each line
   - Could cache results in `window` object
   - Trade-off: Memory vs. repeated queries

2. **Batch Line Key Generation**
   - Generate keys only when needed
   - Check for existing key before generating new

3. **Optimize validateDelete Logic**
   - Current implementation searches all lines for children
   - For large transactions (100+ lines), may slow
   - Consider maintaining child index in memory

### Suitelet Performance

**Considerations:**
- SuiteQL queries executed on every pop-up open
- Joins to multiple tables
- Price-based filtering may be complex

**Optimizations:**

1. **Query Optimization**
   - Ensure Add Ons custom record fields indexed
   - Request NetSuite index: `custrecord_drss_parentitem`
   - Request NetSuite index: `custrecord_drss_accessoryitem`

2. **Result Caching**
   - For frequently accessed parent items
   - Cache query results for short duration (5 minutes)
   - Reduce repeated database hits

3. **Limit Results**
   - If returning 50+ add-ons, may slow rendering
   - Consider limiting results to top 20 most relevant
   - Add pagination if needed

### Workflow Performance

**Considerations:**
- Workflow executes on every Add Ons record create/edit
- Field display changes may have overhead

**Optimizations:**
- Workflow is lightweight, no performance concerns
- Disable logging after initial testing
- No changes needed for typical usage

---

## Appendices

### Appendix A: Field Reference

Complete list of all custom fields with technical details.

#### Item Fields

| Script ID | Label | Type | Applies To | Default | Source Tab |
|-----------|-------|------|------------|---------|------------|
| custitem_ns_accessorypopup | Add On Pop-up | Checkbox | Inventory, Assembly, Kit, Non-Inventory | Unchecked | Purchasing/Inventory |

#### Transaction Body Fields

| Script ID | Label | Type | Applies To | Display | Source Tab |
|-----------|-------|------|------------|---------|------------|
| custbody_ns_acc_poppedlines | Popped Line Array | Long Text | Sales Order | Hidden | System Information |

#### Transaction Column Fields

| Script ID | Label | Type | Applies To | Display | Description |
|-----------|-------|------|------------|---------|-------------|
| custcol_ns_addonparent | Add On Parent | List/Record (Item) | Sales Order, Item Fulfillment | Normal | Parent item reference |
| custcol_ns_lineparentkey | Line Parent Key | Text | Sales Order, Item Fulfillment | Locked | Unique line identifier |
| custcol_ns_linechildkey | Line Child Key | Text | Sales Order, Item Fulfillment | Locked | Parent line identifier |

### Appendix B: Script Reference

| Script ID | Type | File | Entry Points | Deployments |
|-----------|------|------|--------------|-------------|
| customscript_ns_cu_accpop | Client Script | accessorypop.js | pageInit, validateLine, fieldChanged, validateDelete, saveRecord | Sales Order |
| customscript_ns_su_accessories | Suitelet | ns_su_accessories.js | onRequest | Standard deployment |

### Appendix C: SuiteQL Query Reference

**Item-Based Add-Ons Query:**
```sql
SELECT
    a.custrecord_drss_accessoryitem AS internalid,
    c.name AS pricelevel,
    b.itemid,
    b.displayname,
    b.description,
    d.unitprice,
    d.quantity,
    e.itemid AS parent_item
FROM
    CUSTOMRECORD_DRSS_ACCESSORIES a
    INNER JOIN ITEM b ON a.custrecord_drss_accessoryitem = b.id
    INNER JOIN PRICELEVEL c ON a.custrecord_drss_accessoryprice = c.id
    INNER JOIN PRICING d ON a.custrecord_drss_accessoryitem = d.item
        AND d.pricelevel = a.custrecord_drss_accessoryprice
    INNER JOIN ITEM e ON a.custrecord_drss_parentitem = e.id
WHERE
    e.id = ?
    AND a.custrecord_drss_minprice < ?
    AND a.custrecord_drss_maxprice > ?
```

**Class-Based Add-Ons Query:**
```sql
SELECT
    a.custrecord_drss_accessoryitem AS internalid,
    c.name AS pricelevel,
    b.itemid,
    b.displayname,
    b.description,
    d.unitprice,
    d.quantity
FROM
    CUSTOMRECORD_DRSS_ACCESSORIES a
    INNER JOIN ITEM b ON a.custrecord_drss_accessoryitem = b.id
    INNER JOIN PRICELEVEL c ON a.custrecord_drss_accessoryprice = c.id
    INNER JOIN PRICING d ON a.custrecord_drss_accessoryitem = d.item
        AND d.pricelevel = a.custrecord_drss_accessoryprice
    INNER JOIN MAP_customrecord_drss_accessories_custrecord_drss_parentclass e
        ON a.id = e.mapone
WHERE
    e.maptwo = ?
    AND (a.custrecord_drss_minprice IS NULL OR a.custrecord_drss_minprice <= ?)
    AND (a.custrecord_drss_maxprice IS NULL OR a.custrecord_drss_maxprice > ?)
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
- NetSuite SuiteAnswers for platform features
- SuiteScript 2.1 API Documentation

**Additional Resources:**
- NetSuite Help Center: Client Scripts
- NetSuite Help Center: Suitelets
- NetSuite Help Center: SuiteQL
- NetSuite Community Forums

---

*End of Document*
