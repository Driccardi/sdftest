# 070 - Market-to-ROI Configuration

**Process Area**: Marketing Campaign Management & Promotion Execution
**Configuration Count**: 3 detailed configurations
**Total Estimated Effort**: 30 hours
**Priority**: Medium
**Status**: Ready for Implementation

---

## Overview

The Market-to-ROI process area configures comprehensive marketing campaign management, promotion engine, and customer segmentation capabilities for SunStyle Retail. This enables data-driven marketing decisions, personalized customer experiences, and measurable campaign ROI.

### Business Value

- **Campaign Tracking**: Track marketing initiatives across email, social media, in-store events, influencer partnerships, and paid search
- **Promotion Engine**: Flexible discount management supporting % off, $ off, BOGO, free shipping, and gift with purchase
- **Customer Segmentation**: RFM (Recency, Frequency, Monetary) analysis to identify VIP, loyal, at-risk, new, and lapsed customers
- **ROI Measurement**: Calculate marketing ROI by linking campaigns to revenue and tracking performance metrics
- **Personalization**: Target campaigns and promotions to specific customer segments and channels

---

## Configuration Components

### 070.010 - Campaign Management Setup

**File**: `070.010-Campaign-Management.md`
**Effort**: 10 hours

Configures campaign tracking across multiple marketing channels:

**Key Features**:
- Campaign categories (Email, Social Media, In-Store Events, Influencer, Paid Search, etc.)
- Campaign performance tracking (revenue, orders, customers, ROI, cost per order)
- Multi-touch attribution (first-touch and last-touch campaign tracking)
- Integration with Klaviyo (email), Google Ads, Facebook Ads
- UTM parameter capture from web orders
- Campaign dashboards and reports

**Custom Objects Created**:
- Campaign custom fields (17 fields for tracking and metrics)
- Campaign categories custom list
- Campaign performance dashboard
- Campaign ROI reports

**Integration Points**:
- Klaviyo: Email campaign metrics sync
- Google Ads: Paid search performance tracking
- Facebook/Instagram: Social media campaign metrics
- Shopify: UTM parameters from web orders
- Lightspeed POS: In-store campaign tracking

---

### 070.020 - Promotion & Pricing Rules

**File**: `070.020-Promotion-Pricing-Rules.md`
**Effort**: 12 hours

Configures flexible promotion engine with stacking rules, channel targeting, and usage limits:

**Promotion Types Supported**:
1. **Percentage Off**: 20% off entire order or specific categories
2. **Dollar Off**: $10 off orders over $100
3. **BOGO**: Buy one get one 50% off
4. **Free Shipping**: Free shipping over $75
5. **Gift with Purchase**: Free case with premium sunglasses

**Key Features**:
- Promotion stacking rules (define which promotions can combine)
- Channel targeting (E-commerce, Mobile, In-Store, Phone, Wholesale)
- Date range scheduling (limited-time, seasonal, evergreen, flash sales)
- Usage limits (total redemptions, per-customer limits, new customer only)
- Coupon code management (public multi-use codes, unique single-use codes)
- Customer qualification rules (by category, loyalty tier, segment, location)
- Item qualification rules (by category, brand, price, SKU)
- Promotion priority and conflict resolution
- Margin protection rules (max discount limits, approval workflows)

**Custom Objects Created**:
- Promotion stacking groups list
- Promotion channels list
- Transaction fields for promotion tracking
- Promotion performance reports

---

### 070.030 - Customer Segmentation

**File**: `070.030-Customer-Segmentation.md`
**Effort**: 8 hours

Configures RFM-based customer segmentation for targeted marketing:

**Customer Segments**:
1. **VIP Champions**: High-value, frequent buyers (Lifetime Value > $2K)
2. **Loyal Customers**: Consistent repeat buyers ($500-$2K LTV)
3. **At-Risk**: Previously active, now declining engagement
4. **New Customers**: First purchase within last 90 days
5. **Lapsed Customers**: Inactive 365+ days
6. **One-Time Buyers**: Single purchase, 90-365 days ago
7. **High-Potential Prospects**: Recent high-value buyers showing engagement

**RFM Analysis Framework**:
- **Recency Score** (1-5): Days since last purchase
  - 5: 0-30 days, 4: 31-90 days, 3: 91-180 days, 2: 181-365 days, 1: 365+ days
- **Frequency Score** (1-5): Total order count
  - 5: 10+ orders, 4: 5-9 orders, 3: 3-4 orders, 2: 2 orders, 1: 1 order
- **Monetary Score** (1-5): Lifetime value
  - 5: $2K+, 4: $1K-$2K, 3: $500-$1K, 2: $100-$500, 1: <$100

**Automated Segment Assignment**:
- Scheduled SuiteScript runs daily at 2:00 AM
- Calculates RFM scores for all customers
- Assigns segment based on combined RFM score
- Triggers campaign actions on segment changes
- Updates customer records automatically

**Use Cases**:
- VIP event invitations (trunk shows, exclusive previews)
- Win-back campaigns for lapsed customers
- New customer onboarding email series
- At-risk retention programs
- Targeted promotions by segment

**Custom Objects Created**:
- RFM segment custom list (9 segments)
- Customer RFM score fields (recency, frequency, monetary)
- Customer segment field (auto-assigned)
- Segment distribution dashboard
- Segment performance reports
- Segment movement tracking

---

## SDF Objects Created

All SDF objects have been created in the **"Custom Fields collection"** SDF project:

`sdf/Custom Fields collection/src/Objects/`

### Custom Lists (4)

1. **customlist_ns_campaign_categories.xml**
   - 16 campaign channel values (Email, Social Media, Paid Search, In-Store, Influencer, etc.)

2. **customlist_ns_promo_stacking_groups.xml**
   - 4 stacking groups (Discount, Shipping, Gift, Loyalty)

3. **customlist_ns_promo_channels.xml**
   - 6 sales channels (E-commerce, Mobile App, In-Store, Phone, Wholesale, All Channels)

4. **customlist_ns_rfm_segments.xml**
   - 9 customer segments (VIP Champions, Loyal, At-Risk, New, Lapsed, etc.)

### Custom Entity Fields - Customer (5)

1. **custentity_ns_rfm_segment.xml**
   - Customer's RFM-based segment

2. **custentity_ns_rfm_recency_score.xml**
   - Recency score (1-5)

3. **custentity_ns_rfm_frequency_score.xml**
   - Frequency score (1-5)

4. **custentity_ns_rfm_monetary_score.xml**
   - Monetary score (1-5)

### Custom Entity Fields - Campaign (1)

5. **custentity_ns_campaign_channel.xml**
   - Campaign's primary marketing channel

### Custom Transaction Fields (2)

6. **custbody_ns_promotion_code_used.xml**
   - Promotion/coupon code entered by customer

7. **custbody_ns_promotion_discount_amt.xml**
   - Total discount amount from promotions

---

## Dependencies

**Must Complete First**:
- 030.010 - Customer Categories & Custom Fields
- 040.010 - Item Master Setup
- 4010.010 - Custom Customer Fields (loyalty tier, preferences)
- 4010.030 - Custom Transaction Fields (campaign source field)

**Related Configurations**:
- 080.010 - Case Management (for campaign-related inquiries)
- 4030.010 - Order Approval Workflow (for high-discount approvals)
- 4050.010 - Sales Dashboards (campaign performance)

---

## Integration Requirements

### External Systems

**Klaviyo** (Email Marketing Platform):
- Outbound: Customer segments, email preferences, loyalty data, purchase history
- Inbound: Campaign performance metrics, unsubscribe updates
- Mapping: NetSuite Campaign External ID = Klaviyo Campaign ID

**Google Ads**:
- Outbound: Product catalog, inventory, pricing
- Inbound: Campaign metrics (impressions, clicks, cost), UTM parameters
- Mapping: NetSuite Campaign External ID = Google Ads Campaign ID

**Facebook/Instagram Ads**:
- Inbound: Campaign metrics (reach, impressions, cost), conversion data
- Mapping: NetSuite Campaign External ID = Facebook Campaign ID

**Shopify** (E-commerce):
- Sync promotion codes bidirectionally
- Capture UTM parameters from web orders
- Apply NetSuite promotions at checkout

**Lightspeed POS**:
- Enable promotion code entry at POS
- Real-time validation with NetSuite
- Sync usage back to NetSuite

---

## Implementation Timeline

### Week 1: Campaign Management Foundation
- Create campaign custom fields
- Build campaign categories list
- Configure campaign record form
- Ensure transaction-to-campaign linking functional
- Test campaign selection on orders

### Week 2: Campaign Performance & Integration
- Build campaign performance saved search
- Create dashboard portlets
- Test ROI calculations
- Configure Klaviyo integration
- Set up Google Ads/Facebook metrics import

### Week 3: Promotion Engine
- Create promotion custom fields and lists
- Define promotion stacking rules
- Build standard promotions (% Off, $ Off, Free Shipping)
- Configure channel targeting
- Test promotion validation logic

### Week 4: Advanced Promotions
- Implement BOGO logic (SuiteScript if needed)
- Configure GWP promotions
- Build coupon code generator for single-use codes
- Integrate with Shopify discount codes
- Sync with Lightspeed POS

### Week 5: Customer Segmentation
- Create RFM custom fields on customer record
- Define RFM scoring logic and segment mapping
- Develop scheduled SuiteScript for daily segment updates
- Test segment assignment on sample data
- Validate accuracy

### Week 6: Reporting & Training
- Create segment distribution dashboard
- Build segment performance reports
- Link segments to campaign targeting
- Train marketing team on segment-based campaigns
- Train merchandising team on promotion management
- End-to-end testing across all channels

---

## Testing Checklist

### Campaign Management
- [ ] Campaign record creation with all required fields
- [ ] Custom fields display correctly on campaign form
- [ ] Campaign categories list populated
- [ ] Campaign-to-transaction linking functional
- [ ] Campaign performance formulas calculate correctly
- [ ] Campaign dashboard displays accurate metrics
- [ ] Klaviyo integration syncs campaign data
- [ ] Google Ads UTM parameters captured on web orders
- [ ] Facebook campaign metrics imported
- [ ] Multi-touch attribution tracking works

### Promotion Engine
- [ ] Percentage discount promotion applies correctly
- [ ] Dollar off with minimum threshold validates
- [ ] BOGO logic discounts lower-priced item
- [ ] Free shipping applies when threshold met
- [ ] Gift with purchase adds free item to cart
- [ ] Stacking rules enforced (allowed and blocked scenarios)
- [ ] Channel restrictions work (online-only codes blocked at POS)
- [ ] Usage limits enforced (per customer, total redemptions)
- [ ] New customer qualification validates order history
- [ ] Promotion codes validate and display error messages
- [ ] Shopify discount codes sync bidirectionally
- [ ] POS promotion entry and validation functional

### Customer Segmentation
- [ ] RFM scores calculate correctly for sample customers
- [ ] Segment assignment matches expected logic
- [ ] Scheduled script runs daily without errors
- [ ] Saved searches return accurate segment lists
- [ ] Dashboard displays segment distribution
- [ ] Campaign targeting uses segments correctly
- [ ] Segment transitions trigger appropriate workflows
- [ ] Reports show segment performance metrics

---

## Training Requirements

### Marketing Team
- Creating and managing campaigns
- Tracking campaign performance and ROI
- Understanding campaign attribution (first-touch vs last-touch)
- Using campaign dashboards
- Generating coupon codes
- Analyzing promotion effectiveness
- Using customer segmentation for targeting
- Understanding RFM scoring and segments

### Merchandising Team
- Creating and managing promotions
- Setting date ranges and usage limits
- Configuring promotion stacking rules
- Setting channel restrictions
- Monitoring promotion performance
- Understanding margin impact

### Store Teams
- Entering promotion codes at POS
- Handling customer questions about offers
- Applying manager override for high discounts
- Linking in-store transactions to campaigns
- Reporting on in-store event success

### IT Team
- Integration with Shopify and POS
- Troubleshooting promotion validation issues
- Custom code development for complex BOGO scenarios
- Scheduled script monitoring (segment updates)
- Campaign data import from external platforms

---

## Success Metrics

### Campaign Management
- **Campaign Tracking**: 100% of marketing initiatives tracked in NetSuite
- **ROI Visibility**: Real-time ROI calculation for all active campaigns
- **Attribution Accuracy**: > 90% of orders attributed to campaign source
- **Marketing Efficiency**: Improve overall marketing ROI by 15% YoY

### Promotion Engine
- **Promotion Usage**: > 30% of orders use a promotion
- **Average Discount**: 15-20% (maintain healthy margin)
- **Promotion ROI**: > 2:1 (every $1 discount generates $2 incremental revenue)
- **Code Validation Time**: < 1 second (fast checkout)
- **Error Rate**: < 1% (accurate code validation)

### Customer Segmentation
- **Segment Coverage**: 100% of active customers assigned to segment
- **Segment Accuracy**: > 95% of customers in correct segment
- **Campaign Efficiency**: 20% improvement in campaign ROI using segmentation
- **Retention**: Reduce at-risk churn by 25%
- **Conversion**: Increase new-to-repeat customer rate by 15%

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| External platform API changes | Medium | Low | Use established connectors (Celigo), maintain fallback manual import |
| UTM parameter capture failure | High | Low | Implement multiple tracking methods (cookies, session data, manual entry) |
| Multi-touch attribution complexity | Medium | Medium | Start with last-touch, phase in first-touch later |
| BOGO implementation complexity | Medium | Medium | Start with native NetSuite, develop custom SuiteScript if needed |
| Promotion stacking confusion | Medium | Medium | Clear documentation, training, and error messages |
| Segment calculation performance | Low | Low | Run scheduled script during off-hours (2 AM), optimize queries |
| Marketing team adoption | Medium | Low | Comprehensive training, simple campaign creation process |
| ROI calculation accuracy | High | Low | Clearly define revenue attribution rules, validate with Finance |
| Integration downtime | Medium | Low | Cache promotion data locally at POS for offline mode |

---

## Open Questions / Decisions Needed

### Campaign Management
1. **Attribution Model**: Confirm preference for first-touch vs. last-touch vs. multi-touch weighted attribution
2. **Budget Approval Thresholds**: Confirm $5K and $10K thresholds appropriate
3. **Klaviyo Integration**: Confirm Klaviyo is primary email platform
4. **Influencer Tracking**: Confirm process for tracking partnerships (unique codes vs. landing pages)
5. **In-Store Event Tracking**: Confirm stores can capture campaign codes at POS

### Promotions
1. **BOGO Implementation**: Use native NetSuite or custom SuiteScript?
2. **Stacking Policy**: Confirm which promotions can stack (see matrix)
3. **Maximum Discount**: Confirm 40% max for retail/e-commerce
4. **Manager Override Process**: Confirm approval workflow and thresholds
5. **Single-Use Codes**: Volume needed? (Determines implementation approach)
6. **Influencer Codes**: Unique codes for each influencer partnership?

### Segmentation
1. **RFM Thresholds**: Confirm scoring thresholds (e.g., is $2K right for VIP?)
2. **Update Frequency**: Daily segment updates sufficient, or real-time needed?
3. **Segment Granularity**: 8 segments enough, or need more detailed sub-segments?
4. **Lifecycle Tracking**: Track full lifecycle history (audit trail of segment changes)?
5. **Predictive Modeling**: Interest in ML-based churn prediction (beyond RFM)?

---

## Deliverables

### Configuration Documents
- [x] 070.010-Campaign-Management.md (detailed configuration guide)
- [x] 070.020-Promotion-Pricing-Rules.md (detailed configuration guide)
- [x] 070.030-Customer-Segmentation.md (detailed configuration guide)
- [x] README.md (this summary document)

### SDF Objects
- [x] 4 Custom Lists (campaign categories, promo stacking, promo channels, RFM segments)
- [x] 5 Custom Customer Fields (RFM scores and segment)
- [x] 1 Custom Campaign Field (channel)
- [x] 2 Custom Transaction Fields (promotion code, discount amount)

### Scripts (To Be Developed)
- [ ] Scheduled Script: Daily RFM Segment Update (custscript_ns_rfm_segment_update)
- [ ] User Event Script: Promotion Validation (custscript_ns_promo_validation)
- [ ] SuiteScript: BOGO Logic (if complex scenarios needed)
- [ ] RESTlet: Campaign Metrics Import (for external platform integration)

### Reports & Dashboards
- [ ] Campaign Performance Dashboard
- [ ] Campaign ROI Summary Report
- [ ] Top Performing Campaigns Report
- [ ] Campaign Attribution Analysis Report
- [ ] Promotion Performance Report
- [ ] Discount Impact Report
- [ ] Segment Distribution Dashboard
- [ ] Segment Performance Report
- [ ] Segment Movement Report

---

## Maintenance & Optimization

### Monthly Tasks
- Review campaign performance with Marketing team
- Archive completed campaigns (status = completed, end date > 90 days)
- Update campaign categories if new channels added
- Reconcile campaign budgets vs. actual spend
- Review promotion effectiveness and adjust as needed
- Analyze segment distribution and trends

### Quarterly Tasks
- Audit campaign attribution accuracy
- Review and optimize saved searches/dashboards
- Update integration mappings if needed
- Benchmark channel performance
- Evaluate RFM thresholds and adjust if needed
- Review segment movement patterns

### Annual Tasks
- Evaluate new marketing platform integrations
- Review campaign naming conventions
- Update ROI calculation methodology if needed
- Train new marketing team members
- Assess need for advanced features (predictive modeling, AI-driven segmentation)

---

## Configuration Owners

**Campaign Management**:
- **Configuration Owner**: Sarah Mitchell (VP Digital Operations)
- **Technical Owner**: IT/Integration Team
- **Business Owner**: Marketing Team

**Promotion Engine**:
- **Configuration Owner**: Merchandising Team
- **Technical Owner**: IT/Integration Team
- **Business Owner**: Marketing Team

**Customer Segmentation**:
- **Configuration Owner**: Marketing Team (CRM Manager)
- **Technical Owner**: IT Team (SuiteScript development)
- **Business Owner**: VP Digital Operations

---

## Status & Next Steps

**Configuration Status**: ✅ Ready for Implementation

**SDF Objects Status**: ✅ Created and ready for deployment

**Next Steps**:
1. Review configuration documents with Marketing and Merchandising teams
2. Confirm open questions and business decisions
3. Set up NetSuite account for SDF project (suitecloud account:setup)
4. Validate SDF objects (suitecloud project:validate --server)
5. Deploy SDF objects to NetSuite (suitecloud project:deploy)
6. Develop scheduled SuiteScript for RFM segment updates
7. Configure integrations with Klaviyo, Google Ads, Facebook Ads
8. Build campaign and promotion reports/dashboards
9. Conduct end-to-end testing across all channels
10. Train marketing, merchandising, and store teams
11. Go live with pilot campaign and promotion
12. Monitor performance and optimize

---

**Document Version**: 1.0
**Last Updated**: 2026-02-04
**Prepared By**: NetSuite Implementation Team
**Status**: Ready for Stakeholder Review
