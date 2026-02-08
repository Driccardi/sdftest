# Vendor Sourcing Records - Deployment Notes

**Project**: Vendor Sourcing Records
**Version**: 1.1
**Date**: 2026-02-05

---

## Summary

This SDF project contains the Vendor Sourcing Tracker custom record system for Coastal Shades Inc. (CSI). The solution enables procurement teams to systematically track vendor qualification efforts, quote management, and sourcing decisions.

---

## Objects Included

### 1. Custom Record Type
- **Script ID**: `customrecord_sourcing_tracker`
- **Label**: Sourcing Tracker
- **Auto-numbering**: ST-0001, ST-0002, etc.
- **Fields**: 11 custom fields (vendor, item, model code, status, buyer, dates, pricing, MOQ, lead time, notes)

### 2. Custom List
- **Script ID**: `customlist_ns_csi_sourcing_status`
- **Label**: Sourcing Status
- **Values**: 8 status values (Contacted, Awaiting Quote, Quote Received, Negotiating, Approved, Rejected, On Hold, Cancelled)

### 3. Saved Search
- **Script ID**: `customsearch_vendor_sourcing_history`
- **Label**: Vendor Sourcing History
- **Purpose**: Displays sourcing records on vendor form as subtab
- **Filter**: Automatically filters to current vendor (@CURRENT@ context)

---

## Deployment Steps

### Prerequisites
- NetSuite account with Administrator or Developer role
- SuiteCloud Development Framework (SDF) CLI installed
- Vendor records populated
- Item master data configured
- Employee records for procurement team

### Steps

1. **Navigate to Project Source Directory**
   ```powershell
   cd "C:\Users\David Riccardi\Documents\test-project\sdf\Vendor Sourcing Records\src"
   ```

2. **Set Up Account Authentication**
   ```powershell
   suitecloud account:setup
   ```
   - Auth ID: `next-products`
   - Follow prompts for account credentials

3. **Validate Project**
   ```powershell
   suitecloud project:validate --server
   ```
   - Review validation results
   - Address any errors before deployment

4. **Deploy to NetSuite**
   ```powershell
   suitecloud project:deploy
   ```
   - Confirm deployment when prompted
   - Monitor deployment log for success

5. **Post-Deployment Configuration**

   **A. Add Sourcing History Subtab to Vendor Form**
   1. Navigate to: Customization > Forms > Entry Forms > Vendor
   2. Select: Standard Vendor Form (or your custom vendor form)
   3. Click: "Customize"
   4. Go to: "Custom Subtabs"
   5. Click: "Add Subtab"
   6. Configure:
      - Tab Label: **Sourcing History**
      - Tab Type: **Saved Search**
      - Saved Search: **Vendor Sourcing History**
   7. Save the form

   **B. Set Permissions**
   - Navigate to: Setup > Users/Roles > Manage Roles
   - For each role that needs access (Purchasing Team, Sales Team, etc.):
     - Permissions > Custom Records
     - Set appropriate access level for "Sourcing Tracker" custom record
     - Set "Sourcing Status" custom list to View or Full

   **C. Test the Solution**
   - Navigate to: Lists > Sourcing Tracker > New
   - Create a test sourcing record:
     - Select a vendor
     - Select an item
     - Enter model code (optional)
     - Status defaults to "Contacted"
     - Buyer defaults to current user
     - Add quoted cost, MOQ, lead time
   - Save the record
   - Navigate to the vendor record
   - Verify the "Sourcing History" subtab appears
   - Confirm the test sourcing record shows in the list

---

## Technical Architecture

### Data Model

**Sourcing Tracker Record (customrecord_sourcing_tracker)**
- Links to: Vendor (SELECT -23), Item (SELECT -10), Employee (SELECT -4)
- Status: Custom List (customlist_ns_csi_sourcing_status)
- Pricing: Currency fields (Quoted Cost, Target Cost)
- Quantities: Integer fields (MOQ, Lead Time in Days)
- Audit: Date fields (Initial Contact, Quote Received), Textarea (Notes)

### Vendor Integration

**Saved Search: Vendor Sourcing History**
- Filters: `custrecord_st_vendor = @CURRENT@` (shows records for current vendor only)
- Columns: Record ID, Item, Model Code, Status, Buyer, Contact Date, Quoted Cost, MOQ, Lead Time
- Sort: Contact Date DESC (most recent first)
- Available Filters: Status, Buyer, Contact Date

When embedded on vendor form as subtab:
- Auto-filters to show only sourcing records for that vendor
- Clicking record ID opens full sourcing record
- Users can apply additional filters (status, buyer, date range)

---

## Known Gaps & Future Enhancements

### Open Gaps

**GAP-PTP-005: Email Notifications**
- Requirement: Automated emails when status changes
- Status: Requirements undefined
- Open Questions:
  - Which status transitions trigger emails?
  - Who receives notifications (buyer, vendor, manager)?
  - Email content/format preferences?
  - Immediate or batched delivery?
- Solution: Requires workflow or user event script with email templates

### Future Enhancements

1. **Additional Saved Searches**
   - Active sourcing efforts by buyer (workload dashboard)
   - Vendor pricing comparison by item
   - Average lead times by vendor
   - Approved vendors by item category
   - Cost variance analysis (quoted vs. target)

2. **Workflow Automation**
   - Auto-advance status based on field changes (e.g., quote date entered → status "Quote Received")
   - Approval workflows for high-value vendor selections

3. **Reporting Dashboards**
   - Days to quote metrics by vendor
   - Cost savings achieved (target vs. quoted)
   - Vendor responsiveness scorecards

4. **Attachment Management**
   - Structured storage for quote PDFs
   - Link to external document management system

5. **Item Record Integration**
   - Add subtab to item record showing all sourcing attempts for that item
   - Compare vendor pricing across sourcing rounds

---

## Rollback Plan

If deployment issues occur:

1. **Record Deployed Objects**
   - Note internal IDs of deployed custom record, custom list, and saved search

2. **Remove Vendor Form Customization**
   - Navigate to vendor form customization
   - Remove "Sourcing History" subtab
   - Save form

3. **Delete Objects via UI** (if needed)
   - Customization > Lists, Records, & Fields > Custom Records > Sourcing Tracker
   - Mark as Inactive or Delete (if no data exists)
   - Customization > Lists, Records, & Fields > Custom Lists > Sourcing Status
   - Mark as Inactive or Delete
   - Lists > Search > Saved Searches > Vendor Sourcing History
   - Mark as Inactive or Delete

---

## Support & Contact

- **Project Owner**: David Riccardi
- **Customer**: Coastal Shades Inc. (CSI)
- **Stakeholders**: Sarah (Purchasing Manager), Tom (Operations Director)
- **Auth ID**: next-products

---

## Deployment Log

**Validation Attempts**:
- 2026-01-30 20:54:47 UTC - Initial validation
- 2026-02-04 22:59:57 UTC - Failed: "No account has been set up for this project"

**Deployment Status**: Not yet deployed (pending account setup)

---

*Last Updated: 2026-02-05*
