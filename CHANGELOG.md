# Changelog

All notable changes to the Perk Wallet project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.4.0] – 2025-08-15

### Added
- **Template Studio MVP**: Complete template editing system
  - Template drafts list with program-scoped management
  - Multi-tab Template Editor (Layout, Fields, Assets, Preview, Publish)
  - Asset upload system with 5 asset types (logo, icon, strip, background, googleCover)
  - Live preview with real participant data resolution
  
- **Merge Tags System** (`src/lib/merge-tags.ts`)
  - 12+ dynamic content tags: `{fname}`, `{lname}`, `{name}`, `{email}`, `{points}`, `{unused_points}`, `{tier}`, `{status}`
  - Program context tags: `{program_id}`, `{program_name}`, `{perk_uuid}`
  - Dynamic attributes: `{attr:KEY}` for custom profile data
  - Tag validation and autocomplete system

- **Preview Resolver** (`src/lib/preview.ts`)
  - API endpoint `/api/admin/templates/preview` for real-time template resolution
  - Sample participant data fallback system
  - Deep object traversal for tag replacement
  - 16 comprehensive unit tests with vitest

- **Field Mapping UI**
  - Visual editor for common template fields (header, primary fields, points)
  - Autocomplete with merge tag suggestions
  - "Apply to Layout" workflow integration
  - Reference panel with all available tags

- **Asset Management**
  - Supabase Storage integration with `pass-assets` bucket
  - File validation (PNG, JPG, JPEG, WebP up to 5MB)
  - Organized storage: `programs/{id}/drafts/{id}/{uuid}/{filename}`
  - Replace/remove functionality with optimistic UI

### Changed
- **Template Editor**: Enhanced with tabbed interface and live functionality
- **Preview System**: Now uses API-resolved data instead of static mock data
- **Database Schema**: Added `template_drafts` table with migration file

### Technical Details
- **Build Status**: ✅ Successfully compiles (12 kB bundle for editor)
- **Tests**: All 16 unit tests passing for preview resolver
- **API**: RESTful template preview endpoint with Zod validation
- **Storage**: File uploads with proper error handling and user feedback

### Related Commits
- `345080e`: Asset upload system implementation
- `[previous]`: Merge tags and preview resolver
- `[previous]`: Template Editor foundation

---

## [0.3.1] - 2025-08-12

### Fixed
- **Templates Schema**: Standardized `templates.pass_type` → `pass_kind` for consistency with `passes` table
- **Admin Templates**: Updated JSX bindings in template pages to use `pass_kind`
- **Pass Issue Route**: Fixed template filtering to use `pass_kind` field

### Changed
- **Database Schema**: `templates` table now uses `pass_kind: 'loyalty' | 'rewards'`
- **TypeScript Types**: Updated Supabase types to reflect schema changes

### Added
- **Enhanced Documentation**: Updated CLAUDE.md with comprehensive feature mapping
- **Database Schema Documentation**: Detailed mapping of all table changes and new fields
- **File Structure Documentation**: Complete reference of new /src/lib/perk/ organization
- **CHANGELOG.md**: Proper changelog tracking for all releases

### Developer Notes
- All builds passing with no TypeScript errors
- Schema changes maintain backward compatibility via consistent field naming
- 4 files changed total: supabase.ts, templates pages, and pass issue route

---

## [0.3.0] - 2025-08-12

### Added
- **Participant Data Alignment System**
  - `/src/lib/perk/schemas.ts`: Comprehensive Zod validation for Perk API data
  - `/src/lib/perk/normalize.ts`: ParticipantSnapshot interface and normalization functions
  - Tier fallback logic (tier → status → null)
  - Support for unused_points, fname, lname, tag_list fields

- **Merge Tag System**
  - `/src/lib/mergeTags.ts`: Dynamic template content replacement
  - 16+ supported tags: {points}, {unused_points}, {tier}, {profile.*}, etc.
  - Tag validation and unknown tag detection
  - Template validation with warnings

- **Notification System with Intelligent Merging**
  - `/src/lib/notify.ts`: Event buffering and merging system
  - `/src/lib/notify-flush.ts`: Background notification flushing
  - 120-second merge window for rapid point updates
  - 300-second throttling per participant+rule
  - Points delta calculation using program settings

- **Points Display Configuration**
  - Per-program setting: `points_display: 'points' | 'unused_points'`
  - Admin UI in program settings for configuration
  - Default to 'unused_points' (available balance)
  - Applied across pass builders and notifications

- **Admin Testing Tools**
  - Simulate Points Burst feature in participant details (`/admin/participants/[perk_uuid]`)
  - Development-only testing interface
  - Configurable event count, points, and duration
  - Real-time job monitoring integration
  - Requires super_admin or program_admin role

- **Enhanced Database Schema**
  - `participants` table: Added unused_points, fname, lname, tag_list fields
  - `programs.settings`: Added points_display configuration
  - Complete Perk data alignment capabilities

### Changed
- **Webhook Processing**: Now uses ParticipantSnapshot for consistent data handling
- **Pass Builders**: Apple and Google builders updated to use ParticipantSnapshot interface
- **Pass Issue Route**: Enhanced with fromDatabaseRow normalization
- **Database Updates**: Enhanced participants table with Perk-aligned fields

### Added Tests
- **Unit Tests**: Comprehensive test coverage for new features
- `/src/lib/__tests__/perk-normalize.test.ts`: ParticipantSnapshot normalization tests
- `/src/lib/__tests__/merge-tags.test.ts`: Tag resolution and validation tests
- `/src/lib/__tests__/notify.test.ts`: Notification merging and throttling tests
- `tests/fixtures/perk-participant-bluejackets.json`: Sample test data

---

## [0.2.0] - 2025-08-12

### Added
- **Complete Admin Interface** with role-based access control (RBAC)
  - Dashboard with system-wide and program-scoped KPIs
  - Programs management with CRUD operations
  - Templates editor with JSON validation
  - Participants search and management
  - Passes monitoring and control
  - Jobs queue monitoring with retry capability
  - Webhooks event tracking and replay
  
- **Role Emulator System** for development/testing
  - 5 roles: super_admin, program_admin, program_editor, program_viewer, support
  - JWT-based authentication emulation
  - Signed cookies with 24-hour TTL
  - Program-scoped permissions

- **Program Management Features**
  - Create new programs with API validation
  - Program status system (draft/active/inactive)
  - Status transitions with effects preview
  - Comprehensive branding configuration
  - Per-program webhook endpoints
  - Multi-tenant data isolation

- **Version Indicator Component**
  - Shows deployment version/git commit
  - Fixed position bottom-right
  - Tooltip with build information
  - Helps verify latest deployment

- **Real Supabase Integration**
  - Replaced all mock data with database queries
  - Program-scoped data filtering
  - Server-side data fetching
  - Optimistic UI updates

### Changed
- Migrated from Tailwind CSS v4 to v3 for shadcn/ui compatibility
- Updated admin routes to use App Router patterns
- Moved utility functions out of server actions files
- Enhanced error handling in API routes

### Fixed
- Build error with server actions requiring async functions
- Cookie handling in API routes for impersonation
- Tailwind CSS compatibility issues
- Failed fetch errors in role emulator

### Security
- Server-side permission checks on all admin actions
- API keys never sent to client-side code
- Cryptographically signed identity tokens
- Secret-based emulator protection

## [0.1.0] - 2025-08-10

### Added
- Initial release with core functionality
- Apple Wallet and Google Wallet pass generation
- Webhook processing for Perk events
- QR code generation with HMAC signing
- Magic link installation flow
- Multi-program support architecture
- Supabase database integration
- Rate limiting and retry logic
- Event tracking and logging

### Technical Stack
- Next.js 14 App Router
- TypeScript
- Supabase
- Vercel deployment
- passkit-generator for Apple Wallet
- Google Wallet REST API

## Development Notes

### Environment Setup
Required environment variables added:
- `APP_EMULATOR_SECRET` - For admin role emulation
- All existing Perk and Supabase configurations

### Database Migrations
- No new migrations required
- Program status stored in JSONB settings column
- Webhook secrets removed from storage

### Known Issues
- All critical issues resolved as of v0.2.0
- Admin interface requires emulator secret in production

### Next Release Planning
- Real authentication system to replace emulator
- Audit logging for admin actions
- Enhanced error tracking with Sentry
- E2E testing suite for admin workflows
- API documentation generation

---

For detailed implementation notes, see [CLAUDE.md](./CLAUDE.md)
For general documentation, see [README.md](./README.md)