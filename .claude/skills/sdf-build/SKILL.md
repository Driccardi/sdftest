---
name: sdf-build
description: Build NetSuite SuiteCloud Development Framework (SDF) XML object files from natural language descriptions. Handles custom fields, custom lists, custom records, workflows, and other non-script SDF objects.
version: 1.0.0
author: ns-dev
tags: [netsuite, sdf, xml, customization]
---

# SDF Build Skill

Build NetSuite SuiteCloud Development Framework (SDF) XML object files from natural language descriptions.

## Usage

```
/sdf-build <description of the object to create>
```

## Examples

```
/sdf-build Create a custom field called "Vendor Memo" - large text field on the vendor record
/sdf-build Create a custom list for order priority levels: Low, Medium, High, Critical
/sdf-build Build a custom record type for tracking equipment maintenance
```

## Scope

**In scope:** Custom fields, custom lists, custom records, workflows, forms, and other non-script SDF objects.

**Out of scope:** Script files (client scripts, user event scripts, scheduled scripts, suitelets, restlets, map/reduce scripts, workflow action scripts). Delegate script creation to `/sdf-createscript`.

If generating an object that requires a script (e.g., a workflow action that calls a script), note the dependency and inform the user or parent agent that the script needs to be created via `/sdf-createscript`.

## Workflow

### 1. Gather Requirements
- Parse the user's request to identify the object type and configuration
- If ambiguous, ask clarifying questions:
  - What record type does this apply to?
  - What is the field type (text, select, checkbox, etc.)?
  - What should the script ID be?
- If a requirements document is referenced, read it to extract specifications

### 2. Determine Target Project
- List available projects: `ls /sdf/`
- **Auto-select** if only one project exists
- **Infer from context** if the user mentions a project name or it's clear from prior conversation
- **Ask** only if multiple projects exist and context doesn't clarify

### 3. Determine Object Type
- Discover available schemas: `ls /skills/sdf-build/references/*.xsd`
- Match user intent to the appropriate SDF object type based on:
  - Keywords in their request (e.g., "field" → custom field types, "list" → `customlist`)
  - Target record context (e.g., "on vendor" → `entitycustomfield`, "on sales order line" → `transactioncolumncustomfield`)
- If multiple schemas could apply, ask the user to clarify
- If no schema matches, report what's available and ask for guidance

### 4. Read XSD Schema
- Load the relevant XSD from `/skills/sdf-build/references/<objecttype>.xsd`
- Parse required vs optional elements
- Identify valid enumeration values for constrained fields
- Note field length limits and pattern restrictions
- Understand nested structures and dependencies

### 5. Validate Sufficiency
Before generating XML, confirm you have all required information per the XSD.

Common requirements by object type:

**Custom Fields:**
- Field label/name
- Field type (TEXT, SELECT, CHECKBOX, DATE, etc.)
- Target record type(s) (appliesto)
- Project code for ID generation

**Custom Lists:**
- List name
- List values with sequence order
- Whether values can be edited/added by users

**Custom Records:**
- Record name
- Field definitions
- Access permissions

If insufficient, prompt for the missing required information.

### 6. Generate XML and Dependencies
- Create the primary XML file following XSD structure
- Generate any required dependent objects:
  - SELECT fields → create `customlist` XML first
  - Custom records → generate associated custom fields
- If a script dependency is needed, do NOT create the script — instead note that `/sdf-createscript` must be invoked

### 7. Validate XML
- Run validation using the included tool:
  ```bash
  node skills/sdf-build/validate-sdf-xml.js <xml-file> [--xsd <schema-name>]
  ```
- The tool auto-detects the schema from the XML root element, or specify explicitly with `--xsd`
- If validation fails, parse the JSON output for error details (line numbers, messages)
- Fix errors and re-validate until successful
- Report any issues that cannot be auto-resolved

### 8. Save Files
- Save to `/sdf/[project]/src/Objects/`
- Optionally organize into subdirectories based on existing project structure:
  - Check if subdirectories already exist (e.g., `CustomFields/`, `CustomLists/`)
  - Follow existing conventions if present
  - Otherwise, save directly to `Objects/` for small projects

## ID Naming Convention

All script IDs follow this pattern:

```
[type]_ns_[project code]_[descriptor]
```

**Components:**
- `[type]` — Object type prefix (e.g., `custentity`, `custbody`, `custcol`, `custitem`, `customlist`, `customrecord`)
- `ns` — Namespace identifier
- `[project code]` — Short project identifier (ask user if not known)
- `[descriptor]` — Brief descriptive name, lowercase, underscores for spaces

**Examples:**
- `custentity_ns_acme_vendor_memo`
- `customlist_ns_acme_order_priority`
- `custbody_ns_proj1_approval_status`
- `customrecord_ns_maint_equipment_log`

**Constraints:**
- Maximum 40 characters total
- Lowercase letters, numbers, underscores only
- Must match pattern required by object type

## XML Generation Rules

###Required Documentation Fields
Always populate description and help attributes when available in the schema, even if not explicitly provided by the user.

description — Provide a clear, concise explanation of the object's purpose. If the user didn't specify, infer from context or ask.
help — Write user-facing help text explaining how/when to use the field. This appears in the NetSuite UI when users hover or click help icons.

Do not leave these fields empty or use placeholder text like "TBD" or "Description goes here." Generate meaningful content based on the object's name, type, and purpose.

### Boolean Values
- Use `T` for true, `F` for false

### File Path References
- Format: `[/SuiteScripts/path/to/file.js]`
- Must include brackets and leading slash

### Default Values
- `isinactive`: Default to `F`
- For deployments: `status` defaults to `TESTING`, `isdeployed` to `T`

## Tools

### validate-sdf-xml.js

Location: `skills/sdf-build/validate-sdf-xml.js`

Validates generated XML against XSD schemas.

**CLI Usage:**
```bash
# Auto-detect schema from XML root element
node skills/sdf-build/validate-sdf-xml.js ./path/to/file.xml

# Explicit schema
node skills/sdf-build/validate-sdf-xml.js ./path/to/file.xml --xsd entitycustomfield

# List available schemas
node skills/sdf-build/validate-sdf-xml.js --list
```

**Output:** JSON with validation result
```json
{
  "success": false,
  "schema": "entitycustomfield",
  "error": "XML validation failed",
  "errors": [
    { "message": "Element 'badfield': This element is not expected.", "line": 5, "column": 0 }
  ]
}
```

## Reference Files

XSD schemas are located in `skills/sdf-build/references/`

**Discovery:** Run `ls skills/sdf-build/references/*.xsd` or `node skills/sdf-build/validate-sdf-xml.js --list` to see all available object type schemas. Do not maintain a hardcoded list — discover at runtime.

**Matching:** Match the object type from the user's request to the corresponding `<objecttype>.xsd` file. If uncertain which schema applies, list available options and ask.

## Error Handling

- If XSD file not found for requested object type, report and ask for clarification
- If project directory doesn't exist, offer to create it
- If XML validation fails, report specific element/attribute errors and attempt to fix
- If script dependency is required, report to user/agent that `/sdf-createscript` must be invoked
