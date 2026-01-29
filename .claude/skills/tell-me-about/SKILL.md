---
name: tell-me-about
description: >
  Explain a customer's business process, module, or requirement as if briefing a new consultant.
  Reads the Customer Knowledgebase (CKB) and synthesizes information about the requested topic.
  Use when someone asks to understand a process area, module, integration, or any aspect of
  the customer's business. Triggers: "tell me about", "explain", "brief me on", "what do we
  know about", "summarize the requirements for".
---

# Tell Me About: New Consultant Briefing

You are briefing a **new consultant who just joined this project**. They're smart and experienced with NetSuite, but they know nothing about this specific customer yet.

Your job is to read the Customer Knowledgebase (CKB) and provide a clear, contextual briefing on: **$ARGUMENTS**

---

## Your Approach

### 1. Find the CKB
```bash
find . -maxdepth 3 -type d \( -iname "*knowledge*" -o -iname "*ckb*" -o -iname "*requirement*" \) 2>/dev/null
```

### 2. Search for Relevant Documentation
Look for files related to the topic. Use grep, find, and read strategically:
```bash
# Find files mentioning the topic
grep -r -i -l "$ARGUMENTS" <ckb-path>/ 2>/dev/null

# Look for common document patterns
find <ckb-path>/ -type f \( -name "*.md" -o -name "*.json" \) | head -20
```

### 3. Read and Synthesize
Read the relevant files and extract information about **$ARGUMENTS**.

---

## Briefing Format

Structure your response as a consultant briefing:

### 🏢 Business Context
- What is this customer's industry?
- Why does **$ARGUMENTS** matter to their business?
- Any unique aspects of how they operate?

### 📋 What We Know
Summarize the documented requirements, processes, or specifications related to **$ARGUMENTS**:
- Key requirements (bullet points)
- Stated business rules or constraints
- Volume/scale expectations if mentioned
- Any specific stakeholders or roles involved

### 🔗 Related Areas
What other processes or modules connect to **$ARGUMENTS**?
- Upstream dependencies (what feeds into this?)
- Downstream impacts (what does this feed?)
- Integration touchpoints

### ⚠️ Watch Out For
Based on your reading:
- Any ambiguities or gaps in the documentation?
- Assumptions that seem to be made?
- Open questions that haven't been answered?
- Potential risks or complexity?

### 📁 Source Documents
List the files you referenced:
- `path/to/document1.md` - Brief description of what it contained
- `path/to/document2.json` - Brief description

---

## Tone Guidelines

- Be conversational but professional - you're talking to a peer
- Don't just regurgitate the docs - synthesize and add value
- If something is unclear, say so: "The docs mention X but don't specify Y"
- If you're inferring something, flag it: "Based on [source], it seems like..."
- If there's nothing documented, say that clearly rather than making things up

---

## If Topic Not Found

If you search and find no documentation about **$ARGUMENTS**:

1. Say so clearly: "I couldn't find any documentation specifically about **$ARGUMENTS** in the CKB."
2. Suggest what you'd expect to find for this topic
3. Offer to search for related terms
4. Ask if they meant something else

---

## Examples

**User:** `/tell-me-about Procure to Pay`

**Expected behavior:** Search for P2P, procurement, purchasing, vendor, AP, purchase order content. Brief on the customer's purchasing processes, approval workflows, vendor management requirements, and integration needs.

**User:** `/tell-me-about the Salesforce integration`

**Expected behavior:** Search for Salesforce, CRM, integration, sync content. Brief on what data flows between systems, direction, frequency, and any mapping requirements.

**User:** `/tell-me-about their inventory challenges`

**Expected behavior:** Search for inventory, warehouse, stock, WMS content. Synthesize pain points, current state issues, and requirements around inventory management.
