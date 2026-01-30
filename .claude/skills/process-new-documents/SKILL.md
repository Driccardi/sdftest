---
name: process-new-documents
description: Ingest and synthesize documents from the unprocessed folder into the appropriate knowledgebase, configuration, or test execution directories. Maintains organizational taxonomy and ensures new information is properly contextualized within existing documentation.
version: 1.0.0
author: ns-dev
tags: [documentation, knowledgebase, ingestion, synthesis]
---

# Process New Documents Skill

Ingest raw documents from `/unprocessed/` and synthesize them into the appropriate project knowledgebase structure.

## Usage

```
/process-new-documents [filename]
```

If no filename is specified, process all files in `/unprocessed/`.

## Examples

```
/process-new-documents
/process-new-documents discovery-notes-2026-01-28.md
/process-new-documents client-email-re-sourcing.pdf
```

## Target Directories

Documents are synthesized into one of three destination directories based on content type:

| Directory | Content Type |
|-----------|--------------|
| `./customer-knowledgebase/` | Business requirements, processes, domain knowledge, client context, stakeholder info |
| `./configuration-execution/` | Implementation specs, build instructions, configuration details, technical decisions |
| `./test-execution/` | Test cases, validation criteria, UAT scripts, expected behaviors |

## Workflow

### 1. Establish Context

Before processing any new documents, build understanding from existing project context:

**Required reads (in order):**
1. `./CLAUDE.md` — Project-level orientation and agent instructions
2. `./customer-knowledgebase/README.md` — Customer context, project background, key terminology
3. `./.claude/netsuite-taxonomy.md` — Taxonomy and naming conventions for organizing knowledge

**Do not skip these reads.** New information must be understood relative to existing context.

### 2. Scan Unprocessed Documents

- List files in `./unprocessed/`
- For each file, determine:
  - File type (markdown, PDF, email export, spreadsheet, image, etc.)
  - Apparent content category (requirements, technical spec, test case, meeting notes, etc.)
  - Relevance to existing knowledgebase sections

If a file cannot be parsed or understood, report it and move to the next file.

### 3. Classify and Locate

For each document, determine:

**A. Which destination directory?**
- Business/functional content → `./customer-knowledgebase/`
- Build/configuration specs → `./configuration-execution/`
- Test/validation content → `./test-execution/`

**B. Which subdirectory/section per the taxonomy?**
- Consult `./.claude/netsuite-taxonomy.md` for the hierarchical structure
- Match content to the most specific applicable category
- If no category fits, propose a new one (but prefer existing structure)

**C. Update existing or create new?**
- Search destination directory for related documents
- **Update** if the new content:
  - Refines, corrects, or extends existing documentation
  - Relates to the same feature, process, or entity
  - Would cause fragmentation if stored separately
- **Create new** if the content:
  - Represents a distinct feature, process, or entity
  - Would make an existing document too large or unfocused
  - Has a different lifecycle or audience than existing docs

**Think like a future agent:** How would another agent search for this information? Would they expect it in the existing doc or as its own file?

### 4. Draft Content

When synthesizing raw input into knowledgebase content:

- **Extract structured information** from unstructured notes (tables, field lists, requirements)
- **Normalize terminology** to match existing knowledgebase conventions
- **Add context links** — reference related documents within the knowledgebase
- **Preserve attribution** — note source document and date (e.g., "Per discovery call 2026-01-28")
- **Flag open questions** — clearly mark unresolved items with `> ⚠️ OPEN:` callout blocks
- **Don't discard nuance** — if consultant notes include stakeholder opinions, concerns, or "parking lot" items, preserve them in appropriate sections

### 5. Write to Knowledgebase

**For updates:**
- Insert new content in the appropriate section of the existing document
- Maintain document structure and heading hierarchy
- Add a changelog entry if the document has one
- Don't overwrite existing content unless explicitly correcting errors

**For new documents:**
- Follow naming conventions from taxonomy
- Include standard frontmatter/header (title, date, status, related docs)
- Place in correct subdirectory per taxonomy

### 6. Handle Processed Files

After successfully processing a file:
- Move the original file to `./unprocessed/_processed/` (create if doesn't exist)
- Preserve original filename with date prefix: `2026-01-30_original-filename.md`

If processing fails:
- Leave file in `./unprocessed/`
- Report the error and reason

### 7. Report Results

After processing completes, output a summary:

```
## Processing Complete

### Documents Updated
- `./customer-knowledgebase/vendors/sourcing-process.md` — Added sourcing tracker requirements
- `./customer-knowledgebase/README.md` — Added Coastal Shades project context

### Documents Created
- `./configuration-execution/custom-records/sourcing-tracker.md` — New custom record spec
- `./configuration-execution/custom-lists/sourcing-status.md` — New list definition

### Moved to Processed
- `./unprocessed/_processed/2026-01-30_discovery-notes-sourcing.md`

### Errors
- `./unprocessed/corrupted-file.xlsx` — Could not parse file contents
```

## Document Standards

### Frontmatter for New Documents

```markdown
---
title: [Descriptive Title]
created: YYYY-MM-DD
status: draft | active | deprecated
source: [Original filename from unprocessed]
related:
  - ./path/to/related-doc.md
---
```

### Heading Hierarchy

Follow existing document conventions. Typical structure:

```markdown
# Document Title

## Overview
Brief summary of contents

## [Main Sections]
Content organized per taxonomy

## Open Questions
Unresolved items

## Changelog
- YYYY-MM-DD: Initial creation from [source]
```

## Error Handling

- **Unreadable file:** Report and skip, leave in unprocessed
- **Ambiguous classification:** Ask for clarification before proceeding
- **Conflicting information:** Flag in document with `> ⚠️ CONFLICT:` callout, don't silently overwrite
- **Missing context files:** If `README.md`, `CLAUDE.md`, or taxonomy file missing, stop and report — do not process without context

## Taxonomy Reference

The taxonomy file at `./.claude/netsuite-taxonomy.md` defines:

- Directory structure for each knowledgebase
- Naming conventions for files
- Category definitions and examples
- When to nest vs. flatten

**Always consult the taxonomy before creating new files or directories.**
