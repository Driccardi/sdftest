# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **NetSuite implementation workspace** containing:
- Customer business documentation (Customer Knowledgebase / CKB)
- NetSuite configuration plans
- SuiteCloud Development Framework (SDF) projects with customizations

## Project Structure

```
/customer-knowledgebase/     # CKB - Business requirements and process documentation
  ├── 01-business-overview/
  ├── 02-system-requirements/
  ├── 03-functional-processes/
  ├── 04-integration-landscape/
  ├── 05-technical-architecture/
  ├── 06-operational-procedures/
  ├── 07-compliance-governance/
  └── 08-training-documentation/

/configuration-plan/         # Generated NetSuite configuration plans
  └── Configuration-Plan/
      ├── 010-Record-to-Report/
      ├── _Tracking/           # Assumptions, gaps, ambiguities, follow-up questions
      └── configuration-summary.md

/sdf/                        # SuiteCloud SDF projects
  └── [project-name]/
      ├── src/               # ← All suitecloud commands run from here
      │   ├── Objects/       # Custom fields, lists, records, workflows (XML)
      │   ├── FileCabinet/   # Scripts, templates, files
      │   │   └── SuiteScripts/
      │   ├── deploy.xml
      │   └── manifest.xml
      ├── logs/              # Validation and deployment logs
      └── suitecloud.config.js

/.claude/skills/             # Custom Claude Code skills
  ├── config-planner-v2/     # Generate configuration plans from CKB
  ├── sdf-build/             # Build SDF XML objects from descriptions
  ├── sdf-deploy/            # Validate and deploy SDF projects
  └── tell-me-about/         # Brief on CKB topics
```

## SuiteCloud CLI Commands

**CRITICAL:** All `suitecloud` commands must be run from the `src/` directory of an SDF project.

### Validation
```powershell
cd "sdf/[project-name]/src"
suitecloud project:validate --server
```

### Deploy (with validation)
```powershell
cd "sdf/[project-name]/src"
suitecloud project:deploy --validate
```

### Dry Run (validate against account without deploying)
```powershell
cd "sdf/[project-name]/src"
suitecloud project:deploy --dryrun
```

### List SDF Projects
```powershell
find ./sdf -maxdepth 2 -name "src" -type d | sed 's|/src$||' | sed 's|^\./sdf/||'
```

## Custom Skills

Use these skills for NetSuite-specific workflows:

- `/config-planner-v2` - Analyze CKB and generate comprehensive configuration plan
- `/sdf-build [description]` - Create SDF XML objects (fields, lists, records, workflows)
- `/sdf-deploy [action] [project]` - Validate or deploy SDF projects
- `/tell-me-about [topic]` - Get consultant briefing on CKB topics

## SDF Object Naming Convention

All NetSuite script IDs follow:
```
[type]_ns_[project]_[descriptor]
```

Examples:
- `custentity_ns_acme_vendor_memo` (entity custom field)
- `custbody_ns_proj_approval_status` (transaction body field)
- `customlist_ns_proj_priority_levels` (custom list)

## Configuration Plan Taxonomy

Configuration plans use numbered ranges:
- `010-999` - Process Areas (Record to Report, Order to Cash, etc.)
- `1000-1999` - Feature Modules (Fixed Assets, WMS, etc.)
- `2000-2999` - SuiteApps
- `3000-3999` - Integrations
- `4000-4999` - Customizations

## Customer Context

**Company:** SunStyle Retail
**Industry:** Retail - Fashion Accessories (Sunglasses, Eyewear)
**Channels:** Physical Stores, E-commerce, Mobile
**Geography:** North America (USA, Canada)

Refer to `/customer-knowledgebase/README.md` for full business context.

## Development Notes

- **SuiteScript version:** Prefer SuiteScript 2.1 module pattern
- **XML validation:** Use `node .claude/skills/sdf-build/validate-sdf-xml.js [file]` to validate SDF XML against schemas
- **Dependencies:** `libxmljs2` installed for XML processing
- **Logs:** Deployment and validation logs are saved to `sdf/[project]/logs/`

## Working with the CKB

The Customer Knowledgebase contains all business requirements, process documentation, and integration specifications. When asked about business processes, requirements, or planning:

1. Check `/customer-knowledgebase/DOCUMENT-INDEX.md` for document catalog
2. Use `/tell-me-about [topic]` skill for synthesized briefings
3. Read relevant source documents for detailed specifications
