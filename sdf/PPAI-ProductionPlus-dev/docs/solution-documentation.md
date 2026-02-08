# Production Plus for Promotional Products
## NetSuite Solution Documentation

---

## Executive Summary

**Solution Name:** Production Plus for Promotional Products
**Solution Type:** Manufacturing Execution System
**Version:** 1.0
**Industry Focus:** Promotional Products Manufacturing, Apparel Decoration, Branded Merchandise

### Overview

Production Plus is a comprehensive NetSuite customization designed specifically for promotional product manufacturers and decorators who customize items with logos, artwork, and branding. The solution streamlines manufacturing operations by automating work order generation, managing complex imprint and decoration workflows, and tracking production events from sales order through completion.

### Value Proposition

Promotional product companies face unique challenges:
- **Complex Decoration Specifications**: Multiple imprint locations, designs, colors, and methods per item
- **Custom Artwork Management**: Customer logos and artwork must be tracked and applied correctly
- **Production Scheduling Constraints**: Balancing customer deadlines with equipment availability
- **Work Order Complexity**: Managing assemblies, components, and decoration operations
- **Shop Floor Visibility**: Tracking which machine, operator, and artwork is used for each job

Production Plus solves these challenges by extending NetSuite's native Work Order functionality with specialized records and automation that capture the full complexity of promotional product manufacturing.

---

## Solution Architecture

### Data Model

```
Sales Order
    ├─ custbody_nsra_linkedprodrec_so_head ──┐
    └─ Transaction Lines                      │
         └─ custcol_ns_ppai_imprint_orderdetail ──┐
                                              │    │
                Production Plus Record ◄──────┘    │
                (customrecord_nsra_ppr)            │
                    ├─ Production Events           │
                    │   (customrecord_nsra_pp_prodevent)
                    ├─ Linked Work Orders          │
                    └─ Imprint Order Details ◄─────┘
                         (customrecord_ns_ppai_imprnt_orderdetails)
                             └─ Imprint Details
                                 (customrecord_ns_ppai_imprintdetails)
                                     ├─ Artwork Item
                                     ├─ Location
                                     ├─ Design
                                     └─ Imprint Config Template
```

### Custom Records

#### 1. Production Plus Record (`customrecord_nsra_ppr`)

**Purpose:** Central production management record linking sales orders to work orders and tracking overall production status.

**Key Fields:**
- **Customer Order** (`custrecord_nsra_ppr_`): Link to originating Sales Order
- **Sales Order Notes** (`custrecord_nsps_sales_order_notes`): Sourced from sales order
- **In Hands Date** (`custrecord_nsps_in_hands_date`): Customer required date (from SO)
- **Ship Date** (`custrecord_nsps_ship_date`): Planned ship date (from SO)
- **Production Start Date** (`custrecord_nsps_prod_start_date`): When production begins
- **Production End Date** (`custrecord_nsps_prod_end_date`): When production completes
- **Total Quantity** (`custrecord_nsps_total_qty`): Total units to produce (calculated)
- **Total Imprints** (`custrecordnsps_total_imprints`): Count of imprint variations (calculated)
- **Total Designs** (`custrecord_ns_ppai_total_design`): Count of unique designs (calculated)
- **Total Locations** (`custrecord_ns_ppai_total_location`): Count of imprint locations (calculated)
- **Routing Template** (`custrecord_ns_ppai_routing_template`): Manufacturing routing
- **Scheduling Method** (`custrecord_ns_ppai_scheduling_method`): Forward or Backward
- **Status** (`custrecord_ns_ppai_status`): Planning, In Production, Completed, Cancelled

**Subtabs:**
1. **Work Orders**: Saved search showing all linked work orders
2. **Line Imprint Details**: Saved search showing imprint specifications
3. **Production Events**: Child production events for this record

**Record Numbering:** Auto-numbered with prefix "ProdPlus"

**Access:** Appears in Shipping/Inventory/Manufacturing center

#### 2. Production Event (`customrecord_nsra_pp_prodevent`)

**Purpose:** Tracks individual production operations/activities within a production run.

**Key Fields:**
- **Production Record** (`custrecord_nsra_prod_event_pr`): Parent Production Plus Record
- **Date** (`custrecord_prod_event`): Date of production activity
- **Machine** (`custrecord_nsra_prod_event_machine`): Equipment used (from custom list)
- **Production Event Imprint Method** (`custrecord_nsra_`): Decoration method/template
- **Total Run Time** (`custrecord_nsps_total_run_time`): Actual production time
- **Total Setup Time** (`custrecord_nsps_total_setup_time`): Machine setup time
- **Assigned To** (`custrecord_nsps_assigned_to`): Employee responsible
- **Total to Build** (`custrecord_nsps_total_build`): Quantity for this operation
- **Production Event Item** (`custrecord_nsps_prod_event_item`): Item being produced
- **Artwork Item** (`custrecord_ns_ppai_artwork_item`): Stored artwork used (non-inventory item)

**Use Case:** Shop floor operators create Production Events to record actual manufacturing activities, capturing which machine was used, how long setup and run took, and which artwork/design was applied.

#### 3. Imprint Order Details (`customrecord_ns_ppai_imprnt_orderdetails`)

**Purpose:** Master record for all imprint/decoration specifications for a sales order line.

**Key Fields:**
- **Sales Order** (`custrecord_ns_ppai_iod_salesorder`): Parent sales order
- **Production Record** (`custrecord_ns_ppai_iod_prod_rec`): Linked Production Plus Record
- **Item** (`custrecord_ns_ppai_iod_item`): Item being decorated
- **Quantity** (`custrecord_ns_ppai_iod_qty`): Quantity to produce
- **Line Number**: Sales order line reference

**Child Records:** Has multiple Imprint Details (one per decoration location/design)

#### 4. Imprint Details (`customrecord_ns_ppai_imprintdetails`)

**Purpose:** Detailed decoration specifications for each imprint location on an item.

**Key Fields:**
- **Imprint Order Details** (`custrecord_ns_ppai_id_iod`): Parent record
- **Imprint Configuration Template** (`custrecord_ns_ppai_id_imprinttemplate`): Decoration method template
- **Artwork Item** (`custrecord_ns_ppai_id_artwork_item`): Stored artwork to apply
- **Location** (`custrecord_ns_ppai_id_location`): Where on item (front, back, sleeve, etc.)
- **Design** (`custrecord_ns_ppai_id_design`): Design variation
- **Number of Colors** (`custrecord_ns_ppai_id_numcolor`): Color count for imprint
- **Art Height** / **Art Width**: Dimensions for decoration

**Use Case:** A t-shirt order might have 3 Imprint Details records:
1. Company logo on front left chest (1 color)
2. Event name on back (2 colors)
3. Sponsor logo on left sleeve (full color)

#### 5. Imprint Configuration Template (`customrecord_ns_ppai_imprtconfig_tmpl`)

**Purpose:** Reusable templates defining decoration methods and processes.

**Examples:**
- Screen Printing - Standard
- Embroidery - Left Chest
- Heat Transfer - Full Back
- Digital Print - All-Over

**Usage:** Linked from Imprint Details to specify how decoration should be applied. Can include setup instructions, machine requirements, and process parameters.

#### 6. Stored Art List (`customrecord_ns_ppai_stored_art_list`)

**Purpose:** Library of artwork files and design assets.

**Usage:** Maintains repository of customer logos, designs, and artwork files. Referenced by Production Events and Imprint Details to ensure correct artwork is used in production.

---

## Scripts and Automation

### Core Scripts

#### 1. NS | SL | PPAI (`customscript_ns_sl_ppai`)
**Type:** Suitelet
**Entry Point:** Custom button on Sales Order

**Functionality:**
1. **GET Request**: Displays confirmation dialog asking user to proceed with Production Plus Record creation
2. **POST Request**:
   - Aggregates imprint details from sales order
   - Calculates totals (quantity, imprints, designs, locations)
   - Creates Production Plus Record
   - Updates Imprint Order Details with Production Record link
   - Updates Sales Order with Production Record link
   - Triggers Map/Reduce script to link work orders
   - Returns success message with link to new Production Record

**Script Parameters:**
- `custscript_ns_sl_imprint_detail_search`: Saved search for imprint details
- `custscript_ns_sl_imprint_detail_summary`: Saved search for imprint totals
- `custscript_ns_sl_production_plus_record`: Production Plus Record type ID
- `custscript_ns_process_wo_linked_to_so_mr`: Map/Reduce script ID for WO linking
- `custscript_ns_so_imprint_detail_search`: Saved search for SO imprint details

**Key Functions:**
- `getImprintDetails()`: Retrieves all imprint details for sales order
- `getImprintDetailsSummary()`: Calculates totals (imprints, designs, locations, quantity)
- `createProductionPlusRecord()`: Creates and saves Production Plus Record
- `setImprintDetailsProductionPlus()`: Updates imprint records with production link

#### 2. NS | MR | Process WO Linked to SO (`customscript_ns_mr_process_wo_link_to_wo`)
**Type:** Map/Reduce

**Purpose:** Links existing work orders to newly created Production Plus Record.

**Workflow:**
1. **GetInputData**: Searches for work orders linked to sales order
2. **Map**: Processes each work order
3. **Reduce**: Updates work orders with Production Plus Record reference

**Triggered By:** Suitelet after Production Plus Record creation

#### 3. NS | MR | Build Work Orders (`customscript_ns_mr_build_wo`)
**Type:** Map/Reduce

**Purpose:** Automatically transforms work orders into assembly builds when conditions are met.

**Logic:**
1. **GetInputData**: Searches for unbuild work orders linked to Production Plus Record
2. **Map**: For each work order, checks:
   - No backorders on inventory/assembly items
   - No routing template assigned (or routing complete)
3. **Reduce**: If conditions met, transforms Work Order → Assembly Build

**Validation Rules:**
- Only builds if inventory is available (no backorders)
- Skips work orders with active routing requirements
- Item type must be Inventory Part or Assembly

#### 4. NS | MR | Complete Work Orders (`customscript_ns_mr_complete_wo`)
**Type:** Map/Reduce

**Purpose:** Batch processes work order completions.

**Workflow:**
1. Identifies work orders ready for completion
2. Validates all operations complete
3. Updates work order status to Closed
4. Creates item fulfillments if needed

#### 5. NS | MR | Update Production Dates on WO (`customscript_ns_mr_update_prod_dates_wo`)
**Type:** Map/Reduce

**Purpose:** Propagates production start/end dates from Production Plus Record to linked work orders.

**Scheduling Logic:**
- **Forward Scheduling**: Sets production start date → NetSuite calculates end date based on routing
- **Backward Scheduling**: Sets production end date → NetSuite calculates start date based on routing

#### 6. NS | UE | Create Button (`customscript_ns_ue_create_button`)
**Type:** User Event Script

**Purpose:** Adds custom buttons to transaction and production records.

**Buttons Added:**
- **Sales Order**: "Create Production Plus Record" button
- **Production Plus Record**: "Update Work Order Dates", "Build Work Orders", "Complete Work Orders"
- **Work Order**: Context-specific actions

**Script Parameters:**
- `custscript_ns_cs_file_name`: Client script file for button actions
- `custscript_ns_check_routing_wo_search`: Saved search for routing validation

#### 7. NS | CS | PPAI (`customscript_ns_cs_ppai`)
**Type:** Client Script

**Purpose:** Client-side validation and UI enhancements.

**Functions:**
- Validates imprint detail completeness before saving
- Dynamically shows/hides fields based on scheduling method
- Calculates totals on the fly
- Provides user feedback for validation errors

### Suitelet Interfaces

#### Mass Production Plus (`customscript_ns_sl_mass_production_plus`)
Bulk interface for creating multiple Production Plus Records from a list of sales orders.

#### Build Work Orders Interface (`customscript_ns_sl_build_wo`)
User interface for selecting and building multiple work orders simultaneously.

#### Complete Work Orders Interface (`customscript_ns_sl_complete_wo`)
User interface for selecting and completing multiple work orders simultaneously.

#### Update Production Dates Interface (`customscript_ns_sl_update_prod_dates_wo`)
Interface for updating production dates across multiple work orders.

---

## Custom Fields

### Transaction Body Fields

| Script ID | Label | Applied To | Description |
|-----------|-------|------------|-------------|
| `custbody_nsra_linkedprodrec_so_head` | Linked Production Record | Sales Order, Work Order | Links transaction to Production Plus Record |
| `custbody_ns_ppai_parent` | PPAI Parent | Work Order | Links WO to parent production record |
| `custbody_ns_ppai_requiredate` | Required Date | Sales Order | Customer in-hands date requirement |
| `custbody_nsps_sales_order_notes` | Sales Order Notes | Transactions | Special production instructions |

### Transaction Column Fields

| Script ID | Label | Description |
|-----------|-------|-------------|
| `custcol_ns_ppai_imprint_orderdetail` | Imprint Order Details | Links transaction line to imprint specifications |
| `custcol_nsps_assemblyitem` | Assembly Item | Assembly item reference for production |
| `custcol_nsps_prod_event` | Production Event | Links to production event record |

### Item Fields

| Script ID | Label | Description |
|-----------|-------|-------------|
| `custitem_ns_ppai_artwork_item` | Artwork Item Flag | Identifies non-inventory items used for artwork storage |
| `custitem_ns_ppai_artwork_file` | Artwork File | File reference to stored artwork |
| `custitem_ns_ppai_defaultimprinttemplat` | Default Imprint Template | Default decoration method for this item |

### Entity Fields

| Script ID | Label | Description |
|-----------|-------|-------------|
| `custevent_ns_ppai_assembly` | Assembly | Assembly item reference on calendar event |
| `custevent_ns_ppai_prod_plus_record` | Production Plus Record | Links calendar event to production record |

---

## Custom Lists

### Production Plus Status (`customlist_ns_ppai_prod_plus_status`)
- Planning
- In Production
- Completed
- Cancelled

### Scheduling Method (`customlist_ns_ppai_scheduling_method`)
- **Forward Scheduling**: Start date known, calculate end date
- **Backward Scheduling**: End date known (required date), calculate start date

### Design List (`customlist_ns_ppai_design`)
Available designs for imprinting (customer-configured)
- Logo A
- Logo B
- Event Theme 2024
- Seasonal Design
- Custom Text

### Imprint Location List (`customlist_ns_ppai_imprintloclist`)
Physical locations for decoration:
- Front Left Chest
- Full Front
- Full Back
- Left Sleeve
- Right Sleeve
- Front Pocket
- Back Neck
- Custom Location

### Number of Colors (`customlist_ns_ppai_imprint_numcolor`)
- 1 Color
- 2 Colors
- 3 Colors
- 4 Colors
- 5+ Colors
- Full Color / CMYK

### Production Event Machines (`customlist_nsra_ppr_event_machines`)
Equipment available for production (customer-configured):
- Screen Press 1
- Screen Press 2
- Embroidery Machine A
- Embroidery Machine B
- Heat Press 1
- Digital Printer 1
- Laser Engraver

---

## Business Processes

### Process 1: Sales Order to Production Record

**Trigger:** Sales representative completes sales order with imprint requirements

**Steps:**

1. **Sales Order Entry**
   - Sales rep creates sales order with decorated items
   - For each line requiring decoration, creates/links Imprint Order Details record
   - Specifies artwork, locations, colors, designs for each imprint
   - Sets required in-hands date on order

2. **Imprint Details Entry**
   - For each sales order line, creates Imprint Order Details record
   - Adds one Imprint Details child record for each decoration location
   - Selects artwork item from library
   - Chooses imprint configuration template (decoration method)
   - Specifies location, design, colors, dimensions

3. **Production Record Creation**
   - Production manager clicks "Create Production Plus Record" button on approved sales order
   - Suitelet displays confirmation dialog with order summary
   - Upon confirmation:
     - System aggregates all imprint details
     - Calculates totals (quantity, imprints, designs, locations)
     - Creates Production Plus Record
     - Links record to sales order
     - Updates all Imprint Order Details with production record reference
     - Initiates work order linking process
   - Production Plus Record opens automatically

4. **Work Order Linking**
   - Map/Reduce script searches for existing work orders for the sales order
   - Links each work order to new Production Plus Record
   - Work orders appear in Production Plus Record's Work Orders subtab

**Outcome:** Centralized Production Plus Record consolidates all information needed to manufacture the order, with links to sales order, work orders, and detailed imprint specifications.

---

### Process 2: Production Scheduling

**Trigger:** Production manager reviews new Production Plus Records

**Steps:**

1. **Review Production Requirements**
   - Production manager opens Production Plus Record
   - Reviews Work Orders subtab to see all work orders created
   - Reviews Line Imprint Details subtab to understand decoration requirements
   - Checks customer required date (In Hands Date)

2. **Select Scheduling Method**
   - **Forward Scheduling**: When prioritizing equipment availability
     - Set "Scheduling Method" = Forward Scheduling
     - Enter "Production Start Date" = when production can begin
     - Leave "Production End Date" blank
     - System calculates end date based on routings
   - **Backward Scheduling**: When prioritizing customer deadline
     - Set "Scheduling Method" = Backward Scheduling
     - Enter "Production End Date" = must-complete date
     - Leave "Production Start Date" blank
     - System calculates start date based on routings

3. **Assign Routing Template**
   - Select appropriate routing template based on decoration methods required
   - Routing defines sequence of operations and time estimates
   - Templates configured with operations like:
     - Material Prep
     - Screen Setup
     - Printing Pass 1
     - Drying
     - Printing Pass 2
     - Quality Check
     - Folding/Packing

4. **Propagate Dates to Work Orders**
   - Click "Update Work Order Dates" button
   - Suitelet launches Map/Reduce script
   - Script updates production start/end dates on all linked work orders
   - Work orders now appear on production schedule

**Outcome:** All work orders have appropriate production dates, appear on shop floor schedule, and operators can see which jobs to prioritize.

---

### Process 3: Shop Floor Production Tracking

**Trigger:** Shop floor operator begins work on a production job

**Steps:**

1. **Production Event Creation**
   - Operator opens Production Plus Record from work queue
   - Navigates to Production Events subtab
   - Clicks "New Production Event"

2. **Event Details Entry**
   - **Date**: Today's date (or actual production date)
   - **Machine**: Selects equipment from dropdown (Screen Press 1, Embroidery Machine A, etc.)
   - **Production Event Imprint Method**: Selects decoration method template
   - **Production Event Item**: Selects item being produced
   - **Artwork Item**: Selects correct artwork from library
   - **Total to Build**: Quantity for this production run
   - **Assigned To**: Employee performing the work

3. **Time Tracking**
   - **Total Setup Time**: Hours spent setting up machine (artwork loading, screen setup, etc.)
   - **Total Run Time**: Hours spent in actual production
   - System can optionally create time tracking records for labor costing

4. **Quality Check**
   - Operator notes any issues or variations
   - System notes allow communication with production manager
   - Attachments can include photos of completed work

**Outcome:** Complete record of actual production activities, machine utilization, and time spent. Provides data for:
- Job costing accuracy
- Machine efficiency analysis
- Operator productivity tracking
- Historical reference for future similar jobs

---

### Process 4: Automated Work Order Building

**Trigger:** Scheduled Map/Reduce script or manual "Build Work Orders" button

**Steps:**

1. **Work Order Identification**
   - Script searches for work orders in "Released" status
   - Filters for work orders linked to Production Plus Records
   - Excludes work orders already built

2. **Readiness Validation**
   - For each work order, script checks:
     - **Inventory Availability**: No backorders on components
     - **Routing Status**: No active routing or routing complete
     - **Item Type**: Must be Assembly or Inventory Part
   - If any check fails, work order is skipped

3. **Assembly Build Transformation**
   - Script transforms Work Order → Assembly Build record
   - Assembly Build:
     - Consumes component inventory
     - Creates finished goods inventory
     - Updates work order status to "Built"
     - Maintains link to Production Plus Record

4. **Exception Handling**
   - Work orders with backorders remain in "Released" status
   - Work orders with incomplete routings wait for operation completion
   - Error log captures any transformation failures

**Outcome:** Automatic progression from Work Order → Assembly Build when conditions are met, reducing manual intervention and ensuring inventory accuracy.

---

### Process 5: Work Order Completion

**Trigger:** Production complete, ready to close work order

**Options:**

#### Option A: Manual Individual Completion
- Open work order
- Click "Build" button (if not already built)
- Verify quantities and quality
- Mark work order "Closed"

#### Option B: Bulk Completion via Suitelet
1. Production manager clicks "Complete Work Orders" button on Production Plus Record
2. Suitelet displays list of work orders ready for completion
3. Manager selects work orders to complete
4. Clicks "Process Completions"
5. Map/Reduce script processes selected work orders:
   - Creates item fulfillments if needed
   - Updates work order status to "Closed"
   - Records completion date
   - Updates Production Plus Record totals

**Outcome:** Work orders closed, inventory relieved, production record shows completed quantities.

---

### Process 6: Production Plus Record Completion

**Trigger:** All work orders complete

**Steps:**

1. **Verification**
   - Production manager reviews Production Plus Record
   - Checks Work Orders subtab - all should show "Closed"
   - Verifies all production events recorded
   - Confirms quantities match sales order

2. **Status Update**
   - Change Status from "In Production" → "Completed"
   - System date-stamps completion

3. **Final Documentation**
   - Attach final production notes
   - Link any quality reports
   - Document any variations from original specifications

4. **Reporting**
   - Production record available for historical reporting
   - Costing data complete for margin analysis
   - Artwork and process details available for reorders

**Outcome:** Complete production history maintained, ready for fulfillment and invoicing.

---

## User Roles and Permissions

### Production Manager Role
**Responsibilities:**
- Create Production Plus Records from sales orders
- Set production scheduling (forward/backward, dates)
- Assign routing templates
- Manage work order building and completion
- Run mass production operations
- Review production event history
- Analyze machine utilization

**Required Permissions:**
- Full access to Production Plus Records
- Full access to Production Events
- Edit access to Work Orders
- View access to Sales Orders
- Edit access to Imprint Order Details
- View access to Artwork Library

---

### Shop Floor Operator Role
**Responsibilities:**
- Create and update Production Events
- Record machine usage and time
- Track artwork applied
- Update work order status
- Communicate production issues

**Required Permissions:**
- View access to Production Plus Records
- Full access to Production Events
- View access to Work Orders
- View access to Imprint Details
- View access to Artwork Library

---

### Sales Representative Role
**Responsibilities:**
- Create sales orders with imprint requirements
- Enter Imprint Order Details
- Select artwork from library
- Specify decoration requirements (locations, colors, designs)
- Set customer required dates
- View production status

**Required Permissions:**
- Full access to Sales Orders
- Full access to Imprint Order Details
- Full access to Imprint Details
- View access to Artwork Library
- View access to Imprint Configuration Templates
- View access to Production Plus Records (own orders only)

---

### Art Department Role
**Responsibilities:**
- Manage artwork library (Stored Art List)
- Create and maintain Imprint Configuration Templates
- Upload and organize artwork files
- Define default imprint templates for items
- Approve artwork for production use

**Required Permissions:**
- Full access to Stored Art List records
- Full access to Imprint Configuration Templates
- Full access to Item records (artwork-related fields)
- View access to Production Events (to see artwork usage)

---

## Configuration Guide

### Initial Setup Checklist

#### 1. Enable Required NetSuite Features
- ✓ Work Orders (WORKORDERS)
- ✓ Assemblies (ASSEMBLIES)
- ✓ Manufacturing Routing (MFGROUTING)
- ✓ Custom Records (CUSTOMRECORDS)
- ✓ Server-Side Scripting (SERVERSIDESCRIPTING)
- ✓ Workflow (WORKFLOW)

#### 2. Configure Custom Lists

**Production Plus Status:**
1. Navigate to Customization > Lists, Records, & Fields > Custom Lists > New
2. Name: "Production Plus Status"
3. Add values:
   - Planning (default)
   - In Production
   - Completed
   - Cancelled

**Scheduling Method:**
1. Add values:
   - Forward Scheduling (default)
   - Backward Scheduling

**Machines List:**
1. Create "Production Event Machines" list
2. Add each piece of production equipment:
   - Machine ID/Name
   - Optional: Link to Fixed Asset record
   - Optional: Machine capacity, capabilities

**Imprint Locations:**
1. Create "Imprint Location List"
2. Add all possible decoration locations for your products:
   - Front Left Chest
   - Full Front
   - Full Back
   - Sleeves
   - Pockets
   - etc.

**Designs:**
1. Create "Design List"
2. Add standard designs offered
3. Update as new designs added

**Number of Colors:**
1. Create "Number of Colors" list
2. Add: 1 Color, 2 Colors, 3 Colors, etc.

#### 3. Create Imprint Configuration Templates

For each decoration method:
1. Navigate to Production Plus > Imprint Configuration Templates > New
2. Name template (e.g., "Screen Print - Standard", "Embroidery - Left Chest")
3. Document setup instructions
4. Specify equipment requirements
5. Note any special process parameters

Common templates:
- Screen Printing (1-color, 2-color, 3+ color)
- Embroidery (different locations)
- Heat Transfer
- Digital Print
- Laser Engraving
- Pad Printing

#### 4. Configure Routing Templates

For each decoration method:
1. Navigate to Manufacturing > Routing > New
2. Define operations sequence:
   - Material Preparation
   - Machine Setup
   - Production Run
   - Quality Check
   - Finishing
3. Set time estimates for each operation
4. Assign work centers/machines
5. Save routing template

#### 5. Set Up Artwork Library

1. Create non-inventory items for artwork storage:
   - Item Type: Non-Inventory for Sale or Non-Inventory for Resale
   - Check `custitem_ns_ppai_artwork_item` field
   - Attach artwork file to `custitem_ns_ppai_artwork_file`
2. Create Stored Art List records linking to artwork items
3. Organize by customer or design type

#### 6. Configure Item Records

For each decorated item:
1. Navigate to item record
2. Set `custitem_ns_ppai_defaultimprinttemplat` to most common decoration method
3. Document available imprint locations in item description
4. Set up Bill of Materials (BOM) if assembly

#### 7. Create Saved Searches

**Required Searches for Scripts:**

1. **Imprint Detail Search** (`custscript_ns_sl_imprint_detail_search`)
   - Type: Imprint Details
   - Criteria: Filters by sales order
   - Results: All imprint detail fields

2. **Imprint Detail Summary Search** (`custscript_ns_sl_imprint_detail_summary`)
   - Type: Imprint Details
   - Criteria: Group by sales order
   - Results: COUNT(imprints), COUNT(designs), COUNT(locations), MAX(quantity)

3. **SO Imprint Detail Search** (`custscript_ns_so_imprint_detail_search`)
   - Type: Sales Order
   - Joined: Imprint Order Details
   - Results: Line items with imprint details

4. **Work Orders for Build** (`custscript_ns_for_build_wo_search`)
   - Type: Work Order
   - Criteria: Status = Released, Built = No
   - Results: Work order details, backorder formulas

5. **Work Orders Linked to Production Plus**
   - Type: Work Order
   - Criteria: custbody_nsra_linkedprodrec_so_head is not empty
   - Results: Display in Production Plus Record subtab

#### 8. Deploy Scripts

For each script:
1. Navigate to Customization > Scripting > Scripts > Upload
2. Upload script file from `/SuiteScripts/_nscs/ppai/`
3. Create script record
4. Configure script parameters (searches, record types)
5. Create deployment:
   - Set status = Released
   - Assign roles
   - Set logging level (Debug for initial deployment)
   - Schedule (for Map/Reduce scripts)

**Script Deployment Priority:**
1. User Event (Create Button) - deploys to Sales Order, Production Plus Record
2. Client Script (PPAI) - deploys to forms
3. Suitelet (PPAI) - main production record creation
4. Map/Reduce scripts (process WO link, build WO, complete WO, update dates)
5. Mass processing Suitelets

#### 9. Customize Forms

**Production Plus Form:**
1. Navigate to Customization > Forms > Entry Forms > New
2. Custom Record Type: Production Plus Record
3. Layout:
   - Main tab: Customer Order, Dates, Scheduling, Status, Totals
   - Work Orders subtab: Saved search showing linked WOs
   - Line Imprint Details subtab: Saved search showing decorations
   - Production Events subtab: Child records
4. Add custom buttons calling Suitelets:
   - Update Work Order Dates
   - Build Work Orders
   - Complete Work Orders
5. Assign form to roles

**Sales Order Form:**
1. Customize standard Sales Order form or create custom
2. Add Production Plus fields: Required Date, Linked Production Record
3. Add custom button: "Create Production Plus Record"
4. Ensure Imprint Order Details field visible on line items

#### 10. Set Up Center Tabs (Optional)

1. Create "Production Plus" center category
2. Add to Shipping/Manufacturing center
3. Include links:
   - Production Plus Records (list)
   - Production Events (list)
   - Imprint Configuration Templates
   - Artwork Library
   - Mass Production Plus Interface

---

## Integration Points

### Sales Order → Production Plus Record

**Method:** Suitelet triggered by custom button

**Flow:**
1. User clicks "Create Production Plus Record" on Sales Order
2. User Event script injects button with onclick handler
3. Handler calls Suitelet with sales order ID
4. Suitelet:
   - Retrieves imprint details
   - Calculates totals
   - Creates Production Plus Record
   - Links records bidirectionally
   - Triggers WO linking Map/Reduce

**Data Passed:**
- Sales Order Internal ID
- Imprint Order Details (multiple records)
- Imprint Details (nested, multiple per order detail)
- Customer required date
- Sales order notes

**Result:**
- Production Plus Record created
- Sales Order field `custbody_nsra_linkedprodrec_so_head` populated
- Imprint Order Details field `custrecord_ns_ppai_iod_prod_rec` populated
- Work orders linked (via Map/Reduce)

---

### Production Plus Record → Work Orders

**Method:** Map/Reduce script automation

**Trigger:**
- Automatically after Production Plus Record creation (from Suitelet)
- Manually via "Build Work Orders" button

**Logic:**
1. **Input:** Search for work orders where Sales Order = Production Plus Record's SO
2. **Map:** Process each work order
3. **Reduce:** Update work order field `custbody_nsra_linkedprodrec_so_head` with Production Plus Record ID

**Result:** Work orders appear in Production Plus Record's Work Orders subtab

---

### Work Order → Assembly Build

**Method:** Record transformation via Map/Reduce

**Trigger:**
- Scheduled (e.g., nightly)
- Manual "Build Work Orders" button

**Validation:**
1. Work Order status = Released
2. Work Order not already built
3. No backorders on components (formula check)
4. No active routing requirements

**Transformation:**
```javascript
record.transform({
    fromType: record.Type.WORK_ORDER,
    fromId: workOrderId,
    toType: record.Type.ASSEMBLY_BUILD
}).save();
```

**Result:**
- Assembly Build created
- Component inventory consumed
- Finished goods inventory created
- Work Order status → Built

---

### Production Dates → Work Orders

**Method:** Mass update via Map/Reduce

**Trigger:** "Update Work Order Dates" button on Production Plus Record

**Logic:**
1. Retrieve Production Plus Record dates and scheduling method
2. Search for all linked work orders
3. For each work order:
   - If Forward Scheduling: Set production start date
   - If Backward Scheduling: Set production end date
4. NetSuite's routing engine calculates opposite date

**Result:** All work orders synchronized with production schedule

---

## Reporting and Analytics

### Standard Reports

#### Production Status Dashboard
- **Source:** Production Plus Records
- **Metrics:**
  - Orders in Planning, In Production, Completed
  - Average time from SO to Production Record creation
  - Average production cycle time (start to completion)
  - On-time completion rate (vs required date)

#### Work Order Completion Tracking
- **Source:** Work Orders joined to Production Plus Records
- **Metrics:**
  - Work orders released, built, closed
  - Backorder delays
  - Routing completion time
  - Build efficiency

#### Production Event History
- **Source:** Production Events
- **Metrics:**
  - Events by machine
  - Events by operator
  - Events by imprint method
  - Setup time vs run time analysis

#### Machine Utilization
- **Source:** Production Events
- **Grouping:** By Machine (from custom list)
- **Metrics:**
  - Total run time
  - Total setup time
  - Number of jobs
  - Average setup time per job
  - Utilization % (actual time vs available time)

#### Artwork Usage Report
- **Source:** Production Events joined to Artwork Items
- **Metrics:**
  - Times each artwork used
  - Items decorated with each artwork
  - Customers using each artwork
  - Artwork library coverage

#### Imprint Details Analysis
- **Source:** Imprint Details
- **Grouping:** By Location, Design, Color Count
- **Metrics:**
  - Most common imprint locations
  - Most requested designs
  - Average colors per decoration
  - Complexity trends over time

### Saved Search Examples

#### Production Plus Records Requiring Action
```
Type: Production Plus Record
Criteria:
  - Status = Planning OR In Production
  - Production Start Date <= Today + 7 days
Results:
  - Production Plus ID
  - Customer Order
  - Status
  - Production Start Date
  - Total Quantity
  - Work Orders Count (formula)
```

#### Work Orders with Backorders
```
Type: Work Order
Criteria:
  - Linked Production Record is not empty
  - Status = Released
  - Has backorders (formula: SUM(backorder) > 0)
Results:
  - Work Order Number
  - Production Plus Record
  - Item
  - Backorder Quantity
  - Expected Receipt Date
```

#### Production Events Needing Review
```
Type: Production Event
Criteria:
  - Setup Time is empty OR Run Time is empty
  - Date within last 7 days
Results:
  - Production Event ID
  - Production Record
  - Date
  - Machine
  - Assigned To
```

---

## Troubleshooting Guide

### Issue: Production Plus Record Creation Fails

**Symptoms:**
- Suitelet shows error after clicking Submit
- No Production Plus Record created
- Sales Order not updated

**Possible Causes & Solutions:**

1. **Missing Imprint Details**
   - Verify Imprint Order Details exist for sales order lines
   - Check that Imprint Details child records exist
   - Ensure saved search `custscript_ns_sl_imprint_detail_search` returns results

2. **Search Configuration Error**
   - Verify saved searches exist and are not inactive
   - Check search IDs match script parameters
   - Test searches manually with same filters

3. **Permission Issues**
   - Verify user has Create permission on Production Plus Records
   - Check user can edit Sales Order (to update linked field)
   - Confirm user can edit Imprint Order Details

4. **Script Errors**
   - Check Script Execution Log (Setup > Management > Execution Log)
   - Look for ERROR level messages
   - Review error details and stack trace

**Resolution Steps:**
1. Enable Debug logging on script deployment
2. Attempt creation again
3. Review execution log for detailed error
4. Fix data or configuration issue
5. Retry creation

---

### Issue: Work Orders Not Linking to Production Plus Record

**Symptoms:**
- Production Plus Record created successfully
- Work Orders subtab empty or incomplete
- Work orders exist for sales order but don't show link

**Possible Causes & Solutions:**

1. **Map/Reduce Script Not Triggered**
   - Check Map/Reduce Status (Customization > Scripting > Script Status)
   - Verify script `ns_mr_process_wo_link_to_wo` shows in queue or completed
   - Check script deployment is Active

2. **Work Orders Created Before Production Record**
   - Normal - script links existing WOs after creation
   - Wait for Map/Reduce to complete
   - Manually trigger by clicking button on Production Plus Record

3. **Work Order Search Issues**
   - Verify work orders have Sales Order populated
   - Check work orders are not closed/cancelled
   - Verify search criteria in Map/Reduce script

4. **Field Permissions**
   - Ensure Map/Reduce runs as Admin or role with full WO access
   - Check deployment "Run As" setting

**Resolution:**
1. Navigate to Customization > Scripting > Script Status
2. Find "Process WO Linked to SO" script
3. Check status:
   - **Pending**: Wait for execution
   - **Processing**: Wait for completion
   - **Complete**: Check results
   - **Failed**: Review error log
4. If failed, check error details
5. Fix issue and re-trigger manually:
   - Open Production Plus Record
   - Click custom button to re-run linking

---

### Issue: Work Orders Not Auto-Building

**Symptoms:**
- Work orders remain in "Released" status
- Assembly Builds not created automatically
- Production stuck waiting for builds

**Possible Causes & Solutions:**

1. **Backorders on Components**
   - Check work order component availability
   - Review formula field for backorder quantity
   - **Fix:** Receive components or adjust BOM

2. **Routing Not Complete**
   - Work order has routing template assigned
   - Operations not complete
   - **Fix:** Complete routing operations or remove routing

3. **Script Not Running**
   - Map/Reduce "Build Work Orders" not scheduled
   - **Fix:** Check scheduled scripts, verify deployment active

4. **Item Type Issues**
   - Script only processes Assembly and Inventory Part items
   - Service items, etc. skipped
   - **Fix:** Verify item types in BOM

5. **Script Parameters**
   - Saved search `custscript_ns_for_build_wo_search` misconfigured
   - **Fix:** Verify search returns candidate work orders

**Resolution:**
1. Open a work order that should be building
2. Manually check:
   - Status = Released? ✓
   - All components available (no backorders)? ✓
   - Routing empty or complete? ✓
3. If all conditions met:
   - Click "Build" button manually to test
   - If successful, issue is with scheduled script
   - Check scheduled script deployment
4. If manual build fails:
   - Review error message
   - Fix data issue (inventory, routing, etc.)

---

### Issue: Production Dates Not Updating on Work Orders

**Symptoms:**
- Update Production Dates button clicked
- Work orders still show old/empty dates
- Production schedule not synchronized

**Possible Causes & Solutions:**

1. **Map/Reduce Script Failed**
   - Check Script Status for "Update Prod Dates" script
   - Review error log if failed
   - Common cause: Permission error on work order

2. **Scheduling Method Not Set**
   - Production Plus Record must have Scheduling Method selected
   - Either Forward or Backward required
   - Corresponding date (Start or End) must be populated

3. **Work Orders Not Linked**
   - Update only affects work orders linked to Production Plus Record
   - Verify Work Orders subtab populated
   - Run WO linking script if needed

4. **Work Order Status**
   - Closed work orders may be excluded
   - Check script logic for status filters

**Resolution:**
1. Open Production Plus Record
2. Verify:
   - Scheduling Method selected
   - Appropriate date field populated (Start for Forward, End for Backward)
   - Work Orders subtab shows linked WOs
3. Click "Update Production Dates" button
4. Monitor Script Status page
5. Once complete, open a work order to verify dates updated
6. If still not updated:
   - Check execution log
   - Verify script parameter configuration
   - Test with single work order manually

---

### Issue: Production Events Not Saving

**Symptoms:**
- Error when saving Production Event
- Required field errors
- Event saves but doesn't appear in list

**Possible Causes & Solutions:**

1. **Required Fields Missing**
   - Production Record (parent) required
   - Check all mandatory fields populated

2. **Parent Record Link Incorrect**
   - Ensure Production Event linked to valid Production Plus Record
   - Can't create orphan events

3. **Custom List Values Missing**
   - Machine list empty or inactive values selected
   - Imprint Method template doesn't exist
   - **Fix:** Add list values, reactivate if needed

4. **Permissions**
   - User lacks Create permission on Production Event record type
   - **Fix:** Update role permissions

5. **Subtab Configuration**
   - Production Events subtab on Production Plus form misconfigured
   - Saved search filter too restrictive
   - **Fix:** Review subtab configuration

**Resolution:**
1. Navigate directly to Production Event record type
2. Click New (not from subtab)
3. Manually select Production Plus Record
4. Fill all fields, attempt save
5. If successful, issue is with subtab/form configuration
6. If still fails, check required fields and permissions

---

## Performance Optimization

### Map/Reduce Script Governance

**Challenge:** Large production runs create many work orders, events, and records to process.

**Solutions:**

1. **Scheduled Scripts**
   - Run WO Build script during off-peak hours (e.g., 2 AM)
   - Distribute processing across multiple deployments
   - Set concurrency limits to avoid blocking

2. **Search Optimization**
   - Add date range filters to limit result sets
   - Use joined searches instead of multiple lookups
   - Index custom fields used in search filters

3. **Batch Size Tuning**
   - Default Map/Reduce processes 1000 records per chunk
   - Reduce for complex operations
   - Increase for simple updates

4. **Governance Monitoring**
   - Review script execution logs for usage warnings
   - Check "Remaining Usage" in logs
   - Optimize if approaching limits

### Database Performance

**Large Record Volumes:**

1. **Archival Strategy**
   - Archive completed Production Plus Records older than 2 years
   - Move to separate "Archive" status
   - Create historical reporting searches with date filters

2. **Index Custom Fields**
   - Request NetSuite index commonly searched fields:
     - `custbody_nsra_linkedprodrec_so_head`
     - `custrecord_nsra_ppr_` (Sales Order link)
     - Status fields

3. **Saved Search Optimization**
   - Avoid "Any of" with > 100 values
   - Use date ranges to limit results
   - Summary searches preferred over detailed

### User Interface Performance

**Slow Form Loading:**

1. **Subtab Saved Searches**
   - Limit columns to essential fields
   - Add filters to reduce rows (e.g., open work orders only)
   - Use summary instead of detail where possible

2. **Client Script Optimization**
   - Avoid fieldChanged events on every keystroke
   - Debounce validation functions
   - Cache lookup results

3. **Form Customization**
   - Hide unused fields and tabs
   - Minimize sublist columns
   - Use saved layout for common views

---

## Maintenance and Support

### Regular Maintenance Tasks

#### Daily
- Monitor Script Status page for failures
- Review Production Plus Records in "Planning" status
- Check for work orders with backorders

#### Weekly
- Review Production Event completeness (setup/run times filled)
- Verify artwork library organized and accessible
- Check for orphaned Imprint Details (no production record)

#### Monthly
- Archive completed Production Plus Records (>90 days old)
- Review machine utilization reports
- Update custom lists (new machines, designs, locations)
- Verify routing templates reflect current processes

#### Quarterly
- Script performance review (execution times, governance usage)
- User feedback session (process improvements)
- Training refresher for new users
- Documentation updates

### NetSuite Version Upgrades

**Before Each Release:**

1. **Review Release Notes**
   - Check for changes to Work Order, Assembly, Routing features
   - Note any SuiteScript API changes
   - Review deprecated functionality

2. **Sandbox Testing**
   - Deploy release to Sandbox account
   - Test all critical workflows:
     - Production Plus Record creation
     - Work order linking
     - Automated building
     - Date propagation
   - Test each Map/Reduce script

3. **Script Validation**
   - Run SuiteCloud Unit Tests (if configured)
   - Validate saved searches still return expected results
   - Check custom field references still valid

**After Production Deployment:**

1. Monitor script execution for errors
2. Verify custom records accessible
3. Test user workflows
4. Provide user communication on any changes

### Common Customization Requests

#### Add New Imprint Location
1. Update `customlist_ns_ppai_imprintloclist`
2. Add new list value
3. Train users on when to use
4. Update imprint templates if needed

#### Add New Production Machine
1. Update `customlist_nsra_ppr_event_machines`
2. Add machine details
3. Optionally link to Fixed Asset record
4. Update capacity planning if needed

#### Change Scheduling Logic
1. Review current scheduling method options
2. Consider adding new value to `customlist_ns_ppai_scheduling_method`
3. Update Map/Reduce script `ns_mr_update_prod_dates_wo`
4. Test with sample production records

#### Add Custom Production Report
1. Create saved search on relevant record type
2. Include Production Plus Record joins
3. Add to dashboard or center tab
4. Train managers on interpretation

---

## Training Resources

### Production Manager Training (4-6 hours)

**Module 1: Production Plus Overview (1 hour)**
- Solution purpose and benefits
- Data model and record relationships
- Navigation and interface tour

**Module 2: Creating Production Records (1 hour)**
- From sales order to production record
- Understanding imprint details
- Totals and calculations
- Work order linking

**Module 3: Production Scheduling (1 hour)**
- Forward vs Backward scheduling
- Routing templates
- Date propagation
- Work queue management

**Module 4: Batch Operations (1 hour)**
- Mass production interfaces
- Building multiple work orders
- Completing work orders
- Date updates

**Module 5: Monitoring and Reporting (1 hour)**
- Production status dashboard
- Work order tracking
- Machine utilization
- Exception handling

**Module 6: Troubleshooting (30 minutes)**
- Common issues
- Where to find help
- Script status monitoring

### Shop Floor Operator Training (2-3 hours)

**Module 1: Production Events Basics (45 minutes)**
- What are production events
- When to create them
- Required information

**Module 2: Creating Production Events (45 minutes)**
- Hands-on: Create event from production record
- Selecting machine
- Recording time (setup + run)
- Choosing artwork

**Module 3: Time Tracking (30 minutes)**
- Importance of accurate times
- Setup vs run time
- Best practices

**Module 4: Quality Notes (15 minutes)**
- Documenting issues
- Communicating with management
- Attaching photos

### Sales Representative Training (1-2 hours)

**Module 1: Imprint Details Entry (30 minutes)**
- When to create Imprint Order Details
- Linking to sales order lines
- Required fields

**Module 2: Artwork Selection (30 minutes)**
- Browsing artwork library
- Selecting correct artwork
- Requesting new artwork

**Module 3: Decoration Specifications (30 minutes)**
- Choosing imprint locations
- Selecting designs
- Specifying colors
- Setting dimensions

**Module 4: Production Status Visibility (15 minutes)**
- Viewing linked production records
- Understanding production dates
- Communicating with customers

### Art Department Training (2-3 hours)

**Module 1: Artwork Library Management (1 hour)**
- Creating artwork items
- Uploading files
- Organizing library
- Stored art list records

**Module 2: Imprint Configuration Templates (1 hour)**
- Purpose of templates
- Creating new templates
- Documenting processes
- Linking to items

**Module 3: Production Artwork Usage (30 minutes)**
- How artwork flows to production
- Reviewing artwork usage reports
- Ensuring correct artwork applied

---

## Appendices

### Appendix A: Field Reference

Complete list of all custom fields with technical details.

#### Transaction Body Fields

| Script ID | Label | Type | Record | Default | Help Text |
|-----------|-------|------|--------|---------|-----------|
| custbody_nsra_linkedprodrec_so_head | Linked Production Record | List/Record | Sales Order, Work Order | | Links to Production Plus Record |
| custbody_ns_ppai_parent | PPAI Parent | List/Record | Work Order | | Parent Production Plus Record |
| custbody_ns_ppai_requiredate | Required Date | Date | Sales Order | | Customer in-hands date |
| custbody_nsps_sales_order_notes | Sales Order Notes | Text Area | Transaction | | Special production instructions |

#### Transaction Column Fields

| Script ID | Label | Type | Description |
|-----------|-------|------|-------------|
| custcol_ns_ppai_imprint_orderdetail | Imprint Order Details | List/Record | Links line to imprint specifications |
| custcol_nsps_assemblyitem | Assembly Item | List/Record | Assembly item for production |
| custcol_nsps_prod_event | Production Event | List/Record | Linked production event |

#### Custom Record Fields - Production Plus Record

| Script ID | Label | Type | Source | Description |
|-----------|-------|------|--------|-------------|
| custrecord_nsra_ppr_ | Customer Order | List/Record | | Sales Order link |
| custrecord_nsps_sales_order_notes | Sales Order Notes | Text Area | SO field | Sourced from sales order |
| custrecord_nsps_in_hands_date | In Hands Date | Date | SO field | Customer required date |
| custrecord_nsps_ship_date | Ship Date | Date | SO field | Planned ship date |
| custrecord_nsps_prod_start_date | Production Start Date | Date | | Production begins |
| custrecord_nsps_prod_end_date | Production End Date | Date | | Production completes |
| custrecord_nsps_total_qty | Total Quantity | Integer | Calculated | Total units |
| custrecordnsps_total_imprints | Total Imprints | Float | Calculated | Count of imprints |
| custrecord_ns_ppai_total_design | Total Designs | Float | Calculated | Count of designs |
| custrecord_ns_ppai_total_location | Total Locations | Float | Calculated | Count of locations |
| custrecord_ns_ppai_routing_template | Routing Template | List/Record | | Manufacturing routing |
| custrecord_ns_ppai_scheduling_method | Scheduling Method | List | | Forward/Backward |
| custrecord_ns_ppai_status | Status | List | | Record status |

### Appendix B: Script Reference

Complete list of all scripts with technical details.

| Script ID | Type | File | Entry Points | Deployments |
|-----------|------|------|--------------|-------------|
| customscript_ns_sl_ppai | Suitelet | ns_sl_ppai.js | onRequest | Sales Order button |
| customscript_ns_mr_ppai | Map/Reduce | ns_mr_ppai.js | getInputData, map, reduce | Scheduled + Manual |
| customscript_ns_mr_process_wo_link_to_wo | Map/Reduce | ns_mr_process_wo_linked_to_so.js | getInputData, map, reduce | Triggered by Suitelet |
| customscript_ns_mr_build_wo | Map/Reduce | ns_mr_build_wo.js | getInputData, map, reduce | Scheduled + Manual |
| customscript_ns_mr_complete_wo | Map/Reduce | ns_mr_complete_wo.js | getInputData, map, reduce | Manual |
| customscript_ns_mr_update_prod_dates_wo | Map/Reduce | ns_mr_update_prod_dates_wo.js | getInputData, map, reduce | Manual |
| customscript_ns_mr_update_wo_ot | Map/Reduce | ns_mr_update_wo_ot.js | getInputData, map, reduce | TBD |
| customscript_ns_ue_create_button | User Event | ns_ue_create_button.js | beforeLoad | Sales Order, Production Plus |
| customscript_ns_ue_link_wo | User Event | [TBD] | [TBD] | Work Order |
| customscript_ns_cs_ppai | Client Script | ns_cs_ppai.js | pageInit, fieldChanged, saveRecord | Production Plus form |
| customscript_ns_sl_mass_production_plus | Suitelet | ns_sl_mass_production_plus.js | onRequest | Mass operations |
| customscript_ns_sl_build_wo | Suitelet | ns_sl_build_wo.js | onRequest | Build WO interface |
| customscript_ns_sl_complete_wo | Suitelet | ns_sl_complete_wo.js | onRequest | Complete WO interface |
| customscript_ns_sl_update_prod_dates_wo | Suitelet | ns_sl_update_prod_dates_wo.js | onRequest | Update dates interface |
| customscript_ns_sl_wo_build | Suitelet | ns_sl_wo_build.js | onRequest | [TBD] |
| customscript_ns_sl_wo_completion | Suitelet | ns_sl_wo_completion.js | onRequest | [TBD] |
| customscript_ns_sl_inventory_detail | Suitelet | ns_sl_inventory_detail.js | onRequest | Inventory detail UI |

### Appendix C: Saved Search Reference

Required saved searches for script parameters.

| Search Name | Record Type | Purpose | Key Criteria | Key Results |
|-------------|-------------|---------|--------------|-------------|
| Imprint Detail Search | Imprint Details | Retrieve all imprint specs for SO | custrecord_ns_ppai_iod_salesorder = [SO ID] | All imprint fields |
| Imprint Detail Summary | Imprint Details | Calculate totals | Group by SO | COUNT(name), COUNT(artwork), COUNT(location), MAX(qty) |
| SO Imprint Detail Search | Sales Order | Line-level imprint data | Transaction ID | Item, Line, Imprint Order Detail |
| Work Orders for Build | Work Order | Find WOs ready to build | Status=Released, Built=No, Backorder=0 | WO fields, backorder formula |
| Work Orders by Production Plus | Work Order | Display linked WOs | custbody_nsra_linkedprodrec_so_head = [PP ID] | WO number, status, item, qty |
| Production Events by Production Record | Production Event | Display events | custrecord_nsra_prod_event_pr = [PP ID] | Date, machine, time, operator |

### Appendix D: Custom List Values

Reference data for all custom lists.

**Production Plus Status:**
- Planning (default)
- In Production
- Completed
- Cancelled

**Scheduling Method:**
- Forward Scheduling (default): Start date known, calculate end
- Backward Scheduling: End date known, calculate start

**Example Machines:**
- Screen Press 1
- Screen Press 2
- Automatic Screen Press
- Embroidery Machine A
- Embroidery Machine B
- Heat Press 1
- Heat Press 2
- Digital Printer - DTG
- Digital Printer - Sublimation
- Laser Engraver
- Pad Print Machine
- Manual Assembly Station

**Example Imprint Locations:**
- Front Left Chest
- Front Right Chest
- Front Center
- Full Front
- Front Pocket
- Back Top
- Back Center
- Full Back
- Back Bottom
- Left Sleeve
- Right Sleeve
- Left Leg
- Right Leg
- Tag/Label
- Inside Collar
- Custom Location

**Example Designs:**
- Company Logo Standard
- Company Logo Reversed
- Event Logo 2024
- Seasonal - Summer
- Seasonal - Fall
- Seasonal - Winter
- Seasonal - Spring
- Custom Text Only
- Customer Provided Art

**Number of Colors:**
- 1 Color - Single
- 2 Colors
- 3 Colors
- 4 Colors
- 5 Colors
- 6+ Colors
- Full Color Process (CMYK)
- Full Color + White Base
- Specialty (Metallic/Glow)

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

**Documentation:**
- This comprehensive solution documentation
- NetSuite SuiteAnswers for platform features
- Production Plus Design Doc V2.pdf (business requirements)

**Additional Resources:**
- NetSuite Help Center: Work Orders
- NetSuite Help Center: Assembly Builds
- NetSuite Help Center: Manufacturing Routing
- SuiteScript 2.1 API Documentation

---

*End of Document*
