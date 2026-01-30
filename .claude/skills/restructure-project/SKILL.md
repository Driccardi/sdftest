---
name: restructure-project
description: Reorganize project directory to conform to project-taxonomy.md and netsuite-taxonomy.md standards
arguments:
  - name: mode
    description: "Execution mode: 'plan' for dry-run (default), 'execute' to make changes"
    required: false
    default: "plan"
---

# Restructure Project Directory

Reorganize the current project directory to conform to the project taxonomy standards.

**Mode: $ARGUMENTS.mode** (use 'plan' to preview changes, 'execute' to apply them)

## Instructions

You are restructuring a NetSuite implementation project directory to match the taxonomy defined in `.claude/project-taxonomy.md` and `.claude/netsuite-taxonomy.md`.

### Phase 1: Read Taxonomy Standards

1. Read `.claude/project-taxonomy.md` to understand the required top-level directory structure
2. Read `.claude/netsuite-taxonomy.md` to understand the required subfolder structure for NS-TAX governed directories

### Phase 2: Analyze Current State

1. List all current top-level directories and files in the project root
2. For each NS-TAX governed directory that exists, list its current subfolder structure
3. Identify any files in the root that should be moved to specific directories
4. Identify any directories that don't match the taxonomy (potential candidates for reorganization or placement in `/unprocessed`)

### Phase 3: Generate Restructure Plan

Create a detailed plan showing:

**Directories to Create:**
```
[List all missing required directories with full paths]
```

**Files to Move:**
```
[Source] → [Destination]
[Explain reasoning for each move]
```

**Directories to Reorganize:**
```
[Current location] → [New location or structure]
[Explain what changes are needed]
```

**Files Requiring Manual Review:**
```
[List files that don't clearly map to a taxonomy location]
[Suggest placing in /unprocessed if unclear]
```

### Phase 4: Confirm Before Executing

Present the plan to the user and ask for confirmation before making any changes. Format as:

```
## Restructure Plan Summary

### New Directories (X total)
- /path/to/new/directory

### File Moves (X total)
- file.md → /new/location/file.md

### Manual Review Needed (X files)
- unclear-file.md (suggested: /unprocessed/)

Proceed with restructure? [Awaiting confirmation]
```

### Phase 5: Execute Restructure

Once confirmed:

1. **Create directory structure first** (in this order):
   - Top-level directories from project-taxonomy
   - NS-TAX subfolders (`process-areas/`, `feature-modules/`, `suite-apps/`, `integrations/`, `customizations/`)
   - Any directory-specific subfolders (`_tracking/`, `_archived/`, etc.)

2. **Move files to new locations**
   - Preserve file contents exactly
   - Update any relative links if possible to detect them

3. **Create required index files** if they don't exist:
   - `/customer-knowledgebase/DOCUMENT-INDEX.md` (stub if needed)
   - `/customer-knowledgebase/README.md` (stub if needed)
   - `/configuration-plan/configuration-summary.md` (stub if needed)
   - `/configuration-plan/_tracking/decisions-log.md` (stub if needed)
   - `/configuration-plan/_tracking/open-items.md` (stub if needed)
   - `/configuration-plan/_tracking/phase-status.md` (stub if needed)

4. **Report results**

### Phase 6: Generate Summary Report

After restructuring, create a summary showing:
- Directories created
- Files moved
- Files placed in `/unprocessed/` for manual review
- Any errors encountered
- Recommended next steps

---

## Required Directory Structure Reference

### Top-Level Directories (from project-taxonomy.md)
```
.claude/
.config/
assets/
  ├── presales-notes/
  ├── project-notes/
  ├── contracts/
  ├── transcripts/
  ├── customer-supplied-documents/
  ├── templates/
  ├── screenshots/
  └── exports/
configuration-execution/     [NS-TAX]
configuration-plan/          [NS-TAX]
  ├── _tracking/
  └── _archived/
customer-knowledgebase/      [CKB structure]
sdf/
solutions/                   [NS-TAX]
  └── environment-design/
templates/
test-execution/              [NS-TAX]
  ├── unit-tests/
  ├── e2e-tests/
  ├── uat/
  └── defects/
test-plan/                   [NS-TAX]
  └── role-based/ (optional)
unprocessed/
```

### NS-TAX Subfolders (required in all [NS-TAX] directories)
```
process-areas/
feature-modules/
suite-apps/
integrations/
customizations/
```

---

## File Classification Heuristics

Use these patterns to determine where files should be moved:

| Pattern/Content | Destination |
|-----------------|-------------|
| Files with codes 10-999 in name | `{dir}/process-areas/` |
| Files with codes 1000-1999 in name | `{dir}/feature-modules/` |
| Files with codes 2000-2999 in name | `{dir}/suite-apps/` |
| Files with codes 3000-3999 in name | `{dir}/integrations/` |
| Files with codes 4000-4999 in name | `{dir}/customizations/` |
| `*-requirements.md` | `/customer-knowledgebase/02-system-requirements/` |
| `*-process.md` | `/customer-knowledgebase/03-functional-processes/` |
| `manifest.xml`, `project.json` (SDF) | `/sdf/{project-name}/` |
| `*.docx`, `*.xlsx` from customer | `/assets/customer-supplied-documents/` |
| Meeting notes, call notes | `/assets/project-notes/` |
| SOW, contract, legal | `/assets/contracts/` |
| Test results, screenshots of tests | `/test-execution/` |
| Test scripts, test cases | `/test-plan/` |
| Design docs, architecture | `/solutions/` |
| Unclear/unclassified | `/unprocessed/` |

---

## Stub File Templates

### DOCUMENT-INDEX.md (stub)
```markdown
# Document Index - Customer Knowledgebase

## Document Information
- **Last Updated**: [DATE]
- **Version**: 0.1.0
- **Maintained By**: [OWNER]

## Documents

*No documents indexed yet. Add documents to this index as the knowledgebase is populated.*

---

## How to Add Documents

1. Create document in appropriate subdirectory
2. Add entry to this index with: Title, ID, Version, Last Updated, Owner
3. Follow naming conventions from project-taxonomy.md
```

### README.md (stub for CKB)
```markdown
# Customer Knowledgebase

This directory contains synthesized knowledge about the customer's business, systems, and requirements.

## Structure

- `01-business-overview/` - Company profile, org structure, business model
- `02-system-requirements/` - Business, functional, technical requirements
- `03-functional-processes/` - Business process documentation
- `04-integration-landscape/` - Current systems and integration points
- `05-technical-architecture/` - Infrastructure and security architecture
- `06-operational-procedures/` - IT operations and support procedures
- `07-compliance-governance/` - Policies, standards, regulatory compliance
- `08-training-documentation/` - User guides and training materials

## Usage

See `DOCUMENT-INDEX.md` for a complete catalog of all documents.

All documents follow semantic versioning and have assigned owners.
```

### configuration-summary.md (stub)
```markdown
# Configuration Summary

## Overview

*High-level summary of configuration scope for this implementation.*

## Process Areas in Scope

| Code | Process Area | Status | Notes |
|------|--------------|--------|-------|
| | | | |

## Feature Modules in Scope

| Code | Module | Status | Notes |
|------|--------|--------|-------|
| | | | |

## Integrations in Scope

| Code | Integration | Status | Notes |
|------|-------------|--------|-------|
| | | | |

## Key Decisions

*Document major configuration decisions here or reference decisions-log.md*

---
*Last Updated: [DATE]*
```

### decisions-log.md (stub)
```markdown
# Configuration Decisions Log

Track key decisions made during configuration planning.

## Decision Template

### DEC-XXX: [Decision Title]
- **Date**: YYYY-MM-DD
- **Decision Maker(s)**: [Names]
- **Context**: [Why was this decision needed?]
- **Decision**: [What was decided?]
- **Alternatives Considered**: [What else was considered?]
- **Rationale**: [Why this option?]
- **Impact**: [What does this affect?]

---

## Decisions

*No decisions logged yet.*
```

### open-items.md (stub)
```markdown
# Open Items

Track unresolved questions, pending decisions, and blockers.

## Open Items

| ID | Item | Owner | Raised | Due | Status | Notes |
|----|------|-------|--------|-----|--------|-------|
| | | | | | | |

## Resolved Items

| ID | Item | Resolution | Resolved Date |
|----|------|------------|---------------|
| | | | |
```

### phase-status.md (stub)
```markdown
# Phase Status Tracker

## Current Phase: [Phase Name]

### Overall Status: 🟡 In Progress

## Phase Summary

| Area | Planned | In Progress | Complete | Blocked |
|------|---------|-------------|----------|---------|
| Process Areas | 0 | 0 | 0 | 0 |
| Feature Modules | 0 | 0 | 0 | 0 |
| Integrations | 0 | 0 | 0 | 0 |
| Customizations | 0 | 0 | 0 | 0 |

## Detailed Status

*Update as configuration progresses*

---
*Last Updated: [DATE]*
```

---

## Safety Guidelines

1. **Never delete files** - only move them
2. **Always preserve original content** - no modifications to file contents during moves
3. **When in doubt, use /unprocessed** - it's better to require manual review than misplace files
4. **Create backup list** - before executing, list all files that will be moved so the operation can be reversed if needed
5. **Stop and ask** if you encounter:
   - Files with unclear ownership
   - Potential duplicate files
   - Large binary files that might be slow to move
   - Anything that seems risky

## Execution Mode

- If `$ARGUMENTS.mode` is **"plan"** (default): Generate and display the restructure plan, but do NOT make any changes. End with "Run with mode='execute' to apply these changes."
- If `$ARGUMENTS.mode` is **"execute"**: Generate the plan, confirm with user, then apply changes.
