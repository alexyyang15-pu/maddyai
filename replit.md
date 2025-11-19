# Maddy AI - Relationship Intelligence Platform

## Overview

Maddy AI is a relationship-intelligence operating system designed for founders, investors, operators, and community builders who manage large networks. The platform helps users maintain meaningful relationships at scale by consolidating contacts from multiple sources, enriching them with AI, providing natural-language search, calculating relationship warmth scores, and delivering proactive nudges for follow-ups.

The application combines contact management, relationship scoring, and automated nudging to help super-connectors maintain warm relationships without manual tracking across scattered platforms like Gmail, LinkedIn, calendars, and spreadsheets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server

**UI Component Library**: Shadcn UI (new-york style) with Radix UI primitives
- Comprehensive component library including cards, dialogs, forms, tables, and navigation
- Tailwind CSS for styling with CSS variables for theming
- Custom warm, earthy theme inspired by relationship-focused design
- Responsive design with mobile-first approach using hooks like `useIsMobile`

**State Management**: 
- TanStack Query (React Query) for server state management and data fetching
- Custom query client with configured caching and refetch behavior
- Form state handled via React Hook Form with Zod validation

**Routing**: Wouter for lightweight client-side routing
- Landing page at root (`/`)
- Dashboard at `/dashboard`
- 404 handling for unknown routes

**Key Pages**:
- Landing page: Marketing and onboarding interface
- Dashboard: Main application interface displaying contacts, nudges, and relationship insights

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API architecture
- `/api/contacts` - Full CRUD operations for contacts with search capability
- `/api/nudges` - Nudge management and status updates
- Query parameter support for filtering (e.g., `?q=` for search)

**Development Setup**:
- Vite middleware integration for HMR in development
- Custom logging middleware for API request/response tracking
- Environment-based configuration (development vs production)

**Build Process**:
- Frontend: Vite bundling to `dist/public`
- Backend: esbuild compilation to `dist/index.js` with ESM output
- Separate dev and production scripts

### Data Layer

**ORM**: Drizzle ORM for type-safe database operations
- Schema-first approach with TypeScript inference
- Zod schema generation for validation
- Migration support via drizzle-kit

**Database Schema**:

**Contacts Table**:
- Core fields: name, role, company, location, email, avatar
- Relationship tracking: warmthScore (0-100), lastInteraction, nextFollowUp
- Metadata: tags (array), notes (text)

**Nudges Table**:
- Links to contacts via foreign key
- Type classification: 'decay', 'milestone', 'location', 'intro'
- Priority levels: 'high', 'medium', 'low'
- Status tracking: 'pending', 'dismissed', 'completed'
- Timestamp for creation/scheduling

**Warmth Scoring System**:
- Base score of 100 (maximum warmth)
- Time decay: -0.5 points per day of inactivity
- Recent interaction bonus: +15 if contacted within 7 days
- Network effect: +5 per mutual connection
- Priority weighting: +10 if priority score is 80+
- Score ranges:
  - 85-100: Very warm (healthy relationship)
  - 50-69: Cooling off (needs attention soon)
  - Below 50: Cold (critical attention needed)

**Storage Pattern**:
- Interface-based storage abstraction (`IStorage`)
- Database implementation using Drizzle ORM
- Seed data capability for development/testing
- Full-text search on contacts

### Path Aliases

Consistent path resolution across the codebase:
- `@/*` → `client/src/*` (frontend code)
- `@shared/*` → `shared/*` (shared types and schemas)
- `@assets/*` → `attached_assets/*` (static assets)

### Type Safety

- Strict TypeScript configuration across all layers
- Shared schema definitions between frontend and backend
- Drizzle-Zod integration for runtime validation
- Inferred types from database schema

### Development Workflow

**Development Mode**:
- Concurrent frontend (Vite on port 5000) and backend (Express) servers
- Hot module replacement for instant feedback
- Runtime error overlay for debugging

**Production Mode**:
- Optimized Vite build with code splitting
- esbuild bundling for server with external packages
- Static file serving from dist directory

## External Dependencies

### Database
- **Neon Serverless PostgreSQL**: Primary database using `@neondatabase/serverless` driver
- WebSocket support for serverless connections
- Connection pooling via `pg` Pool
- Environment-based configuration via `DATABASE_URL`

### UI and Styling
- **Radix UI**: Accessible, unstyled component primitives (accordion, dialog, dropdown, popover, etc.)
- **Tailwind CSS**: Utility-first CSS framework with v4 alpha (`@tailwindcss/vite`)
- **Class Variance Authority**: Component variant management
- **Lucide React**: Icon library for consistent iconography

### Form Handling
- **React Hook Form**: Form state management
- **Hookform Resolvers**: Integration with validation libraries
- **Zod**: Schema validation for forms and API data

### Development Tools
- **Replit-specific plugins**: 
  - Cartographer for code navigation
  - Dev banner for development mode indication
  - Runtime error modal for better debugging
- **Vite**: Fast build tool and dev server
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development server

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional className composition
- **nanoid**: Unique ID generation
- **cmdk**: Command menu component
- **embla-carousel-react**: Carousel/slider functionality
- **vaul**: Drawer component (mobile-friendly)

### Future Integration Points (from PRD)
- Gmail API for contact ingestion
- LinkedIn API for profile enrichment
- Calendar integrations (Google Calendar, etc.)
- AI/LLM services for draft generation and contact enrichment
- Event import systems for tracking "how you met" data
- Email sending capabilities (mailto and SMTP)