# MirrorMeet CRM

Monorepo containing:
- `server/` — NestJS backend
- `web/` — Next.js frontend

## Prerequisites
- Node.js 18+
- Docker + Docker Compose

## Quick start (dev)
1. Create env files from examples:
   - `copy server\env.example server\.env` (Windows)
   - `copy web\env.example web\.env` (Windows)
2. Start infrastructure:
   - `docker compose up -d`
3. Start apps:
   - Backend: `npm install && npm run start:dev` in `server/`
   - Frontend: `npm install && npm run dev` in `web/`

MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)
S3 endpoint: http://localhost:9000
Postgres: localhost:5432 (mirrormeet / mm_user / mm_password)

## Next steps
- Add Prisma + DB schema
- Implement RBAC and media upload (S3 presigned URLs)
- Calendar with statuses
