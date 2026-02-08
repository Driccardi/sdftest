# NetSuite Objects Reference

Guide to NetSuite SDF object types and their implications for solution cataloging.

## Script Types

### User Event Scripts (usereventscript)
- **File Pattern**: `customscript_*.xml` with `<usereventscript>` root
- **Purpose**: Automate record operations (before load, submit, delete)
- **Catalog Implications**: Core business logic, data validation, automation
- **Key Fields**:
  - `<recordtype>`: Which record this operates on
  - `<executioncontext>`: When it runs
  - `<scriptfile>`: Associated .js file

### Client Scripts (clientscript)
- **File Pattern**: `customscript_*.xml` with `<clientscript>` root
- **Purpose**: Browser-side validation, field changes, page init
- **Catalog Implications**: User interface enhancements, real-time validation
- **Feature Keywords**: "Interactive", "Real-time", "Field validation"

### Scheduled Scripts (scheduledscript)
- **File Pattern**: `customscript_*.xml` with `<scheduledscript>` root
- **Purpose**: Batch processing, data updates, integrations
- **Catalog Implications**: Automation, bulk operations, scheduled tasks
- **Feature Keywords**: "Automated", "Batch processing", "Scheduled"

### Suitelet Scripts (suitelet)
- **File Pattern**: `customscript_*.xml` with `<suitelet>` root
- **Purpose**: Custom pages and forms
- **Catalog Implications**: Custom UI, user portals, specialized interfaces
- **Feature Keywords**: "Custom interface", "User portal", "Dashboard"

### RESTlet Scripts (restlet)
- **File Pattern**: `customscript_*.xml` with `<restlet>` root
- **Purpose**: REST API endpoints for integrations
- **Catalog Implications**: Third-party integration, API access, external systems
- **Feature Keywords**: "API integration", "External connectivity", "RESTful"

### Map/Reduce Scripts (mapreducescript)
- **File Pattern**: `customscript_*.xml` with `<mapreducescript>` root
- **Purpose**: Large-scale data processing
- **Catalog Implications**: Big data handling, performance optimization
- **Feature Keywords**: "Scalable processing", "High-volume", "Parallel processing"

### Workflow Action Scripts (workflowactionscript)
- **File Pattern**: `customscript_*.xml` with `<workflowactionscript>` root
- **Purpose**: Custom actions within workflows
- **Catalog Implications**: Process automation, approval logic
- **Feature Keywords**: "Workflow automation", "Approval process"

## Record Types

### Custom Records (customrecordtype)
- **File Pattern**: `customrecord*.xml`
- **Purpose**: Store custom data structures
- **Catalog Implications**: Data models, specialized tracking
- **Common Use Cases**:
  - Approval queues
  - Audit logs
  - Configuration tables
  - Master data
- **Feature Keywords**: Based on record name (e.g., "customrecord_approval" → "Approval Management")

### Custom Fields (customfield*)
- **Types**: customfield, entitycustomfield, transactionbodycustomfield, etc.
- **Purpose**: Extend standard records
- **Catalog Implications**: Data capture requirements, industry-specific fields

### Custom Segments (customsegment)
- **Purpose**: Custom GL segment dimensions
- **Catalog Implications**: Advanced accounting, multi-dimensional reporting
- **Industry**: Typically Construction, Professional Services, Nonprofit

## UI Objects

### Custom Forms (form, entryForm, transactionForm)
- **Purpose**: Customized record entry screens
- **Catalog Implications**: User experience improvements, guided data entry

### Portlets (portlet)
- **Purpose**: Dashboard widgets
- **Catalog Implications**: Reporting, analytics, KPI tracking
- **Feature Keywords**: "Dashboard", "Real-time metrics", "Visual analytics"

### Saved Searches (savedsearch)
- **Purpose**: Reusable queries and reports
- **Catalog Implications**: Reporting capabilities, data analysis

## Workflow Objects

### Workflows (workflow)
- **File Pattern**: `workflow*.xml`
- **Purpose**: Automate business processes
- **Catalog Implications**: Business process automation
- **Key Elements**:
  - `<workflowstates>`: Process stages
  - `<workflowtransitions>`: State changes
  - `<workflowactions>`: Automated actions
- **Feature Keywords**: "Automated workflow", "Multi-stage approval", "Process automation"

## Integration Objects

### Bundle Dependencies
- **Location**: `manifest.xml` `<dependencies>` section
- **Purpose**: Required bundles or features
- **Catalog Implications**: Add to `depends_on` field

## Record Type Indicators for Industry

### Financial Management
- Record types: journalentry, customsegment, revenuerecognition
- Modules: N/financial, N/revenue

### Inventory & Warehouse
- Record types: item, binnumber, inventorytransfer, itemfulfillment
- Modules: N/inventory, N/warehouse

### Professional Services
- Record types: project, projecttask, timebill, expensereport
- Modules: N/project, N/time

### Sales & CRM
- Record types: customer, opportunity, estimate, salesorder
- Modules: N/sales, N/crm

### Manufacturing
- Record types: workorder, assemblybuild, manufacturingoperationtask
- Modules: N/manufacturing

### Construction
- Record types: job, projecttask, customsegment (for job costing)
- Fields: job-related fields, WIP tracking

## Script Execution Context Patterns

### CLIENT Context
- User interface interactions
- Real-time validation
- Field changes

### USEREVENT Context
- Business logic enforcement
- Data validation
- Related record updates

### SCHEDULED Context
- Batch processing
- Data synchronization
- Cleanup tasks

### RESTLET Context
- External integrations
- API endpoints
- Third-party connectivity

### MAPREDUCE Context
- Large dataset processing
- Performance-intensive operations
- Bulk updates

## Feature Inference Patterns

### Compliance Features
- Keywords: "ASC 606", "GAAP", "IFRS", "SOX", "audit", "compliance"
- Objects: Custom audit records, journal entry workflows

### Integration Features
- RESTlets present
- External API calls in scripts
- Scheduled sync scripts

### Reporting Features
- Multiple saved searches
- Portlets
- Suitelets with charts/graphs

### Approval Workflows
- Workflow objects with states/transitions
- Custom approval records
- Email notification actions

### Mobile Features
- Execution contexts include MOBILE
- Client scripts with mobile-specific logic

## Analysis Tips

1. **Start with manifest.xml**: Gets project metadata and dependencies
2. **Scan Objects/ directory**: Count and categorize object types
3. **Read main scripts first**: Largest/most complex often contain core logic
4. **Look for patterns**: Multiple related objects indicate feature areas
5. **Check record types**: Indicates which NetSuite modules are extended
6. **Review deployment settings**: Shows scope and user roles
