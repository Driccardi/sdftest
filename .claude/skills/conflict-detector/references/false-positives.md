# False Positive Handling

## Common False Positives

### 1. Temporal Updates (Most Common)

**Pattern**: Newer document updates or supersedes older decision

**Indicators**:
- Significant date gap between documents (e.g., 2+ months)
- Keywords: "updated", "revised", "changed", "new decision"
- Document titles: "Updated Requirements", "Revised Spec"
- Meeting notes with "decision changed to..."

**Examples**:

```text
NOT a conflict:
- Doc A (2025-10-15): "Migrate all 10 years of transaction history"
- Doc B (2026-01-08): "Decision revised: only migrate 2 years per agreed scope"
  → This is an update, not a conflict

NOT a conflict:
- Doc A (2025-11-20): "Will retain existing Clover POS"
- Doc B (2026-01-15): "Updated: Onboarding NetSuite POS in Phase 2"
  → Clear indication of decision change
```

**Validation checks**:
1. Compare document dates - is there a significant gap?
2. Check newer document for update language
3. Look for decision justification in newer doc
4. Check meeting notes for decision change discussion

**Handling**: Flag as "Temporal Update" not conflict. Note in report:
```markdown
**Note**: This appears to be a decision update. Document B (newer) supersedes Document A.
Recommend: Update Document A with deprecation notice or remove outdated content.
```

### 2. Different Contexts

**Pattern**: Same entity in different contexts, locations, or subsidiaries

**Indicators**:
- Location qualifiers: "Warehouse A" vs. "Warehouse B"
- Subsidiary names: "US entity" vs. "UK entity"
- Department qualifiers: "Sales" vs. "Accounting"
- Conditional contexts: "for retail" vs. "for wholesale"

**Examples**:

```text
NOT a conflict:
- Doc A: "US subsidiary uses FIFO inventory valuation"
- Doc B: "UK subsidiary uses average cost inventory valuation"
  → Different subsidiaries, both valid

NOT a conflict:
- Doc A: "Sales orders under $1,000 require no approval"
- Doc B: "International sales orders require manager approval regardless of amount"
  → Different order types, both valid

NOT a conflict:
- Doc A: "Retail customers pay via credit card"
- Doc B: "Wholesale customers pay via invoice with net 30 terms"
  → Different customer types, both valid
```

**Validation checks**:
1. Look for entity qualifiers (location, subsidiary, department)
2. Check for conditional language ("if", "when", "for")
3. Verify statements are about same specific entity
4. Check document scope (e.g., "US Operations" vs. "Global")

**Handling**: Dismiss as different contexts. Note in report:
```markdown
**Note**: Statements refer to different contexts (US vs UK subsidiary).
No conflict detected.
```

### 3. Conditional Logic

**Pattern**: Multiple valid options depending on conditions

**Indicators**:
- If/then language: "If X, then A; if Y, then B"
- Scenario planning: "Option 1:", "Option 2:"
- Dependent logic: "Depending on...", "Based on..."
- Alternative approaches: "Approach A (preferred):", "Approach B (fallback):"

**Examples**:

```text
NOT a conflict:
- Doc A: "If customer has credit terms, invoice payment method"
- Doc B: "If customer is retail, credit card payment required"
  → Conditional logic, both valid

NOT a conflict:
- Doc A: "Option 1: Use ShipStation for external shipping"
- Doc B: "Option 2: Use Ship Central for integrated shipping"
  → Options, not decisions (unless "selected" appears)

NOT a conflict:
- Doc A: "Preferred: SuiteScript 2.1 for all new customizations"
- Doc B: "Fallback: SuiteScript 1.0 for legacy maintenance only"
  → Complementary, not contradictory
```

**Validation checks**:
1. Look for conditional keywords
2. Check for option/scenario labels
3. Verify if one option was selected/approved
4. Look for "preferred", "fallback", "alternative" language

**Handling**: Dismiss as conditional logic. Note in report:
```markdown
**Note**: Statements represent conditional logic or options.
If no selection has been made, recommend documenting final decision.
```

### 4. Example Values vs. Requirements

**Pattern**: Example values mistaken for actual requirements

**Indicators**:
- Keywords: "e.g.", "for example", "such as", "like"
- Illustrative context: "Sample:", "Example:"
- Non-specific language: "might be", "could be", "typically"

**Examples**:

```text
NOT a conflict:
- Doc A: "Approval threshold is $10,000"
- Doc B: "For example, if threshold is $5,000, manager approves..."
  → Doc B is an example, not a requirement

NOT a conflict:
- Doc A: "Customer fields: Name, Email, Phone"
- Doc B: "Additional fields might include: Fax, Mobile, Title"
  → Doc B suggests possibilities, not requirements
```

**Validation checks**:
1. Look for example indicators
2. Check for definitive language in one vs. illustrative in other
3. Verify statement assertiveness ("will" vs. "might")

**Handling**: Dismiss as example vs. requirement. Note:
```markdown
**Note**: One statement is an example/illustration, not a requirement.
No conflict detected.
```

### 5. Different Levels of Abstraction

**Pattern**: General statement vs. specific implementation detail

**Indicators**:
- One statement is high-level, other is detailed
- Parent/child relationship between concepts
- General principle vs. specific application

**Examples**:

```text
NOT a conflict:
- Doc A: "All transactions require audit trail"
- Doc B: "Sales orders store Created By, Modified By, and Timestamp"
  → Doc B implements Doc A's requirement

NOT a conflict:
- Doc A: "Integrate with shipping system"
- Doc B: "ShipStation API integration using RESTlet"
  → Doc B specifies Doc A's general requirement
```

**Validation checks**:
1. Determine if one statement is subset/implementation of other
2. Check if both can be true simultaneously
3. Verify hierarchical relationship

**Handling**: Dismiss as different abstraction levels. Note:
```markdown
**Note**: Statements are at different abstraction levels.
Statement B implements/specifies Statement A.
```

### 6. Scope Differences

**Pattern**: Statements apply to different project phases or scopes

**Indicators**:
- Phase labels: "Phase 1", "Phase 2", "MVP", "Future"
- Scope labels: "Initial", "Full", "Basic", "Advanced"
- Timeline: "Go-live" vs. "Post-implementation"
- Priority: "Must have" vs. "Nice to have"

**Examples**:

```text
NOT a conflict:
- Doc A: "Phase 1 includes basic inventory management"
- Doc B: "Phase 2 adds advanced inventory with lot tracking"
  → Sequential implementation, not conflict

NOT a conflict:
- Doc A: "MVP includes manual approval workflow"
- Doc B: "Future enhancement: automated approval rules engine"
  → Phased approach, both valid
```

**Validation checks**:
1. Look for phase/scope qualifiers
2. Check if statements describe timeline progression
3. Verify both are planned, just at different times

**Handling**: Dismiss as different phases. Note:
```markdown
**Note**: Statements refer to different implementation phases.
Recommend: Ensure phase timeline is clearly documented.
```

## Validation Workflow

For each potential conflict:

```
1. Check dates
   ├─ Significant gap? → Check for update language → Temporal update?
   └─ Similar dates? → Continue to #2

2. Check contexts
   ├─ Different entities/locations? → Different context?
   └─ Same entity? → Continue to #3

3. Check conditional logic
   ├─ If/then statements? → Conditional logic?
   └─ Definitive statements? → Continue to #4

4. Check for examples
   ├─ Example indicators present? → Example vs. requirement?
   └─ Both definitive? → Continue to #5

5. Check abstraction levels
   ├─ One general, one specific? → Different abstraction?
   └─ Same level? → Continue to #6

6. Check scope/phase
   ├─ Different phases/scopes? → Phased approach?
   └─ Same phase? → LIKELY TRUE CONFLICT

7. Perform semantic validation
   └─ Read full context of both statements
   └─ Can both be true simultaneously?
      ├─ Yes → False positive, document reason
      └─ No → True conflict, report it
```

## Language Indicators Reference

### Update Language (Temporal)
- "updated", "revised", "changed", "new decision"
- "supersedes", "replaces previous", "correction"
- "as of [date]", "effective [date]"

### Context Qualifiers (Different Contexts)
- Location: "US", "UK", "Warehouse A", "Store 1"
- Entity: "Subsidiary X", "Division Y"
- Type: "retail", "wholesale", "B2B", "B2C"
- Department: "Sales", "Accounting", "Operations"

### Conditional Indicators (Conditional Logic)
- "if", "when", "depending on", "based on"
- "option", "alternative", "approach"
- "preferred", "fallback", "backup"
- "scenario", "case"

### Example Indicators (Examples)
- "e.g.", "for example", "such as", "like"
- "sample", "illustration", "typical"
- "might", "could", "may", "possibly"

### Abstraction Indicators (Different Levels)
- General: "will integrate", "requires approval"
- Specific: "RESTlet integration", "manager approval at $5K"

### Scope Indicators (Different Phases)
- "Phase 1/2/3", "MVP", "V1/V2"
- "initial", "future", "enhancement"
- "must have", "should have", "nice to have"
- "go-live", "post-implementation", "future state"

## Edge Cases

### Partial Conflicts

Sometimes statements partially conflict:

```text
- Doc A: "Migrate customers, vendors, and inventory items"
- Doc B: "Migrate customers and vendors only; inventory items entered manually"
```

**Handling**: This IS a conflict (inventory items). Report as:
```markdown
**Type**: Partial Conflict
**Conflicting Element**: Inventory items migration approach
```

### Implicit Conflicts

Conflicts not explicitly stated:

```text
- Doc A: "Use ShipStation for all shipping"
- Doc B: "Ship Central module will be enabled"
```

**Handling**: If both claim to handle "all shipping", this IS a conflict. Report as:
```markdown
**Type**: Implicit Conflict
**Issue**: Both systems claim same functional territory
```

### Soft Conflicts

Different recommendations/preferences:

```text
- Doc A: "Recommend using workflows for approvals"
- Doc B: "Prefer SuiteScript for approval logic flexibility"
```

**Handling**: This is a preference conflict, lower severity. Report as:
```markdown
**Severity**: 🟠 Medium
**Type**: Design Preference Conflict
**Recommendation**: Align team on preferred approach
```
