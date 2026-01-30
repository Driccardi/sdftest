# Quote to Order Process - Wholesale Custom Frames

---
**Document Type**: Functional Process
**Client**: SunStyle Retail
**Process Area**: Order to Cash - Wholesale Sales
**Status**: Draft
**Version**: 0.1.0
**Last Updated**: 2026-01-30
**Author**: Discovery Notes
**Related Documents**:
- `./order-management.md`
- `./vendor-sourcing-process.md`
- `../02-system-requirements/crm-requirements.md` (to be created)

---

## Process Overview

The Quote to Order process handles wholesale sales to sports teams and other bulk buyers who require **custom-designed frames** in specific team colors and branding. This process bridges NetSuite CRM (for customer relationship and quote management) with custom product sourcing workflows.

### Key Characteristics
- **Customer Type**: Wholesale buyers (primarily sports teams)
- **Product Type**: Custom-designed frames with team colors and branding
- **NetSuite Record Type**: Estimate (Quote)
- **Special Requirements**: Design team involvement, custom sourcing

---

## Process Flow

### 1. Quote Creation (CRM)

**Actor**: Sales Representative
**System**: NetSuite CRM
**Output**: Estimate record

#### Activities
1. Sales rep receives inquiry from wholesale customer (sports team)
2. Rep creates Estimate record in NetSuite CRM
3. Line items represent custom frame designs with specifications:
   - Frame style/model base
   - Custom color requirements (team colors)
   - Branding/logo placement specifications
   - Quantity (MOQ considerations)
   - Delivery timeline requirements

#### Data Captured
- Customer: Wholesale account (sports team)
- Contact: Team procurement contact
- Item specifications (custom)
- Quantities
- Target pricing
- Delivery date requirements

> ⚠️ **OPEN**: How are custom color/design specifications captured? Custom fields on estimate line items? Attachments? External design brief?

---

### 2. Design Team Handoff

**Actor**: Design Team / Product Development
**Trigger**: Estimate reaches specific status (e.g., "Design Required")

#### Activities
1. Design team receives notification of new custom quote
2. Review customer specifications and requirements
3. Create design mockups/renderings for customer approval
4. Identify sourcing requirements:
   - Base frame model selection
   - Custom color formulations
   - Logo/branding production requirements
   - Material specifications

> ⚠️ **OPEN**: How is the design team notified? Workflow email? Dashboard? Manual handoff?

> ⚠️ **OPEN**: Where are design mockups stored? File attachments on Estimate? FileCabinet? External system?

---

### 3. Custom Frame Sourcing

**Actor**: Purchasing Team / Design Team
**System**: NetSuite + Sourcing Tracker (see `vendor-sourcing-process.md`)

#### Activities
1. Initiate vendor sourcing for custom frame production
2. Create **Sourcing Tracker** record(s) for custom items:
   - Link to Estimate record (quote reference)
   - Vendor selection for custom manufacturing
   - Custom specifications (colors, materials, branding)
   - MOQ negotiation
   - Lead time confirmation
   - Cost quotes

3. Vendor communication and negotiation
4. Sample approval (if required)
5. Finalize sourcing and confirm production timeline

> ⚠️ **OPEN**: Should Sourcing Tracker custom record have a lookup/reference field to Estimate records?

> ⚠️ **OPEN**: How are custom specs communicated to vendor? Through NetSuite? External system? Email with attachments?

---

### 4. Quote Finalization and Customer Approval

**Actor**: Sales Representative
**System**: NetSuite CRM

#### Activities
1. Receive confirmed sourcing costs and lead times
2. Update Estimate with:
   - Final pricing (cost + markup)
   - Confirmed delivery timeline
   - Terms and conditions for custom orders
3. Send quote to customer for approval
4. Customer accepts or requests revisions

> ⚠️ **OPEN**: What is the approval workflow on the customer side? E-signature? Email confirmation? Manual?

---

### 5. Order Conversion

**Actor**: Sales Representative
**System**: NetSuite CRM → ERP

#### Activities
1. Upon customer acceptance, convert Estimate to **Sales Order**
2. Sales Order triggers:
   - Purchase Order creation to vendor (custom manufacturing)
   - Production timeline tracking
   - Deposit/payment collection (if required for custom orders)
3. Order fulfillment follows standard or custom fulfillment process

> ⚠️ **OPEN**: Are custom frames drop-shipped directly from manufacturer? Or received into SunStyle inventory first?

> ⚠️ **OPEN**: What is the payment terms structure for custom wholesale orders? Deposit required? Net terms?

---

## System Requirements

### NetSuite CRM Configuration
- Estimate form customization for wholesale/custom orders
- Custom fields to capture design specifications
- Status workflow for design handoff and sourcing stages

### Sourcing Tracker Integration
- Link Sourcing Tracker records to Estimate records
- Custom item creation for wholesale custom designs
- Vendor management for custom manufacturing partners

### Design Workflow (TBD)
- Design brief capture and storage
- Mockup/rendering approval workflow
- Specification handoff to sourcing team

---

## Configuration Impact

### Estimate (Quote) Customizations
- Custom transaction body fields:
  - `custbody_design_required` (Checkbox) - Flags quotes requiring design team involvement
  - `custbody_design_status` (List) - Design workflow stage (Pending, In Progress, Approved, etc.)
  - `custbody_linked_sourcing_tracker` (Multi-select?) - Reference to Sourcing Tracker record(s)
  - `custbody_customer_type` (List) - Wholesale, Retail, Team/Bulk, etc.

- Custom line-level fields:
  - `custcol_custom_color_spec` (Text/Textarea) - Custom color requirements
  - `custcol_branding_spec` (Text/Textarea) - Logo/branding specifications
  - `custcol_design_mockup_file` (File) - Reference to design mockup

> ⚠️ **OPEN**: Should we use a separate custom record for "Design Specifications" linked to Estimate lines? Or keep it simple with fields?

### Workflow/Automation Needs
- Email notification to design team when quote flagged for custom design
- Status update automation as design progresses
- Integration with Sourcing Tracker for custom item sourcing

### Reporting Requirements
- Custom quote pipeline report (wholesale segment)
- Design team workload/capacity dashboard
- Custom sourcing timeline tracking

---

## Integration Points

### Internal NetSuite
- **CRM → ERP**: Estimate to Sales Order conversion
- **Estimate → Sourcing Tracker**: Custom record linkage for sourcing custom items
- **Sales Order → Purchase Order**: Trigger vendor PO for custom manufacturing

### External (Potential)
- Design software/PLM system (if external design tools used)
- Vendor portal for custom spec communication

> ⚠️ **OPEN**: Are there any external systems for design management, or is everything NetSuite-native?

---

## Testing Considerations

### Test Scenarios
1. **End-to-End Custom Quote Flow**
   - Create wholesale estimate with custom specs
   - Route to design team
   - Create sourcing tracker for custom item
   - Finalize quote with customer
   - Convert to Sales Order and trigger PO

2. **Design Team Handoff**
   - Verify notification triggers correctly
   - Confirm design status updates flow properly
   - Test mockup attachment and approval workflow

3. **Sourcing Integration**
   - Link Sourcing Tracker to Estimate
   - Confirm cost/lead time updates flow back to quote
   - Validate vendor selection and communication

4. **Order Conversion**
   - Convert approved estimate to Sales Order
   - Verify PO creation to custom manufacturer
   - Test fulfillment workflow for custom items

5. **Reporting and Visibility**
   - Custom quote dashboard for sales team
   - Design team workload view
   - Sourcing status visibility

---

## Open Questions Summary

1. How are custom color/design specifications captured on estimates?
2. How is the design team notified of new custom quotes?
3. Where are design mockups and renderings stored?
4. Should Sourcing Tracker have a field to link to Estimate records?
5. How are custom specifications communicated to vendors?
6. What is the customer approval workflow for quotes?
7. Are custom frames drop-shipped or received into inventory?
8. What are the payment terms for custom wholesale orders?
9. Should design specifications be a separate custom record or just fields?
10. Are there external systems for design management?

---

## Next Steps

1. **Discovery Session**: Schedule follow-up with stakeholders to clarify open questions
   - Sales team (wholesale segment)
   - Design/product development team
   - Purchasing/sourcing team

2. **Process Mapping Workshop**: Detailed walkthrough of current state and desired future state

3. **Configuration Planning**: Once requirements confirmed, create detailed configuration plan for:
   - Estimate customizations
   - Design workflow automation
   - Sourcing Tracker enhancements
   - Reporting requirements

4. **Integration with Existing Plans**: Update Order to Cash and Vendor Sourcing configuration plans

---

## Changelog

| Version | Date       | Author          | Changes                                    |
|---------|------------|-----------------|--------------------------------------------|
| 0.1.0   | 2026-01-30 | Discovery Notes | Initial draft from discovery conversation  |

---

*This document is part of the SunStyle Retail Customer Knowledgebase.*
