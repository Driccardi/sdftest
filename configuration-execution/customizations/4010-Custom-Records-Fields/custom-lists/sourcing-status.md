# Custom List: Sourcing Status

---
**List Type**: Custom List
**Script ID**: `customlist_sourcing_status`
**Project Code**: csi
**Client**: Coastal Shades Inc.
**Created**: 2026-01-30
**Status**: Ready for Build
**Source**: Discovery notes from M. Rivera, 2026-01-28
**Related**:
  - [Custom Record: Sourcing Tracker](../custom-records/sourcing-tracker.md)
  - [Business Process: Vendor Sourcing](../../customer-knowledgebase/03-functional-processes/vendor-sourcing-process.md)
---

## Purpose

Defines the workflow stages for vendor sourcing efforts. Used by the Sourcing Tracker custom record to track progress from initial contact through final decision.

## List Configuration

- **List Name**: Sourcing Status
- **Script ID**: `customlist_sourcing_status`
- **Is Ordered**: Yes (values represent workflow progression)
- **Include Inactive**: Yes (allow archiving old statuses without breaking data)

## List Values

| Sequence | Name | Internal ID | Description | Active |
|----------|------|-------------|-------------|--------|
| 1 | Contacted | `contacted` | Initial outreach sent, awaiting vendor response | Yes |
| 2 | Awaiting Quote | `awaiting_quote` | Vendor acknowledged request, preparing formal quote | Yes |
| 3 | Quote Received | `quote_received` | Pricing and terms received from vendor | Yes |
| 4 | Negotiating | `negotiating` | In active discussion on pricing or terms | Yes |
| 5 | Approved | `approved` | Vendor selected, ready to issue PO | Yes |
| 6 | Rejected | `rejected` | Vendor not selected due to pricing/terms/capability | Yes |
| 7 | On Hold | `on_hold` | Sourcing paused for business reasons | Yes |

## Workflow Progression

### Typical Flow
```
Contacted → Awaiting Quote → Quote Received → Negotiating → Approved
                                                          → Rejected
                                              → On Hold
```

### Status Definitions

#### 1. Contacted
- **When to Use**: Initial outreach to vendor has been sent
- **Next Steps**: Wait for vendor acknowledgment
- **Expected Duration**: 1-3 days

#### 2. Awaiting Quote
- **When to Use**: Vendor has acknowledged and is preparing quote
- **Next Steps**: Follow up if no response within 5-7 days
- **Expected Duration**: 3-7 days

#### 3. Quote Received
- **When to Use**: Vendor has provided formal pricing and terms
- **Next Steps**: Internal review and comparison against target cost
- **Expected Duration**: 1-2 days for buyer review

#### 4. Negotiating
- **When to Use**: Buyer is actively discussing pricing/terms with vendor
- **Next Steps**: Reach agreement or determine vendor is not suitable
- **Expected Duration**: Variable, typically 3-10 days

#### 5. Approved
- **When to Use**: Vendor selected as supplier for this item
- **Next Steps**: Issue purchase order
- **Terminal Status**: Yes (final positive outcome)

#### 6. Rejected
- **When to Use**: Vendor not selected (pricing too high, terms unacceptable, capacity issues, etc.)
- **Next Steps**: Document reason in Notes field; consider alternative vendors
- **Terminal Status**: Yes (final negative outcome)

#### 7. On Hold
- **When to Use**: Sourcing effort paused (business priority shift, item no longer needed, etc.)
- **Next Steps**: Resume when business conditions change or close out if no longer needed
- **Terminal Status**: Semi-terminal (can be resumed or moved to Rejected)

## Reporting and Analytics

### Key Metrics by Status

- **Contacted + Awaiting Quote**: Active pipeline, not yet quoted
- **Quote Received + Negotiating**: Active evaluation, requires buyer attention
- **Approved**: Success rate metric (Approved / Total)
- **Rejected**: Learn from rejection reasons
- **On Hold**: Monitor for stale requests

### Status Change Tracking

> ⚠️ **Future Enhancement**: Consider workflow history tracking to measure:
> - Average time in each status
> - Status change patterns
> - Bottlenecks in sourcing workflow

## Implementation Notes

### SDF Build Command
```bash
# From project root:
/sdf-build customlist_sourcing_status "custom list with values: Contacted, Awaiting Quote, Quote Received, Negotiating, Approved, Rejected, On Hold. Project code: csi"
```

### Dependencies
- None (this list should be created before the Sourcing Tracker custom record)

### Testing Checklist
- [ ] List appears in dropdown fields
- [ ] All values display correctly
- [ ] Sequence order is maintained
- [ ] Inactive values do not appear in active record dropdowns
- [ ] Values can be selected and saved on Sourcing Tracker records

## Changelog

- **2026-01-30**: Initial specification created from discovery notes (M. Rivera, 2026-01-28)

---

*Last Updated: 2026-01-30*
*Version: 1.0.0*
*Status: Ready for Build*
