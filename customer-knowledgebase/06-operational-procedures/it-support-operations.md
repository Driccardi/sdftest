# IT Support and Operations - SunStyle Retail

## Document Information
- **Document ID**: ITSUP-001
- **Version**: 1.2
- **Status**: Approved
- **Last Updated**: 2026-01-22
- **Owner**: Jennifer Lee, IT Support & Service Desk Lead

## Overview

IT Support and Operations provides technical support, system administration, and operational services to ensure technology systems are available, reliable, and meet business needs.

## Service Desk

### Service Catalog

**End User Support**:
- Hardware support (laptops, phones, tablets)
- Software support (applications, licenses)
- Account management (passwords, access)
- Email and communication tools
- VPN and remote access
- Printer and peripherals

**System Support**:
- Application support (business systems)
- Database support
- Network connectivity
- Cloud services
- Integration issues

### Support Channels

1. **Self-Service Portal**: support.sunstyleretail.com
   - Knowledge base articles
   - Submit tickets
   - Track ticket status
   - Chat with virtual assistant

2. **Email**: itsupport@sunstyleretail.com
   - Response time: < 4 hours

3. **Phone**: 1-800-SUNTECH (786-8324)
   - Hours: Mon-Fri 6 AM - 6 PM PST
   - After-hours: Emergency on-call for P0/P1

4. **Walk-up Support** (HQ only)
   - Hours: Mon-Fri 8 AM - 5 PM PST
   - Location: IT Help Desk (2nd floor)

5. **Chat**: Microsoft Teams
   - Hours: Mon-Fri 8 AM - 6 PM PST

### Ticket Priority and SLAs

| Priority | Description | Response Time | Resolution Time | Escalation |
|----------|-------------|---------------|-----------------|------------|
| P0 - Critical | Complete system outage, production down, security breach | 15 min | 4 hours | Immediate to Manager |
| P1 - High | Major functionality unavailable, significant business impact | 1 hour | 8 hours | 2 hours to Manager |
| P2 - Medium | Partial functionality loss, workaround available | 4 hours | 2 business days | 1 day to Manager |
| P3 - Low | Minor issue, information request, enhancement | 1 business day | 5 business days | N/A |

### Ticket Lifecycle

1. **Intake**: Ticket created (portal, email, phone, chat)
2. **Triage**: Priority assigned, categorized, routed
3. **Assignment**: Assigned to technician or team
4. **Investigation**: Root cause analysis, troubleshooting
5. **Resolution**: Issue fixed, workaround provided
6. **Verification**: User confirms resolution
7. **Closure**: Ticket closed, documentation updated
8. **Feedback**: User satisfaction survey

## Support Teams

### Tier 1 - Service Desk
**Team Size**: 8 technicians
**Coverage**: 6 AM - 6 PM PST, Mon-Fri
**Responsibilities**:
- First-line support
- Ticket intake and triage
- Password resets
- Basic troubleshooting
- Knowledge base creation
- User onboarding/offboarding

**Tools**: Zendesk (ticketing), Active Directory, Google Workspace

**Metrics**:
- First-call resolution: Target > 60%
- Avg handle time: Target < 15 minutes
- Customer satisfaction: Target > 4.5/5

### Tier 2 - Technical Support
**Team Size**: 4 specialists
**Coverage**: 7 AM - 5 PM PST, Mon-Fri
**Responsibilities**:
- Advanced troubleshooting
- Application support
- System administration
- Escalations from Tier 1
- Configuration changes
- Documentation

**Specializations**:
- Application Specialist (business systems)
- Network Specialist
- Database Administrator
- Cloud Administrator

**Metrics**:
- Resolution rate: Target > 90%
- Avg resolution time: Target < 1 business day (P2)
- Escalation rate from Tier 1: Target < 20%

### Tier 3 - Engineering and Development
**Team Size**: Variable (based on issue)
**Responsibilities**:
- Complex technical issues
- System architecture changes
- Code fixes and deployments
- Third-party vendor escalations
- Root cause analysis
- Permanent fixes for recurring issues

**Engagement**: As-needed for complex issues

## System Administration

### User Account Management

**Onboarding Process**:
1. HR triggers account creation (BambooHR)
2. Accounts created:
   - Google Workspace (email, Drive)
   - Active Directory (if applicable)
   - Business applications (based on role)
3. Hardware provisioned (laptop, phone)
4. New hire orientation (IT systems training)

**Timeline**: Within 24 hours of hire date

**Offboarding Process**:
1. HR triggers account deactivation
2. Accounts disabled immediately
3. Data backup and transfer (to manager)
4. Account deletion (after 30 days)
5. Hardware collected and wiped

**Timeline**: Same day as termination

### Access Management

**Access Request Process**:
1. Manager submits access request
2. Approval workflow:
   - Manager approval (required)
   - Security review (for privileged access)
   - System owner approval (for sensitive systems)
3. Access provisioned
4. Confirmation to requester

**Access Reviews**:
- Quarterly review of all user access
- Certification by managers
- Removal of unnecessary access

### License Management

**Software Licenses Managed**:
- Google Workspace (320 licenses)
- Microsoft Office (50 licenses)
- Adobe Creative Cloud (15 licenses)
- Business applications (various)

**License Tracking**:
- Inventory in asset management system
- Usage monitoring
- Optimization (reclaim unused licenses)
- Renewals tracked (60-day advance notice)

## System Monitoring

### Monitoring Coverage

**Infrastructure**:
- Servers and VMs (CPU, memory, disk, network)
- Kubernetes clusters (nodes, pods, services)
- Network devices (routers, switches, firewalls)
- Cloud resources (GCP services)

**Applications**:
- Application availability (uptime checks)
- Application performance (response time, error rate)
- Database performance (queries, connections, locks)
- API endpoints (latency, throughput)

**Business Metrics**:
- Order volume
- Website traffic
- Transaction success rate
- Customer satisfaction

### Monitoring Tools

**Primary**: Datadog
- Infrastructure monitoring
- Application Performance Monitoring (APM)
- Log management
- Dashboards and alerts

**Secondary**: Google Cloud Monitoring
- GCP native resources
- Uptime checks
- Custom metrics

**Alerting**: PagerDuty for critical alerts, Slack for warnings

### On-Call Rotation

**Schedule**: 24/7 coverage
**Team**: Infrastructure and DevOps engineers (8 engineers)
**Rotation**: Weekly rotation

**On-Call Responsibilities**:
- Respond to critical alerts (P0, P1)
- Incident triage and initial response
- Escalation to appropriate teams
- Communication with stakeholders
- Incident documentation

**On-Call Compensation**: $200/week stipend + overtime for incidents

## Incident Management

### Incident Classification

**Severity Levels**:
- **P0 - Critical**: Complete outage, data breach, major security incident
- **P1 - High**: Major feature unavailable, significant performance degradation
- **P2 - Medium**: Partial functionality impacted, workaround available
- **P3 - Low**: Minor issue, cosmetic, enhancement request

### Incident Response Process

1. **Detection**: Alert, user report, monitoring
2. **Triage**: Severity assessment, assignment
3. **Notification**: Stakeholders notified (based on severity)
4. **Investigation**: Root cause analysis, troubleshooting
5. **Mitigation**: Temporary fix, workaround
6. **Resolution**: Permanent fix deployed
7. **Verification**: Confirm issue resolved
8. **Communication**: Status updates to stakeholders
9. **Post-Incident Review**: Lessons learned, preventive actions

### Major Incident Management

**Major Incident Criteria**:
- Complete system outage
- Affects > 50% of users
- Revenue-impacting issue
- Data breach or security incident

**Major Incident Team**:
- **Incident Commander**: Senior engineer or manager
- **Technical Lead**: Subject matter expert
- **Communications**: Updates to stakeholders
- **Scribe**: Incident timeline documentation
- **Business Representative**: Business impact assessment

**Communication**:
- Internal: Slack #incidents channel, email to leadership
- External: Status page updates, customer communications (if customer-facing)

**Post-Incident Review (PIR)**:
- Conducted within 3 business days
- Attendees: Incident team, stakeholders, management
- Output: PIR document with timeline, root cause, action items
- Follow-up: Action items tracked to completion

## Change Management

### Change Types

**Standard Change**:
- Pre-approved, low-risk
- Documented procedure
- No additional approval required
- Examples: Password reset, license addition, routine updates

**Normal Change**:
- Standard business change
- Change Advisory Board (CAB) review
- Risk assessment required
- Examples: System configuration, application deployment, infrastructure changes

**Emergency Change**:
- Urgent, unplanned
- Required to resolve critical incident
- Expedited approval (Emergency CAB)
- Retrospective review

### Change Advisory Board (CAB)

**Members**:
- CTO (Chair)
- Infrastructure Lead
- Application Development Lead
- Security Lead
- Business representative

**Meeting Schedule**: Weekly (Tuesdays, 2 PM PST)

**CAB Review**:
- Change details and justification
- Risk assessment
- Rollback plan
- Testing evidence
- Approval/denial/defer decision

### Change Process

1. **Request**: Change request submitted (ticket)
2. **Assessment**: Risk, impact, dependencies
3. **Approval**: CAB review and approval
4. **Planning**: Detailed implementation plan, rollback plan
5. **Communication**: Stakeholder notification
6. **Implementation**: Change executed (maintenance window)
7. **Verification**: Confirm success
8. **Documentation**: Update configuration management database (CMDB)
9. **Review**: Post-implementation review (if major change)

### Maintenance Windows

**Scheduled Maintenance**:
- **Weekly**: Tuesday 11 PM - 1 AM PST (minor changes)
- **Monthly**: First Sunday 12 AM - 6 AM PST (major changes)

**Emergency Maintenance**: As needed (with stakeholder approval)

**Change Freeze**: 2 weeks before major events (Black Friday, holiday season)

## Knowledge Management

### Knowledge Base

**Categories**:
- User guides (how-to articles)
- Troubleshooting guides
- FAQs
- System documentation
- Policies and procedures

**Tools**: Confluence, Zendesk Guide

**Content Management**:
- Articles created by support staff
- Peer review before publication
- Monthly review and update
- Retirement of outdated articles

**Metrics**:
- Article views
- Article helpfulness rating
- Ticket deflection rate

### Documentation Standards

**Required Documentation**:
- System architecture diagrams
- Network diagrams
- Configuration documentation
- Runbooks (operational procedures)
- Incident response playbooks
- Disaster recovery procedures

**Documentation Reviews**: Quarterly

## Key Performance Indicators (KPIs)

| KPI | Target | Current | Trend |
|-----|--------|---------|-------|
| First-Call Resolution (FCR) | > 60% | 65% | ↑ |
| Avg Ticket Resolution Time | < 2 days | 1.8 days | → |
| Customer Satisfaction (CSAT) | > 4.5/5 | 4.6/5 | ↑ |
| System Uptime | > 99.9% | 99.92% | → |
| Mean Time to Detect (MTTD) | < 5 min | 3.2 min | ↑ |
| Mean Time to Resolve (MTTR) | < 30 min | 22 min | ↑ |
| Change Success Rate | > 95% | 97% | → |

## Continuous Improvement

### Recent Improvements**:
- Implemented self-service password reset (reduced tickets by 25%)
- AI chatbot for common inquiries (ticket deflection 15%)
- Automated user provisioning (reduced onboarding time by 50%)
- Enhanced monitoring and alerting (MTTD improved by 40%)

### Planned Improvements (Next 6 months)**:
- Knowledge base expansion (target 200+ articles)
- Mobile app for IT support portal
- Predictive analytics for proactive support
- Automation of routine tasks (RPA)

---

*Status: Approved*
*Last Updated: 2026-01-22*
*Version: 1.2*
*Owner: Jennifer Lee, IT Support & Service Desk Lead*
