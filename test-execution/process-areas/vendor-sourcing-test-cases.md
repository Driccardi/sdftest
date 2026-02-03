# Vendor Sourcing Process - Test Cases

---
**Test Suite ID**: TS-VS-001
**Module**: Procure to Pay - Vendor Sourcing
**Related Process**: [Vendor Sourcing Process](../../customer-knowledgebase/03-functional-processes/vendor-sourcing-process.md)
**Custom Record**: Sourcing Tracker (`customrecord_ns_csi_sourcing_tracker`)
**Created**: 2026-01-30
**Status**: Draft
**Test Environment**: Sandbox Account
**Test Data Required**: Yes (see Appendix A)

---

## Test Scope

This test suite covers the end-to-end vendor sourcing process including:
- Sourcing Tracker record creation and updates
- Status workflow transitions
- Field validations and business rules
- Permission and role-based access control
- Saved searches and reporting
- Email notification triggers (pending requirements - GAP-PTP-005)

## Prerequisites

### Test Data Setup
1. Vendor records: At least 3 active vendors (e.g., "Acme Eyewear", "Coastal Optics", "Vision Wholesale")
2. Item records: At least 5 inventory items (sunglasses/eyewear)
3. Employee records:
   - 2 Purchasing team members (full edit access)
   - 1 Sales team member (view-only access)
   - 1 Executive (reports-only access)
4. Custom record deployed: Sourcing Tracker
5. Custom list deployed: Sourcing Status with all required values

### User Test Accounts
- **Buyer1** (Role: Purchasing Manager) - Full edit access
- **Buyer2** (Role: Purchasing Coordinator) - Full edit access
- **Sales1** (Role: Sales Representative) - View-only access
- **Exec1** (Role: Executive) - Reports-only access

---

## Test Cases - Record Creation

### TC-VS-001: Create Sourcing Tracker - Happy Path
**Priority**: High
**Type**: Functional - Positive

**Preconditions**:
- User logged in as Buyer1
- Valid vendor and item records exist

**Test Steps**:
1. Navigate to Sourcing Tracker custom record list
2. Click "New"
3. Enter required fields:
   - Vendor: "Acme Eyewear"
   - Item: "Classic Aviator - Black"
   - Model/Style Code: "ACM-AV-001"
   - Sourcing Status: "Contacted"
   - Initial Contact Date: Today's date
   - Assigned Buyer: Buyer1
4. Click "Save"

**Expected Result**:
- Record saves successfully
- Record ID generated
- Status = "Contacted"
- Created By = Buyer1
- All entered values display correctly

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Executed By**: _[Tester name]_
**Execution Date**: _[Date]_

---

### TC-VS-002: Create Sourcing Tracker - Missing Required Fields
**Priority**: High
**Type**: Functional - Negative

**Preconditions**:
- User logged in as Buyer1

**Test Steps**:
1. Navigate to Sourcing Tracker custom record list
2. Click "New"
3. Leave Vendor field empty
4. Enter Item: "Classic Aviator - Black"
5. Enter Sourcing Status: "Contacted"
6. Click "Save"

**Expected Result**:
- Error message displayed: "Please enter a value for Vendor"
- Record does NOT save
- User remains on edit form

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-003: Create Duplicate Sourcing Record
**Priority**: Medium
**Type**: Business Rule Validation

**Preconditions**:
- Existing sourcing record exists:
  - Vendor: "Acme Eyewear"
  - Item: "Classic Aviator - Black"
  - Model/Style Code: "ACM-AV-001"
  - Status: "Contacted" or "Awaiting Quote" (active status)

**Test Steps**:
1. Attempt to create new sourcing record with identical:
   - Vendor: "Acme Eyewear"
   - Item: "Classic Aviator - Black"
   - Model/Style Code: "ACM-AV-001"
2. Click "Save"

**Expected Result**:
- **IF duplicate prevention is configured**: Error message displayed indicating duplicate exists
- **IF duplicate prevention NOT configured**: Record saves successfully (note: customer requirement is to "check for existing records" but enforcement may be manual)

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Notes**: Document whether duplicate prevention is system-enforced or user-responsibility

---

## Test Cases - Status Workflow

### TC-VS-010: Status Transition - Contacted to Quote Received
**Priority**: High
**Type**: Functional - Workflow

**Preconditions**:
- Existing sourcing record with Status = "Contacted"

**Test Steps**:
1. Open the sourcing record
2. Update the following fields:
   - Sourcing Status: "Quote Received"
   - Quote Received Date: Today's date
   - Quoted Unit Cost: $12.50
   - MOQ: 500
   - Lead Time (Days): 30
3. Click "Save"

**Expected Result**:
- Record saves successfully
- Status updates to "Quote Received"
- All quote-related fields saved
- Last Modified timestamp updated

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-011: Status Transition - Quote Received to Negotiating
**Priority**: High
**Type**: Functional - Workflow

**Preconditions**:
- Existing sourcing record with Status = "Quote Received"
- Quoted Unit Cost = $12.50
- Target Cost = $10.00

**Test Steps**:
1. Open the sourcing record
2. Note that Quoted Unit Cost ($12.50) exceeds Target Cost ($10.00)
3. Update Sourcing Status: "Negotiating"
4. Add Notes: "Initial quote too high, negotiating for $10.50 target"
5. Click "Save"

**Expected Result**:
- Record saves successfully
- Status = "Negotiating"
- Notes field saved
- Quote fields remain unchanged

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-012: Status Transition - Negotiating to Approved
**Priority**: High
**Type**: Functional - Workflow

**Preconditions**:
- Existing sourcing record with Status = "Negotiating"

**Test Steps**:
1. Open the sourcing record
2. Update Quoted Unit Cost: $10.50 (revised)
3. Update Sourcing Status: "Approved"
4. Add Notes: "Vendor agreed to $10.50, approved to proceed with PO"
5. Click "Save"

**Expected Result**:
- Record saves successfully
- Status = "Approved"
- Quoted Unit Cost = $10.50
- Record is now ready for PO creation

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-013: Status Transition - Quote Received to Rejected
**Priority**: Medium
**Type**: Functional - Workflow

**Preconditions**:
- Existing sourcing record with Status = "Quote Received"

**Test Steps**:
1. Open the sourcing record
2. Update Sourcing Status: "Rejected"
3. Add Notes: "Price too high, MOQ unrealistic for our volume"
4. Click "Save"

**Expected Result**:
- Record saves successfully
- Status = "Rejected"
- Notes captured
- Record no longer appears in "Open Sourcing Requests" reports

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-014: Status Transition - Any Status to On Hold
**Priority**: Medium
**Type**: Functional - Workflow

**Preconditions**:
- Existing sourcing record with any active status

**Test Steps**:
1. Open the sourcing record
2. Update Sourcing Status: "On Hold"
3. Add Notes: "Pausing sourcing due to delayed product launch"
4. Click "Save"

**Expected Result**:
- Record saves successfully from any status to "On Hold"
- Status = "On Hold"
- Notes captured

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-015: Status Transition - On Hold to Cancelled
**Priority**: Medium
**Type**: Functional - Workflow

**Preconditions**:
- Existing sourcing record with Status = "On Hold"

**Test Steps**:
1. Open the sourcing record
2. Update Sourcing Status: "Cancelled"
3. Add Notes: "Product line discontinued, sourcing no longer needed"
4. Click "Save"

**Expected Result**:
- Record saves successfully
- Status = "Cancelled"
- Record excluded from active sourcing reports

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

## Test Cases - Field Validations

### TC-VS-020: Validate Quote Received Date - Future Date
**Priority**: Medium
**Type**: Validation - Negative

**Preconditions**:
- User logged in as Buyer1

**Test Steps**:
1. Create or edit a sourcing record
2. Enter Quote Received Date: Tomorrow's date (future)
3. Click "Save"

**Expected Result**:
- **IF validation exists**: Error message "Quote Received Date cannot be in the future"
- **IF no validation**: Record saves (document as potential enhancement)

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Notes**: Document whether this validation is required

---

### TC-VS-021: Validate Quote Received Date - Before Contact Date
**Priority**: Medium
**Type**: Validation - Business Rule

**Preconditions**:
- User logged in as Buyer1

**Test Steps**:
1. Create sourcing record with Initial Contact Date: 2026-01-20
2. Enter Quote Received Date: 2026-01-15 (before contact date)
3. Click "Save"

**Expected Result**:
- **IF validation exists**: Error message "Quote Received Date cannot be earlier than Initial Contact Date"
- **IF no validation**: Record saves (document as potential enhancement)

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-022: Validate Quoted Unit Cost - Negative Value
**Priority**: High
**Type**: Validation - Negative

**Preconditions**:
- User logged in as Buyer1

**Test Steps**:
1. Create or edit sourcing record
2. Enter Quoted Unit Cost: -5.00
3. Click "Save"

**Expected Result**:
- Error message: "Quoted Unit Cost must be a positive value"
- Record does NOT save

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-023: Validate MOQ - Zero or Negative
**Priority**: Medium
**Type**: Validation - Negative

**Test Steps**:
1. Enter MOQ: 0
2. Click "Save"
3. Try again with MOQ: -10

**Expected Result**:
- Error message: "MOQ must be greater than zero"

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-024: Validate Lead Time - Negative Value
**Priority**: Medium
**Type**: Validation - Negative

**Test Steps**:
1. Enter Lead Time (Days): -5
2. Click "Save"

**Expected Result**:
- Error message: "Lead Time must be zero or greater"

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-025: Model/Style Code - Max Length
**Priority**: Low
**Type**: Validation - Boundary

**Test Steps**:
1. Enter Model/Style Code: 51+ character string
2. Click "Save"

**Expected Result**:
- **IF field limited to 50 chars**: Error or truncation
- Record saves with truncated value OR validation error

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Notes**: Spec indicates 50 char limit

---

## Test Cases - Permissions and Access Control

### TC-VS-030: Purchasing Team - Full Edit Access
**Priority**: High
**Type**: Security - Permissions

**Preconditions**:
- User logged in as Buyer1 (Purchasing Manager role)

**Test Steps**:
1. Navigate to Sourcing Tracker list
2. Create new record → Verify success
3. Edit existing record → Verify success
4. Attempt to delete record → Verify success (or note if delete is restricted)

**Expected Result**:
- User can create, view, edit, and delete sourcing records
- All fields are editable

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-031: Sales Team - View Only Access
**Priority**: High
**Type**: Security - Permissions

**Preconditions**:
- User logged in as Sales1 (Sales Representative role)

**Test Steps**:
1. Navigate to Sourcing Tracker list
2. View list of sourcing records → Verify visible
3. Open existing record → Verify can view
4. Attempt to edit record → Check if edit button available
5. Attempt to create new record → Check if "New" button available

**Expected Result**:
- User can view sourcing records (list and detail)
- Edit button NOT available or edit attempt fails with permission error
- "New" button NOT available or create attempt fails

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-032: Executive - Reports Only Access
**Priority**: Medium
**Type**: Security - Permissions

**Preconditions**:
- User logged in as Exec1 (Executive role)

**Test Steps**:
1. Attempt to navigate to Sourcing Tracker list
2. Access saved search/dashboard with sourcing data
3. Attempt to drill into individual record from report

**Expected Result**:
- User CANNOT access custom record list directly
- User CAN view dashboards and saved searches
- Drill-down behavior: Either blocked OR view-only access to record detail

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Notes**: Clarify drill-down behavior with business

---

### TC-VS-033: Assigned Buyer Field - Restricted to Buyer's Own Records
**Priority**: Low
**Type**: Security - Row-Level (Optional)

**Preconditions**:
- Buyer1 has created Record A (Assigned Buyer = Buyer1)
- Buyer2 has created Record B (Assigned Buyer = Buyer2)

**Test Steps**:
1. Log in as Buyer1
2. View list of all sourcing records
3. Verify visibility of both Record A and Record B

**Expected Result**:
- **IF no row-level security**: Both records visible to both buyers
- **IF row-level security enabled**: Each buyer sees only their assigned records

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Notes**: Requirement doc does not specify row-level restrictions; assume all buyers see all records

---

## Test Cases - Reporting

### TC-VS-040: Saved Search - Open Sourcing Requests by Status
**Priority**: High
**Type**: Reporting

**Preconditions**:
- Multiple sourcing records exist in various statuses
- Saved search deployed: "Open Sourcing Requests by Status"

**Test Steps**:
1. Navigate to saved search
2. Verify columns displayed:
   - Vendor
   - Item
   - Status
   - Assigned Buyer
   - Initial Contact Date
   - Days Since Contact (formula field)
3. Apply filter: Status = "Contacted" or "Awaiting Quote" or "Quote Received"
4. Verify results exclude "Approved", "Rejected", "On Hold", "Cancelled"

**Expected Result**:
- Search displays only open/active sourcing records
- Days Since Contact calculated correctly
- Results sortable and filterable

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-041: Saved Search - Overdue Quotes (>7 Days)
**Priority**: High
**Type**: Reporting - Business Rule

**Preconditions**:
- Sourcing records exist with Status = "Contacted" or "Awaiting Quote"
- Initial Contact Date > 7 days ago

**Test Steps**:
1. Navigate to saved search "Overdue Quotes"
2. Verify filter criteria:
   - Status = "Contacted" OR "Awaiting Quote"
   - Days Since Contact > 7
3. Verify results highlight records requiring follow-up

**Expected Result**:
- Search returns only records >7 days old without quote
- Formula calculates days correctly
- Highlighting or color-coding applied (if configured)

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-042: Saved Search - Vendor Response Time Analysis
**Priority**: Medium
**Type**: Reporting - Analytics

**Preconditions**:
- Multiple sourcing records with Quote Received Date populated
- Saved search "Vendor Response Time" deployed

**Test Steps**:
1. Navigate to saved search
2. Verify columns:
   - Vendor
   - Average Days to Quote (formula: AVG of Quote Received Date - Initial Contact Date)
   - Count of Quotes
3. Verify grouping by Vendor
4. Sort by Average Days to Quote descending

**Expected Result**:
- Search groups by vendor
- Calculates average days to quote correctly
- Identifies slowest-responding vendors

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-043: Saved Search - Cost Variance by Vendor
**Priority**: Medium
**Type**: Reporting - Analytics

**Preconditions**:
- Multiple sourcing records with both Target Cost and Quoted Unit Cost populated

**Test Steps**:
1. Navigate to saved search "Cost Variance by Vendor"
2. Verify columns:
   - Vendor
   - Item
   - Target Cost
   - Quoted Unit Cost
   - Cost Variance % (formula: (Quoted - Target) / Target * 100)
3. Verify formula calculates correctly
4. Filter for records with variance > 10%

**Expected Result**:
- Search displays cost variance percentage
- Highlights vendors quoting significantly over target
- Sortable by variance

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

### TC-VS-044: Dashboard Portlet - Open Sourcing Pipeline
**Priority**: Medium
**Type**: Reporting - Dashboard

**Preconditions**:
- Dashboard created with sourcing metrics

**Test Steps**:
1. Navigate to Purchasing Dashboard
2. Locate "Open Sourcing Pipeline" portlet
3. Verify displays:
   - Count by status (bar chart or table)
   - Total open requests
   - Trend line (if configured)

**Expected Result**:
- Portlet displays current open sourcing activity
- Refreshes dynamically
- Click-through to saved search works

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_

---

## Test Cases - Vendor Record Integration

### TC-VS-050: View Sourcing History from Vendor Record - Subtab
**Priority**: Medium
**Type**: Integration - UI

**Preconditions**:
- Vendor record exists: "Acme Eyewear"
- Multiple sourcing records exist for this vendor
- Subtab configured on Vendor form (if approach selected)

**Test Steps**:
1. Open Vendor record: "Acme Eyewear"
2. Navigate to "Sourcing History" subtab
3. Verify list displays all related sourcing records
4. Verify columns: Item, Status, Initial Contact Date, Quoted Cost
5. Click on a record to drill down

**Expected Result**:
- Subtab displays all sourcing records for this vendor
- Records clickable for detail view
- List updates dynamically

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Notes**: Applicable only if subtab approach is selected

---

### TC-VS-051: View Sourcing History from Vendor Record - Embedded Search
**Priority**: Medium
**Type**: Integration - UI

**Preconditions**:
- Vendor record exists
- Saved search embedded on Vendor form (if approach selected)

**Test Steps**:
1. Open Vendor record
2. Locate embedded saved search section
3. Verify search auto-filters to current vendor
4. Verify results display

**Expected Result**:
- Embedded search shows only this vendor's sourcing records
- Search functions normally
- Results update dynamically

**Actual Result**: _[To be filled during test execution]_
**Status**: _[Pass/Fail]_
**Notes**: Applicable only if embedded search approach is selected

---

## Test Cases - Email Notifications (Pending Requirements)

> **Note**: The following test cases are DRAFT pending resolution of GAP-PTP-005. These will be finalized once email notification requirements are confirmed.

### TC-VS-060: Email Notification - Status Change (Generic)
**Priority**: High
**Type**: Automation - Workflow
**Status**: BLOCKED - Pending GAP-PTP-005 resolution

**Preconditions**:
- Email notification workflow deployed
- Test recipient configured

**Test Steps**:
1. Update sourcing record status from "Contacted" to "Quote Received"
2. Save record
3. Check recipient inbox

**Expected Result**:
- Email sent to [recipient TBD]
- Email contains [content TBD]
- Send timing: [immediate/batched TBD]

**Actual Result**: _[To be completed after requirements finalized]_
**Status**: _[Blocked]_

---

### TC-VS-061: Email Notification - Multiple Status Changes
**Priority**: Medium
**Type**: Automation - Workflow
**Status**: BLOCKED - Pending GAP-PTP-005 resolution

**Test Steps**:
1. Update status multiple times in quick succession
2. Verify email behavior (one per change vs. consolidated)

**Expected Result**: _[TBD based on requirements]_

---

### TC-VS-062: Email Notification - Vendor Recipient
**Priority**: Medium
**Type**: Automation - Workflow
**Status**: BLOCKED - Pending GAP-PTP-005 resolution

**Test Steps**:
1. Determine if vendors receive automated notifications
2. Test vendor email delivery

**Expected Result**: _[TBD - depends on whether vendors are notified]_

---

## Test Cases - Calculated Metrics (Future Phase)

> **Note**: Cost Variance and Days to Quote are currently manual fields. These tests apply when/if formula fields or workflows are implemented.

### TC-VS-070: Calculate Days to Quote
**Priority**: Low
**Type**: Formula Field (Future)
**Status**: DEFERRED

**Test Steps**:
1. Create record with Initial Contact Date: 2026-01-20
2. Update Quote Received Date: 2026-01-27
3. Verify "Days to Quote" formula field = 7

**Expected Result**: Formula calculates correctly

---

### TC-VS-071: Calculate Cost Variance Percentage
**Priority**: Low
**Type**: Formula Field (Future)
**Status**: DEFERRED

**Test Steps**:
1. Create record with Target Cost: $10.00
2. Update Quoted Unit Cost: $12.00
3. Verify "Cost Variance %" field = 20%

**Expected Result**: Formula: (12 - 10) / 10 * 100 = 20%

---

## Test Cases - Attachment Handling (Phase 2)

### TC-VS-080: Attach Quote PDF
**Priority**: Low
**Type**: File Attachment (Future)
**Status**: DEFERRED - Phase 2

**Test Steps**:
1. Open sourcing record
2. Attach quote PDF file
3. Verify file linked correctly

**Expected Result**: _[Parking lot for Phase 2]_

---

## Regression Test Cases

### TC-VS-090: Bulk Update - Reassign Buyer
**Priority**: Medium
**Type**: Regression

**Test Steps**:
1. Select multiple sourcing records
2. Use mass update to change Assigned Buyer
3. Verify all records updated correctly

**Expected Result**: Bulk operation completes successfully

---

### TC-VS-091: Record Deletion - Check Dependencies
**Priority**: Medium
**Type**: Regression - Data Integrity

**Test Steps**:
1. Attempt to delete sourcing record
2. Verify behavior (hard delete vs. soft delete vs. restricted)

**Expected Result**: Deletion policy enforced consistently

---

## Defect Template

When a test case fails, log defects using the following format:

**Defect ID**: DEF-VS-[number]
**Test Case**: TC-VS-[number]
**Severity**: Critical / High / Medium / Low
**Priority**: P1 / P2 / P3
**Summary**: [Brief description]
**Steps to Reproduce**:
**Expected Result**:
**Actual Result**:
**Screenshots/Logs**: [Attach if applicable]
**Environment**: Sandbox / Production
**Reported By**: [Tester name]
**Reported Date**: [Date]
**Assigned To**: [Developer]
**Status**: Open / In Progress / Fixed / Closed

---

## Appendix A - Test Data Script

```javascript
// SuiteScript to create test data for vendor sourcing test cases
// Run as a one-time script in sandbox

define([], function() {
    function createTestData() {

        // Create test vendors
        var vendors = [
            {name: 'Acme Eyewear', email: 'vendor@acme-eyewear.com'},
            {name: 'Coastal Optics', email: 'sales@coastaloptics.com'},
            {name: 'Vision Wholesale', email: 'quotes@visionwholesale.com'}
        ];

        // Create test items
        var items = [
            {name: 'Classic Aviator - Black', sku: 'SGLSS-AV-BLK-001'},
            {name: 'Wayfarer - Tortoise', sku: 'SGLSS-WF-TRT-002'},
            {name: 'Round Frame - Gold', sku: 'SGLSS-RD-GLD-003'},
            {name: 'Cat Eye - Red', sku: 'SGLSS-CE-RED-004'},
            {name: 'Sport Wrap - Blue', sku: 'SGLSS-SW-BLU-005'}
        ];

        // Create test sourcing records
        var sourcingRecords = [
            {
                vendor: 'Acme Eyewear',
                item: 'Classic Aviator - Black',
                modelCode: 'ACM-AV-001',
                status: 'Contacted',
                contactDate: '2026-01-25',
                buyer: 'Buyer1'
            },
            {
                vendor: 'Acme Eyewear',
                item: 'Wayfarer - Tortoise',
                modelCode: 'ACM-WF-002',
                status: 'Quote Received',
                contactDate: '2026-01-20',
                quoteDate: '2026-01-27',
                quotedCost: 12.50,
                moq: 500,
                leadTime: 30,
                buyer: 'Buyer1'
            },
            {
                vendor: 'Coastal Optics',
                item: 'Round Frame - Gold',
                modelCode: 'CO-RND-003',
                status: 'Negotiating',
                contactDate: '2026-01-15',
                quoteDate: '2026-01-22',
                quotedCost: 15.00,
                targetCost: 12.00,
                moq: 1000,
                leadTime: 45,
                buyer: 'Buyer2'
            },
            {
                vendor: 'Vision Wholesale',
                item: 'Cat Eye - Red',
                modelCode: 'VW-CE-RED-004',
                status: 'Approved',
                contactDate: '2026-01-10',
                quoteDate: '2026-01-17',
                quotedCost: 10.50,
                targetCost: 10.00,
                moq: 250,
                leadTime: 20,
                buyer: 'Buyer1'
            }
        ];

        log.audit('Test Data', 'Create vendors: ' + vendors.length);
        log.audit('Test Data', 'Create items: ' + items.length);
        log.audit('Test Data', 'Create sourcing records: ' + sourcingRecords.length);
    }

    return {
        execute: createTestData
    };
});
```

---

## Appendix B - Test Execution Checklist

- [ ] Sandbox environment prepared
- [ ] Test data created (Appendix A)
- [ ] Test user accounts provisioned
- [ ] Custom record and list deployed
- [ ] Saved searches deployed
- [ ] Dashboard configured (if applicable)
- [ ] Test execution spreadsheet prepared
- [ ] Defect tracking system ready
- [ ] UAT participants identified
- [ ] Test schedule communicated

---

## Sign-Off

**Test Plan Reviewed By**: _____________________________ Date: _________
(Sarah - Purchasing Manager)

**Test Plan Approved By**: _____________________________ Date: _________
(Tom - Operations Director)

**Testing Lead**: _____________________________ Date: _________
(QA/Implementation Team)

---

**Last Updated**: 2026-01-30
**Version**: 1.0
**Status**: Draft - Ready for Review
