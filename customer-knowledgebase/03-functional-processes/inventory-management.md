# Inventory Management Process - SunStyle Retail

## Process Overview

**Process Name**: Inventory Management and Replenishment
**Process Owner**: COO (David Martinez)
**Last Updated**: 2026-01-19
**Version**: 1.2

## Purpose

The Inventory Management Process ensures optimal stock levels across all locations to maximize sales while minimizing carrying costs and stockouts. This includes inventory planning, replenishment, transfers, and cycle counting.

## Scope

### In Scope
- Inventory planning and forecasting
- Purchase order management
- Receiving and put-away
- Inventory transfers between locations
- Cycle counting and physical inventory
- Stock level optimization
- Inventory accuracy

### Out of Scope
- Vendor relationship management (covered in Vendor Management)
- Product pricing and margins (covered in Merchandising)
- Product returns to vendors (covered in Vendor Management)

## Process Flows

### 1. Demand Planning and Forecasting

#### 1.1 Sales Forecasting
**Responsible**: Merchandising Team

**Steps**:
1. Analyze historical sales data (12-24 months)
2. Identify seasonal trends and patterns
3. Consider market trends and upcoming promotions
4. Adjust for new product launches
5. Generate demand forecast by SKU and location
6. Review and approve forecast

**Systems**: Inventory Management System, Business Intelligence Tool

**Inputs**:
- Historical sales data
- Marketing calendar (promotions, events)
- New product launch schedule
- Market trends and industry data

**Outputs**:
- Monthly demand forecast by SKU
- Seasonal buying plan
- Location-level inventory targets

**Business Rules**:
- Forecast updated monthly
- Minimum 3 months forward visibility
- Seasonal adjustments (e.g., summer sunglasses surge)
- New product ramp-up assumptions

**Metrics**:
- Forecast accuracy: Target ± 15% of actual
- Forecast bias: Target < 5%
- MAPE (Mean Absolute Percentage Error): Target < 20%

#### 1.2 Inventory Planning
**Responsible**: Supply Chain Team

**Steps**:
1. Review demand forecast
2. Calculate target inventory levels by location:
   - Safety stock (buffer for demand variability)
   - Cycle stock (between reorders)
   - Seasonal build-up
3. Determine reorder points and order quantities
4. Set min/max inventory levels
5. Allocate inventory to locations based on:
   - Sales velocity
   - Store size and traffic
   - Regional preferences
6. Generate replenishment plan

**Systems**: Inventory Management System

**Inputs**:
- Demand forecast
- Current inventory levels
- Lead times by vendor
- Target service levels (% in-stock)

**Outputs**:
- Reorder points by SKU and location
- Order quantities (Economic Order Quantity)
- Safety stock levels
- Replenishment schedule

**Business Rules**:
- Target service level: 95% in-stock
- Safety stock covers 2 weeks of demand
- Economic Order Quantity (EOQ) optimization
- Minimum order quantities per vendor agreements

**Metrics**:
- Inventory turnover: Target > 4.5x annually
- Days of inventory on hand: Target 60-75 days
- Service level (in-stock rate): Target > 95%
- Carrying cost: Target < 15% of inventory value

### 2. Procurement and Receiving

#### 2.1 Purchase Order Creation
**Responsible**: Supply Chain Team / System (Automated)

**Steps**:
1. System identifies items below reorder point
2. Calculate order quantity (EOQ or manual override)
3. Select vendor (primary or alternate)
4. Generate purchase order:
   - PO number (unique)
   - Vendor information
   - Line items (SKU, quantity, unit cost)
   - Expected delivery date
   - Ship-to location (warehouse)
   - Payment terms
5. Route PO for approval (if > threshold)
6. Submit PO to vendor (EDI or email)

**Systems**: Inventory Management System, Vendor Management System

**Inputs**:
- Reorder point triggers
- Vendor information
- Pricing agreements
- Lead times

**Outputs**:
- Purchase order (PO)
- Expected receipt date
- Budget commitment

**Business Rules**:
- Auto-generate POs for orders < $5,000
- Manager approval for POs $5,000-$25,000
- VP approval for POs > $25,000
- Consolidate orders by vendor (weekly batches)
- Standard lead times: 2-4 weeks (domestic), 6-8 weeks (international)

**Costing Requirements (Added 2026-02-02)**:
- **Estimated Landed Cost**: Customer requires estimated landed costing functionality
- **HTS Codes**: Items must have Harmonized Tariff Schedule (HTS) codes configured
- **Landed Cost Calculation**: Percentage-based landed cost calculation by weight for each item
- **Cost Components**: Unit cost + calculated landed cost (duties, freight, etc.) = total landed cost

> ⚠️ **OPEN**: Need to clarify:
> - Which cost components to include in landed cost % (duties, freight, insurance, handling)
> - How to configure HTS codes per item (custom field or vendor-specific)
> - Whether landed cost % varies by vendor or is item-specific
> - If landed cost should update standard cost or be tracked separately
> - Reporting requirements for landed cost variance analysis

**Metrics**:
- PO creation time: Target < 15 minutes (manual POs)
- Auto-PO percentage: Target > 80%
- PO accuracy: Target > 98%
- Vendor lead time adherence: Target > 90%

#### 2.2 Receiving
**Responsible**: Warehouse Receiving Team

**Steps**:
1. Vendor delivery arrives at warehouse
2. Check in shipment:
   - Match packing slip to PO
   - Inspect packaging for damage
3. Unload and count items:
   - Verify quantity against PO
   - Scan barcodes for each item
   - Record actual vs. expected quantities
4. Quality inspection:
   - Check for visible defects
   - Verify product matches specifications
   - Sample inspection for new products
5. Resolve discrepancies:
   - Over-shipment: Contact vendor
   - Under-shipment: Create shortage claim
   - Damaged items: Document and reject
6. Update system:
   - Mark PO as received (full or partial)
   - Update inventory quantities
   - Generate receiving report

**Systems**: Inventory Management System, Mobile Receiving App

**Inputs**:
- Purchase order
- Packing slip
- Physical goods

**Outputs**:
- Receiving report
- Updated inventory quantities
- Discrepancy reports (if any)

**Business Rules**:
- All items scanned for accuracy
- Quality inspection on 10% of items (or 100% for new products)
- Damaged items segregated immediately
- Receiving completed same day as delivery
- Blind receive option for high-value items (no expected quantity shown)

**Metrics**:
- Receiving accuracy: Target > 99%
- Receiving time: Target < 2 hours per shipment
- Discrepancy rate: Target < 3%
- Same-day receiving rate: Target > 95%

#### 2.3 Put-Away
**Responsible**: Warehouse Team

**Steps**:
1. Stage received items in receiving area
2. System assigns bin locations:
   - Fast-moving items in accessible locations
   - Bulk storage for slow-moving items
   - Reserve locations for overstock
3. Transport items to assigned locations
4. Put away and scan items into bins
5. Update system with bin locations
6. Clear receiving area for next shipment

**Systems**: Inventory Management System, Warehouse Management System

**Inputs**:
- Received items
- Bin location assignments

**Outputs**:
- Items stored in bins
- Updated bin locations in system
- Available inventory increased

**Business Rules**:
- Put-away completed within 4 hours of receiving
- Bin location scanned for accuracy
- FIFO (First In, First Out) principle for dated products
- Bin capacity not to exceed 90%

**Metrics**:
- Put-away accuracy: Target > 99%
- Put-away time: Target < 4 hours from receiving
- Bin utilization: Target 70-85%

### 3. Inventory Transfers

#### 3.1 Transfer Request
**Responsible**: Store Managers / Merchandising Team

**Steps**:
1. Identify need for transfer:
   - Store running low on popular item
   - Warehouse directing stock to stores
   - Store has excess of slow-moving item
2. Check inventory availability at source location
3. Create transfer request:
   - Source location
   - Destination location
   - SKUs and quantities
   - Reason for transfer
   - Priority (standard, expedited)
4. Submit for approval (if required)

**Systems**: Inventory Management System

**Inputs**:
- Store inventory levels
- Warehouse inventory levels
- Sales velocity data

**Outputs**:
- Transfer request
- Approval workflow triggered

**Business Rules**:
- Transfers < $1,000: auto-approved
- Transfers $1,000-$5,000: manager approval
- Transfers > $5,000: VP approval
- Minimum transfer quantity: 3 units
- Priority transfers for stockouts only

**Metrics**:
- Transfer request approval time: Target < 4 hours
- Transfer request accuracy: Target > 95%

#### 3.2 Transfer Fulfillment
**Responsible**: Source Location (Warehouse/Store)

**Steps**:
1. Receive transfer order
2. Pick items for transfer:
   - Locate items in source location
   - Scan items to verify
   - Pack items securely
3. Generate transfer documentation:
   - Transfer slip
   - Shipping label (if applicable)
4. Update inventory:
   - Deduct from source location
   - Mark as in-transit
5. Ship transfer (carrier or internal delivery)

**Systems**: Inventory Management System, Shipping Integration

**Inputs**:
- Approved transfer order
- Source location inventory

**Outputs**:
- Packed transfer
- Transfer slip
- In-transit inventory record

**Business Rules**:
- Transfer fulfilled within 24 hours of approval
- Items scanned at source for accuracy
- Tracking number for all shipped transfers
- In-transit status until received at destination

**Metrics**:
- Transfer fulfillment time: Target < 24 hours
- Transfer picking accuracy: Target > 99%
- Transfer damage rate: Target < 1%

#### 3.3 Transfer Receipt
**Responsible**: Destination Location (Warehouse/Store)

**Steps**:
1. Receive transfer shipment
2. Verify transfer slip matches shipment
3. Count and inspect items:
   - Verify quantity
   - Check for damage
   - Scan items for accuracy
4. Resolve discrepancies:
   - Report shortages
   - Document damage
5. Update inventory:
   - Add to destination location
   - Clear in-transit status
   - Generate receipt confirmation

**Systems**: Inventory Management System

**Inputs**:
- Transfer shipment
- Transfer slip

**Outputs**:
- Updated inventory at destination
- Transfer receipt confirmation
- Discrepancy report (if any)

**Business Rules**:
- Transfer received same day as delivery
- All items scanned for accuracy
- Discrepancies reported within 24 hours
- Destination confirms receipt in system

**Metrics**:
- Transfer receipt accuracy: Target > 99%
- Transfer receipt time: Target < 2 hours
- Transfer completion rate: Target > 98%

### 4. Cycle Counting and Physical Inventory

#### 4.1 Cycle Counting
**Responsible**: Warehouse Team

**Steps**:
1. Generate cycle count schedule:
   - ABC analysis (count frequency by value):
     - A items (high value): Monthly
     - B items (medium value): Quarterly
     - C items (low value): Semi-annually
   - Random sampling
   - Items with suspected discrepancies
2. Assign count tasks to associates
3. Count items:
   - Locate items in bins
   - Count physical quantity
   - Record count (do not see system quantity - blind count)
4. Compare count to system quantity
5. Investigate variances:
   - Recount if variance > threshold
   - Research transactions
   - Determine root cause
6. Adjust inventory if confirmed variance
7. Document findings and corrective actions

**Systems**: Inventory Management System, Mobile Counting App

**Inputs**:
- Cycle count schedule
- System inventory quantities
- Bin locations

**Outputs**:
- Count results
- Inventory adjustments
- Variance reports
- Root cause analysis

**Business Rules**:
- Blind counts (associates don't see expected quantity)
- Recount if variance > 5% or > 10 units
- Two-person verification for adjustments > $500
- Root cause documented for all variances

**Metrics**:
- Inventory accuracy: Target > 98%
- Cycle count variance rate: Target < 2%
- Cycle count completion rate: Target 100% of schedule
- Average variance value: Target < $100

#### 4.2 Annual Physical Inventory
**Responsible**: Finance Team, Warehouse Team

**Steps**:
1. Schedule annual physical inventory (typically end of fiscal year)
2. Freeze inventory transactions (or scheduled during closure)
3. Organize count teams and zones
4. Conduct full physical count:
   - Count all items in all locations
   - Two-count verification
   - Record counts
5. Compare counts to system
6. Investigate and reconcile discrepancies
7. Adjust inventory to physical count
8. Generate financial reports
9. Document findings and improvement plans

**Systems**: Inventory Management System, Financial System

**Inputs**:
- Complete inventory list
- System quantities
- Physical counts

**Outputs**:
- Adjusted inventory
- Physical inventory report
- Financial impact analysis
- Process improvement plan

**Business Rules**:
- Conducted annually (fiscal year-end)
- All transactions suspended during count
- Two independent counts per item
- Finance team oversight
- Adjustments approved by CFO

**Metrics**:
- Physical inventory accuracy: Target > 99%
- Shrinkage rate: Target < 1% of inventory value
- Count completion time: Target < 8 hours

## Inventory Metrics and Reporting

### Key Performance Indicators (KPIs)

| KPI | Target | Current | Frequency |
|-----|--------|---------|-----------|
| Inventory Accuracy | > 98% | 98.5% | Weekly |
| Inventory Turnover | > 4.5x | 4.7x | Monthly |
| Days on Hand | 60-75 days | 68 days | Weekly |
| Stockout Rate | < 5% | 4.2% | Daily |
| Overstock Rate | < 10% | 8.5% | Weekly |
| Carrying Cost | < 15% | 13.5% | Monthly |
| Shrinkage | < 1% | 0.8% | Quarterly |

### Inventory Reports

1. **Daily Inventory Status Report**
   - Current stock levels by location
   - Items below reorder point
   - Stockouts and backorders
   - In-transit inventory

2. **Weekly Inventory Health Report**
   - Inventory turnover by category
   - Slow-moving items (> 90 days)
   - Overstock items
   - Inventory aging analysis

3. **Monthly Inventory Performance Report**
   - Forecast vs. actual variance
   - Service level achievement
   - Inventory accuracy
   - Shrinkage analysis

4. **Quarterly Inventory Review**
   - Strategic inventory planning
   - Vendor performance
   - Process improvements
   - Inventory investment ROI

## Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| Merchandising Team | Demand forecasting, product selection, inventory targets |
| Supply Chain Team | Inventory planning, PO management, replenishment |
| Warehouse Team | Receiving, put-away, cycle counting, transfers |
| Store Managers | Store inventory management, transfer requests |
| Finance Team | Inventory valuation, physical inventory, shrinkage analysis |
| System Administrators | IMS configuration, automation rules, reporting |

## Process Improvements

### Recent Improvements (Last 6 months)
1. Implemented ABC classification for optimized cycle counting
2. Enhanced demand forecasting with machine learning algorithms
3. Automated reorder point calculations based on sales velocity
4. Improved bin location assignments for faster picking

### Planned Improvements (Next 6 months)
1. RFID tagging pilot for high-value items (auto-inventory tracking)
2. Predictive analytics for stock optimization
3. Vendor-managed inventory (VMI) for top suppliers
4. Mobile app for store managers (inventory visibility and transfer requests)

## Related Documents
- FR-IMS-001: Inventory Tracking (Functional Requirements)
- FR-IMS-002: Automated Replenishment (Functional Requirements)
- FR-IMS-003: Inventory Transfers (Functional Requirements)
- FR-IMS-004: Cycle Counting (Functional Requirements)
- SOP-WH-002: Warehouse Receiving Procedures
- SOP-WH-003: Cycle Counting Procedures

## Changelog

- **2026-02-02**: Added estimated landed costing requirement with HTS codes (per note from Greg)
- **2026-01-19**: Version 1.2 - Process improvements and enhanced metrics

---
*Status: Draft (updated 2026-02-02)*
*Last Updated: 2026-02-02*
*Version: 1.3*
*Process Owner: David Martinez, COO*
