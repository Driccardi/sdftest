# Customer Engagement & Marketing Analytics Suite

**Version**: 1.0 | **By**: NetSuite Professional Services

---

## Description

The Customer Engagement & Marketing Analytics Suite is a foundational customization package that bridges customer service operations with marketing analytics. It provides the data infrastructure needed to support complex case management workflows while simultaneously enabling sophisticated customer segmentation for targeted marketing campaigns.

This solution addresses two critical business needs: streamlining customer service case handling with structured action steps and approval workflows, and providing marketing teams with RFM (Recency, Frequency, Monetary) analytics to identify high-value customer segments. The package includes 33 custom objects including fields, records, lists, and searches that work together to capture and analyze customer interactions across all sales channels.

Organizations gain immediate value through improved case resolution tracking, promotion effectiveness measurement, and data-driven customer segmentation that drives personalized marketing strategies and optimized customer retention programs.

---

## Solution Details

### Solution Type
- **Sales & CRM**

### Target Industries
- **Retail**
- **Wholesale Distribution**

### Dependencies
- None (standalone field collection)

---

## Features

### Case Management Hub (CSHUB)
Provides comprehensive case tracking with custom records for case actions, case steps, status management, and return reasons, enabling structured customer service workflows.

### RFM Customer Segmentation
Tracks Recency, Frequency, and Monetary scores on customer records to enable sophisticated segmentation analysis and targeted marketing campaigns.

### Promotion Tracking System
Captures promotion codes and discount amounts on transactions, linking to multi-channel campaign categories for full promotion attribution analysis.

### Multi-Channel Campaign Attribution
Supports 16 marketing channels including email, social media platforms, paid search, influencer, referral, and traditional channels for comprehensive campaign tracking.

### Return & Adjustment Workflows
Includes GL reason codes, return reason tracking, and inventory adjustment workflows with approval capabilities for sensitive case types.

### Flexible Rendering Options
Supports both flat and hierarchical transaction structure rendering for complex case scenarios with parent-child relationships.

### Item-Level Case Detail Tracking
Links case actions to specific transaction line items with unique line key tracking for precise issue resolution.

### Price-Based Promotion Targeting
Includes minimum and maximum price constraints on promotions for sophisticated pricing strategy implementation.

---

## Technical Details

### Script Files
**None** - This is a pure configuration package with no SuiteScript files.

### Custom Records

**customrecord_cshub_caseactions** - Case Actions/Scenarios
- Configuration repository for case automation scenarios
- Supports flat vs hierarchical rendering modes
- Includes approval workflow configurations

**customrecord_cshub_caseactionstep** - Case Action Steps
- Individual workflow steps within case actions
- Supports step sequencing and status tracking

**customrecord_cshub_casedetails** - Case Details
- Detailed case information tracking (currently inactive)

**customrecord_cshub_casestatus** - Case Status
- Case lifecycle status management

**customrecord_cshub_glreasoncodes** - GL Reason Codes
- Inventory adjustment reason code tracking for financial reporting

**customrecord_cshub_returnreasons** - Return Reasons
- Standardized return reason codes for RMA/case scenarios

**customrecord_cshub_mr_config** - Map/Reduce Configuration
- Multi-request/batch processing configuration

### Workflows
**Workflow Integration**: Custom lists support case action status workflows and step type definitions

### Custom Fields

**Transaction Body Fields (11 total)**:
- `custbody_cshub_case_type` - Case type classification
- `custbody_cshub_createdfromcasedetail` - Case detail origin tracking
- `custbody_ns_promotion_code_used` - Promotion code capture
- `custbody_ns_promotion_discount_amt` - Discount amount tracking

**Transaction Line Fields (3 total)**:
- `custcol_cshub_associatedlineid` - Line item association for cases
- `custcol_ns_lineparentkey` / `custcol_ns_linechildkey` - Parent-child line relationships

**Entity Fields (5 total - RFM Analytics)**:
- `custentity_ns_rfm_recency_score` - Days since last purchase score
- `custentity_ns_rfm_frequency_score` - Purchase frequency score
- `custentity_ns_rfm_monetary_score` - Total spending score
- `custentity_ns_rfm_segment` - Calculated customer segment
- `custentity_ns_campaign_channel` - Primary campaign channel

**Event Fields (3 total)**:
- `custevent_cshub_case_type` - Case type on events/activities
- `custevent_cshub_casedtls_scrpt_use` - Script usage flag
- `custevent_cshub_casestep_array_ids` - Case step array tracking

**Item Fields (1 total)**:
- `custitem_ns_ss_sunglass_model_tags` - Product tagging for sunglasses/eyewear

### Saved Searches
- **customsearch_cshub_lineuniquekey** - Line item unique key search (system-generated)
- **customsearch_cshub_mr_reexecute_cas** - Map-reduce re-execution search
- **customsearch_cshub_ue_002_caseactionstep** - Case action step user event search

### Other Objects
- **Custom Lists**: 8 lists including campaign categories (16 channels), promotion channels (6 options), RFM segments, case action statuses, and utility lists

---

## System Requirements

### NetSuite Version
- **Minimum**: 2020.1
- **Recommended**: Latest stable release

### NetSuite Edition
- **Required**: N/A (compatible with all editions)

### Required Features
- **Custom Records** (required)
- **Classes** (optional, enhances case categorization)
- **Marketing** (optional, enhances campaign features)

### Optional Features
- **Advanced Customer Support** - Enhances case management workflows
- **SuiteAnalytics** - Enables advanced RFM reporting and segmentation analysis

---

## Installation

### Prerequisites
1. NetSuite account with Administrator or Developer role access
2. SuiteCloud Development Framework (SDF) CLI installed
3. Custom Records feature enabled in NetSuite account

### Deployment Steps

1. **Navigate to Project**
   ```bash
   cd "sdf/Custom Fields collection/src"
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
   # Use auth ID: next-products
   ```

3. **Validate Project**
   ```bash
   suitecloud project:validate --server
   ```

4. **Deploy to NetSuite**
   ```bash
   suitecloud project:deploy
   ```

5. **Post-Deployment Configuration**
   - Populate RFM segment list values based on your segmentation strategy
   - Configure campaign category mappings for your marketing channels
   - Set up return reason codes specific to your business
   - Define GL reason codes for inventory adjustments
   - Configure case action scenarios for your support workflows

---

## Usage

### Getting Started

After deployment, the field collection becomes available across relevant NetSuite records. Configure custom record data (RFM segments, campaign categories, return reasons) before beginning data entry.

### Common Workflows

**RFM Customer Segmentation**
1. Run scheduled analytics to calculate RFM scores for all customers
2. Populate `custentity_ns_rfm_*` fields based on purchase history
3. Assign customers to segments using `custentity_ns_rfm_segment`
4. Create targeted campaigns based on segment characteristics

**Case Management Workflow**
1. Customer service rep creates case record with case type
2. System looks up matching case action scenario from `customrecord_cshub_caseactions`
3. Case steps are created from `customrecord_cshub_caseactionstep` template
4. Rep follows step sequence, updating status through custom lists
5. Approval workflows trigger for sensitive case types
6. Case resolution creates appropriate transactions (credit memos, RMAs, refunds)

**Promotion Tracking**
1. Sales order captures promotion code in `custbody_ns_promotion_code_used`
2. Discount amount recorded in `custbody_ns_promotion_discount_amt`
3. Campaign channel assigned for attribution
4. Reporting aggregates promotion effectiveness by channel and code

### User Roles

- **Customer Service Representatives**: Create and manage case records, follow case action steps
- **Marketing Analysts**: Configure RFM segments, analyze campaign attribution data
- **Finance Team**: Review GL reason codes, approve case credits/refunds
- **Inventory Managers**: Use return reason codes for inventory adjustment tracking

---

## Configuration

### Settings

**RFM Segmentation Configuration**:
- Define segment thresholds in `customlist_ns_rfm_segments` (e.g., Champions, Loyal, At Risk, Lost)
- Set recency/frequency/monetary scoring algorithms (typically implemented via scheduled script)

**Case Management Configuration**:
- Create case action scenario records with rendering type (flat/hierarchical)
- Define case step sequences with status values
- Configure approval thresholds for refund suppression

**Campaign Channel Mapping**:
- Map internal campaign codes to standard channel list (`customlist_ns_campaign_categories`)
- Configure promotion stacking groups for compatible offers

### Customization

Fields can be added to custom forms as needed. Consider hiding locked fields (line parent/child keys) from user view while keeping them on forms for script access.

---

## Support & Documentation

### Resources
- **Repository**: Local SDF project in `/sdf/Custom Fields collection/`
- **Documentation**: NetSuite SuiteAnswers for custom record best practices

### Contact
- **Manager**: NetSuite Professional Services

---

## Technical Architecture

### Component Overview

```
NetSuite Transaction Records
    ↓
Custom Fields (Body/Line/Entity)
    ↓
Custom Records (Cases, Actions, Steps) ↔ Custom Lists (Statuses, Segments)
    ↓
Saved Searches (Data Retrieval)
    ↓
Reporting & Analytics
```

### Data Flow

**Case Management Flow**:
1. Transaction creates case detail record
2. Case links to case action scenario
3. Case action steps are instantiated
4. Status updates flow through custom lists
5. Completion triggers transaction creation (credit memo, RMA, etc.)

**RFM Analytics Flow**:
1. Purchase history analyzed via scheduled script
2. RFM scores calculated and stored on customer entity
3. Segment assignment based on score thresholds
4. Marketing campaigns target specific segments
5. Campaign attribution captured on resulting sales orders

### Integration Points

- **Sales Orders**: Promotion tracking, case creation, line-level case association
- **Invoices**: Case type tracking, discount capture
- **Credit Memos**: Return reason codes, case resolution
- **Return Authorizations**: Case detail linkage, GL reason codes
- **Customers**: RFM scores, segment assignment, campaign channel
- **Inventory Adjustments**: GL reason code tracking

---

## Changelog

### Version 1.0
- 33 custom objects deployed
- Case management hub foundation (7 custom records)
- RFM segmentation fields (5 entity fields + 1 custom list)
- Promotion tracking (2 body fields, 2 custom lists)
- Multi-channel campaign attribution (16-channel custom list)
- 3 saved searches for case workflows
- 8 custom lists for workflow support

---

## Credits

**Developed by**: NetSuite Professional Services
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: 2026-02-04
