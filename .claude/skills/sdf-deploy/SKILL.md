---
name: sdf-deploy
description: >
  Validate and deploy SuiteCloud SDF projects to NetSuite. Handles project discovery,
  validation, and deployment with automatic logging. Use when asked to validate SDF,
  deploy to NetSuite, deploy SDF project, validate SuiteCloud project, or run suitecloud commands.
  Triggers: "validate sdf", "deploy sdf", "deploy to netsuite", "suitecloud deploy",
  "sdf validate", "deploy project", "push to netsuite".
allowed-tools: Bash, Read, Write, Glob
---

# SuiteCloud SDF Deployment Skill

Validate and deploy SuiteCloud Development Framework (SDF) projects to NetSuite.

**User Request:** `$ARGUMENTS`

---

## Project Structure

All SDF projects are under `/sdf/` with this structure:

```
/sdf/
├── <project-name>/
│   ├── src/                 # ← Commands run from here
│   │   ├── deploy.xml
│   │   ├── manifest.xml
│   │   ├── Objects/
│   │   └── FileCabinet/
│   ├── logs/                # ← Created by this skill
│   └── project.json
└── ...
```

---

## Step 1: Parse the Request

From `$ARGUMENTS`, determine:
1. **Action:** `validate`, `deploy`, `dryrun`, or `list`
2. **Project name:** The SDF project folder name

If unclear, ask the user what action they want.

---

## Step 2: List or Locate the Project

### List all projects:
```bash
echo "=== Available SDF Projects ===" && \
find ./sdf -maxdepth 2 -name "src" -type d 2>/dev/null | \
  sed 's|/src$||' | sed 's|^\./sdf/||' | sort
```

### Validate project exists:
```bash
PROJECT="<project-name>"
if [ ! -d "./sdf/${PROJECT}/src" ]; then
  echo "ERROR: Project '${PROJECT}' not found"
  echo "Available projects:"
  find ./sdf -maxdepth 2 -name "src" -type d | sed 's|/src$||' | sed 's|^\./sdf/||'
  exit 1
fi
```

---

## Step 3: Set Up Logging

```bash
PROJECT="<project-name>"
ACTION="<action>"
LOG_DIR="./sdf/${PROJECT}/logs"
mkdir -p "${LOG_DIR}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${LOG_DIR}/${ACTION}_${TIMESTAMP}.log"
echo "Log file: ${LOG_FILE}"
```

---

## Step 4: Execute the Command

**Critical:** All suitecloud commands must run from the `src/` directory.

### For VALIDATE:
```bash
PROJECT="<project-name>"
LOG_DIR="./sdf/${PROJECT}/logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/validate_$(date +%Y%m%d_%H%M%S).log"

cd "./sdf/${PROJECT}/src" && \
suitecloud project:validate --server 2>&1 | tee "${LOG_FILE}"
```

### For DRYRUN (validate via deploy without changes):
```bash
PROJECT="<project-name>"
LOG_DIR="./sdf/${PROJECT}/logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/dryrun_$(date +%Y%m%d_%H%M%S).log"

cd "./sdf/${PROJECT}/src" && \
suitecloud project:deploy --dryrun 2>&1 | tee "${LOG_FILE}"
```

### For DEPLOY:
```bash
PROJECT="<project-name>"
LOG_DIR="./sdf/${PROJECT}/logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/deploy_$(date +%Y%m%d_%H%M%S).log"

cd "./sdf/${PROJECT}/src" && \
suitecloud project:deploy --validate 2>&1 | tee "${LOG_FILE}"
```

---

## Step 5: Report Results

After execution:
1. Summarize success or failure
2. If errors, highlight key error messages from output
3. Confirm log file location: `/sdf/<project>/logs/<action>_<timestamp>.log`

---

## Command Options Reference

### project:validate
| Option | Description |
|--------|-------------|
| `--server` | Validate against NetSuite account (recommended) |
| `--accountspecificvalues WARNING` | Warn on account-specific values |
| `--accountspecificvalues ERROR` | Error on account-specific values |

### project:deploy
| Option | Description |
|--------|-------------|
| `--validate` | Run local validation before deploy |
| `--dryrun` | Validate against account without deploying |
| `--accountspecificvalues WARNING` | Warn on account-specific values |

**Note:** `--validate` and `--dryrun` are mutually exclusive.

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Authentication required" | Run `suitecloud account:setup` in the project's src/ directory |
| "Invalid reference" | Run `suitecloud project:adddependencies` then retry |
| "Manifest validation failed" | Check manifest.xml for syntax errors |
| "Deploy file validation failed" | Verify paths in deploy.xml reference existing files |

---

## Examples

**List projects:**
```
User: /sdf-deploy list
```

**Validate:**
```
User: /sdf-deploy validate my-customizations
```

**Deploy:**
```
User: /sdf-deploy deploy my-customizations
```

**Dry run:**
```
User: /sdf-deploy dryrun my-customizations
```

**Ambiguous (agent should ask):**
```
User: /sdf-deploy my-customizations
→ Ask: "What would you like to do? validate, deploy, or dryrun?"
```
