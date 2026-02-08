# Smart File Selector

**Version**: 1.00 | **By**: NetSuite Consulting Services

---

## Description

Customer service teams often waste valuable time searching for and manually attaching files when responding to customer inquiries. When sending emails from NetSuite, users must navigate to the File Cabinet or transaction record separately to locate relevant attachments, leading to inefficient workflows and potential errors in attaching the wrong files.

Smart File Selector solves this problem by adding an intelligent file picker button directly to email Message records. When composing or viewing an email, users can click the "Select Record Attachments" button to instantly view all files attached to the parent transaction. The solution presents files in a searchable table with file names, sizes, and upload dates, allowing users to select multiple files at once while automatically validating against NetSuite's email attachment size limits (15MB total, 10MB per file).

The result is faster email response times, improved accuracy in file attachment, and enhanced customer service quality. Sales teams can quickly send quotes and supporting documents, accounting teams can efficiently share invoices and statements, and support teams can rapidly provide documentation—all without leaving the email interface.

---

## Solution Details

### Solution Type
- **Workflow Automation**

### Target Industries
- **Wholesale Distribution**
- **Manufacturing**
- **Retail**
- **Professional Services**

### Dependencies
- None (standalone solution)

---

## Features

### One-Click File Selection Interface
Users can access all transaction-related files through a single button click on the Message record, eliminating manual navigation to File Cabinet or transaction records.

### Transaction File Browsing
Automatically retrieves and displays all files attached to the parent transaction with key metadata including file name, size (in MB), and upload date for easy identification.

### Bulk File Attachment
Select multiple files simultaneously using checkboxes with "Select All" functionality, dramatically reducing time spent attaching multiple documents to customer communications.

### Intelligent File Size Validation
Real-time validation ensures compliance with NetSuite email attachment limits, displaying warnings when individual files exceed 10MB or total selection exceeds 15MB, preventing failed email sends.

### Visual File Picker Modal
Clean, intuitive modal interface with sortable table view, responsive design, and clear visual feedback including total size counter and warning indicators.

### Seamless Email Integration
Selected files are automatically added to the Message record's media items, maintaining standard NetSuite email workflow while enhancing efficiency.

---

## Technical Details

### Script Files

**User Event Scripts** (1 file)
- `ns_ue_smart_file_selector.js` - beforeLoad script that adds file picker button and interface to Message records

### Custom Records
None - Solution leverages standard NetSuite Message records

### Workflows
None - Solution uses client-side JavaScript and server-side User Event script

### Custom Fields
- `custpage_ns_atch_msg_button` - Inline HTML field for file picker interface and functionality

### Saved Searches
None - Uses dynamic search within script to retrieve transaction files

### Other Objects
- **User Event Script Deployment**: Deployed to MESSAGE record type across all execution contexts and roles
- **Inline HTML Interface**: Custom modal with embedded CSS and JavaScript for file selection

---

## System Requirements

### NetSuite Version
- **Minimum**: 2021.1
- **Recommended**: Latest release

### NetSuite Edition
- **Required**: All editions supported

### Required Features
- None

### Optional Features
- None

---

## Installation

### Prerequisites
1. NetSuite account with Administrator or Developer role access
2. SuiteCloud Development Framework (SDF) CLI installed
3. Permission to deploy User Event scripts

### Deployment Steps

1. **Download Source**
   ```bash
   git clone [repository_url]
   cd SFS-SmartFileSelector-dev/smart-file-selector/src
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
   # Follow prompts to authenticate with your NetSuite account
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
   - No additional configuration required
   - Script automatically deploys to all roles and execution contexts
   - Verify deployment: Navigate to Customization > Scripting > Scripts > NS|UE|Smart File Email Selector

---

## Usage

### Getting Started

After deployment, the Smart File Selector automatically appears on all Message records when viewing or editing emails that are associated with transactions.

### Common Workflows

**Attaching Transaction Files to Customer Email**
1. Open or create a Message record associated with a transaction
2. Navigate to the "Attachments" tab
3. Click the "Select Record Attachments" button
4. Review displayed files with names, sizes, and dates
5. Select desired files using checkboxes (or use "Select All")
6. Click "Attach" button to add files to email
7. Send email as normal

**Managing Large File Attachments**
1. Open file picker modal on Message record
2. Select files you wish to attach
3. Monitor real-time total size counter at bottom of modal
4. If warning appears (15MB total or 10MB individual file exceeded), deselect files until warning disappears
5. Click "Attach" when within limits
6. Alternatively, click "Cancel" to close modal without changes

### User Roles

- **All Roles**: Smart File Selector is available to all NetSuite users who can access Message records, including employees, customers (via Customer Center), vendors, and partners.
- **Administrator**: Can modify script deployment settings, role restrictions, and execution contexts as needed.

---

## Configuration

### Settings

The solution includes configurable constants in the script file:
- `MAX_TOTAL_MB` (default: 15.0) - Maximum total attachment size in megabytes
- `MAX_SINGLE_MB` (default: 10.0) - Maximum individual file size in megabytes

These can be adjusted by editing the script file, though default values match NetSuite email attachment limits.

### Customization

**Styling**: The inline HTML includes embedded CSS that can be customized to match your NetSuite theme or branding requirements. Modify colors, fonts, and spacing in the `<style>` section of the script.

**Button Placement**: By default, the button appears in the "attachments" container. This can be modified by changing the `container` parameter in the `form.addField()` call.

**File Filtering**: The script currently retrieves all files from the parent transaction. You can add filtering logic in the `getTxAttachments()` function to exclude certain file types or folders.

---

## Support & Documentation

### Resources
- **Repository**: SFS-SmartFileSelector-dev
- **Documentation**: This document
- **Issues**: Contact solution manager

### Contact
- **Manager**: NetSuite Professional Services
- **Developer**: mgutierrez (initial release May 2025)

---

## Technical Architecture

### Component Overview

```
NetSuite Message Record (User Interface)
    ↓
User Event Script (beforeLoad)
    ↓
[Server Side] File Retrieval from Transaction
    ↓
[Client Side] Inline HTML/CSS/JavaScript File Picker
    ↓
User Selection → File Size Validation
    ↓
Media Items Added to Message Record
    ↓
Standard NetSuite Email Send Process
```

### Data Flow

1. **Trigger**: User opens or edits a Message record associated with a transaction
2. **Script Execution**: User Event `beforeLoad` function executes
3. **File Discovery**: Script searches for all files attached to parent transaction via saved search
4. **File Loading**: For each file found, script loads file object to retrieve size in bytes
5. **Interface Rendering**: Script generates HTML table with file metadata and selection controls
6. **User Interaction**: Client-side JavaScript handles checkbox selection and size validation
7. **Attachment**: Selected files are programmatically added to message's mediaitem sublist using NetSuite's client-side API (`nlapiSelectNewLineItem`, `nlapiSetCurrentLineItemValue`, `nlapiCommitLineItem`)

### Integration Points

- **Transaction Records**: Reads files attached to any transaction type (Sales Orders, Invoices, Purchase Orders, etc.)
- **File Cabinet**: Retrieves file metadata and content from NetSuite File Cabinet
- **Message Records**: Integrates with standard NetSuite email/message functionality
- **Client-Side API**: Uses NetSuite 1.0 client-side API for sublist manipulation (compatible with SuiteScript 2.1 User Event context)

---

## Changelog

### Version 1.00 (May 5, 2025)
- Initial release by mgutierrez
- User Event script with beforeLoad trigger
- File picker modal interface
- File size validation (15MB total, 10MB per file)
- Select All / individual file selection
- Real-time size counter
- Support for all transaction types

---

## License

Copyright (c) 1998-2025 Oracle NetSuite, Inc.
Confidential and Proprietary

---

## Credits

**Developed by**: NetSuite Consulting Services (mgutierrez)
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: February 4, 2026
