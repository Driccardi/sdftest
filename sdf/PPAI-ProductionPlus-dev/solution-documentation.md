# Production Plus - Manufacturing Execution System

**Version**: 1.0 | **By**: Production Plus AI (PPAI)

---

## Description

Production Plus is a sophisticated manufacturing execution system (MES) designed specifically for promotional product manufacturers who customize items with imprinting, embroidery, and decoration. Built as an extension to NetSuite's work order and assembly management, Production Plus automates the complex workflows required to manage custom-decorated merchandise from sales order through production completion.

The solution consolidates decoration specifications from sales orders into centralized Production Plus Records that serve as the master production control documents. These records automatically generate work orders based on configurable templates, propagate production dates across all linked work orders, and track detailed imprint specifications including artwork files, color counts, imprint locations (front, back, sleeve), and decoration methods. Shop floor operators use custom Suitelet interfaces to record production events, build assemblies in batch, and complete work orders efficiently.

Organizations benefit from complete visibility into production status, automated work order creation eliminating manual entry errors, batch processing capabilities for high-volume operations, and detailed tracking of machine usage, operator time, and artwork management. The solution supports both forward scheduling (from start date) and backward scheduling (from required completion date) with automatic date propagation across entire production runs.

---

## Solution Details

### Solution Type
- **Manufacturing & Production**

### Target Industries
- **Manufacturing** (promotional products, branded merchandise, custom apparel)
- **Wholesale Distribution** (imprinted promotional items)
- **Retail** (custom decoration services)

### Dependencies
- **Supply Chain Management (SCM) Bundle** - Item substitute records

---

## Features

### Custom Decoration Management
Comprehensive imprint and decoration specification tracking including artwork files, design details, color counts, imprint locations, and decoration methods.

### Automated Work Order Generation
Map/Reduce scripts automatically create work orders from Production Plus Records based on sales order imprint details and configurable templates.

### Production Event Tracking
Shop floor operators record detailed production events with machine assignment, time tracking, operator identification, and artwork usage.

### Forward/Backward Scheduling
Support for both forward scheduling (from production start) and backward scheduling (from customer required date) with automatic date calculation.

### Batch Build & Completion
Suitelet interfaces enable bulk selection and processing of multiple work orders simultaneously for efficient high-volume operations.

### Artwork Library
Centralized repository of artwork files and design assets with reusable templates for common decoration patterns.

### Production Date Propagation
Map/Reduce script automatically propagates production dates from Production Plus Records to all linked work orders when schedules change.

### Machine & Resource Tracking
Track which production machines and equipment are used for each operation with machine-specific event recording.

### Mass Production Interface
Bulk interface for processing multiple Production Plus Records and work orders simultaneously.

### Inventory Validation
Work order build process validates inventory availability before allowing assembly builds to proceed.

### Production Status Visibility
Real-time status tracking (Planning, In Production, Completed, Cancelled) across all production records and work orders.

### Imprint Configuration Templates
Reusable decoration process templates that standardize imprint specifications across similar products.

---

## Technical Details

### Script Files

**Total**: 22 SuiteScript 2.1 files

**Script Distribution**:
- **Utility Library** (1): NSUtilvSS2.js - Shared functions
- **Client Scripts** (1): Form validation and UI enhancements
- **User Event Scripts** (2): Custom buttons, work order linking
- **Suitelets** (7): Shop floor UIs (build, complete, mass production, inventory detail, production date updates)
- **Map/Reduce Scripts** (9): Batch processing (work order creation, builds, completions, date propagation)

**Key Scripts**:
- `ns_sl_ppai.js` - Primary interface for creating Production Plus Records from sales orders
- `ns_mr_ppai.js` - Batch creates Production Plus Records from imprint data
- `ns_mr_build_wo.js` - Transforms work orders to assembly builds when inventory available
- `ns_mr_complete_wo.js` - Batch processes work order completions
- `ns_mr_update_prod_dates_wo.js` - Propagates production dates to linked work orders
- `ns_sl_mass_production_plus.js` - Bulk processing interface

### Custom Records

**Total**: 9 custom record types

**Key Records**:
- `customrecord_nsra_ppr` - **Production Plus Record** (master production control)
- `customrecord_nsra_pp_prodevent` - **Production Event** (shop floor operations)
- `customrecord_ns_ppai_imprnt_orderdetails` - **Imprint Order Details** (decoration master)
- `customrecord_ns_ppai_imprintdetails` - **Imprint Details** (artwork & design specs)
- `customrecord_ns_ppai_imprtconfig_tmpl` - **Imprint Configuration Template** (reusable processes)
- `customrecord_ns_ppai_stored_art_list` - **Stored Art Library** (artwork repository)

### Workflows

**Total**: 2 workflows
- Default assembly work order workflow
- Production Plus scheduling workflow

### Custom Fields

**Total**: 11 custom fields

**Field Distribution**:
- Transaction Body Fields (4): Production record links, required dates, notes
- Transaction Column Fields (3): Imprint detail links, assembly items, production events
- Item Fields (3): Artwork flags, artwork files, default imprint templates

**Key Fields**:
- `custbody_nsra_linkedprodrec_so_head` - Sales Order to Production Plus link
- `custbody_ns_ppai_parent` - Work Order to parent Production Plus Record link
- `custbody_ns_ppai_requiredate` - Customer required in-hands date
- `custcol_ns_ppai_imprint_orderdetail` - Line to Imprint Order Details link

### Saved Searches

**Total**: 18 saved searches supporting:
- Production Plus Record creation
- Work order build/completion queries
- Inventory detail searches
- Imprint detail/summary reports
- Manufacturing overtime tracking
- Sales order and work order backlogs

### Other Objects

- **Custom Lists** (6): Status values, scheduling methods, designs, imprint locations, color counts, machines
- **Custom Forms** (1): Production Plus Record form with sublists
- **Custom Roles** (3): Sales, customer service, and production roles
- **UI Components** (3): Center categories, tabs, subtabs
- **Script Deployments** (14): XML deployment definitions for all scripts
- **Event Records** (2): Assembly and Production Plus events

---

## System Requirements

### NetSuite Version
- **Minimum**: 2021.2 (for Work Orders and Manufacturing Routing)
- **Recommended**: Latest stable release

### NetSuite Edition
- **Required**: N/A (works with all editions that support manufacturing)

### Required Features
- **Work Orders & Assemblies**
- **Manufacturing Routing**
- **Custom Records**
- **Server-Side Scripting**
- **Classes** (recommended for job costing)
- **Workflow Engine**

### Optional Features
- **Multi-Location Inventory** - Enhances location-specific production tracking
- **Advanced Manufacturing** - Provides additional routing and capacity planning
- **SuiteAnalytics** - Enables advanced production reporting

---

## Installation

### Prerequisites
1. NetSuite account with Work Orders and Assemblies enabled
2. Manufacturing Routing feature enabled
3. Administrator or Developer role
4. SDF CLI installed
5. Supply Chain Management (SCM) bundle installed (for item substitutes)

### Deployment Steps

1. **Navigate to Project**
   ```bash
   cd "sdf/PPAI-ProductionPlus-dev/ppai/src"
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
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
   - Create or configure Production Plus Record custom record forms
   - Set up imprint location list values (front, back, sleeve, etc.)
   - Configure production machine list
   - Create imprint configuration templates for common processes
   - Populate artwork library with design files
   - Set up routing templates for work orders
   - Configure Map/Reduce script schedules (if automating record creation)
   - Test end-to-end workflow from sales order to work order completion

---

## Usage

### Common Workflows

**Creating Production Plus Records from Sales Orders**
1. Sales rep creates SO with imprint details in line item notes/fields
2. Production manager clicks custom button "Create Production Plus Record"
3. Suitelet displays confirmation with imprint summary
4. System creates Production Plus Record consolidating all decoration specs
5. Map/Reduce script auto-generates work orders from Production Plus Record

**Shop Floor Production Event Recording**
1. Operator selects work order from production queue
2. Opens production event record or Suitelet interface
3. Records machine used, time spent, operator name, artwork applied
4. Marks operation complete
5. System updates work order status and production record

**Batch Building Work Orders**
1. Production supervisor opens "Build Work Orders" Suitelet
2. Interface displays all work orders ready for build (inventory available)
3. Supervisor selects multiple work orders (bulk selection)
4. Clicks "Build All Selected"
5. Map/Reduce processes assembly builds in batch
6. Inventory adjustments created automatically

**Updating Production Dates**
1. Customer changes required delivery date
2. Production planner updates Production Plus Record required date field
3. Runs "Update Production Dates" Map/Reduce script
4. Script propagates new dates to all linked work orders
5. Schedule automatically adjusted

### User Roles

- **Production Managers**: Create Production Plus Records, schedule production, manage workflows
- **Shop Floor Operators**: Record production events, complete work orders, track machine usage
- **Sales Representatives**: Create sales orders with imprint details
- **Art Department**: Manage artwork library, create imprint templates, upload design files
- **Inventory Planners**: Monitor inventory levels for work order builds

---

## Configuration

### Settings

**Production Plus Configuration**:
- **Scheduling Method**: Forward (start date-based) or Backward (required date-based)
- **Status Values**: Planning, In Production, Completed, Cancelled
- **Imprint Locations**: Define available imprint areas (front, back, sleeve, pocket, etc.)
- **Color Count Options**: 1-color, 2-color, 3+ colors
- **Machine List**: Production equipment/machines available

**Artwork Management**:
- Upload artwork files to Stored Art Library
- Create Imprint Configuration Templates for standard processes
- Link default templates to item records

### Customization

The solution can be extended to support:
- Quality control checkpoints within production events
- Scrap and rework tracking
- Labor cost capture and job costing integration
- Real-time capacity planning and scheduling optimization
- Customer portal for artwork approval workflows
- Mobile interfaces for shop floor operators

---

## Technical Architecture

### Component Overview

```
Sales Order with Imprint Details
    ↓
Custom Button → Suitelet (ns_sl_ppai.js)
    ↓
Production Plus Record Created
    ↓
Map/Reduce (ns_mr_ppai.js) → Auto-Create Work Orders
    ↓
Shop Floor Interfaces (Suitelets)
    ├→ Record Production Events
    ├→ Batch Build Work Orders
    ├→ Batch Complete Work Orders
    └→ Update Production Dates
        ↓
Map/Reduce Scripts (Background Processing)
    ├→ Build Processing (inventory validation)
    ├→ Completion Processing (inventory adjustments)
    └→ Date Propagation (schedule updates)
        ↓
Completed Work Orders → Finished Goods Inventory
```

### Integration Points

- **Sales Orders**: Source of imprint details and customer requirements
- **Work Orders**: Auto-generated from Production Plus Records
- **Assembly Builds**: Created when work orders are built
- **Item Master**: Artwork item flags, default templates
- **Inventory**: Availability validation, adjustments on completion
- **Routing**: Manufacturing routing templates
- **SCM Item Substitutes**: Alternative component handling

---

## Changelog

### Version 1.0
- 22 SuiteScript files deployed (client, user event, suitelets, map/reduce)
- 9 custom records (production records, events, imprint details, templates, artwork)
- 11 custom fields across transactions and items
- 18 saved searches for production workflows
- 6 custom lists (status, scheduling, designs, locations, colors, machines)
- 2 workflows (assembly, scheduling)
- Shop floor interfaces complete
- Batch processing operational
- Artwork library implemented

---

## Credits

**Developed by**: Production Plus AI (PPAI)
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: 2026-02-04
**Complexity**: Advanced (87 total objects, 22 scripts)
