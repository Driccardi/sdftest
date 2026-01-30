# Discovery Notes: Sunglass Sourcing Tracker
**Client:** Coastal Shades Inc.
**Consultant:** M. Rivera
**Date:** January 28, 2026
**Project Code:** csi

---

## Background

Met with Sarah (Purchasing Manager) and Tom (Operations Director) to discuss their vendor qualification and product sourcing workflow. They're currently tracking everything in spreadsheets and email threads — want to move this into NetSuite to tie sourcing history to actual POs and inventory.

## Current Pain Points

- No visibility into which vendors have been contacted for which styles
- Duplicate outreach — buyers contact same vendor for same model without knowing someone already did
- No record of quoted prices, MOQs, or lead times until a PO is cut
- Can't report on "time to source" or vendor responsiveness

## Requirements: Sourcing Tracker Record

Need a custom record that captures each unique **Vendor + Item + Model** sourcing attempt. One record per combination — if we go back to the same vendor for the same item/model later, we update the existing record or create a new "round" (they're okay with new records per sourcing round for now, revisit later).

### Key Fields

| Field | Type | Notes |
|-------|------|-------|
| Vendor | List/Record (Vendor) | Required. Link to vendor record. |
| Item | List/Record (Item) | Required. The inventory item being sourced. |
| Model/Style Code | Free text | Vendor's model number — not always same as our SKU. Max 50 chars. |
| Sourcing Status | Dropdown | Values: Contacted, Awaiting Quote, Quote Received, Negotiating, Approved, Rejected, On Hold |
| Initial Contact Date | Date | When we first reached out for this item |
| Quote Received Date | Date | When vendor responded with pricing |
| Quoted Unit Cost | Currency | Vendor's quoted price per unit (USD) |
| MOQ | Integer | Minimum order quantity |
| Lead Time (Days) | Integer | Quoted lead time in calendar days |
| Target Cost | Currency | Our target/budget price — used to compare against quoted |
| Assigned Buyer | List/Record (Employee) | Who owns this sourcing effort |
| Notes | Long text | Free-form notes, email snippets, conversation summaries |
| Attachment folder | File? | They want to attach quote PDFs — not sure how to handle yet, maybe just a link field for now |

### Calculated/Display Fields (nice to have)

- **Cost Variance** — (Quoted - Target) / Target as percentage. Could be formula field or just calculated in a saved search. Low priority.
- **Days to Quote** — Quote Received Date minus Initial Contact Date. Same, could be search.

### Access

- Purchasing team needs full edit
- Sales can view only (they want to see what's in the pipeline)
- Executives — just reports, don't need record access

### Reporting

Sarah wants a saved search / dashboard showing:
1. All open sourcing requests by status
2. Vendor response time (avg days to quote)
3. Cost variance by vendor (are some vendors always over target?)

Tom mentioned wanting to see this on the Vendor record somehow — like a related records tab or subtab. Not sure if that's custom record linking or a sublist. Need to figure out.

---

## Next Steps

1. Build the custom record type with fields above
2. Create the status list (Sourcing Status values)
3. Set up roles/permissions
4. Circle back on the "show on vendor record" piece — might need a suitelet or just a saved search link

## Open Questions

- Do they want to track multiple quotes per sourcing record? (e.g., vendor revises price) — Sarah said no for now, just overwrite with latest quote
- The attachment thing — parking lot for phase 2
- Should Model/Style Code be a custom list instead of free text? They said no, too many one-off styles

---

**/sdf-build** — Start with the custom record and the sourcing status list. Fields per above. Project is `csi`.