# 070 Market-to-ROI - Deployment Guide

**Configuration Area**: Campaign Management, Promotions, Customer Segmentation
**SDF Project**: Custom Fields collection
**Deployment Status**: Ready
**Last Updated**: 2026-02-04

---

## Pre-Deployment Checklist

Before deploying the 070 Market-to-ROI configuration, ensure:

- [ ] NetSuite account has MARKETING feature enabled
- [ ] Custom field limits not exceeded (check account limits)
- [ ] Dependencies completed:
  - [ ] 030.010 - Customer Categories & Custom Fields
  - [ ] 040.010 - Item Master Setup
  - [ ] 4010.010 - Custom Customer Fields
  - [ ] 4010.030 - Custom Transaction Fields
- [ ] Stakeholder review and approval obtained
- [ ] Open questions resolved (see README.md)

---

## SDF Objects to Deploy

All objects are located in: `sdf/Custom Fields collection/src/Objects/`

### Custom Lists (4 objects)

1. **customlist_ns_campaign_categories.xml**
   - 16 campaign channel categories
   - Used for: Campaign management and reporting

2. **customlist_ns_promo_stacking_groups.xml**
   - 4 stacking groups (Discount, Shipping, Gift, Loyalty)
   - Used for: Promotion stacking rule enforcement

3. **customlist_ns_promo_channels.xml**
   - 6 sales channels
   - Used for: Promotion channel targeting

4. **customlist_ns_rfm_segments.xml**
   - 9 RFM-based customer segments
   - Used for: Customer segmentation and targeting

### Custom Entity Fields - Customer (4 objects)

5. **custentity_ns_rfm_segment.xml**
   - Customer's assigned RFM segment
   - Auto-populated by scheduled script

6. **custentity_ns_rfm_recency_score.xml**
   - RFM Recency score (1-5)
   - Auto-calculated by scheduled script

7. **custentity_ns_rfm_frequency_score.xml**
   - RFM Frequency score (1-5)
   - Auto-calculated by scheduled script

8. **custentity_ns_rfm_monetary_score.xml**
   - RFM Monetary score (1-5)
   - Auto-calculated by scheduled script

### Custom Entity Fields - Campaign (1 object)

9. **custentity_ns_campaign_channel.xml**
   - Campaign's primary marketing channel
   - Used on Campaign records

### Custom Transaction Body Fields (2 objects)

10. **custbody_ns_promotion_code_used.xml**
    - Promotion/coupon code entered by customer
    - Populated at order entry

11. **custbody_ns_promotion_discount_amt.xml**
    - Total discount amount from promotions
    - Calculated when promotion applied

**Total: 11 SDF objects**

---

## Deployment Steps

### Step 1: Setup SDF Project Account

```powershell
cd "sdf/Custom Fields collection/src"
suitecloud account:setup
```

Select the target NetSuite account (sandbox or production).

### Step 2: Validate Objects

```powershell
cd "sdf/Custom Fields collection/src"
suitecloud project:validate --server
```

Review validation output. Fix any errors before proceeding.

### Step 3: Deploy to NetSuite

```powershell
cd "sdf/Custom Fields collection/src"
suitecloud project:deploy
```

Select objects to deploy:
- All 11 new `ns_*` objects listed above

Confirm deployment when prompted.

### Step 4: Verify Deployment

**In NetSuite UI**:

1. **Custom Lists**:
   - Navigate to: Customization > Lists, Records, & Fields > Custom Lists
   - Verify: NS Campaign Categories, NS Promotion Stacking Groups, NS Promotion Channels, NS RFM Segments

2. **Customer Fields**:
   - Navigate to: Customization > Lists, Records, & Fields > Entity Fields
   - Verify: RFM Segment, RFM Recency Score, RFM Frequency Score, RFM Monetary Score
   - Check: "Applies To" = Customer

3. **Campaign Fields**:
   - Navigate to: Customization > Lists, Records, & Fields > Entity Fields
   - Verify: Campaign Channel
   - Check: "Applies To" = Campaign (or verify in Campaign record form)

4. **Transaction Fields**:
   - Navigate to: Customization > Lists, Records, & Fields > Transaction Body Fields
   - Verify: Promotion Code Used, Promotion Discount Amount
   - Check: "Applies To" includes Sales Order, Invoice, Cash Sale

### Step 5: Configure Campaign Record Form

**Add Campaign Channel field to Campaign form**:

1. Navigate to: Customization > Forms > Entry Forms
2. Find: Campaign Standard Form
3. Edit form
4. Add field: "Campaign Channel" to appropriate tab/subtab
5. Save form

### Step 6: Configure Customer Record Form

**Add RFM fields to Customer form**:

1. Navigate to: Customization > Forms > Entry Forms
2. Find: Customer Standard Form
3. Edit form
4. Create new subtab: "Segmentation" or add to existing "Marketing" tab
5. Add fields:
   - RFM Segment
   - RFM Recency Score
   - RFM Frequency Score
   - RFM Monetary Score
6. Set fields to "Inline Text" display type (read-only since auto-populated)
7. Save form

### Step 7: Configure Transaction Forms

**Add Promotion fields to Sales Order form**:

1. Navigate to: Customization > Forms > Transaction Forms
2. Find: Sales Order Standard Form
3. Edit form
4. Add fields to "Marketing" or "Promotions" subtab:
   - Promotion Code Used
   - Promotion Discount Amount
5. Save form

Repeat for:
- Invoice form
- Cash Sale form

---

## Post-Deployment Configuration

### 1. Create Native Campaign Records

**Test Campaign Setup**:

1. Navigate to: Marketing > Campaigns > New Campaign
2. Create test campaign:
   - Name: "Test Campaign - 2026 Q1"
   - Category: Email Marketing
   - Status: Planning
   - Campaign Channel: Email Marketing (from custom field)
   - Start Date: Today
   - Budget: $1,000
3. Save and verify custom field appears

### 2. Create Native Promotions

**Test Promotion Setup**:

1. Navigate to: Setup > Marketing > Promotions > New
2. Create test promotion:
   - Name: "Test - 20% Off"
   - Promotion Code: TEST20
   - Discount: 20% off
   - Start Date: Today
   - End Date: 30 days from today
3. Save and test applying to order

### 3. Build Campaign Performance Saved Search

**Create Campaign ROI Report**:

1. Navigate to: Reports > Saved Searches > New > Campaign
2. Criteria:
   - Status: Active, Completed
3. Results Columns:
   - Campaign Name
   - Campaign Channel (custom field)
   - Start Date, End Date
   - Expected Cost
   - Revenue (formula: sum of related transaction amounts)
   - Orders (formula: count of related transactions)
   - ROI % (formula: (Revenue - Cost) / Cost × 100)
4. Available Filters: Date Range, Channel, Status
5. Save as: "Campaign Performance Dashboard"

### 4. Build Segment Distribution Saved Search

**Create Customer Segmentation Report**:

1. Navigate to: Reports > Saved Searches > New > Customer
2. Criteria:
   - Is Inactive: False
   - Has Transactions: True
3. Results Columns:
   - RFM Segment (custom field) - GROUP BY
   - Customer Count (summary: COUNT)
   - Total Lifetime Value (summary: SUM of transaction amounts)
   - Average Lifetime Value (summary: AVG of transaction amounts)
4. Save as: "Customer Segment Distribution"

### 5. Create Dashboard Portlets

**Campaign Performance Portlet**:
- Type: Saved Search
- Search: "Campaign Performance Dashboard"
- Chart Type: Bar chart (Revenue by Campaign)

**Segment Distribution Portlet**:
- Type: Saved Search
- Search: "Customer Segment Distribution"
- Chart Type: Pie chart (Customer Count by Segment)

Add to Marketing Dashboard or Executive Dashboard.

---

## Scheduled Script Development

### RFM Segment Update Script

**Script Details**:
- Script ID: `customscript_ns_rfm_segment_update`
- Script Type: Scheduled Script
- Schedule: Daily at 2:00 AM
- Frequency: Daily

**Script File**: `rfm_segment_update_ss.js`

**Deployment**:
1. Develop SuiteScript (see 070.030-Customer-Segmentation.md for pseudocode)
2. Upload to FileCabinet: `SuiteScripts/marketing/rfm_segment_update_ss.js`
3. Create Script Record
4. Create Deployment Record
5. Set schedule: Daily, 2:00 AM
6. Activate deployment

**Testing**:
1. Run script manually (one-time execution)
2. Verify RFM scores calculated for sample customers
3. Verify segments assigned correctly
4. Check execution logs for errors

---

## Integration Setup

### Klaviyo (Email Marketing)

**Requirements**:
- Klaviyo account and API key
- Integration connector (Celigo or custom)

**Configuration**:
1. Install Klaviyo-NetSuite connector (if using packaged solution)
2. Configure API credentials
3. Map fields:
   - NetSuite Campaign External ID → Klaviyo Campaign ID
   - Customer RFM Segment → Klaviyo Custom Property
4. Set sync schedule: Real-time for customer data, daily for campaign metrics
5. Test campaign creation and metric sync

### Google Ads

**Requirements**:
- Google Ads account
- Google Ads API access
- UTM parameter capture on website

**Configuration**:
1. Configure UTM parameter capture on Shopify
2. Map UTM parameters to NetSuite campaign fields via integration
3. Set up batch import for Google Ads metrics (daily)
4. Test UTM tracking on sample order

### Facebook/Instagram Ads

**Requirements**:
- Facebook Business Manager account
- Facebook Marketing API access

**Configuration**:
1. Set up Facebook Marketing API integration
2. Map Facebook Campaign ID to NetSuite External ID field
3. Configure daily batch import for campaign metrics
4. Test metric import

### Shopify (E-commerce)

**Requirements**:
- Shopify Plus account
- NetSuite-Shopify connector

**Configuration**:
1. Sync NetSuite promotions to Shopify discount codes
2. Configure bidirectional sync:
   - NetSuite → Shopify: Promotion codes, date ranges, usage limits
   - Shopify → NetSuite: Orders with promotion codes, UTM parameters
3. Test promotion code application at Shopify checkout
4. Verify promotion code syncs back to NetSuite on order

### Lightspeed POS

**Requirements**:
- Lightspeed Retail account
- NetSuite-Lightspeed integration

**Configuration**:
1. Enable promotion code entry at POS
2. Configure real-time validation with NetSuite:
   - POS sends code to NetSuite for validation
   - NetSuite returns discount amount or error
3. Sync promotion usage back to NetSuite with transaction
4. Test promotion code entry at store POS

---

## Training Plan

### Marketing Team Training (2 hours)

**Topics**:
- Creating and managing campaigns in NetSuite
- Understanding campaign attribution and ROI tracking
- Using customer segments for targeting
- Interpreting RFM scores
- Campaign performance dashboards

**Hands-On**:
- Create test campaign
- Link order to campaign
- Run campaign performance report
- Identify VIP customers using segment search

### Merchandising Team Training (2 hours)

**Topics**:
- Creating and managing promotions
- Setting promotion stacking rules
- Configuring channel restrictions and date ranges
- Setting usage limits
- Monitoring promotion performance

**Hands-On**:
- Create % off promotion
- Create BOGO promotion
- Test promotion stacking scenarios
- Run promotion performance report

### Store Team Training (1 hour)

**Topics**:
- Entering promotion codes at POS
- Handling promotion errors
- Linking transactions to campaigns (in-store events)
- Identifying VIP customers

**Hands-On**:
- Apply promotion code at POS
- Handle "code not found" error
- Look up customer's RFM segment

---

## Rollback Plan

**If deployment causes issues**:

### Option 1: Disable Fields (Quick)

1. Navigate to each custom field
2. Set "Display Type" = "Hidden"
3. Fields remain in database but hidden from users

### Option 2: Remove from Forms (Medium)

1. Edit Campaign, Customer, and Transaction forms
2. Remove new custom fields from forms
3. Fields remain in system but not visible

### Option 3: Delete Objects (Full Rollback)

1. Navigate to: Customization > Lists, Records, & Fields
2. Delete custom fields (ensure no data dependencies)
3. Delete custom lists
4. **Warning**: This deletes all data in these fields

**Recommendation**: Use Option 1 or 2 for quick rollback without data loss.

---

## Success Criteria

**Deployment is successful when**:

- [ ] All 11 SDF objects deployed without errors
- [ ] Campaign Channel field visible on Campaign record
- [ ] RFM fields visible on Customer record
- [ ] Promotion fields visible on Sales Order
- [ ] Test campaign created successfully
- [ ] Test promotion applied to order successfully
- [ ] Campaign performance report displays data
- [ ] Segment distribution report displays data
- [ ] RFM scheduled script runs without errors
- [ ] Integrations sync data successfully (Klaviyo, Google Ads, Shopify, POS)
- [ ] Users trained and can perform basic tasks

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Field does not appear on form"
- **Solution**: Edit form layout, add custom field to appropriate subtab

**Issue**: "Promotion code not validating"
- **Solution**: Check promotion date range, usage limits, channel restrictions

**Issue**: "RFM scores not updating"
- **Solution**: Check scheduled script execution logs, verify script deployment is active

**Issue**: "Campaign revenue not calculating"
- **Solution**: Verify transactions have Campaign Source field populated, check saved search formula

### Contact

**Technical Issues**:
- IT Team / SuiteScript Developer

**Business/Configuration Questions**:
- Marketing Team (campaigns, segments)
- Merchandising Team (promotions)

**Integration Issues**:
- Integration Specialist

---

## Next Phase

After successful deployment and testing:

1. Develop remaining SuiteScripts:
   - Promotion validation script
   - BOGO logic (if complex scenarios)
   - Campaign metrics import RESTlet

2. Build remaining reports:
   - Top performing campaigns
   - Campaign attribution analysis
   - Segment movement tracking
   - Promotion discount impact

3. Refine processes:
   - Campaign naming conventions
   - Promotion approval workflows
   - Segment-based campaign targeting

4. Monitor and optimize:
   - Review campaign ROI monthly
   - Adjust RFM thresholds quarterly
   - Optimize promotion stacking rules based on usage

---

**Deployment Guide Version**: 1.0
**Last Updated**: 2026-02-04
**Status**: Ready for Deployment
