# CyberFlow SOAR Platform

A multi-tenant Security Orchestration, Automation, and Response (SOAR) platform for SOC teams to ingest security alerts, correlate incidents, and execute automated playbooks.

## 🏗️ Architecture

- **Frontend**: Next.js 14 (TypeScript) + Shadcn/UI
- **Backend**: Go + Gin Framework
- **Database**: PostgreSQL (schema-per-tenant isolation)
- **Auth**: Clerk (multi-tenancy support)
- **Queue**: Redis (async job processing)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Go 1.21+
- PostgreSQL 15+
- Redis 7+

### Frontend Setup

```bash
cd cyberflow-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Add your Clerk keys to .env.local
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
# CLERK_SECRET_KEY=sk_test_xxx

# Run development server
npm run dev
```

Frontend runs on http://localhost:3000

### Backend Setup

```bash
cd cyberflow-backend

# Install Go dependencies
go mod tidy

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
# DATABASE_URL=postgres://user:password@localhost:5432/cyberflow
# REDIS_URL=localhost:6379
# CLERK_SECRET_KEY=sk_test_xxx

# Run the server
go run main.go
```

Backend API runs on http://localhost:8080

### Database Setup

```bash
# Create database
createdb cyberflow

# Apply public schema migrations
psql -d cyberflow -f migrations/public_schema.sql

# Tenant schemas are created automatically when organizations sign up
```

## 📚 Key Features

### ✅ Completed (MVP Phase 1)
- Multi-tenant architecture with schema-based isolation
- Clerk authentication with organization support
- Dashboard UI with dark mode design
- Incidents management page
- Alerts monitoring page
- Playbooks automation page
- Integrations management page
- Go API backend with RESTful endpoints
- PostgreSQL database schemas
- Middleware for CORS and authentication

### 🔄 In Progress
- Redis task queuing
- Webhook ingestion engine
- Schema mapper for field mapping
- Playbook execution engine
- Real-time updates via WebSockets

### 📋 Planned
- Visual playbook editor
- Evidence locker (file uploads)
- Audit log system
- Mock data generator
- Tenant isolation tests
- Integration framework (VirusTotal, Slack, etc.)

## 🗂️ Project Structure

```
cyberflow-frontend/
├── app/
│   ├── dashboard/          # Main dashboard pages
│   │   ├── alerts/         # Alerts page
│   │   ├── incidents/      # Incidents management
│   │   ├── playbooks/      # Playbook automation
│   │   └── integrations/   # Third-party integrations
│   ├── sign-in/            # Authentication pages
│   └── layout.tsx          # Root layout with Clerk
├── components/ui/          # Shadcn UI components
└── lib/
    └── api.ts              # API client utilities

cyberflow-backend/
├── main.go                 # Server entry point
├── internal/
│   ├── api/
│   │   ├── routes.go       # API routes definition
│   │   ├── handlers/       # Request handlers
│   │   └── middleware/     # Auth & CORS middleware
│   ├── config/             # Configuration management
│   └── database/           # Database utilities
└── migrations/             # SQL migration files
```

## 🔐 Multi-Tenancy Design

CyberFlow uses **schema-based isolation** for maximum security:

- Each organization gets a dedicated PostgreSQL schema (e.g., `org_abc123`)
- All queries automatically use the correct schema via `search_path`
- Zero risk of cross-tenant data leakage
- Easy per-tenant backups and compliance

See [multi_tenancy_architecture.md](../brain/0be1a8e8-92df-4ebf-bc36-fe0a312f96a0/multi_tenancy_architecture.md) for details.

## 📡 API Endpoints

### Public (No Auth)
- `POST /api/v1/webhooks/ingest` - Ingest security alerts

### Protected (Requires Clerk Token)
- `GET /api/v1/alerts` - List alerts
- `GET /api/v1/incidents` - List incidents
- `POST /api/v1/incidents` - Create incident
- `GET /api/v1/playbooks` - List playbooks
- `POST /api/v1/playbooks` - Create playbook
- `POST /api/v1/playbooks/:id/execute` - Execute playbook
- `GET /api/v1/integrations` - List integrations

## 🧪 Testing

```bash
# Frontend tests
cd cyberflow-frontend
npm test

# Backend tests
cd cyberflow-backend
go test ./...
```

## 📖 Documentation

- [Implementation Plan](../brain/0be1a8e8-92df-4ebf-bc36-fe0a312f96a0/implementation_plan.md)
- [Multi-Tenancy Architecture](../brain/0be1a8e8-92df-4ebf-bc36-fe0a312f96a0/multi_tenancy_architecture.md)
- [Task Checklist](../brain/0be1a8e8-92df-4ebf-bc36-fe0a312f96a0/task.md)

## 🤝 Contributing

1. Follow the integration guide in `INTEGRATION_GUIDE.md` (coming soon)
2. Run linters before committing
3. Ensure all tests pass

## 📝 License

MIT
