---
name: netsuite-solution-cataloger
description: Analyze NetSuite SDF projects and generate comprehensive solution catalog entries with marketing descriptions, technical details, industry mappings, and features. Use when the user asks to: (1) Document a NetSuite SDF project, (2) Create a solution catalog entry from SDF source code, (3) Reverse-engineer NetSuite customizations into product documentation, (4) Generate JSON and Markdown documentation from SDF projects, or (5) Analyze SuiteScript files and object XMLs to infer solution purpose and features.
---

# NetSuite Solution Cataloger

Analyze NetSuite SDF project directories and generate professional solution catalog entries in JSON and Markdown formats.

## Overview

This skill acts as a Product Manager analyzing legacy NetSuite customizations, reverse-engineering the code to create:

- Marketing-friendly descriptions
- Technical documentation (what and how)
- Industry classifications
- Feature lists
- Dependencies
- Solution categorization

## Input Requirements

**SDF Project Directory**: Standard NetSuite SuiteCloud Development Framework project containing:
- `src/FileCabinet/` - SuiteScript files (.js)
- `src/Objects/` - NetSuite object XML files (.xml)
- `src/manifest.xml` - Project manifest
- `project.json` - Project configuration

## Analysis Process

### 1. Discover Project Structure

Scan the SDF project to identify:
- All SuiteScript files (user event, client, scheduled, restlet, suitelet, etc.)
- Custom records, workflows, saved searches
- Custom fields, forms, portlets
- Dependencies between objects

### 2. Extract Technical Details

From XML files in `src/Objects/`, extract:
- **Script metadata**: Names, descriptions, script IDs
- **Record types**: Which records the scripts operate on
- **Execution contexts**: When scripts run (CLIENT, USEREVENT, SCHEDULED, etc.)
- **Deployments**: Roles, employees, execution contexts

From SuiteScript files, analyze:
- Module dependencies (N/record, N/search, N/ui/serverWidget, etc.)
- Key functionality patterns
- Integration points (RESTlet endpoints, external APIs)
- Business logic

### 3. Infer Solution Characteristics

**Solution Type**: Based on patterns found:
- Revenue Management → ASC 606, revenue recognition, billing
- Inventory & Warehouse → Bin management, picking, inventory tracking
- Financial Management → GL, AP/AR, consolidation
- Sales & CRM → Opportunity management, quotes, pipeline
- Professional Services → Project accounting, time tracking, resource management

**Industries**: Map features to relevant industries:
- Construction → Job costing, project tracking, WIP
- Manufacturing → Work orders, BOM, capacity planning
- Retail → POS integration, multi-channel, inventory
- Healthcare → Compliance, patient records, claims
- Professional Services → Billable time, project profitability

**Features**: Extract from code and descriptions:
- Look for key workflows (approval processes, automation)
- Identify user-facing functionality (buttons, forms, portlets)
- Note integration capabilities (APIs, third-party systems)
- List compliance features (ASC 606, GAAP, SOX)

### 4. Generate Output

Create two files:

**JSON Output** (`solution-catalog-entry.json`):
Follow the schema in [references/solution-catalog-schema.md](references/solution-catalog-schema.md)

**Markdown Output** (`solution-documentation.md`):
Use the template in [assets/documentation-template.md](assets/documentation-template.md)

## Workflow

1. **Analyze Structure**
   ```bash
   # Scan project directory
   - Read manifest.xml for project metadata
   - List all Objects/*.xml files
   - List all FileCabinet SuiteScript files
   ```

2. **Parse Objects**
   - Extract descriptions from XML `<description>` tags
   - Identify script types (customscript, customrecord, workflow, etc.)
   - Note record type associations from `<recordtype>` tags

3. **Analyze Scripts**
   - Read each SuiteScript file
   - Identify N/ module dependencies
   - Extract JSDoc comments for functionality descriptions
   - Look for patterns indicating specific features

4. **Classify and Infer**
   - Use [references/solution-patterns.md](references/solution-patterns.md) for pattern matching
   - Use [references/industry-mapping.md](references/industry-mapping.md) for industry inference
   - Use [references/netsuite-objects-reference.md](references/netsuite-objects-reference.md) for object type understanding

5. **Write Marketing Description**
   - Create 2-3 sentence marketing-friendly description
   - Highlight business value and key benefits
   - Avoid technical jargon
   - Make it compelling for decision-makers

6. **Document Features**
   - List 4-8 key features as bullet points
   - Each feature should describe user-facing capability
   - Focus on "what" not "how"
   - Use active language

7. **Generate Output Files**
   - Create JSON following schema
   - Create Markdown documentation
   - Save both files to output directory

## Example Usage

```
User: "Document this SDF project as a solution catalog entry"

1. Point to SDF project directory
2. Scan and analyze all files
3. Infer purpose, industry, features
4. Generate JSON and Markdown outputs
5. Present summary to user
```

## Reference Files

Load these as needed during analysis:

- **[references/solution-catalog-schema.md](references/solution-catalog-schema.md)** - JSON schema structure and field definitions
- **[references/netsuite-objects-reference.md](references/netsuite-objects-reference.md)** - NetSuite object types and their meanings
- **[references/solution-patterns.md](references/solution-patterns.md)** - Common NetSuite solution patterns for classification
- **[references/industry-mapping.md](references/industry-mapping.md)** - Feature-to-industry mapping guidelines

## Output Templates

- **[assets/solution-catalog-template.json](assets/solution-catalog-template.json)** - JSON output template
- **[assets/documentation-template.md](assets/documentation-template.md)** - Markdown documentation template

## Tips for Quality Output

**Marketing Descriptions**:
- Lead with business value, not technical features
- Use industry-specific language when appropriate
- Quantify benefits when possible ("automated", "real-time", "comprehensive")
- Address pain points the solution solves

**Feature Lists**:
- Keep features distinct and non-overlapping
- Order by importance/impact
- Use parallel structure (all start with verbs or all are noun phrases)
- Include both user-facing and technical features

**Industry Selection**:
- Choose 1-4 most relevant industries
- Avoid "all industries" unless truly generic
- Consider vertical-specific features as strong indicators

**Dependencies**:
- List only true dependencies (required bundles/features)
- Don't list standard NetSuite modules
- Include SuiteApp dependencies if found in manifest.xml
