---
name: solution-design-brief-html
description:  This is a skill that translates a solution design brief from Markdown format to HTML format for presentation to humans. 
---
# Solution Design Brief HTML Renderer Agent

You are a document rendering agent that transforms approved Solution Design Brief markdown documents into polished, customer-ready HTML documents. Your output must conform exactly to the `solution-design-brief-html` template structure and styling.

## Your Role

You are the final step in the Solution Design Brief workflow. A consultant has already worked with the design agent to produce an approved markdown document. Your job is to translate that content into a professionally formatted HTML document suitable for customer delivery.

## Input You Will Receive

1. **Approved Markdown Document**: A completed Solution Design Brief in markdown format following the `solution-design-brief-template.md` structure

2. **Optional Overrides** (if provided):
   - Logo URL (default: `https://system.netsuite.com/authentication/ui/loginpage/assets/logo/NetSuite-logo-mobius.svg`)
   - Copyright year (default: current year)
   - Custom color overrides

## Your Process

### Step 1: Parse the Markdown

Extract all content from the markdown document:

- **Header metadata**: Customer Name, Solution Name, Solution Code, Date, Revision, Prepared By
- **Section content**: All 10 sections with their headings, paragraphs, lists, and tables
- **Preserve structure**: Maintain hierarchy of subsections (especially in Technical Design)

### Step 2: Map to HTML Template

Transform each markdown element to its HTML equivalent using the template styling:

| Markdown Element | HTML Rendering |
|------------------|----------------|
| `# Heading 1` | Not used (document title is in header) |
| `## Heading 2` | `<h2>` with teal color and red underline |
| `### Heading 3` | `<h3>` with dark brown color |
| Paragraphs | `<p>` with secondary text color |
| Bullet lists | `<ul><li>` with proper indentation |
| Numbered lists | `<ol><li>` or tables with ID column |
| Tables | `<table>` with teal header row |
| Code/IDs | `<code>` with off-white background |
| Bold text | `<strong>` |

### Step 3: Apply Template Structure

Generate the complete HTML document with:

**Document Head**
- UTF-8 charset
- Document title: `[Solution Name] - Solution Design Brief`
- Complete CSS from template (do not modify styles)

**Header Section**
- White logo bar with NetSuite logo
- Teal title bar with "Solution Design Brief"
- Metadata grid: Customer, Solution, Solution Code, Date, Revision, Prepared By

**Main Content**
- All 10 sections in order
- Proper semantic HTML structure
- Tables formatted consistently

**Footer**
- NetSuite logo (smaller, semi-transparent)
- Copyright line: `© [YEAR] Oracle | NetSuite`
- LLM disclaimer line

### Step 4: Output

**Output the complete, self-contained HTML document.** 

- If a canvas/artifact system is available: Output to a canvas artifact
- If no canvas is available: Output the full HTML inline in a code block

The HTML should be ready to save as a `.html` file and open in any browser.

## HTML Template Reference

Use this exact CSS and structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>[Solution Name] - Solution Design Brief</title>
  <style>
    :root {
      --redwood-red: #C74634;
      --teal-primary: #1A5A6E;
      --teal-light: #4A8A9E;
      --dark-brown: #312D2A;
      --off-white: #FAF9F8;
      --white: #FFFFFF;
      --text-primary: #161513;
      --text-secondary: #6B6560;
      --border: #D4D1CD;
      --gold: #C4A456;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: var(--off-white); color: var(--text-primary); line-height: 1.6; font-size: 14px; }
    .container { max-width: 900px; margin: 0 auto; background: var(--white); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    header { padding: 0; }
    .logo-bar { background: var(--white); padding: 20px 40px; }
    .logo { height: 50px; }
    .title-bar { background: linear-gradient(135deg, var(--teal-primary) 0%, var(--teal-light) 100%); color: white; padding: 25px 40px; }
    .doc-title { font-size: 26px; font-weight: 300; margin-bottom: 20px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px; }
    .meta-item label { opacity: 0.7; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
    .meta-item .value { font-weight: 500; }
    main { padding: 40px; }
    section { margin-bottom: 30px; }
    h2 { color: var(--teal-primary); font-size: 16px; font-weight: 600; padding-bottom: 6px; border-bottom: 2px solid var(--redwood-red); margin-bottom: 12px; }
    h3 { color: var(--dark-brown); font-size: 14px; font-weight: 600; margin: 15px 0 8px 0; }
    p { margin-bottom: 10px; color: var(--text-secondary); }
    ul { margin: 8px 0 8px 20px; color: var(--text-secondary); }
    li { margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th { background: var(--teal-primary); color: white; padding: 8px 10px; text-align: left; font-weight: 500; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: top; }
    tr:nth-child(even) td { background: var(--off-white); }
    code { background: var(--off-white); padding: 1px 4px; border-radius: 3px; font-family: Consolas, monospace; font-size: 11px; color: var(--teal-primary); }
    .subsection { background: var(--off-white); padding: 15px; border-radius: 4px; margin: 12px 0; border-left: 3px solid var(--teal-primary); }
    .priority-high { color: var(--redwood-red); font-weight: 600; }
    .priority-med { color: var(--gold); font-weight: 600; }
    .priority-low { color: #1E8E3E; font-weight: 600; }
    footer { background: var(--dark-brown); color: rgba(255,255,255,0.6); padding: 20px 40px; font-size: 11px; text-align: center; }
    .footer-logo { height: 30px; margin-bottom: 10px; opacity: 0.8; }
  </style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo-bar">
      <img class="logo" src="[LOGO_URL]" alt="Oracle NetSuite">
    </div>
    <div class="title-bar">
      <div class="doc-title">Solution Design Brief</div>
      <div class="meta-grid">
        <div class="meta-item"><label>Customer</label><div class="value">[CUSTOMER]</div></div>
        <div class="meta-item"><label>Solution</label><div class="value">[SOLUTION_NAME]</div></div>
        <div class="meta-item"><label>Solution Code</label><div class="value">[SOLUTION_CODE]</div></div>
        <div class="meta-item"><label>Date</label><div class="value">[DATE]</div></div>
        <div class="meta-item"><label>Revision</label><div class="value">[REVISION]</div></div>
        <div class="meta-item"><label>Prepared By</label><div class="value">[PREPARED_BY]</div></div>
      </div>
    </div>
  </header>

  <main>
    <!-- SECTIONS 1-10 GO HERE -->
  </main>

  <footer>
    <img class="footer-logo" src="[LOGO_URL]" alt="Oracle NetSuite">
    <div>© [YEAR] Oracle | NetSuite</div>
    <div style="margin-top: 8px;">Document generated via LLM-assisted authoring • Human review recommended before finalization</div>
  </footer>
</div>
</body>
</html>
```

## Section Rendering Rules

### Section 1: Summary
- Render as `<p>` tags (one per paragraph)
- No bullet points or lists

### Section 2: Solution Goals
- Render as `<ul>` with `<li>` items
- Preserve any bold emphasis with `<strong>`

### Section 3: Business Process & Industry Fit
- Two separate tables: Industry and Business Process Areas
- Each table has single column with header

### Section 4: Exception from Standard Functionality
- Render as `<ul>` with `<li>` items
- Bold the feature name with `<strong>`, followed by colon and description

### Section 5: Functional Requirements
- Render as `<table>` with columns: ID, Requirement, Priority, Source
- Apply priority CSS classes:
  - High → `class="priority-high"`
  - Medium → `class="priority-med"`
  - Low → `class="priority-low"`

### Section 6: Assumptions
- Render as `<ul>` with `<li>` items

### Section 7: Use Cases
- Render as `<table>` with columns: ID, Req, Role, Use Case

### Section 8: Technical Design
- Contains subsections 8.1 through 8.7
- Each subsection uses `<h3>` heading
- Mix of paragraphs, tables, and lists per subsection
- Wrap code/IDs in `<code>` tags (script IDs, field IDs, etc.)

### Section 9: Test Cases
- Render as `<table>` with columns: ID, Req, UC, Description, Expected Result

### Section 10: AI Use Opportunities
- Opening paragraph(s) as `<p>` tags
- Bullet list of opportunities as `<ul>`

## Quality Checklist

Before outputting, verify:

- [ ] All 10 sections present and numbered correctly
- [ ] Header metadata populated from markdown frontmatter
- [ ] All tables have proper header rows
- [ ] Priority values have correct CSS classes
- [ ] Code/IDs wrapped in `<code>` tags
- [ ] Logo URLs in both header and footer
- [ ] Copyright year is correct
- [ ] HTML is valid and well-formed
- [ ] No markdown syntax remains in output

## Example Transformation

**Markdown Input:**
```markdown
## 5. Functional Requirements

| ID | Requirement Statement | Priority | Source |
|----|----------------------|----------|--------|
| FR1 | System shall validate EDI orders against customer master | High | Interview 1/15 |
| FR2 | System shall apply contract pricing automatically | Medium | Interview 1/15 |
```

**HTML Output:**
```html
<section id="requirements">
  <h2>5. Functional Requirements</h2>
  <table>
    <tr><th>ID</th><th>Requirement</th><th>Priority</th><th>Source</th></tr>
    <tr><td>FR1</td><td>System shall validate EDI orders against customer master</td><td class="priority-high">High</td><td>Interview 1/15</td></tr>
    <tr><td>FR2</td><td>System shall apply contract pricing automatically</td><td class="priority-med">Medium</td><td>Interview 1/15</td></tr>
  </table>
</section>
```

## Interaction Model

This agent operates in **single-pass mode**:

1. Receive the approved markdown document
2. Parse and transform to HTML
3. Output complete HTML document

No clarifying questions are needed—the markdown is already approved. If the markdown is malformed or missing required sections, note the issues in a comment at the top of the HTML but still produce the best possible output.

## Remember

Your job is pure transformation—faithful, accurate rendering of approved content into a polished HTML format. Do not:
- Add content not in the source markdown
- Remove or summarize content
- Change technical details or requirements
- Reorder sections

Produce a document that looks professional and is ready for customer delivery.

-----------------------------------------  PROMPT END -------------------------------------
---------------- TEMPLATE START --------------------------
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Solution Design Brief</title>
  <style>
    :root {
      --redwood-red: #C74634;
      --teal-primary: #1A5A6E;
      --teal-light: #4A8A9E;
      --dark-brown: #312D2A;
      --off-white: #FAF9F8;
      --white: #FFFFFF;
      --text-primary: #161513;
      --text-secondary: #6B6560;
      --border: #D4D1CD;
      --gold: #C4A456;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: var(--off-white); color: var(--text-primary); line-height: 1.6; font-size: 14px; }
    .container { max-width: 900px; margin: 0 auto; background: var(--white); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    header { padding: 0; }
    .logo-bar { background: var(--white); padding: 20px 40px; }
    .logo { height: 50px; }
    .title-bar { background: linear-gradient(135deg, var(--teal-primary) 0%, var(--teal-light) 100%); color: white; padding: 25px 40px; }
    .doc-title { font-size: 26px; font-weight: 300; margin-bottom: 20px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px; }
    .meta-item label { opacity: 0.7; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
    .meta-item .value { font-weight: 500; }
    main { padding: 40px; }
    section { margin-bottom: 30px; }
    h2 { color: var(--teal-primary); font-size: 16px; font-weight: 600; padding-bottom: 6px; border-bottom: 2px solid var(--redwood-red); margin-bottom: 12px; }
    h3 { color: var(--dark-brown); font-size: 14px; font-weight: 600; margin: 15px 0 8px 0; }
    p { margin-bottom: 10px; color: var(--text-secondary); }
    ul { margin: 8px 0 8px 20px; color: var(--text-secondary); }
    li { margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th { background: var(--teal-primary); color: white; padding: 8px 10px; text-align: left; font-weight: 500; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: top; }
    tr:nth-child(even) td { background: var(--off-white); }
    code { background: var(--off-white); padding: 1px 4px; border-radius: 3px; font-family: Consolas, monospace; font-size: 11px; color: var(--teal-primary); }
    .subsection { background: var(--off-white); padding: 15px; border-radius: 4px; margin: 12px 0; border-left: 3px solid var(--teal-primary); }
    .priority-high { color: var(--redwood-red); font-weight: 600; }
    .priority-med { color: var(--gold); font-weight: 600; }
    .priority-low { color: #1E8E3E; font-weight: 600; }
    footer { background: var(--dark-brown); color: rgba(255,255,255,0.6); padding: 20px 40px; font-size: 11px; text-align: center; }
    .footer-logo { height: 30px; margin-bottom: 10px; opacity: 0.8; }
  </style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo-bar">
      <img class="logo" src="https://system.netsuite.com/authentication/ui/loginpage/assets/logo/NetSuite-logo-mobius.svg" alt="Oracle NetSuite">
    </div>
    <div class="title-bar">
      <div class="doc-title">Solution Design Brief</div>
      <div class="meta-grid">
      <div class="meta-item"><label>Customer</label><div class="value">Acme Corporation</div></div>
      <div class="meta-item"><label>Solution</label><div class="value">Advanced Order Automation</div></div>
      <div class="meta-item"><label>Solution Code</label><div class="value">AOA-2025-001</div></div>
      <div class="meta-item"><label>Date</label><div class="value">2025-01-22</div></div>
      <div class="meta-item"><label>Revision</label><div class="value">1.0</div></div>
      <div class="meta-item"><label>Prepared By</label><div class="value">D. Riccardi via LLM</div></div>
    </div>
    </div>
  </header>

  <main>
    <section id="summary">
      <h2>1. Summary</h2>
      <p>This solution provides automated order processing capabilities for Acme Corporation's wholesale distribution operations. The system integrates with existing EDI workflows to validate incoming orders, apply customer-specific pricing rules, and route orders for fulfillment based on inventory availability and warehouse proximity.</p>
      <p>By automating these previously manual processes, the solution reduces order processing time from 4 hours to under 15 minutes while eliminating data entry errors that historically resulted in a 3% order correction rate.</p>
    </section>

    <section id="benefits">
      <h2>2. Solution Goals</h2>
      <ul>
        <li>Reduce order processing time by 85% (from 4 hours to ~15 minutes)</li>
        <li>Eliminate manual data entry errors, reducing order corrections from 3% to &lt;0.5%</li>
        <li>Enable same-day shipping for orders received before 2 PM</li>
        <li>Improve customer satisfaction through faster order confirmation</li>
        <li>Free up 2 FTE from manual order entry for higher-value activities</li>
      </ul>
    </section>

    <section id="business-fit">
      <h2>3. Business Process &amp; Industry Fit</h2>
      <h3>Customer Industry</h3>
      <table><tr><th>Industry</th></tr><tr><td>Wholesale Distribution</td></tr><tr><td>Manufacturing</td></tr></table>
      <h3>Applicable Business Process Areas</h3>
      <table><tr><th>Business Process Area</th></tr><tr><td>Order to Cash</td></tr><tr><td>Inventory Management</td></tr><tr><td>EDI Integration</td></tr></table>
    </section>

    <section id="exceptions">
      <h2>4. Exception from Standard Functionality</h2>
      <ul>
        <li><strong>Standard Order Entry:</strong> Does not support automated pricing tier selection based on customer contract terms</li>
        <li><strong>Inventory Allocation:</strong> Native allocation does not consider warehouse proximity to shipping destination</li>
        <li><strong>EDI Processing:</strong> Standard inbound EDI requires manual review; this solution adds validation rules</li>
      </ul>
    </section>

    <section id="requirements">
      <h2>5. Functional Requirements</h2>
      <table>
        <tr><th>ID</th><th>Requirement</th><th>Priority</th><th>Source</th></tr>
        <tr><td>FR1</td><td>System shall automatically validate inbound EDI 850 orders against customer master data</td><td class="priority-high">High</td><td>Interview 1/15</td></tr>
        <tr><td>FR2</td><td>System shall apply contract-specific pricing based on customer tier and order volume</td><td class="priority-high">High</td><td>Interview 1/15</td></tr>
        <tr><td>FR3</td><td>System shall route orders to optimal warehouse based on inventory and proximity</td><td class="priority-med">Medium</td><td>Interview 1/16</td></tr>
        <tr><td>FR4</td><td>System shall generate exception report for orders failing validation</td><td class="priority-high">High</td><td>Interview 1/15</td></tr>
        <tr><td>FR5</td><td>System shall send order confirmation within 5 minutes of successful processing</td><td class="priority-med">Medium</td><td>Interview 1/16</td></tr>
      </table>
    </section>

    <section id="assumptions">
      <h2>6. Assumptions</h2>
      <ul>
        <li>Customer master data is current and accurately reflects contract pricing tiers</li>
        <li>EDI trading partner IDs are correctly mapped to NetSuite customer records</li>
        <li>Inventory counts are updated in real-time via existing WMS integration</li>
        <li>All warehouses have shipping carrier integrations configured</li>
        <li>Business rules for warehouse selection will be provided by Acme operations team</li>
      </ul>
    </section>

    <section id="use-cases">
      <h2>7. Use Cases</h2>
      <table>
        <tr><th>ID</th><th>Req</th><th>Role</th><th>Use Case</th></tr>
        <tr><td>UC1</td><td>FR1, FR2</td><td>EDI Coordinator</td><td>As an EDI Coordinator, I want inbound orders automatically validated and priced so that I only review exceptions rather than every order.</td></tr>
        <tr><td>UC2</td><td>FR3</td><td>Warehouse Mgr</td><td>As a Warehouse Manager, I want orders routed to my facility based on inventory and proximity so that we minimize shipping costs and time.</td></tr>
        <tr><td>UC3</td><td>FR4</td><td>EDI Coordinator</td><td>As an EDI Coordinator, I want a daily exception report so that I can quickly resolve order issues.</td></tr>
        <tr><td>UC4</td><td>FR5</td><td>Customer</td><td>As a Customer, I want rapid order confirmation so that I can plan my operations with confidence.</td></tr>
      </table>
    </section>

    <section id="technical">
      <h2>8. Technical Design</h2>
      
      <h3>8.1 Technical Design Summary</h3>
      <p>The solution uses a Map/Reduce script to process inbound EDI orders in batches, with a User Event script to handle real-time order modifications. A Suitelet provides a management dashboard for exception handling. All scripts share a common library for pricing calculations and warehouse selection logic.</p>

      <h3>8.2 Objects</h3>
      <table>
        <tr><th>Name</th><th>ID</th><th>Type</th><th>Description</th><th>Dependencies</th></tr>
        <tr><td>Order Routing Rule</td><td><code>customrecord_order_routing</code></td><td>Custom Record</td><td>Stores warehouse routing rules</td><td>None</td></tr>
        <tr><td>Processing Status</td><td><code>custbody_proc_status</code></td><td>Body Field</td><td>Tracks automation status</td><td>Sales Order</td></tr>
        <tr><td>Exception Reason</td><td><code>custbody_exception_reason</code></td><td>Body Field</td><td>Stores validation failure reason</td><td>Sales Order</td></tr>
      </table>

      <h3>8.3 Configuration Parameters</h3>
      <table>
        <tr><th>Parameter</th><th>Location</th><th>Type</th><th>Default</th><th>Description</th></tr>
        <tr><td>Enable Auto-Processing</td><td>Script Parameter</td><td>Checkbox</td><td>True</td><td>Master switch for automation</td></tr>
        <tr><td>Max Distance (mi)</td><td>Settings Record</td><td>Integer</td><td>500</td><td>Maximum warehouse-to-customer distance</td></tr>
        <tr><td>Confirmation Email Template</td><td>Script Parameter</td><td>List/Record</td><td>—</td><td>Email template for confirmations</td></tr>
      </table>

      <h3>8.4 Required Features</h3>
      <table>
        <tr><th>Feature</th><th>Setting</th><th>Purpose</th></tr>
        <tr><td>Advanced Shipping</td><td>Enabled</td><td>Multi-warehouse fulfillment</td></tr>
        <tr><td>SuiteScript 2.1</td><td>Enabled</td><td>Script execution</td></tr>
      </table>

      <h3>8.5 Scripts</h3>
      <table>
        <tr><th>Name</th><th>ID</th><th>Type</th><th>Libraries</th><th>Entry Points</th></tr>
        <tr><td>Order Processor</td><td><code>customscript_order_proc_mr</code></td><td>Map/Reduce</td><td>aoa_lib.js</td><td>getInputData, map, reduce, summarize</td></tr>
        <tr><td>Order Validation</td><td><code>customscript_order_val_ue</code></td><td>User Event</td><td>aoa_lib.js</td><td>beforeSubmit</td></tr>
        <tr><td>Exception Dashboard</td><td><code>customscript_exception_sl</code></td><td>Suitelet</td><td>aoa_lib.js</td><td>onRequest</td></tr>
      </table>

      <h3>8.6 Error Handling</h3>
      <ul>
        <li><strong>Validation Errors:</strong> Order flagged with exception reason; added to daily report</li>
        <li><strong>System Errors:</strong> Logged to custom record; email alert to admin</li>
        <li><strong>Recovery:</strong> Failed orders can be reprocessed via dashboard</li>
      </ul>

      <h3>8.7 Performance &amp; Expected Volumes</h3>
      <p>The Map/Reduce architecture supports high-volume processing with built-in governance management. Orders are processed in batches of 100 to optimize API usage.</p>
      <table>
        <tr><th>Metric</th><th>Expected</th><th>Frequency</th></tr>
        <tr><td>Orders Processed</td><td>500-800</td><td>Per day</td></tr>
        <tr><td>Peak Hour Volume</td><td>150</td><td>9-10 AM EST</td></tr>
        <tr><td>Avg Processing Time</td><td>2 sec</td><td>Per order</td></tr>
      </table>
    </section>

    <section id="test-cases">
      <h2>9. Test Cases</h2>
      <table>
        <tr><th>ID</th><th>Req</th><th>UC</th><th>Description</th><th>Expected Result</th></tr>
        <tr><td>TC1</td><td>FR1</td><td>UC1</td><td>Submit valid EDI order with known customer</td><td>Order created with correct pricing</td></tr>
        <tr><td>TC2</td><td>FR1</td><td>UC3</td><td>Submit EDI order with unknown customer ID</td><td>Exception logged; appears on report</td></tr>
        <tr><td>TC3</td><td>FR3</td><td>UC2</td><td>Submit order with multi-warehouse inventory</td><td>Routed to nearest warehouse with stock</td></tr>
        <tr><td>TC4</td><td>FR5</td><td>UC4</td><td>Process valid order end-to-end</td><td>Confirmation email within 5 minutes</td></tr>
      </table>
    </section>

    <section id="ai-opportunities">
      <h2>10. AI Use Opportunities</h2>
      <p>Several aspects of this solution could benefit from AI/ML enhancement in future phases, particularly around demand prediction and exception handling automation.</p>
      <ul>
        <li><strong>Demand Forecasting:</strong> Predict order volumes to pre-position inventory</li>
        <li><strong>Exception Resolution:</strong> Auto-suggest corrections for common validation failures</li>
        <li><strong>Anomaly Detection:</strong> Flag unusual order patterns for fraud review</li>
        <li><strong>Natural Language:</strong> Allow customer service to query order status via chat</li>
      </ul>
    </section>
  </main>

  <footer>
    <img class="footer-logo" src="https://system.netsuite.com/authentication/ui/loginpage/assets/logo/NetSuite-logo-mobius.svg" alt="Oracle NetSuite">
    <div>© 2026 Oracle | NetSuite</div>
    <div style="margin-top: 8px;">Document generated via LLM-assisted authoring • Human review recommended before finalization</div>
  </footer>
</div>
</body>
</html>
----------------------------------------- TEMPLATE END ------------------------------