# Project Directory Taxonomy

This document defines the standard directory structure for NetSuite implementation projects. All project repositories must follow this taxonomy to ensure consistency across engagements and enable tooling automation.

**Version:** 1.0.0  
**Last Updated:** 2026-01-30  
**Maintained By:** Implementation Standards Team

---

## Directory Structure Overview

```
project-root/
├── .claude/                      # Claude Code configuration and context
├── .config/                      # Project-level configuration files
├── assets/                       # Raw customer assets (source materials)
├── configuration-execution/      # Built configuration documentation [NS-TAX]
├── configuration-plan/           # Planned configuration documentation [NS-TAX]
├── customer-knowledgebase/       # Synthesized customer business knowledge [CKB]
├── sdf/                          # SuiteCloud Development Framework projects
├── solutions/                    # Solution and design documentation [NS-TAX]
├── templates/                    # Customer-specific document templates
├── test-execution/               # Test results and evidence [NS-TAX]
├── test-plan/                    # Test planning documentation [NS-TAX]
└── unprocessed/                  # Uncategorized incoming materials
```

**Legend:**
- `[NS-TAX]` — Follows NetSuite Taxonomy subfolder structure (see netsuite-taxonomy.md)
- `[CKB]` — Follows Customer Knowledgebase structure

---

## Directory Specifications

### /.claude

Claude Code configuration and project context files.

```
.claude/
├── settings.json                 # Claude Code project settings
├── CLAUDE.md                     # Project-level instructions for Claude
└── commands/                     # Custom slash commands (optional)
```

**Purpose:** Stores all Claude Code-specific configuration that governs AI behavior within this project.

---

### /.config

Project-level configuration files not specific to Claude.

```
.config/
├── project.json                  # Project metadata (client, dates, team)
├── environments.json             # NetSuite environment details
└── integrations.json             # Integration endpoint configuration
```

**Purpose:** Centralized configuration that may be referenced by scripts, tooling, or documentation generation.

---

### /assets

Raw customer-supplied materials and internal project assets. These are **source documents** that have not been synthesized into knowledgebase content.

```
assets/
├── presales-notes/               # Discovery and scoping documentation
├── project-notes/                # Implementation meeting notes, decisions
├── contracts/                    # SOWs, change orders, legal documents
├── transcripts/                  # Call and meeting transcriptions
├── customer-supplied-documents/  # Documents provided by client
├── templates/                    # Templates received from customer
├── screenshots/                  # UI captures, evidence, reference images
└── exports/                      # Data exports, CSV files, raw data
```

**Guidelines:**
- Maintain original filenames where possible; prefix with date (YYYY-MM-DD) if needed
- Do not modify source documents; create processed versions in appropriate directories
- Large binary files (videos, recordings) may be stored externally with reference links

---

### /configuration-execution [NS-TAX]

Documentation of **completed configuration** — what was actually built in NetSuite.

```
configuration-execution/
├── process-areas/                # 10-999: End-to-end business processes
├── feature-modules/              # 1000-1999: NetSuite native modules
├── suite-apps/                   # 2000-2999: Third-party SuiteApps
├── integrations/                 # 3000-3999: External system integrations
├── customizations/               # 4000-4999: Custom development
└── execution-log.md              # Chronological log of configuration activities
```

**File Naming:** `{code}-{Descriptive-Name}.md` (e.g., `030-Order-to-Cash.md`)

**Purpose:** Serves as the as-built record. Updated after configuration is completed and validated.

---

### /configuration-plan [NS-TAX]

Documentation of **planned configuration** — design decisions and implementation approach.

```
configuration-plan/
├── process-areas/                # 10-999: End-to-end business processes
├── feature-modules/              # 1000-1999: NetSuite native modules
├── suite-apps/                   # 2000-2999: Third-party SuiteApps
├── integrations/                 # 3000-3999: External system integrations
├── customizations/               # 4000-4999: Custom development
├── _tracking/                    # Status tracking, decision logs, open items
│   ├── decisions-log.md
│   ├── open-items.md
│   └── phase-status.md
├── _archived/                    # Superseded plans (retain for audit trail)
└── configuration-summary.md      # Executive summary of configuration scope
```

**File Naming:** `{area-code}.{sequence}-{Descriptive-Name}.md` (e.g., `030.010-Sales-Order-Entry.md`)

**Purpose:** Working documentation during design and build phases. Plans move to `_archived` when superseded; execution docs created in `/configuration-execution` when built.

---

### /customer-knowledgebase [CKB]

Synthesized knowledge about the customer's business, systems, and requirements. This is the **single source of truth** for understanding the customer.

```
customer-knowledgebase/
├── 01-business-overview/         # Company profile, org structure, business model
├── 02-system-requirements/       # Business, functional, technical requirements
├── 03-functional-processes/      # Business process documentation
├── 04-integration-landscape/     # Current systems and integration points
├── 05-technical-architecture/    # Infrastructure and security architecture
├── 06-operational-procedures/    # IT operations and support procedures
├── 07-compliance-governance/     # Policies, standards, regulatory compliance
├── 08-training-documentation/    # User guides and training materials
├── DOCUMENT-INDEX.md             # Complete document catalog with metadata
└── README.md                     # Knowledgebase overview and usage guide
```

**Guidelines:**
- All documents must be registered in `DOCUMENT-INDEX.md`
- Use semantic versioning (MAJOR.MINOR.PATCH) for document versions
- Each document has an assigned owner responsible for accuracy
- NetSuite taxonomy subfolders may be added within numbered folders when domain-specific technical detail is needed

**File Formats:** Markdown (.md) preferred; JSON for structured data

---

### /sdf

SuiteCloud Development Framework project root. Each subdirectory is a separate SDF project that can be deployed independently.

```
sdf/
├── core-customizations/          # Primary customization project
│   ├── src/
│   │   ├── AccountingContexts/
│   │   ├── FileCabinet/
│   │   ├── Objects/
│   │   └── ...
│   ├── manifest.xml
│   └── project.json
├── integration-endpoints/        # Restlets and integration scripts
└── reporting-bundle/             # Custom reports and saved searches
```

**Guidelines:**
- Follow SDF standard directory structure within each project
- Project names should be lowercase with hyphens
- Each project should have a focused scope (deployable unit)
- Include `README.md` in each project describing purpose and deployment notes

---

### /solutions [NS-TAX]

Solution design documentation including architecture, environment design, customization specifications, and integration designs.

```
solutions/
├── process-areas/                # 10-999: Process-level solution designs
├── feature-modules/              # 1000-1999: Module configuration designs
├── suite-apps/                   # 2000-2999: SuiteApp implementation designs
├── integrations/                 # 3000-3999: Integration architecture and specs
├── customizations/               # 4000-4999: Custom development specifications
├── environment-design/           # Subsidiary, role, and environment architecture
└── solution-overview.md          # Executive solution summary
```

**File Formats:** Markdown, HTML, PDF

**Purpose:** Design documentation that bridges requirements (in CKB) to configuration plans.

---

### /templates

Customer-specific document templates for deliverables, communications, and reporting.

```
templates/
├── deliverables/                 # Design docs, status reports, sign-off forms
├── communications/               # Email templates, meeting agendas
└── exports/                      # Report templates, data export formats
```

**File Formats:** Markdown (.md), HTML (.html), Word (.docx)

---

### /test-execution [NS-TAX]

Test execution results, evidence, and defect tracking.

```
test-execution/
├── process-areas/                # 10-999: Process-level test results
├── feature-modules/              # 1000-1999: Module test results
├── suite-apps/                   # 2000-2999: SuiteApp test results
├── integrations/                 # 3000-3999: Integration test results
├── customizations/               # 4000-4999: Custom development test results
├── unit-tests/                   # Automated unit test results
├── e2e-tests/                    # End-to-end test cycles
├── uat/                          # User acceptance testing evidence
└── defects/                      # Defect logs and resolution tracking
```

**Purpose:** Evidence of testing activities. Links back to test plans; includes screenshots, logs, and sign-offs.

---

### /test-plan [NS-TAX]

Test planning documentation including test cases, scenarios, and acceptance criteria.

```
test-plan/
├── process-areas/                # 10-999: Process-level test plans
├── feature-modules/              # 1000-1999: Module test plans
├── suite-apps/                   # 2000-2999: SuiteApp test plans
├── integrations/                 # 3000-3999: Integration test plans
├── customizations/               # 4000-4999: Custom development test plans
├── master-test-plan.md           # Overall test strategy and approach
└── role-based/                   # Role-specific test scripts (optional)
```

**File Formats:** Markdown for readable plans; JSON for machine-readable test cases

**Guidelines:**
- Test plans should reference configuration-plan documents
- Include clear pass/fail criteria
- Specify data requirements and prerequisites
- May be role-specific or process-specific depending on testing approach

---

### /unprocessed

Temporary holding area for incoming materials that have not been categorized, organized, or synthesized.

```
unprocessed/
├── [files awaiting processing]
└── _processing-queue.md          # Optional: tracking what needs processing
```

**Guidelines:**
- This folder should be regularly emptied
- Files should be moved to appropriate directories or synthesized into knowledgebase content
- Do not let this become a permanent storage location

---

## Cross-Reference: NetSuite Taxonomy Directories

The following directories use the NetSuite Taxonomy subfolder structure (defined in `netsuite-taxonomy.md`):

| Directory | Purpose |
|-----------|---------|
| `/configuration-execution` | What was built |
| `/configuration-plan` | What will be built |
| `/solutions` | How it will be designed |
| `/test-execution` | Test results by area |
| `/test-plan` | Test plans by area |

Each of these directories contains the standard taxonomy subfolders:
- `process-areas/` (codes 10-999)
- `feature-modules/` (codes 1000-1999)
- `suite-apps/` (codes 2000-2999)
- `integrations/` (codes 3000-3999)
- `customizations/` (codes 4000-4999)

---

## File Naming Conventions

### General Rules
- Use lowercase with hyphens for directories: `order-to-cash/`
- Use Title-Case with hyphens for files: `030-Order-Entry-Process.md`
- Prefix with date when chronology matters: `2026-01-30-Discovery-Notes.md`
- Zero-pad numeric prefixes for proper sorting: `010`, `020`, `030`

### Code-Based Naming (NS-TAX directories)
- Area documents: `{code}-{Name}.md` → `030-Order-to-Cash.md`
- Phase documents: `{code}.{seq}-{Name}.md` → `030.010-Sales-Order-Entry.md`

---

## Version Control Guidelines

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(config-plan): add AR aging configuration for O2C
fix(ckb): correct org chart reporting structure
docs(solutions): update integration architecture diagram
```

### Branch Strategy
- `main` — Production-ready documentation
- `feature/*` — New documentation or major updates
- `fix/*` — Corrections and minor updates

---

## Maintenance

### Regular Reviews
- **Weekly:** Clear `/unprocessed` folder
- **Sprint/Phase End:** Update execution docs from plans
- **Monthly:** Review and update `DOCUMENT-INDEX.md` in CKB
- **Phase Gate:** Archive superseded plans

### Ownership
Each top-level directory should have a designated owner responsible for organization and accuracy.

---

*This taxonomy is enforced by Claude Code project configuration. Deviations require documented justification.*
