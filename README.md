# Email Triage Assistant

An intelligent email management tool that automatically clusters Gmail emails into actionable groups with one-click archive functionality.

## Overview

The Email Triage Assistant integrates with Gmail via OAuth to fetch your last 200 emails and automatically organizes them into smart clusters based on content patterns and sender information. This helps you quickly identify and manage different types of emails in your inbox.

## Features

- **Gmail OAuth Integration**: Secure authentication with Gmail using Google OAuth 2.0
- **Intelligent Email Clustering**: Automatically groups emails into categories:
  - Work Communications
  - Newsletters & Updates
  - Financial & Bills
  - Social & Personal
  - Shopping & Services
- **One-Click Archive**: Archive entire clusters of emails with a single click
- **Detailed Email View**: View all emails in a cluster with full details
- **Demo Mode**: Try the clustering functionality with sample data
- **Real-time Sync**: Refresh and re-cluster your emails on demand

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for development and build tooling
- **Wouter** for lightweight client-side routing
- **TanStack React Query** for server state management
- **Radix UI** primitives with shadcn/ui components
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules
- **Drizzle ORM** for database operations
- **PostgreSQL** for data storage
- **Google APIs** for Gmail integration

### Authentication & APIs
- **Google OAuth 2.0** for Gmail access
- **Gmail API** for email fetching and archiving
- **Neon Database** for serverless PostgreSQL

## Getting Started

### Prerequisites

1. **Google Cloud Console Setup**:
   - Create a project in Google Cloud Console
   - Enable the Gmail API
   - Create OAuth 2.0 credentials
   - Set redirect URI to your Replit domain

2. **Environment Variables**:
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   DATABASE_URL=your_postgresql_connection_string
   ```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables in the Replit secrets

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Navigate to your Replit URL to start using the application

### First Time Setup

1. **Enable Gmail API**: Go to [Google Cloud Console](https://console.developers.google.com/apis/api/gmail.googleapis.com) and enable the Gmail API for your project

2. **OAuth Configuration**: Set your Replit domain as an authorized redirect URI in your Google OAuth settings

3. **Test Users**: Add your Gmail address as a test user in Google Cloud Console (required for unverified apps)

## Usage

### Authentication
1. Click "Sign in with Gmail" on the auth page
2. Grant permissions for Gmail access
3. You'll be redirected to the dashboard upon successful authentication

### Email Management
1. **Sync Emails**: Click "Refresh Analysis" to fetch and cluster your latest 200 emails
2. **View Clusters**: Browse automatically categorized email groups
3. **View Details**: Click "View All" on any cluster to see individual emails
4. **Archive Clusters**: Use the "Archive" button to bulk-archive related emails

### Demo Mode
If you want to try the clustering without setting up Gmail API:
1. Click "Try Demo" to load sample emails
2. Explore the clustering and archiving features
3. This helps you understand the app before connecting real emails

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   ├── routes.ts           # API route definitions
│   └── storage.ts          # Data access layer
├── shared/                 # Shared TypeScript types
│   └── schema.ts           # Database schema and types
└── components.json         # shadcn/ui configuration
```

## API Endpoints

- `GET /api/auth/url` - Generate OAuth authorization URL
- `GET /api/auth/callback` - Handle OAuth callback
- `POST /api/emails/sync/:userId` - Sync emails from Gmail
- `POST /api/emails/demo/:userId` - Load demo data
- `GET /api/clusters/:userId` - Get user's email clusters
- `POST /api/clusters/:clusterId/archive` - Archive cluster emails

## Email Clustering Algorithm

The system uses a rule-based clustering approach with predefined templates:

1. **Work Communications**: Matches corporate domains, meeting invites, project updates
2. **Newsletters**: Identifies subscription emails, updates, and marketing content
3. **Financial**: Detects bills, statements, payment confirmations
4. **Social**: Groups social media notifications, personal communications
5. **Shopping**: Categorizes e-commerce emails, shipping notifications, deals

## Troubleshooting

### Gmail API Not Enabled
- Error: "Gmail API has not been used in project"
- Solution: Enable Gmail API in Google Cloud Console and wait 2-3 minutes

### OAuth Issues
- Error: "403 access blocked"
- Solution: Add your email as a test user in Google Cloud Console

### Authentication Failures
- Check that redirect URI matches your Replit domain exactly
- Verify Google OAuth credentials are correctly set in environment variables

## Contributing

This is an educational project. For contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request with detailed description

## License

This project is licensed for educational purposes only.

**Licensed to**: ivrschool.ai  
**Purpose**: Educational use only

This software is provided for educational and learning purposes. Commercial use, redistribution, or modification for commercial purposes is not permitted without explicit written consent from ivrschool.ai.

## Educational Objectives

This project demonstrates:
- Modern React development with TypeScript
- OAuth 2.0 authentication flow
- RESTful API design with Express.js
- Database design and ORM usage
- Email processing and categorization
- State management with React Query
- Component composition with Radix UI
- Responsive design with Tailwind CSS

## Support

For educational inquiries related to this project, please contact ivrschool.ai.

---

**Note**: This application requires Gmail API access and should only be used with test accounts during development. Always follow Google's API usage policies and rate limits.