# Fewblocs Fleet Management Platform

An autonomous-ready fleet management platform built with Next.js 15, React 19, TypeScript, and Tailwind CSS. This platform provides comprehensive vehicle tracking, management, and analytics for modern fleet operations.

![Fleet Management Platform](./banner.png)

## Features

- **Real-time Vehicle Tracking** - Live GPS tracking with interactive maps
- **Fleet Management** - Add, edit, and manage vehicles with detailed information
- **Multi-tenant Architecture** - Secure organization-based data isolation
- **Authentication System** - Google SSO and email/password authentication
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark Mode Support** - Built-in dark/light theme switching

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features and optimizations
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (Authentication, Database, Real-time)
- **Mapbox** - Interactive maps and geolocation services

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Mapbox account and access token

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd fewblocs-fleet-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Add your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── services/           # API services and data fetching
└── types/              # TypeScript type definitions
```

## Database Setup

The application uses Supabase for data storage. Run the provided SQL scripts to set up the database schema:

1. Organizations and users tables
2. Vehicles and tracking tables
3. Row Level Security (RLS) policies
4. Authentication triggers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
