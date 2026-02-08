---
name: rtm-requirements-extractor
description: >
  Extract requirements from unstructured project artifacts (transcripts, meeting summaries, notes, docs) and update a
  requirements.json file in-place (append/insert/update only; never remove). Produces schema-compliant Requirement
  objects per /references/requirements-jsonrpc-schema.json, assigns optional NetSuite process taxonomy, avoids
  duplicates via idempotent matching, flags conflicts (tags + follow-ups), and captures assumptions + out-of-scope
  statements in dedicated files. Designed for large inputs via batching with interim notes and an execution plan that
  is updated as work progresses and removed at completion.
inputs:
  - name: input_path
    type: string
    required: true
    description: >
      File path or directory path within the project directory. If file, process the file. If directory, process all
      files under it (recursive) excluding obvious binaries.
  - name: requirements_path
    type: string
    required: false
    description: >
      Optional path to an existing requirements JSON file to update. If absent or file not found, create
      [project root]/requirements.json.
references:
  schema: /references/requirements-jsonrpc-schema.json
  examples: /examples/rtm-requirements-examples.json
  taxonomy: /references/netsuite-taxonomy.md
tools:
  - Read
  - Write
  - Grep
  - Glob
  - Bash
hard_rules:
  - Never remove existing requirements or delete user-authored content. Only append/insert/update.
  - Schema-first: /references/requirements-jsonrpc-schema.json is the source of truth.
  - IDs are strictly sequential and idempotent: do not renumber; allocate only next unused REQ-### for genuinely new items.
  - Do not infer or propose solutionOptions, solvedBy, or designProposal content. Leave them absent/empty.
  - Conflicts must be marked with BOTH a tag ("conflict") and follow-up question(s).
  - Provenance must be stored as an ARRAY of entries (append new provenance; never overwrite prior provenance).
outputs:
  - requirements.json (created/updated)
  - assumptions.md (created/updated; append-only)
  - out-of-scope.md (created/updated; append-only)
  - notes.md (temporary; must be removed at completion)
  - plan.md (temporary; must be removed at completion)
---

# RTM Requirements Extractor Skill

## 0) Objective
Read the provided input file(s) and extract **requirements intent** into a schema-compliant requirements JSON dataset.
Also track **assumptions** and **scope exclusions**. Operate safely on large inputs by batching, maintaining interim
notes + an execution plan, and cleaning up temporary files at the end.

---

## 1) Source-of-truth schema and backward compatibility
- Treat `/references/requirements-jsonrpc-schema.json` as canonical.
- Existing `requirements.json` may contain legacy shapes. You must:
  - Preserve unknown/legacy fields (do not delete).
  - When updating a requirement, write updates using the *current* schema shape (additive).
  - If you need to add a new field that wasn’t present historically, add it without removing old fields.

---

## 2) Requirements file location and structure
- If `requirements_path` provided and exists: update it.
- Else create `[project root]/requirements.json`.

When creating a new file, use:
```json
{
  "meta": {
    "datasetId": "RTM-<timestamp-or-guid>",
    "generatedAt": "<ISO datetime>",
    "schema": "requirements-jsonrpc-schema.json",
    "notes": "Generated/updated by rtm-requirements-extractor"
  },
  "requirements": []
}
````

---

## 3) Strictly sequential + idempotent IDs

### Allocation

* IDs are `REQ-###` strictly sequential.
* Determine the **highest numeric suffix** present in the existing requirements set; new requirements get `max+1`.

### Idempotency (critical)

Before creating anything new, attempt to match candidates to existing requirements via:

* Title similarity (case/whitespace normalized)
* Shared entities (locations, departments, transaction types, integrations, systems)
* Same process_taxonomy (if present)
* Overlapping keywords and intent phrases
* Same sourceRef or same meeting/document domain

If match is found:

* Update that existing requirement **in place** (append provenance, add follow-ups, add edges/tags).
* Do NOT create a new REQ ID.

---

## 4) Required behavior re: solutions/options/design

You are NOT responsible for solutions.

* Do not populate:

  * `designProposal.steps`
  * `designProposal.solutionOptions`
  * `designProposal.solvedBy`
* If the schema requires `designProposal` for some reason, set it to an empty array `[]` or omit it (prefer omit).
* Never fabricate implementation artifacts.

---

## 5) Provenance must be an array

Even if the current schema shows a single `provenance` object, your project standard is:

* Store provenance as `provenance: [ ... ]` (array of objects)
* When updating, append a new provenance entry rather than overwriting.

**Each provenance entry should include:**

* `sourceRef` (required)
* `sourceType` (if known)
* `sourceLocator` (filePath/docId/page/timecodes/quote if available)
* `requestedBy` / `requestDate` (if explicitly stated)
* `confidence` (0..1 conservative estimate)

If the legacy requirement has `provenance` as a single object:

* Convert to array: `[legacyProvenance]`
* Then append new entries.

---

## 6) process_taxonomy

* Optional but recommended.
* Use `/references/netsuite-taxonomy.md` as lookup.
* If unknown:

  * Omit OR set to `"other"` (either is acceptable)
  * Add a follow-up question to confirm taxonomy if it would materially help routing/testing.

---

## 7) Large input handling (batching required)

### File enumeration

* If `input_path` is a file: process it.
* If directory: recursively enumerate files with `Glob`.
* Skip obvious binaries: images, archives, executables, etc.

### Plan and notes

* Create `[project root]/plan.md`:

  * File list + ordering
  * Batch sizes and cursor
  * Running checklist (done/next)
* Create `[project root]/notes.md`:

  * Append candidate requirements extracted per batch with short pointers back to source

Update `plan.md` after each batch.

### Cleanup

At completion: remove `plan.md` and `notes.md`.

---

## 8) Requirement extraction rules

### Signals

Clear requirement intent:

* “must / should / will”
* “I want it to…”
* “NetSuite needs to be able to…”
* “We require…”

Ambiguous/confirm:

* “may / might / possible / could”
* “we’re thinking about…”
  Still capture, but:
* lower confidence
* add follow-up questions for confirmation
* likely `priority: low|medium`

### Title + description

* Title: concise, specific, testable scope.
* Description: plain English, complete thought, may include NetSuite/customer vernacular.

### Splitting/merging

* Split compound statements into multiple requirements when independently testable.
* Merge when clearly the same intent (idempotency).

---

## 9) Follow-up questions (required when vague or conflicting)

Add follow-ups when:

* scope boundary unclear
* acceptance criteria missing
* ambiguous wording present
* conflicting statements exist
* missing process taxonomy impacts routing

---

## 10) Conflicts handling (must tag + follow-up)

When you detect conflicts (e.g., “real-time” vs “nightly”):

* Add tag: `"conflict"` (append; do not remove existing tags)
* Add follow-up questions to clarify conflict
* Add `edges` of `related-to` between the conflicting requirements (both directions if helpful)
* Do not decide which is correct.

---

## 11) Edges

Edge types:

* `depends-on`: A requires B first
* `dependency-for`: A enables B
* `related-to`: adjacent / shared impact

Add edges conservatively; do not invent dependencies without evidence.

---

## 12) Assumptions & out-of-scope tracking

### assumptions.md (append-only; create if missing)

Capture implied-but-unconfirmed statements.
Format:

* `- [YYYY-MM-DD] Assumption: ... (Source: <sourceRef>, Confidence: <0..1>)`

### out-of-scope.md (append-only; create if missing)

Capture explicit exclusions.
Signals:

* “won’t”, “cannot”, “out of scope”, “not in phase 1”, “exclude”
  Format:
* `- [YYYY-MM-DD] Out of scope: ... (Source: <sourceRef>)`

---

## 13) Write protocol

* Load existing requirements.json (if present)
* Normalize legacy shapes (especially provenance → array)
* Apply updates/additions
* Update timestamps:

  * new requirement: set `createdAt` and `updatedAt`
  * modified requirement: update `updatedAt`
* Write back (prefer atomic write if available; otherwise careful overwrite)

---

## 14) Completion criteria (strict)

Done only when:

* All requested files processed per plan
* requirements.json updated/created with extracted requirements
* No duplicates created (idempotent behavior)
* Conflicts tagged + follow-ups added
* Provenance appended as an array
* assumptions.md and out-of-scope.md updated/created
* plan.md and notes.md removed

```

### A couple of tiny “additions” that will save you pain later
- **Normalization rule:** treat any existing `provenance` object as legacy and auto-wrap to `[ ... ]` immediately on load.
- **Conflict keyword set:** keep a small internal list (real-time vs batch, per-location vs global, allow backorder vs disallow, serial/lot required vs not) to catch silent contradictions.
- **Duplicate guardrail:** add a lightweight `fingerprint` in-memory only (not stored) computed from normalized title+keywords so the agent doesn’t re-add the same thing across batches.

```
