# Solution Catalog Schema

JSON schema for NetSuite solution catalog entries.

## Required Fields

### name
- **Type**: string
- **Description**: Solution name (marketing-friendly)
- **Example**: "Advanced Revenue Recognition", "Warehouse Management Pro"

### description
- **Type**: string
- **Description**: 2-3 sentence marketing description highlighting business value
- **Tips**: Lead with benefits, avoid jargon, focus on pain points solved
- **Example**: "Comprehensive revenue recognition solution with ASC 606 compliance. Automates complex revenue scenarios including multi-element arrangements, percentage of completion, and subscription-based models."

### uses
- **Type**: array of strings
- **Description**: Key features and capabilities
- **Count**: 4-8 items
- **Format**: Active voice, user-facing benefits
- **Examples**:
  - "ASC 606 Compliance"
  - "Multi-Element Arrangements"
  - "Automated Journal Entries"
  - "Revenue Forecasting Dashboard"

### constraints
- **Type**: array of objects
- **Description**: Technical requirements or limitations
- **Properties**:
  - `type` (string): Constraint category
  - `value` (string): Constraint details
- **Examples**:
  ```json
  [
    {"type": "netsuite_version", "value": "2024.1+"},
    {"type": "edition", "value": "OneWorld"},
    {"type": "feature", "value": "Advanced Revenue Management"}
  ]
  ```

### industry
- **Type**: array of strings
- **Description**: Target industries (1-4 recommended)
- **Valid Values**:
  - "Construction"
  - "Energy"
  - "Retail"
  - "Nonprofit"
  - "Healthcare"
  - "Manufacturing"
  - "Education"
  - "Software" (use for SaaS companies)
  - "Professional Services"
  - "Wholesale Distribution"

### solution_type
- **Type**: string
- **Description**: Primary solution category
- **Common Values**:
  - "Revenue Management"
  - "Inventory & Warehouse"
  - "Financial Management"
  - "Sales & CRM"
  - "Professional Services"
  - "Supply Chain"
  - "Procurement"
  - "Manufacturing & Production"
  - "Compliance & Reporting"
  - "Workflow Automation"

### manager
- **Type**: string
- **Description**: Product owner or responsible team
- **Examples**: "NetSuite Professional Services", "Internal IT", "Partner Name"

### documents
- **Type**: array of URIs
- **Description**: Links to documentation
- **Examples**:
  - "https://docs.netsuite.com/solution-name"
  - "https://github.com/org/repo/wiki"
  - "https://help.example.com/solution"

## Optional Fields

### git_repo_link
- **Type**: string (URI) or null
- **Description**: Git repository URL
- **Example**: "https://github.com/org/netsuite-revenue-recognition"

### depends_on
- **Type**: array of strings
- **Description**: Dependencies on other solutions or bundles
- **Examples**:
  - "Advanced Financials"
  - "SuiteAnalytics"
  - "Multi-Book Accounting"

## Complete Example

```json
{
  "name": "Advanced Revenue Recognition",
  "description": "Comprehensive revenue recognition solution with ASC 606 compliance. Automates complex revenue scenarios including multi-element arrangements, percentage of completion, and subscription-based models.",
  "uses": [
    "ASC 606 Compliance",
    "Percentage of Completion",
    "Automated Journal Entries",
    "Multi-Element Arrangements",
    "Subscription Revenue Models",
    "Revenue Forecasting Dashboard"
  ],
  "constraints": [
    {"type": "netsuite_version", "value": "2024.1+"},
    {"type": "feature", "value": "Advanced Revenue Management"}
  ],
  "git_repo_link": "https://github.com/example/revenue-recognition",
  "industry": [
    "Software",
    "Professional Services",
    "SaaS"
  ],
  "depends_on": [
    "Advanced Financials",
    "SuiteAnalytics"
  ],
  "solution_type": "Revenue Management",
  "manager": "NetSuite Professional Services",
  "documents": [
    "https://docs.netsuite.com/revenue-recognition"
  ]
}
```

## Field Generation Guidelines

### Inferring from SDF Projects

**name**:
- Look for project name in manifest.xml or project.json
- Extract from script names (remove prefixes like "customscript_")
- Clean up underscores, add title case

**description**:
- Combine XML `<description>` tags from main scripts
- Identify key workflow patterns in code
- Translate technical details into business benefits

**uses**:
- Extract from script descriptions
- Identify features from custom records (approval workflows, etc.)
- Note UI enhancements (buttons, forms, portlets)
- List integration points (RESTlets, external APIs)

**solution_type**:
- Match record types and modules to categories
- Revenue: transaction, revenuerecognition modules
- Inventory: item, binnumber, inventorytransfer records
- Financial: journalentry, customsegment records

**industry**:
- Look for industry-specific terminology in comments
- Construction: job, project, WIP
- Manufacturing: workorder, assembly, BOM
- Retail: store, channel, SKU, POS
- Healthcare: patient, claim, provider

**constraints**:
- Check manifest.xml for required features
- Note SuiteScript version (2.0, 2.1)
- Check for OneWorld-specific code (subsidiaries, etc.)

**depends_on**:
- Parse manifest.xml `<dependencies>` section
- Note references to bundle IDs or other solutions
