# TODO - Perk Wallet

## Next Steps (Small, Shippable Tasks)

### Template System Improvements
- [ ] Add field-level validation rules for template fields
- [ ] Enhance device preview with actual wallet frame mockups
- [ ] Implement template version comparison/diff view
- [ ] Add template import/export functionality

### Google Wallet Integration
- [ ] Auto-create Google Wallet classes from templates
- [ ] Implement Google Wallet class updates when templates change
- [ ] Add Google-specific template validation

### Apple Wallet Enhancements  
- [ ] Complete Apple web service endpoints for pass updates
- [ ] Implement pass serial number tracking
- [ ] Add Apple-specific template validation

### Public Features
- [ ] Create public pass installation pages
- [ ] Implement install link tracking and analytics
- [ ] Add QR code pass installation flow
- [ ] Build pass usage metrics dashboard

### Notifications & Delivery
- [ ] Implement actual email/push notification delivery
- [ ] Add notification template customization
- [ ] Build notification analytics and tracking
- [ ] Add unsubscribe management

## Medium Priority Features

### Admin Enhancements
- [ ] Add bulk operations for participants/passes
- [ ] Implement admin action audit logging
- [ ] Add data export/import tools
- [ ] Build admin activity dashboard

### Developer Experience
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Build end-to-end testing suite
- [ ] Create API documentation with OpenAPI
- [ ] Add development environment setup scripts

### Infrastructure
- [ ] Implement database backup strategy
- [ ] Add monitoring and alerting
- [ ] Set up staging environment
- [ ] Add load testing capabilities

## High Priority (Major Features)

### Authentication & Security
- [ ] Replace emulator with production auth system
- [ ] Implement proper user management
- [ ] Add API key management for programs
- [ ] Build role-based access control with real auth

### Template Publishing Workflow
- [ ] Complete draft → template publishing process
- [ ] Add template approval workflows
- [ ] Implement template rollback capabilities
- [ ] Add template change impact analysis

### Pass Management
- [ ] Build pass regeneration system for template changes
- [ ] Add bulk pass updates
- [ ] Implement pass lifecycle management
- [ ] Add pass archival and cleanup

### Multi-tenant Architecture
- [ ] Add organization management
- [ ] Implement billing and usage tracking
- [ ] Add white-label customization
- [ ] Build multi-region support

## Done ✅

### Template Studio MVP (v0.4.0)
- ✅ Template drafts list with program-scoped management
- ✅ Multi-tab Template Editor (Layout, Fields, Assets, Preview, Publish)
- ✅ Asset upload system with 5 asset types
- ✅ Merge tags system with 12+ dynamic tags
- ✅ Preview resolver with API and unit tests
- ✅ Field mapping UI with autocomplete
- ✅ Live preview with real participant data

### Program Theming & Admin (v0.3.x)
- ✅ Complete admin interface with RBAC
- ✅ Program-level theming and branding
- ✅ Theme Doctor diagnostics
- ✅ Participant data alignment system
- ✅ Notification system with intelligent merging
- ✅ Points display configuration
- ✅ Admin testing tools

### Core Platform (v0.2.x and earlier)  
- ✅ Apple Wallet and Google Wallet pass generation
- ✅ Webhook processing for Perk events
- ✅ QR code generation with HMAC signing
- ✅ Magic link installation flow
- ✅ Multi-program support architecture
- ✅ Supabase database integration
- ✅ Rate limiting and retry logic

---

**Last Updated**: 2025-08-15  
**Current Version**: v0.4.0  
**Next Target**: v0.5.0 (Public Pass Installation & Enhanced Previews)