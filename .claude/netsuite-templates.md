# NetSuite Configuration Plan Templates

This document contains templates for phase files and tracking documents.

---

## Phase File Template

Each phase markdown file should follow this structure:

```markdown
# {Phase Title}

**Area:** {Process Area or Module}  
**Phase:** {X.Y}  
**Prerequisites:** {List phases that must complete first, or "None"}  
**Estimated Effort:** {S/M/L/XL}  
**Industry Considerations:** {Any industry-specific notes, or "None"}

## Overview

{Brief description of what this phase accomplishes and why it matters}

## Source Requirements

{Reference to specific requirements from the CKB}
- **REQ-001:** {requirement text} *(Source: BRD section 3.2)*
- **REQ-002:** {requirement text} *(Source: Process flow diagram)*

## Configuration Steps

### 1. {Step Name}
- **Path:** Setup > {menu path}
- **Action:** {what to configure}
- **Values/Settings:**
  | Field | Value | Notes |
  |-------|-------|-------|
  | {field} | {value} | {why} |

### 2. {Step Name}
...

## Custom Objects

### Custom Lists
| List ID | Name | Values | Notes |
|---------|------|--------|-------|
| custlist_example | Example List | Value1, Value2, Value3 | Purpose of this list |

### Custom Fields
| Field ID | Label | Type | Applies To | List (if select) | Notes |
|----------|-------|------|------------|------------------|-------|
| custentity_example | Example Field | List/Record | Customer | custlist_example | Required for X |

### Custom Records
| Record ID | Name | Purpose | Key Fields |
|-----------|------|---------|------------|
| customrecord_example | Example Record | Track X | field1, field2, field3 |

### Workflows
| Workflow ID | Name | Trigger | Base Record | Purpose |
|-------------|------|---------|-------------|---------|
| customworkflow_example | Example Workflow | After Submit | Sales Order | Approval routing |

### Scripts
| Script Type | Script ID | Name | Deployment | Purpose |
|-------------|-----------|------|------------|---------|
| User Event | customscript_example | Example UE | Sales Order | Validate X before save |

## Forms

| Form Name | Record Type | Purpose | Key Customizations |
|-----------|-------------|---------|-------------------|
| Custom Sales Order | Sales Order | B2B Orders | Added custom fields, removed unused |

## Saved Searches

| Search ID | Name | Record Type | Purpose | Key Criteria |
|-----------|------|-------------|---------|--------------|
| customsearch_example | Example Search | Transaction | Dashboard KPI | Status = Open, Type = Sales Order |

## Testing Checklist

- [ ] {Test scenario 1 - happy path}
- [ ] {Test scenario 2 - alternate flow}
- [ ] {Negative test / edge case}
- [ ] {Permission/role test}

## Open Items

- {Any items specific to this phase needing resolution}

## Notes & Recommendations

{Additional context, gotchas, industry-specific recommendations, or best practices}
```

---

## Tracking Document Templates

These templates go in the `Configuration-Plan/_Tracking/` directory.

### assumptions.md

```markdown
# Configuration Assumptions

Assumptions made during planning that require validation.

## Status Legend
- ⏳ Pending - Awaiting confirmation
- ✅ Confirmed - Validated with stakeholder
- ❌ Invalidated - Assumption was wrong, plan updated
- 🔄 Changed - Original assumption modified

## Assumptions Log

| ID | Area | Assumption | Rationale | Impact if Wrong | Status | Resolution |
|----|------|------------|-----------|-----------------|--------|------------|
| A001 | Foundation | Fiscal year is calendar year (Jan-Dec) | Not specified in CKB | GL periods, all reporting affected | ⏳ Pending | |
| A002 | Foundation | SuiteTax will be used | Default per planning guidelines | Tax configuration approach changes | ⏳ Pending | |
| A003 | Foundation | OneWorld with single operating subsidiary | CKB mentions one legal entity | Multi-sub config not needed | ⏳ Pending | |
| A004 | Industry | Automotive model supersession tracking needed | Industry standard practice | Custom field design impacted | ⏳ Pending | |

## Adding New Assumptions

When adding assumptions:
1. Assign next sequential ID (A001, A002, etc.)
2. Specify the configuration area affected
3. State the assumption clearly
4. Document why you made this assumption
5. Describe impact if the assumption is wrong
6. Set initial status to ⏳ Pending
```

### gaps.md

```markdown
# Configuration Gaps

Requirements that cannot be fully addressed with standard configuration or supported customization.

## Severity Legend
- 🔴 High - Core business process blocked or significantly impaired
- 🟡 Medium - Workaround exists but impacts efficiency or user experience
- 🟢 Low - Nice-to-have functionality, minimal business impact

## Status Legend
- Open - No resolution identified
- Workaround - Temporary solution in place
- Accepted - Business accepted the limitation
- Resolved - Solution found (update notes)

## Gaps Log

| ID | Area | Requirement Ref | Gap Description | Potential Workarounds | Severity | Status | Notes |
|----|------|-----------------|-----------------|----------------------|----------|--------|-------|
| G001 | O2C | REQ-142 | Real-time ATP visibility across 3PL warehouses | 1) Scheduled sync every 15 min 2) Custom Suitelet for on-demand check 3) Integration middleware | 🔴 High | Open | Requires 3PL API access |
| G002 | P2P | REQ-087 | Vendor portal for bid submission | 1) Email-based process 2) Third-party vendor portal SuiteApp 3) Custom Suitelet portal | 🟡 Medium | Open | Evaluate SuiteApp options |

## Adding New Gaps

When documenting gaps:
1. Assign next sequential ID (G001, G002, etc.)
2. Reference the specific requirement from CKB
3. Clearly describe what cannot be achieved
4. List potential workarounds with trade-offs
5. Assess business impact severity
6. Document any additional context
```

### ambiguities.md

```markdown
# Ambiguous Requirements

Requirements that need clarification before configuration can proceed.

## Blocking Status
- 🔴 Blocking - Cannot proceed with configuration until resolved
- 🟡 Non-blocking - Can proceed with assumption, but need confirmation
- ✅ Resolved - Clarification received, document resolution

## Ambiguities Log

| ID | Area | Requirement Ref | Ambiguity Description | Possible Interpretations | Blocking | Status | Resolution |
|----|------|-----------------|----------------------|-------------------------|----------|--------|------------|
| AMB001 | P2P | BRD-042 | "Approval required for large purchases" - threshold not defined | A) $1,000 B) $5,000 C) $10,000 D) Role-based matrix | 🔴 Blocking | Open | |
| AMB002 | O2C | Process Flow v2 | Credit check timing unclear | A) At order entry B) At fulfillment C) Both | 🟡 Non-blocking | Open | Assuming (A) for now |
| AMB003 | R2R | BRD-018 | "Standard reports" not enumerated | A) NetSuite OOTB reports B) Custom reports per department C) Both | 🟡 Non-blocking | Open | Planning for (C) |

## Adding New Ambiguities

When documenting ambiguities:
1. Assign next sequential ID (AMB001, AMB002, etc.)
2. Reference the specific requirement or document
3. Describe exactly what is unclear
4. List reasonable interpretations
5. Assess if this blocks configuration progress
6. If non-blocking, note what assumption you're proceeding with
```

### follow-up-questions.md

```markdown
# Follow-Up Questions

Questions requiring customer or project team input, organized by priority.

## Priority Definitions
- 🔴 **Critical** - Blocks configuration; cannot proceed without answer
- 🟡 **Important** - Should resolve before build phase; proceeding with assumptions
- 🟢 **Nice to Have** - Can resolve during UAT or post-go-live

## Status
- Open - Question not yet answered
- Submitted - Sent to stakeholder, awaiting response
- Answered - Response received (document in Resolution)

---

## 🔴 Critical (Blocking Configuration)

| ID | Area | Question | Context | Stakeholder | Status | Resolution |
|----|------|----------|---------|-------------|--------|------------|
| FUQ-001 | P2P | What are the approval thresholds for purchase orders by role? | BRD-042 mentions "large purchases" without defining | Finance Lead | Open | |
| FUQ-002 | Foundation | Confirm fiscal year start month | Impacts period setup, all financial reporting | Controller | Open | |
| FUQ-003 | Foundation | List all legal entities / subsidiaries to be configured | Impacts entire account structure | Project Sponsor | Open | |

---

## 🟡 Important (Should Resolve Before Build)

| ID | Area | Question | Context | Stakeholder | Status | Resolution |
|----|------|----------|---------|-------------|--------|------------|
| FUQ-010 | O2C | Priority order for shipping carrier integrations? | Multiple carriers mentioned: UPS, FedEx, USPS | Operations Lead | Open | |
| FUQ-011 | Reporting | Who are the primary dashboard consumers and what KPIs matter most? | Need to scope dashboard build | Department Heads | Open | |
| FUQ-012 | P2P | Is three-way match required for all POs or only above threshold? | Impacts AP workflow design | AP Manager | Open | |

---

## 🟢 Nice to Have (Can Resolve During UAT)

| ID | Area | Question | Context | Stakeholder | Status | Resolution |
|----|------|----------|---------|-------------|--------|------------|
| FUQ-020 | Templates | Brand guidelines for PDF templates (colors, fonts, logo placement)? | Can use defaults initially | Marketing | Open | |
| FUQ-021 | Email | Marketing email sender addresses and reply-to preferences? | Can configure later | Marketing | Open | |
| FUQ-022 | Security | Are there IP restriction requirements for API access? | Can add post-go-live | IT Security | Open | |

---

## Adding New Questions

When adding questions:
1. Assign next sequential ID within priority section
2. Specify configuration area affected
3. Write clear, specific question
4. Provide context (why are you asking, what does it impact)
5. Identify likely stakeholder to answer
6. Set status to Open

## Submitting Questions

When ready to submit questions to stakeholders:
1. Group questions by stakeholder
2. Provide context for each question
3. Indicate priority/urgency
4. Update status to "Submitted"
5. Track response timeline
```

---

## configuration-summary.md Template

```markdown
# Configuration Summary

**Generated:** {date}  
**CKB Source:** {path to customer knowledgebase}  
**Industry:** {identified industry}  
**Prepared By:** NetSuite Configuration Planner

---

## Executive Overview

{2-3 paragraph summary of the implementation scope, key business processes, and overall approach}

---

## Industry Context

**Industry:** {industry}  
**Business Model:** {revenue model, key operations}  
**Key Considerations:** {industry-specific factors applied to this plan}

---

## Scope Summary

### In Scope

| Category | Count | Details |
|----------|-------|---------|
| Process Areas | {n} | {list} |
| Feature Modules | {n} | {list} |
| SuiteApps | {n} | {list} |
| Integrations | {n} | {list} |
| Custom Development | {n phases} | {summary} |

### Out of Scope
- {item}
- {item}

### Deferred / Future Phase
- {item}
- {item}

---

## Recommended Implementation Sequence

{Narrative explanation of why this sequence is recommended}

### Phase 1: Foundation (Weeks 1-2)
- 010.010 - Chart of Accounts
- 010.020 - Subsidiary Structure
- ...

### Phase 2: Master Data (Weeks 3-4)
- ...

### Phase 3: Core Transactions (Weeks 5-8)
- ...

{Continue with phases...}

---

## Critical Path Dependencies

```
[Foundation] 
    └── [Master Data Structure]
            ├── [Procure to Pay]
            ├── [Order to Cash]
            └── [Record to Report]
                    └── [Reporting & Analytics]
```

{Narrative explanation of key dependencies}

---

## Risk Summary

### Gaps ({n} identified)
| Severity | Count | Key Items |
|----------|-------|-----------|
| 🔴 High | {n} | {summary} |
| 🟡 Medium | {n} | {summary} |
| 🟢 Low | {n} | {summary} |

### Assumptions ({n} pending confirmation)
{Summary of highest-impact assumptions}

### Blocking Items ({n} items)
{List of items that must be resolved before build can proceed}

---

## Effort Estimation

| Area | Phases | Effort | Notes |
|------|--------|--------|-------|
| Foundation | {n} | {S/M/L} | |
| Process Areas | {n} | {S/M/L} | |
| Modules | {n} | {S/M/L} | |
| Integrations | {n} | {S/M/L} | |
| Customizations | {n} | {S/M/L} | |
| **Total** | **{n}** | **{estimate}** | |

---

## Immediate Next Steps

1. {action item}
2. {action item}
3. {action item}

---

## Appendix: Document Inventory

| Document | Location | Status |
|----------|----------|--------|
| {CKB doc 1} | {path} | Reviewed |
| {CKB doc 2} | {path} | Reviewed |
```
