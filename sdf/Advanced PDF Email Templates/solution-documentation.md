# Advanced PDF Email Templates

**Version**: 1.0 | **By**: Internal IT

---

## Description

Advanced PDF Email Templates is a foundational SDF project structure designed for organizations that need centralized management of NetSuite templates. The project provides an organized directory scaffold for email templates, marketing templates, PDF customizations, and web-hosted content.

This solution serves as a template/starting point for companies that want to manage their NetSuite templates through version control using the SuiteCloud Development Framework. The project structure follows NetSuite best practices with dedicated folders for different template types, enabling teams to deploy template changes consistently across environments.

The primary benefit is establishing a standardized structure for template management, making it easier to track changes, collaborate on template development, and maintain consistency across sales, marketing, and customer communications.

---

## Solution Details

### Solution Type
- **Workflow Automation**

### Target Industries
- **Retail**
- **Wholesale Distribution**
- **Professional Services**
- **Manufacturing**

### Dependencies
- None

---

## Features

### Organized Directory Structure
Provides pre-configured folders for email templates, marketing templates, and web hosting files, following NetSuite FileCabinet conventions.

### Version Control Ready
Enables teams to track template changes through Git, review template modifications, and collaborate on design updates before deployment.

### Multi-Environment Deployment
Supports deploying template collections across sandbox, production, and test environments using SDF CLI commands.

### Template Categorization
Separates email templates from marketing templates and web content, making it easier to manage different template types independently.

### SDF Framework Integration
Fully compatible with SuiteCloud Development Framework for validation and deployment workflows.

### Scalable Structure
Designed to accommodate growing template libraries with room for staging vs. live web hosting files.

---

## Technical Details

### Script Files
**None** - This is a configuration-only project with no SuiteScript files.

### Custom Records
None

### Workflows
None

### Custom Fields
None

### Saved Searches
None

### Other Objects
- **Directory Structure**: Pre-configured FileCabinet folders for templates
- **Deployment Configuration**: Standard deploy.xml for template deployment

---

## System Requirements

### NetSuite Version
- **Minimum**: Any version
- **Recommended**: Latest stable release

### NetSuite Edition
- **Required**: N/A (compatible with all editions)

### Required Features
- None

### Optional Features
- **Advanced PDF/HTML Templates** - For enhanced PDF customization

---

## Installation

### Prerequisites
1. NetSuite account with Administrator or Developer role
2. SuiteCloud Development Framework (SDF) CLI installed
3. Basic understanding of NetSuite template structure

### Deployment Steps

1. **Download Source**
   ```bash
   cd "sdf/Advanced PDF Email Templates"
   ```

2. **Configure Authentication**
   ```bash
   suitecloud account:setup
   # Follow prompts to authenticate
   ```

3. **Add Templates**
   - Place email templates in `src/FileCabinet/SuiteScripts/Templates/E-mail Templates/`
   - Place marketing templates in `src/FileCabinet/SuiteScripts/Templates/Marketing Templates/`
   - Add web files to appropriate hosting directories

4. **Validate Project**
   ```bash
   cd src
   suitecloud project:validate
   ```

5. **Deploy to NetSuite**
   ```bash
   cd src
   suitecloud project:deploy
   ```

---

## Usage

### Getting Started

After installation, use the directory structure as your workspace for template development. Create or import existing templates into the appropriate folders, then use SDF commands to deploy them to your NetSuite account.

### Common Workflows

**Adding Email Templates**
1. Create or copy HTML email template files into `Templates/E-mail Templates/`
2. Run `suitecloud project:validate` to check for errors
3. Deploy using `suitecloud project:deploy`

**Managing Web Hosting Files**
1. Place files in `Web Site Hosting Files/Live Hosting Files/` or `Staging Hosting Files/`
2. Validate and deploy to make files available on your NetSuite site

### User Roles

- **NetSuite Developers**: Create and modify template files, deploy changes
- **Marketing Team**: Provide template designs and content (collaborate via version control)

---

## Configuration

### Settings

No configuration needed - this is a structural template project. Simply add your template files to the appropriate directories.

### Customization

Customize the directory structure by adding subdirectories for different template categories (e.g., order confirmations, shipping notifications, promotional emails).

---

## Support & Documentation

### Resources
- **Repository**: Local SDF project
- **Documentation**: NetSuite SuiteCloud Development Framework documentation

### Contact
- **Manager**: Internal IT

---

## Technical Architecture

### Component Overview

```
NetSuite FileCabinet
    ↓
SDF Project Structure
    ├── Email Templates
    ├── Marketing Templates
    └── Web Hosting Files
        ↓
    Version Control (Git)
        ↓
    SDF Deployment → NetSuite Account
```

### Data Flow

Templates are developed locally in the file structure, committed to version control, validated through SDF CLI, and deployed to NetSuite FileCabinet where they become available for use in email workflows, campaigns, and web pages.

### Integration Points

- **NetSuite FileCabinet**: Templates deploy to standard NetSuite file storage
- **Email Workflows**: Email templates can be referenced by NetSuite email scripts and workflows
- **Web Hosting**: Web files are served through NetSuite's web hosting capabilities

---

## Changelog

### Version 1.0
- Initial project structure created
- Standard FileCabinet folders configured
- Deploy and manifest files added

---

## Credits

**Developed by**: Internal IT
**Generated by**: NetSuite Solution Cataloger (Claude Code Skill)
**Date**: 2026-02-04
