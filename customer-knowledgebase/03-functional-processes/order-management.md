# Order Management Process - SunStyle Retail

## Process Overview

**Process Name**: Order-to-Cash (O2C)
**Process Owner**: VP Digital Operations
**Last Updated**: 2026-01-20
**Version**: 1.3

## Purpose

The Order Management Process encompasses all activities from customer order placement through fulfillment and payment collection. This process ensures accurate, timely order processing and exceptional customer experience.

## Scope

### In Scope
- Order placement (all channels)
- Order validation and fraud screening
- Payment authorization and capture
- Order fulfillment (picking, packing, shipping)
- Order tracking and customer notifications
- Returns and exchanges
- Customer inquiries related to orders

### Out of Scope
- Product pricing (covered in Merchandising process)
- Inventory replenishment (covered in Inventory Management process)
- Customer acquisition (covered in Marketing process)

## Process Flow

### 1. Order Placement

#### 1.1 Customer Initiates Order
**Channels**: E-commerce website, mobile app, in-store POS, phone

**Steps**:
1. Customer browses product catalog
2. Customer adds products to cart
3. Customer proceeds to checkout
4. System validates cart (inventory availability, pricing)
5. Customer provides/confirms shipping address
6. Customer selects shipping method
7. Customer provides payment information
8. Customer reviews and confirms order

**Systems**: E-commerce Platform, POS System, Inventory Management System

**Inputs**:
- Customer information (profile or guest)
- Product selections (SKUs, quantities)
- Shipping address
- Payment information
- Promotional codes (if applicable)

**Outputs**:
- Order confirmation number
- Estimated delivery date
- Order receipt

**Business Rules**:
- Minimum order: $0 (no minimum)
- Maximum order: $10,000 (fraud prevention threshold)
- Prescription orders require valid prescription upload
- International orders not currently supported

**Metrics**:
- Checkout abandonment rate: Target < 70%
- Average checkout time: Target < 3 minutes
- Checkout error rate: Target < 2%

#### 1.2 Order Validation
**Responsible**: System (automated)

**Steps**:
1. Verify customer information (email, phone format)
2. Validate shipping address (USPS Address Validation API)
3. Confirm inventory availability (real-time check)
4. Verify pricing and promotional codes
5. Calculate tax and shipping costs
6. Check order against fraud rules

**Systems**: Order Management System, Fraud Detection System

**Inputs**:
- Order details from checkout
- Customer profile data
- Real-time inventory data

**Outputs**:
- Validated order
- Order total (with tax and shipping)
- Fraud risk score

**Business Rules**:
- Orders with fraud score > 75 flagged for manual review
- Address must validate through USPS API
- Inventory must be available at time of order
- Promotional codes validated against active campaigns

**Metrics**:
- Validation success rate: Target > 95%
- Fraud detection accuracy: Target > 90%
- Address validation rate: Target > 98%

#### 1.3 Payment Processing
**Responsible**: Payment Gateway (Stripe)

**Steps**:
1. Tokenize payment information (PCI compliance)
2. Authorize payment with card issuer
3. Reserve funds (authorization hold)
4. Store authorization code
5. If declined: notify customer and request alternative payment

**Systems**: Payment Gateway (Stripe), Order Management System

**Inputs**:
- Payment information (tokenized)
- Order total
- Customer billing address

**Outputs**:
- Authorization code
- Transaction ID
- Payment status (authorized, declined, error)

**Business Rules**:
- Payment authorization must succeed before order confirmation
- Authorization valid for 7 days
- 3 failed payment attempts lock the order
- Alternative payment methods offered after decline

**Metrics**:
- Payment authorization rate: Target > 95%
- Payment processing time: Target < 10 seconds
- Payment error rate: Target < 1%

#### 1.4 Order Confirmation
**Responsible**: System (automated)

**Steps**:
1. Generate unique order number
2. Capture payment (convert authorization to charge)
3. Create order record in OMS
4. Reserve inventory
5. Send confirmation email to customer
6. Update customer purchase history
7. Credit loyalty points (if applicable)

**Systems**: Order Management System, Email Service, CRM

**Inputs**:
- Validated order
- Payment authorization
- Customer email address

**Outputs**:
- Order number
- Order confirmation email
- Order record in database

**Business Rules**:
- Order number format: SS-YYYYMMDD-######
- Confirmation email sent within 5 minutes
- Inventory reserved immediately upon confirmation
- Loyalty points credited within 24 hours

**Metrics**:
- Order confirmation rate: Target 100% of validated orders
- Email delivery rate: Target > 98%
- Time to confirmation: Target < 5 minutes

### 2. Order Fulfillment

#### 2.1 Fulfillment Routing
**Responsible**: Order Management System (automated)

**Steps**:
1. Determine optimal fulfillment location:
   - Check warehouse inventory
   - Check store inventory (proximity to shipping address)
   - Calculate shipping costs and delivery times
   - Consider store sales performance (avoid stockouts in high-traffic stores)
2. Assign order to fulfillment location
3. Create pick list / work order
4. Notify fulfillment team

**Systems**: Order Management System, Inventory Management System

**Inputs**:
- Order details
- Inventory availability (all locations)
- Customer shipping address
- Carrier rates and service levels

**Outputs**:
- Fulfillment location assignment
- Pick list
- Estimated ship date

**Business Rules**:
- Warehouse fulfills if in stock (default)
- Ship from nearest store if warehouse out of stock
- Split shipment if items in different locations (avoid if possible)
- Same-day shipping for orders placed before 2 PM (local time)

**Metrics**:
- Fulfillment routing accuracy: Target > 98%
- Same-day shipping rate: Target > 90%
- Split shipment rate: Target < 10%
- Average fulfillment location distance: Target < 200 miles

#### 2.2 Order Picking
**Responsible**: Warehouse/Store Associates

**Steps**:
1. Receive pick list (digital or printed)
2. Locate products in warehouse/store
   - Use bin location from IMS
   - Scan barcode to verify correct item
3. Pick quantity specified
4. Scan picked items to confirm
5. Place items in staging area
6. Mark pick list complete

**Systems**: Inventory Management System, Mobile Picking App

**Inputs**:
- Pick list with order details
- Bin locations
- Barcodes/SKUs

**Outputs**:
- Picked items (staged for packing)
- Pick confirmation in system
- Inventory adjustment (reserved → picked)

**Business Rules**:
- Barcode scan required for each item (accuracy)
- Substitutions not allowed without customer approval
- Out-of-stock items reported immediately
- Damaged items reported and replaced

**Metrics**:
- Picking accuracy: Target > 99%
- Average pick time per order: Target < 15 minutes
- Out-of-stock during pick rate: Target < 2%
- Picking productivity: Target 30 items/hour

#### 2.3 Order Packing
**Responsible**: Warehouse/Store Associates

**Steps**:
1. Receive picked items from staging
2. Inspect items for damage/defects
3. Select appropriate packaging:
   - Box size based on items
   - Protective materials (bubble wrap, padding)
   - Eco-friendly packaging (when available)
4. Pack items securely
5. Include packing slip
6. Seal package
7. Affix shipping label
8. Scan package to confirm ready to ship

**Systems**: Order Management System, Shipping Integration

**Inputs**:
- Picked items
- Packing slip
- Shipping label
- Packaging materials

**Outputs**:
- Packed package
- Shipping label affixed
- Package scan confirmation

**Business Rules**:
- All items inspected before packing
- Packing slip includes order number, items, return instructions
- Fragile items require additional protection
- Maximum package weight: 50 lbs
- SunStyle branded packaging for all shipments

**Metrics**:
- Packing accuracy: Target > 99.5%
- Average pack time per order: Target < 10 minutes
- Damage rate in transit: Target < 0.5%
- Packaging cost per order: Target < $3

#### 2.4 Shipping
**Responsible**: Carrier (FedEx, UPS, USPS)

**Steps**:
1. Carrier picks up packages (scheduled daily pickup)
2. Scan package for shipment tracking
3. Generate tracking number
4. Update order status to "Shipped"
5. Send shipment notification to customer (email, SMS)
6. Provide tracking link

**Systems**: Shipping Integration, Order Management System, Email/SMS Service

**Inputs**:
- Packed packages
- Shipping labels
- Carrier pickup schedule

**Outputs**:
- Tracking number
- Shipment notification
- Updated order status

**Business Rules**:
- Carrier selection based on shipping method chosen
- Tracking number required for all shipments
- Shipment notification sent within 1 hour of carrier scan
- Signature required for orders > $500

**Metrics**:
- On-time shipment rate: Target > 95%
- Tracking notification delivery rate: Target > 98%
- Average time from order to ship: Target < 24 hours
- Carrier performance (on-time delivery): Target > 90%

#### 2.5 Delivery
**Responsible**: Carrier

**Steps**:
1. Carrier transports package
2. Deliver to customer address
3. Obtain signature (if required)
4. Scan package as delivered
5. Update tracking status
6. Send delivery confirmation to customer

**Systems**: Carrier tracking system, Order Management System

**Inputs**:
- Shipped package
- Delivery address
- Tracking information

**Outputs**:
- Delivered package
- Delivery confirmation
- Signature (if applicable)

**Business Rules**:
- Standard shipping: 5-7 business days
- Expedited shipping: 2-3 business days
- Express shipping: 1-2 business days
- Leave at door if no signature required
- Signature required for high-value orders

**Metrics**:
- On-time delivery rate: Target > 90%
- Delivery accuracy (correct address): Target > 99%
- Lost/damaged package rate: Target < 0.5%
- Customer satisfaction with delivery: Target > 4.5/5

### 3. Post-Fulfillment

#### 3.1 Order Completion
**Responsible**: System (automated)

**Steps**:
1. Receive delivery confirmation from carrier
2. Update order status to "Delivered"
3. Send delivery confirmation to customer
4. Request product review (automated email, 3 days after delivery)
5. Calculate and credit employee commissions
6. Close order in OMS

**Systems**: Order Management System, Email Service, Employee System

**Inputs**:
- Delivery confirmation
- Order details
- Customer email

**Outputs**:
- Order marked as delivered
- Review request email
- Commission credited to employee

**Business Rules**:
- Order automatically marked delivered based on tracking
- Review request sent 3 days after delivery
- Commissions calculated based on order total and employee role
- Order archived after 90 days

**Metrics**:
- Order completion rate: Target 100% of delivered orders
- Review request response rate: Target > 10%
- Commission calculation accuracy: Target 100%

### 4. Returns and Exchanges

#### 4.1 Return Initiation
**Responsible**: Customer / Customer Service

**Steps**:
1. Customer initiates return:
   - Self-service portal (preferred)
   - Contact customer service (phone, email, chat)
   - In-store return
2. Verify return eligibility:
   - Within 30-day return window
   - Product in resalable condition
   - Original tags/packaging intact
3. Select return reason
4. Choose refund method (original payment, store credit, exchange)
5. Generate Return Merchandise Authorization (RMA)
6. Provide return shipping label (if online/mail return)

**Systems**: Order Management System, Customer Portal, Email Service

**Inputs**:
- Order number
- Reason for return
- Customer preference (refund/exchange)

**Outputs**:
- RMA number
- Return shipping label
- Return instructions

**Business Rules**:
- 30-day return window from delivery date
- Product must be unworn and in original condition
- Prescription items: non-returnable (unless defective)
- Free return shipping
- Exchanges processed as return + new order

**Metrics**:
- Return rate: Target < 5% of orders
- Return initiation time: Target < 5 minutes
- Return eligibility approval rate: Target > 90%

#### 4.2 Return Receipt and Inspection
**Responsible**: Warehouse/Store Associates

**Steps**:
1. Receive returned package
2. Verify RMA number
3. Inspect returned items:
   - Verify product matches order
   - Check condition (resalable, damaged, defective)
   - Verify all components included
4. Determine disposition:
   - Resalable: Return to stock
   - Damaged: Dispose or return to vendor
   - Defective: Warranty claim with manufacturer
5. Update inventory
6. Process refund/exchange

**Systems**: Order Management System, Inventory Management System

**Inputs**:
- Returned package
- RMA number
- Original order details

**Outputs**:
- Inspection results
- Inventory adjustment
- Refund/exchange processed

**Business Rules**:
- Inspection within 24 hours of receipt
- Damaged items not restocked
- Defective items trigger vendor notification
- Items not matching RMA rejected (customer notified)

**Metrics**:
- Inspection time: Target < 2 hours
- Restocking rate: Target > 80% of returns
- Inspection accuracy: Target > 95%

#### 4.3 Refund Processing
**Responsible**: Finance Team / System (automated)

**Steps**:
1. Confirm return inspection approved
2. Calculate refund amount:
   - Product cost
   - Shipping (if applicable)
   - Tax
   - Restocking fee (if applicable)
3. Process refund to original payment method
4. Reverse loyalty points (if applicable)
5. Send refund confirmation to customer

**Systems**: Order Management System, Payment Gateway, Email Service

**Inputs**:
- Approved return
- Original order payment details
- Refund amount

**Outputs**:
- Refund processed
- Refund confirmation email
- Updated financial records

**Business Rules**:
- Refund to original payment method (credit card, PayPal, etc.)
- Refund processed within 3 business days of approval
- Restocking fee: $0 (currently waived)
- Shipping costs refunded for defective/wrong items only

**Metrics**:
- Refund processing time: Target < 3 business days
- Refund accuracy: Target 100%
- Customer satisfaction with returns: Target > 4/5

## Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| Customer | Place order, provide accurate information, receive shipment |
| System (Automated) | Order validation, payment processing, routing, notifications |
| Warehouse Associates | Picking, packing, quality control |
| Store Associates | In-store sales, store fulfillment, in-store returns |
| Customer Service | Order inquiries, return processing, issue resolution |
| Finance Team | Payment reconciliation, refund processing |
| Carrier | Shipping, delivery, tracking |

## Key Performance Indicators (KPIs)

| KPI | Target | Current | Frequency |
|-----|--------|---------|-----------|
| Order Accuracy | > 99% | 99.2% | Daily |
| On-Time Fulfillment | > 90% | 92% | Daily |
| Order-to-Ship Time | < 24 hours | 18 hours | Daily |
| Return Rate | < 5% | 3.5% | Weekly |
| Customer Satisfaction (CSAT) | > 4.5/5 | 4.6/5 | Weekly |
| Net Promoter Score (NPS) | > 70 | 72 | Monthly |

## Process Improvements

### Recent Improvements (Last 6 months)
1. Implemented ship-from-store capability (reduced delivery time by 1 day)
2. Added real-time inventory visibility across all locations
3. Automated return label generation (reduced customer service load)
4. Enhanced fraud detection rules (reduced fraudulent orders by 30%)

### Planned Improvements (Next 6 months)
1. Same-day delivery pilot in select markets
2. Subscription service for contact lens customers
3. Buy Online, Return In-Store (BORIS) capability
4. Predictive shipping based on purchase patterns

## Related Documents
- FR-OMS-001: Order Creation (Functional Requirements)
- FR-OMS-002: Order Fulfillment (Functional Requirements)
- FR-OMS-003: Order Status and Tracking (Functional Requirements)
- FR-OMS-004: Returns and Exchanges (Functional Requirements)
- SOP-WH-001: Warehouse Picking and Packing Procedures
- SOP-CS-002: Customer Service Order Handling

---
*Status: Approved*
*Last Updated: 2026-01-20*
*Version: 1.3*
*Process Owner: Sarah Mitchell, VP Digital Operations*
