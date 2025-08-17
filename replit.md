# Overview

This is an email management application that automatically clusters and triages Gmail emails for better inbox organization. The system integrates with Gmail via OAuth, fetches user emails, and groups them into smart clusters based on content patterns and sender information. Users can view clustered emails and archive entire clusters to maintain a clean inbox.

## Recent Changes

- **January 2025**: Added comprehensive README.md with educational license to ivrschool.ai
- **Authentication Improvements**: Fixed OAuth flow with proper scopes and error handling
- **Demo Mode**: Added sample data functionality for testing without Gmail API
- **Cluster Details Modal**: Implemented detailed email view with "View All" functionality
- **Error Handling**: Enhanced Gmail API error messages with direct enable links

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Radix UI primitives with custom styling via shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming and Gmail-inspired design tokens

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints for authentication, email syncing, and cluster management
- **Storage Interface**: Abstract storage interface with in-memory implementation for development
- **Error Handling**: Centralized error middleware with structured error responses

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with schema-first approach
- **Schema Design**: Three main entities - users, emails, and clusters with proper foreign key relationships
- **Migration Strategy**: Drizzle Kit for database migrations and schema management
- **Development Storage**: In-memory storage implementation for testing and development

## Authentication and Authorization
- **OAuth Provider**: Google OAuth 2.0 for Gmail access
- **Scope Management**: Gmail read and modify permissions for email access and archiving
- **Token Management**: Access and refresh token storage with expiry handling
- **Session Storage**: User data persisted in localStorage for client-side session management

## External Dependencies
- **Gmail API**: Google APIs client library for email fetching and archiving operations
- **Neon Database**: Serverless PostgreSQL database for production data storage
- **UI Libraries**: Extensive Radix UI component ecosystem for accessible, unstyled primitives
- **Development Tools**: Replit-specific plugins for development environment integration
- **Build Tools**: ESBuild for server bundling and Vite for client application bundling

## Email Clustering System
- **Algorithm**: Rule-based clustering using predefined templates for common email categories
- **Categories**: Work communications, newsletters, financial/bills, social/personal, and shopping/services
- **Matching Logic**: Keyword matching and sender pattern recognition for automatic categorization
- **Cluster Management**: Users can archive entire clusters to bulk-manage related emails