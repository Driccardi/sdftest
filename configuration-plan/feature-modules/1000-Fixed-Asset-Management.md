# 1000 - Fixed Asset Management (FAM) Module Configuration

## Configuration Metadata
- **Config ID**: 1000-FAM
- **Module**: Fixed Asset Management (NetSuite FAM)
- **Priority**: High
- **Complexity**: Medium
- **Estimated Effort**: 80 hours (2 weeks)
- **Prerequisites**:
  - Chart of Accounts (010.010) - Asset/Depreciation accounts configured
  - Subsidiary Structure (010.020) - Entity hierarchy established
  - Departments/Classes/Locations (010.060) - Store locations configured
- **Dependencies**:
  - General Ledger configuration
  - Location master data
  - Approval workflows (if needed for asset acquisition)
- **Implementation Phase**: Phase 6 (Weeks 19-22) - Customizations
- **Go-Live Date**: Week 28 (with main NetSuite implementation)

---

## Business Context

### Decision Background
**Decision Date**: January 2026

SunStyle Retail has decided to implement NetSuite Fixed Asset Management (FAM) module to manage capital assets across all retail locations and distribution facilities. This decision enables:

1. **Centralized Asset Tracking**: Unified system for tracking store fixtures, computer equipment, furniture, and leasehold improvements across 25 retail stores and 1 distribution center
2. **Automated Depreciation**: Streamlined month-end close with automated depreciation calculations and GL postings
3. **Compliance & Audit Support**: Comprehensive audit trail for capital expenditures, transfers, and disposals
4. **Location-Based Reporting**: Asset visibility by store for operational planning and insurance purposes

### Assets in Scope

#### 1. Store Fixtures
- Display shelving units
- Product display cases
- Signage (interior and exterior)
- Lighting fixtures
- Mannequins and display stands
- Security equipment (mirrors, sensors)

#### 2. Computer Equipment
- POS terminals (2-4 per store)
- Back office computers
- Barcode scanners
- Receipt printers
- Network equipment (routers, switches)

#### 3. Furniture & Equipment
- Office furniture (desks, chairs)
- Break room furniture
- Storage cabinets
- Safes and cash management equipment

#### 4. Leasehold Improvements
- Build-out costs for new stores
- Store renovations and remodels
- HVAC improvements
- Flooring and wall treatments

### Business Requirements (Reference: FR-FAM-001)
- Track all capital assets by location (store or DC)
- Calculate depreciation automatically per GAAP standards
- Manage asset lifecycle (acquisition → transfer → disposal)
- Support month-end close process
- Provide asset register reports for financial statements
- Maintain audit trail for all asset transactions

---

## NetSuite FAM Configuration

### 1. Module Activation

#### Enable FAM Features
**Path**: Setup → Company → Enable Features → Financial Management

Enable:
- ✅ Fixed Asset Management
- ✅ Fixed Asset Depreciation
- ✅ Fixed Asset Location Tracking

**Configuration Steps**:
1. Navigate to Setup → Company → Enable Features
2. Select Financial Management tab
3. Check "Fixed Asset Management"
4. Check "Fixed Asset Depreciation"
5. Check "Fixed Asset Location Tracking"
6. Save

**Test**: Verify "Fixed Assets" menu appears in navigation

---

### 2. Fixed Asset Types

#### Asset Type Master List

| Asset Type ID | Asset Type Name | Description | Typical Useful Life | Default Depr. Method |
|---------------|-----------------|-------------|---------------------|----------------------|
| STORE-FIXTURE | Store Fixtures | Display cases, shelving, signage | 7 years | Straight Line |
| COMPUTER-EQUIP | Computer Equipment | POS, printers, scanners, network | 5 years | Straight Line |
| FURNITURE | Furniture & Equipment | Office furniture, safes, etc. | 7 years | Straight Line |
| LEASEHOLD | Leasehold Improvements | Store build-outs, renovations | Lesser of lease term or 15 years | Straight Line |

**Configuration Steps**:
1. Navigate to Lists → Accounting → Fixed Asset Types
2. Create new asset type for each category above
3. For each type, configure:
   - Name and Description
   - Default Asset Account (from COA - 150 series)
   - Default Depreciation Account (from COA - 177 series)
   - Default Accumulated Depreciation Account (from COA - 157 series)
   - Default Depreciation Method
   - Default Useful Life

**Reference**: Chart of Accounts (010.010) for GL account mapping

---

### 3. Depreciation Methods

#### Standard Methods Configuration

**Path**: Setup → Accounting → Depreciation Methods

| Method Code | Method Name | Calculation Type | Convention | Usage |
|-------------|-------------|------------------|------------|-------|
| SL-7YR | Straight Line - 7 Years | Straight Line | Half-Year | Store fixtures, furniture |
| SL-5YR | Straight Line - 5 Years | Straight Line | Half-Year | Computer equipment |
| SL-15YR | Straight Line - 15 Years | Straight Line | Half-Year | Leasehold improvements (max) |
| SL-LEASE | Straight Line - Lease Term | Straight Line | Half-Year | Leasehold (by store lease) |

**Configuration Steps**:
1. Navigate to Setup → Accounting → Depreciation Methods
2. Create each depreciation method:
   - Method Code and Name
   - Convention: Half-Year (standard for retail)
   - Calculation Type: Straight Line
   - Period/Year: 12 periods
3. Save each method

**Note on Leasehold Improvements**:
- Use lesser of lease term or 15 years per GAAP
- May require separate method per store based on lease terms
- Controller to provide lease term data during implementation

---

### 4. Asset GL Accounts Mapping

#### Chart of Accounts Integration

Fixed assets integrate with GL accounts configured in 010.010-Chart-of-Accounts.md:

**Asset Accounts (Balance Sheet - 150 series)**:
- 15100 - Store Fixtures (asset)
- 15200 - Computer Equipment (asset)
- 15300 - Furniture & Equipment (asset)
- 15400 - Leasehold Improvements (asset)

**Accumulated Depreciation (Balance Sheet - 157 series)**:
- 15710 - Accumulated Depreciation - Store Fixtures
- 15720 - Accumulated Depreciation - Computer Equipment
- 15730 - Accumulated Depreciation - Furniture & Equipment
- 15740 - Accumulated Depreciation - Leasehold Improvements

**Depreciation Expense (Income Statement - 720 series)**:
- 72010 - Depreciation Expense - Store Fixtures
- 72020 - Depreciation Expense - Computer Equipment
- 72030 - Depreciation Expense - Furniture & Equipment
- 72040 - Depreciation Expense - Leasehold Improvements

**Gain/Loss on Disposal (Income Statement - 790 series)**:
- 79500 - Gain on Asset Disposal
- 79510 - Loss on Asset Disposal

**Configuration**: These accounts should already exist from Phase 1 (010.010). Verify mapping in each Fixed Asset Type setup.

---

### 5. Asset Location Tracking

#### Location Assignment

**Requirement**: Track assets by specific store location for:
- Insurance coverage documentation
- Store-level asset registers
- Transfer management between stores
- Loss and theft tracking

**NetSuite Locations (Reference: 010.060-Departments-Classes-Locations.md)**:
- Central Distribution Center (LOC-001-DC)
- Store 001 (Manhattan Flagship) through Store 025 (San Diego Fashion Valley)

**Configuration**:
1. Navigate to Setup → Company → Locations
2. Verify all 26 locations exist (from Phase 1 configuration)
3. For each Fixed Asset record, assign primary location in "Location" field
4. Enable "Track Asset Location History" to maintain transfer audit trail

**Location Hierarchy for Reporting**:
```
Corporate (Parent)
├── Distribution Center (LOC-001-DC)
└── Retail Stores
    ├── Northeast Region (Stores 001-010)
    ├── Southeast Region (Stores 011-015)
    ├── Midwest Region (Stores 016-020)
    └── West Region (Stores 021-025)
```

This hierarchy enables rolled-up asset reports by region.

---

### 6. Custom Fields for Asset Management

#### Additional Asset Data Capture

**Custom Fields on Fixed Asset Record**:

| Field ID | Field Label | Field Type | Purpose | Required? |
|----------|-------------|------------|---------|-----------|
| custrecord_fa_serial_number | Serial Number | Text | Track equipment serial numbers | No |
| custrecord_fa_vendor | Vendor | List (Vendor) | Purchase vendor reference | No |
| custrecord_fa_warranty_exp | Warranty Expiration | Date | Warranty tracking for equipment | No |
| custrecord_fa_insurance_value | Insurance Replacement Value | Currency | Insurance coverage amount | No |
| custrecord_fa_last_maintenance | Last Maintenance Date | Date | Preventive maintenance tracking | No |
| custrecord_fa_model_number | Model/SKU | Text | Manufacturer model reference | No |
| custrecord_fa_store_opening_date | Store Opening Date | Date | For leasehold improvements | Leasehold only |

**Configuration Steps**:
1. Navigate to Customization → Lists, Records, & Fields → Entity Fields → New
2. Select "Fixed Asset" as applies to
3. Create each custom field with specifications above
4. Set field-level permissions (view/edit)
5. Add fields to Fixed Asset form layout

**Form Layout**: Add custom fields to "Asset Information" subtab

---

### 7. Fixed Asset Forms & Workflows

#### Standard Forms

**Forms to Configure**:
1. **Fixed Asset Record**: Standard entry form with custom fields
2. **Asset Disposal Form**: Disposition/sale/retirement workflow
3. **Asset Transfer Form**: Inter-location transfer processing

#### Approval Workflow (Optional - Phase 6)

**If needed**: Implement workflow for high-value asset acquisitions

**Trigger Criteria**:
- Asset original cost > $10,000 (per unit)
- Approval routing: Store Manager → Regional Director → CFO

**Workflow States**:
1. Pending Approval
2. Approved
3. Rejected
4. In Service (after approval + receipt)

**Configuration**: Use SuiteFlow if approval workflows are required. This can be added in Phase 6 if business process requires formal approval routing.

---

### 8. Asset Acquisition Process

#### Creating New Fixed Assets

**Source Documents**:
- Purchase Orders (for new equipment/fixtures)
- Vendor Bills (for installed assets)
- Journal Entries (for leasehold improvements via construction)

**Methods to Create Assets**:

**Method 1: From Bill (Recommended for Equipment)**
1. Enter Vendor Bill as usual
2. On expense line, select Fixed Asset Type
3. NetSuite automatically creates Fixed Asset record
4. Edit asset record to add location, useful life, custom field data
5. Place asset "In Service" when installed

**Method 2: Manual Asset Creation**
1. Navigate to Transactions → Financial → Fixed Assets → New
2. Enter asset details:
   - Asset Type
   - Original Cost
   - Purchase Date
   - Vendor
   - Location
   - In-Service Date
   - Useful Life / Depreciation Method
   - Custom field data (serial number, warranty, etc.)
3. Save

**Method 3: From Item Receipt (for Inventory → Fixed Asset conversion)**
- If items are initially received into inventory, then capitalized as fixed assets
- Create Fixed Asset record manually, reference Item Receipt for cost basis

**In-Service Date**: Critical field that triggers depreciation start. Should be date asset is installed and operational, not purchase date.

---

### 9. Depreciation Processing

#### Monthly Depreciation Routine

**Process**: Automated depreciation calculation and posting

**Schedule**: Run monthly during period close (after all asset transactions posted)

**Steps**:
1. Navigate to Transactions → Financial → Depreciation
2. Select accounting period (e.g., January 2026)
3. Click "Calculate Depreciation"
4. Review depreciation journal entry preview
5. Post depreciation journal entry to GL

**Result**: Journal entry automatically created:
```
DR  72xxx - Depreciation Expense (by asset type)
    CR  157xx - Accumulated Depreciation (by asset type)
```

**Posting**: Depreciation posts to GL with:
- Department/Class/Location from asset record
- Subsidiary from asset location
- Accounting period selected

**Mid-Period Additions**: Half-year convention applies depreciation starting in period asset placed in service

---

### 10. Asset Transfers Between Locations

#### Inter-Store Transfer Process

**Business Scenario**: Transfer store fixtures or equipment from one store to another (e.g., closing store, rebalancing inventory)

**Process**:
1. Navigate to asset record
2. Click "Transfer Asset"
3. Select:
   - New Location (destination store)
   - Transfer Date
   - Transfer Reason (free text or dropdown)
4. Save

**Result**:
- Asset location updated
- Location history log maintained (audit trail)
- Future depreciation posts to new location
- No GL impact (still same asset account)

**Reporting**: Asset Transfer Report shows all transfers by date range for audit purposes

---

### 11. Asset Disposal & Retirement

#### Disposal Process

**Business Scenarios**:
- **Sale**: Sold asset to third party
- **Scrap/Discard**: Asset broken, obsolete, or fully depreciated
- **Trade-In**: Traded in for new equipment

**Process**:
1. Navigate to asset record
2. Click "Dispose Asset"
3. Enter:
   - Disposal Date
   - Disposal Type (Sale, Scrap, Trade-In)
   - Sale Proceeds (if sold)
   - Notes
4. Save

**GL Impact**:
```
DR  157xx - Accumulated Depreciation (full amount)
DR  79500 or 79510 - Gain/Loss on Disposal (plug)
CR  15xxx - Fixed Asset (original cost)
DR/CR Cash or AR (if sold for proceeds)
```

**Gain/Loss Calculation**:
- Book Value = Original Cost - Accumulated Depreciation
- Gain/Loss = Sale Proceeds - Book Value
- If no proceeds (scrap), Loss = Book Value

**Fully Depreciated Assets**: If book value = $0, disposal removes from active asset list with no gain/loss

---

### 12. Saved Searches & Reports

#### Standard FAM Reports

**Report 1: Asset Register by Location**
- **Purpose**: Comprehensive list of all assets by store
- **Columns**: Asset ID, Description, Type, Original Cost, Accumulated Depreciation, Net Book Value, Location, In-Service Date
- **Filters**: Location (select store), Status = Active
- **Sort**: Location, Asset Type, Asset ID
- **Usage**: Month-end reporting, insurance documentation, store audits

**Report 2: Depreciation Schedule**
- **Purpose**: Current period and YTD depreciation by asset type
- **Columns**: Asset Type, Original Cost, Prior Accumulated Depreciation, Current Period Depreciation, YTD Depreciation, Ending Accumulated Depreciation, Net Book Value
- **Filters**: Accounting Period (current or YTD)
- **Summary**: Group by Asset Type, then Location
- **Usage**: Month-end close verification, financial statement support

**Report 3: Asset Acquisition Report**
- **Purpose**: Track new asset purchases in period
- **Columns**: Purchase Date, Asset ID, Description, Type, Vendor, Original Cost, Location, In-Service Date
- **Filters**: Purchase Date = This Month/Quarter/Year
- **Sort**: Purchase Date (desc)
- **Usage**: Capital expenditure tracking, budget variance analysis

**Report 4: Asset Disposal Report**
- **Purpose**: Track retired/disposed assets
- **Columns**: Disposal Date, Asset ID, Description, Original Cost, Accumulated Depreciation, Book Value, Sale Proceeds, Gain/Loss, Reason
- **Filters**: Disposal Date = This Month/Quarter/Year
- **Sort**: Disposal Date (desc)
- **Usage**: Audit trail, tax reporting (Section 1231 gains/losses)

**Report 5: Asset Transfer History**
- **Purpose**: Track asset movements between locations
- **Columns**: Transfer Date, Asset ID, Description, From Location, To Location, Transfer Reason
- **Filters**: Transfer Date = Date Range
- **Sort**: Transfer Date (desc)
- **Usage**: Audit compliance, loss prevention

**Report 6: Fully Depreciated Assets**
- **Purpose**: Identify assets at end of useful life
- **Columns**: Asset ID, Description, Type, Original Cost, In-Service Date, Location, Years in Service
- **Filters**: Net Book Value = 0, Status = Active
- **Sort**: In-Service Date
- **Usage**: Identify candidates for disposal, insurance coverage review

#### Configuration Steps for Saved Searches
1. Navigate to Reports → Saved Searches → All Saved Searches → New
2. Select "Fixed Assets" as search type
3. Configure criteria, results columns, and summary as specified above
4. Assign appropriate roles for access (Accounting, Store Manager, etc.)
5. Add to dashboard if frequently used

---

### 13. Dashboards & KPIs

#### Fixed Asset Dashboard (for Finance Team)

**Dashboard Components**:
1. **Total Asset Value by Type** (Pie Chart)
   - Displays distribution of asset values across 4 asset types

2. **Net Book Value Trend** (Line Chart)
   - Monthly NBV over trailing 12 months

3. **Monthly Depreciation Expense** (Bar Chart)
   - Current month vs. prior 11 months

4. **Assets by Location** (Table)
   - Top 10 stores by asset value

5. **Upcoming Fully Depreciated Assets** (Table)
   - Assets reaching NBV=0 in next 6 months

**KPIs to Monitor**:
- Total Asset Value: $X.XX million
- Monthly Depreciation: $X,XXX
- Assets Added This Year: Count and $
- Assets Disposed This Year: Count and $
- Average Asset Age: X.X years

**Access**: Finance team, Controller, CFO

---

### 14. Integration with Other Modules

#### Procure-to-Pay Integration
- **Purchase Orders**: Flag PO lines as "Capital Asset" during approval if meets capitalization threshold
- **Vendor Bills**: Expense lines with Fixed Asset Type auto-create asset records
- **3-Way Match**: Ensure asset receipt confirmation before capitalization

#### Location/Department Integration
- Asset depreciation posts to correct cost center based on location assignment
- Store P&L reflects depreciation for assets assigned to that store

#### General Ledger Integration
- Depreciation journal entries post automatically
- Asset additions/disposals post to appropriate GL accounts
- Sub-ledger reconciliation: FAM asset register ties to GL balances

---

## Implementation Steps

### Week 19: FAM Setup & Configuration (40 hours)

**Day 1-2: Module Activation & GL Setup**
1. Enable FAM features in NetSuite
2. Verify GL accounts exist (from Phase 1 COA setup)
3. Create Fixed Asset Types (4 types)
4. Create Depreciation Methods (4 methods)
5. Map GL accounts to asset types
6. Test: Create dummy asset, verify GL posting

**Day 3-4: Custom Fields & Forms**
1. Create custom fields on Fixed Asset record (7 fields)
2. Update Fixed Asset form layout
3. Configure permissions by role
4. Test: Create asset with custom fields, verify display

**Day 5: Saved Searches & Reports**
1. Build 6 core saved searches (Asset Register, Depreciation Schedule, etc.)
2. Test each search with sample data
3. Create FAM Dashboard with KPIs
4. Assign search/dashboard permissions

### Week 20: Data Migration & Testing (40 hours)

**Data Migration Preparation**:
1. Gather current asset data from existing systems (Excel, Legacy ERP, etc.)
2. Data template creation for bulk import
3. Data cleansing: verify cost, in-service dates, locations, serial numbers
4. Map existing assets to NetSuite Asset Types

**Data Migration Execution**:
1. Import historical assets via CSV import or SuiteScript
2. Verify accumulated depreciation balances (as of cutover date)
3. Reconcile imported data to current asset register
4. Confirm GL account balances match

**Testing Scenarios**:
1. **Test 1: Asset Acquisition** - Create new asset from vendor bill
2. **Test 2: Depreciation Calculation** - Run monthly depreciation, verify GL posting
3. **Test 3: Asset Transfer** - Transfer asset between stores, verify location history
4. **Test 4: Asset Disposal** - Dispose asset with proceeds, verify gain/loss posting
5. **Test 5: Reporting** - Run all 6 saved searches, verify accuracy
6. **Test 6: Month-End Close** - Complete full month-end close with depreciation

---

## Business Rules & Policies

### Capitalization Policy

**Capitalization Threshold**: $1,000 per unit
- Assets costing ≥ $1,000: Capitalize as fixed asset
- Assets costing < $1,000: Expense immediately

**Useful Life Standards**:
- Store Fixtures: 7 years
- Computer Equipment: 5 years
- Furniture & Equipment: 7 years
- Leasehold Improvements: Lesser of lease term or 15 years

**Depreciation Convention**: Half-year convention
- Assets placed in service in first half of year: Full year depreciation
- Assets placed in service in second half of year: Half year depreciation

**Group Assets**: Multiple identical low-value items purchased together (e.g., 10 chairs at $800 each = $8,000 total) should be capitalized as one asset group if total exceeds threshold

### Approval Requirements

**Asset Acquisition**:
- < $5,000: Store Manager approval
- $5,000 - $10,000: Regional Director approval
- > $10,000: CFO approval

**Asset Disposal**:
- All disposals require Controller approval to ensure proper accounting treatment

### Asset Tagging

**Physical Asset Tags**: All assets ≥ $1,000 must have physical asset tag affixed
- Tag format: FA-[Asset ID]-[Location Code]
- Example: FA-001234-STR005
- Tags facilitate physical inventory/cycle counting

### Annual Physical Inventory

**Frequency**: Annual asset verification (Q4 each year)
- Physical count of all assets by location
- Verify asset tag, serial number, condition
- Report missing/damaged assets to Controller
- Update location if asset moved without proper transfer

---

## Testing Scenarios

### Test Case 1: Create Fixed Asset from Vendor Bill
**Objective**: Verify asset creation and GL posting

**Setup**:
- Vendor: ABC Store Fixtures Inc.
- Item: Display case for Store 005 (LA Beverly Center)
- Cost: $5,500

**Steps**:
1. Create Vendor Bill
   - Vendor: ABC Store Fixtures
   - Date: 01/15/2026
   - Line: Display Case - $5,500
   - Expense Account: 15100 - Store Fixtures
   - Fixed Asset Type: STORE-FIXTURE
   - Location: Store 005
2. Save Bill (should auto-create Fixed Asset record)
3. Navigate to Fixed Asset record
4. Edit asset:
   - In-Service Date: 01/20/2026
   - Depreciation Method: SL-7YR
   - Serial Number: DCX-8849
   - Warranty Expiration: 01/20/2027
5. Save

**Expected Results**:
- Fixed Asset record created with FA-XXXXX ID
- Asset Type: STORE-FIXTURE
- Original Cost: $5,500
- Location: Store 005
- Status: In Service
- GL Impact: DR 15100 (Store Fixtures Asset), CR 20000 (Accounts Payable)

**Pass/Fail**: _____

---

### Test Case 2: Calculate Monthly Depreciation
**Objective**: Verify depreciation calculation and GL posting

**Setup**: Use asset from Test Case 1 (Display Case, $5,500, 7-year SL)

**Steps**:
1. Advance to period end (01/31/2026)
2. Navigate to Transactions → Financial → Depreciation
3. Select Period: January 2026
4. Click "Calculate Depreciation"
5. Review depreciation journal entry
6. Post to GL

**Expected Results**:
- Monthly Depreciation = $5,500 / 84 months = $65.48
- Journal Entry:
  - DR 72010 - Depreciation Expense - Store Fixtures: $65.48
  - CR 15710 - Accumulated Depr. - Store Fixtures: $65.48
- Posting to Location: Store 005
- Net Book Value: $5,500 - $65.48 = $5,434.52

**Pass/Fail**: _____

---

### Test Case 3: Transfer Asset Between Locations
**Objective**: Verify asset transfer process and audit trail

**Setup**: Use asset from Test Case 1

**Steps**:
1. Navigate to Fixed Asset record (FA-XXXXX)
2. Click "Transfer Asset"
3. Enter:
   - New Location: Store 010 (Miami Aventura)
   - Transfer Date: 02/15/2026
   - Transfer Reason: "Reallocated during store remodel"
4. Save

**Expected Results**:
- Asset location updated to Store 010
- Location history log shows:
  - From: Store 005 (01/20/2026 - 02/15/2026)
  - To: Store 010 (02/15/2026 - present)
- Future depreciation posts to Store 010
- No GL impact (internal transfer)
- Asset Transfer Report shows this transaction

**Pass/Fail**: _____

---

### Test Case 4: Dispose Asset with Sale Proceeds
**Objective**: Verify disposal accounting and gain/loss calculation

**Setup**:
- Asset: Computer (POS Terminal)
- Original Cost: $2,000
- In-Service Date: 01/01/2023
- Accumulated Depreciation as of 12/31/2025: $1,600 (3 years at $533.33/year)
- Net Book Value: $400
- Sale Date: 01/31/2026
- Sale Proceeds: $500

**Steps**:
1. Navigate to Fixed Asset record
2. Click "Dispose Asset"
3. Enter:
   - Disposal Date: 01/31/2026
   - Disposal Type: Sale
   - Sale Proceeds: $500
   - Notes: "Sold to employee"
4. Save

**Expected Results**:
- Asset Status: Disposed
- Gain on Sale = $500 (proceeds) - $400 (NBV) = $100
- Journal Entry:
  - DR 15720 - Accumulated Depr. - Computer Equip: $1,600
  - DR 79500 - Gain on Asset Disposal: $100 (CR)
  - CR 15200 - Computer Equipment: $2,000
  - DR 10100 - Cash: $500
- Asset removed from active asset register

**Pass/Fail**: _____

---

### Test Case 5: Asset Register Report
**Objective**: Verify saved search accuracy

**Setup**: Multiple assets created (at least 10 across different locations and types)

**Steps**:
1. Navigate to Reports → Saved Searches
2. Run "Asset Register by Location"
3. Filter: Location = Store 005
4. Export to Excel

**Expected Results**:
- Report displays all assets assigned to Store 005
- Columns: Asset ID, Description, Type, Original Cost, Accum. Depr., Net Book Value, In-Service Date
- NBV calculation correct: Original Cost - Accum. Depr.
- Totals accurate

**Pass/Fail**: _____

---

### Test Case 6: Month-End Close with Depreciation
**Objective**: Full integration test with period close

**Steps**:
1. Complete all transactions for period (vendor bills, asset transfers, disposals)
2. Run depreciation calculation for period
3. Post depreciation journal entry
4. Run Asset Register report
5. Run Depreciation Schedule report
6. Reconcile FAM sub-ledger to GL:
   - GL Account 15xxx (Asset accounts) = Sum of Asset Register "Original Cost"
   - GL Account 157xx (Accumulated Depr.) = Sum of Asset Register "Accumulated Depreciation"
   - GL Account 72xxx (Depr. Expense) for period = Depreciation Schedule total
7. Close accounting period

**Expected Results**:
- Depreciation posted successfully
- All reports accurate
- FAM balances reconcile to GL
- Period closes without errors
- Assets locked for closed period (no edits allowed)

**Pass/Fail**: _____

---

## Risk Assessment

### High Risks

**Risk 1: Inaccurate Historical Data**
- **Description**: Existing asset data incomplete, inaccurate, or missing accumulated depreciation
- **Impact**: Misstated balance sheet, incorrect depreciation going forward
- **Mitigation**:
  - Conduct thorough data quality review before migration
  - Physical asset verification at each location
  - Engage Controller to validate accumulated depreciation calculations
  - Consider fresh start approach: capitalize only current NBV as "beginning balance"
- **Owner**: Controller (Susan Park)

**Risk 2: Capitalization Policy Inconsistency**
- **Description**: Historical policies unclear or inconsistently applied; prior system vs. NetSuite definitions differ
- **Impact**: Some assets may be missing from register or improperly expensed
- **Mitigation**:
  - Document clear capitalization policy (included above)
  - Controller approval required for policy
  - Training for all users on policy
  - Review prior year additions for policy compliance
- **Owner**: Controller (Susan Park)

**Risk 3: Depreciation Method Misalignment**
- **Description**: NetSuite depreciation methods don't match existing system or GAAP requirements
- **Impact**: Incorrect depreciation expense, potential audit findings
- **Mitigation**:
  - Review depreciation methods with external auditors before go-live
  - Test depreciation calculations against existing system for same assets
  - Half-year convention is standard; confirm alignment with company policy
- **Owner**: Controller (Susan Park) + External Auditor

### Medium Risks

**Risk 4: User Training Gaps**
- **Description**: Store managers unfamiliar with asset tracking requirements
- **Impact**: Assets not properly tagged, transfers not recorded, missing location data
- **Mitigation**:
  - Comprehensive training for store managers (Phase 8)
  - Quick reference guide for asset acquisition/transfer/disposal
  - Controller team support during first 3 months
- **Owner**: Project Manager + Training Lead

**Risk 5: Integration Issues with AP**
- **Description**: Vendor bills not properly flagged as fixed assets, requiring manual rework
- **Impact**: Delayed capitalization, extra effort to create assets retroactively
- **Mitigation**:
  - Clear workflow for AP team: flag any asset purchases on POs
  - Workflow reminder if expense line > $1,000 (consider custom field or script)
  - Monthly review by Controller of large expenses to catch missed capitalizations
- **Owner**: Controller (Susan Park) + AP Lead

---

## Success Metrics

### Go-Live Success (Week 28)
- ✅ All active assets migrated to NetSuite FAM (100% of asset value)
- ✅ Asset register by location reconciles to GL within $500 variance
- ✅ First month depreciation calculated and posted successfully
- ✅ All 6 core saved searches operational
- ✅ All store managers trained on asset transfer process

### 90-Day Success (3 months post go-live)
- ✅ Month-end close includes depreciation with no manual adjustments needed
- ✅ 100% of asset purchases > $1,000 properly capitalized within 5 days
- ✅ Asset register maintained with 95%+ data quality (location, serial number, warranty)
- ✅ Zero audit findings related to asset accounting

### 12-Month Success (1 year post go-live)
- ✅ Annual physical asset verification completed (Q4)
- ✅ 98%+ asset location accuracy (physical matches system)
- ✅ Depreciation expense variance < 2% vs. budget
- ✅ Asset disposal process followed for 100% of retirements

---

## Related Documentation

### Internal Documents
- **Business Requirements**: BR-003.6 (TBD - to be added to business-requirements.md)
- **Functional Requirements**: FR-FAM-001 (customer-knowledgebase/02-system-requirements/functional-requirements.md)
- **Chart of Accounts**: 010.010-Chart-of-Accounts.md (GL account structure)
- **Subsidiary Structure**: 010.020-Subsidiary-Structure.md (entity hierarchy)
- **Locations**: 010.060-Departments-Classes-Locations.md (store master data)

### NetSuite Documentation
- SuiteAnswers: Fixed Asset Management Overview (ID 10305)
- SuiteAnswers: Depreciation Methods (ID 43119)
- SuiteAnswers: Importing Fixed Assets (ID 47697)
- SuiteAnswers: Fixed Asset Accounting (ID 10307)

### External References
- GAAP: ASC 360 - Property, Plant, and Equipment
- IRS Publication 946 - How to Depreciate Property
- Company Capitalization Policy (to be documented by Controller)

---

## Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Controller | Susan Park | [Pending] | [Pending] |
| CFO | Patricia Wong | [Pending] | [Pending] |
| Project Manager | [TBD] | [Pending] | [Pending] |
| Solution Architect | [NetSuite Partner] | [Pending] | [Pending] |

---

## Appendix A: Data Migration Template

### CSV Import Template for Fixed Assets

| Field Name | Data Type | Required | Example | Notes |
|------------|-----------|----------|---------|-------|
| Asset Name | Text | Yes | "Display Case - Store 005" | Descriptive name |
| Asset Type | List | Yes | STORE-FIXTURE | Must match Asset Type ID |
| Original Cost | Currency | Yes | 5500.00 | Purchase cost |
| Purchase Date | Date | Yes | 01/15/2026 | Date acquired |
| In-Service Date | Date | Yes | 01/20/2026 | Date depreciation starts |
| Location | List | Yes | Store 005 | Must match Location ID |
| Depreciation Method | List | Yes | SL-7YR | Must match Method Code |
| Asset Account | GL Account | Yes | 15100 | From COA |
| Depr. Expense Account | GL Account | Yes | 72010 | From COA |
| Accum. Depr. Account | GL Account | Yes | 15710 | From COA |
| Current Accum. Depr. | Currency | No | 1200.00 | As of migration date |
| Serial Number | Text | No | DCX-8849 | Equipment serial |
| Vendor | List | No | ABC Store Fixtures | Vendor name |
| Warranty Expiration | Date | No | 01/20/2027 | Warranty end date |

### Import Steps
1. Export current asset data from existing system
2. Map fields to NetSuite template above
3. Validate data quality (dates, costs, locations)
4. Import to NetSuite sandbox first (test)
5. Reconcile imported data to source
6. Import to production (go-live)
7. Post opening balance journal entry for accumulated depreciation

---

## Appendix B: Training Outline

### Audience: Store Managers (1 hour training)

**Module 1: Asset Tracking Overview (15 min)**
- Why we track assets
- What qualifies as a fixed asset ($1,000+ threshold)
- Examples: fixtures, computers, furniture

**Module 2: Asset Tagging (10 min)**
- Physical asset tags
- How to apply tags
- Recording asset tag ID in system

**Module 3: Asset Transfers (15 min)**
- When to transfer asset between stores
- How to initiate transfer in NetSuite
- Transfer approval workflow

**Module 4: Reporting Lost/Damaged Assets (10 min)**
- How to report missing asset
- Damaged asset workflow
- Insurance claim process

**Module 5: Q&A (10 min)**

### Audience: Finance Team (2 hour training)

**Module 1: FAM Overview (20 min)**
- NetSuite FAM module features
- Integration with GL, AP
- Asset lifecycle

**Module 2: Asset Setup & Acquisition (30 min)**
- Creating assets from vendor bills
- Manual asset creation
- Custom fields and data entry

**Module 3: Depreciation (30 min)**
- Depreciation methods
- Monthly depreciation process
- GL posting and reconciliation

**Module 4: Transfers, Disposals, Adjustments (20 min)**
- Transfer process
- Disposal process (sale, scrap, trade-in)
- Gain/loss accounting

**Module 5: Reporting & Month-End Close (20 min)**
- Saved searches
- Asset register reconciliation
- Period close checklist

---

**Document Status**: Ready for Review

**Last Updated**: 2026-02-03

**Next Review**: Upon approval, begin implementation in Phase 6 (Week 19)

---

**END OF CONFIGURATION PLAN 1000-FAM**
