# Hatchloom Team Delta -- School Administration Microservices

Team Delta's School Administration backend and frontend for the Hatchloom digital learning platform. Hatchloom is a learning and community platform for teens aged 12-17, built across four York University student teams. Team Delta owns the School Administration module (Screens 300-303), which school administrators use to manage experiences, cohorts, enrolments, and view dashboards.

This project is built as three independent Laravel microservices plus a React frontend for the CSSD 2211 (Cloud Computing) deliverable.

## Architecture

```
                    ┌──────────────────────────────┐
                    │     React Frontend (Vite)     │
                    │         (port 3000)           │
                    │  Screens 300, 301, 302, 303   │
                    └───┬──────────┬──────────┬─────┘
                        │          │          │
                   /dashboard  /experiences  /enrolments
                        │      /courses      /cohorts
                        │          │          │
              ┌─────────▼──┐  ┌───▼────────┐ ┌▼──────────────┐
              │ Dashboard   │  │ Experience │ │  Enrolment    │
              │  Service    │  │  Service   │ │   Service     │
              │ (port 8001) │  │(port 8002) │ │ (port 8003)   │
              │ Screen 300  │  │Screens     │ │  Screen 303   │
              │ Aggregation │  │301-302     │ │               │
              └──────┬──────┘  └─────┬──────┘ └──────┬────────┘
                     │               │               │
                     └───────────────┼───────────────┘
                                     │
                            ┌────────▼─────────┐
                            │  PostgreSQL 16   │
                            │   (port 5432)    │
                            │ Shared database  │
                            └──────────────────┘
```

| Service | Port | Owns Tables | Description |
|---------|------|-------------|-------------|
| Frontend | 3000 | None | React SPA — all 4 admin screens |
| Dashboard Service | 8001 | None (aggregation only) | School Admin Dashboard (Screen 300) |
| Experience Service | 8002 | `experiences`, `experience_courses` | Experience management (Screens 301, 302) |
| Enrolment Service | 8003 | `cohorts`, `cohort_enrolments` | Cohort and enrolment management (Screen 303) |

All three backend services connect to a single shared PostgreSQL database. Each service runs its own migrations for its owned tables. The `schools` and `users` tables are seeded as mock reference data.

## Prerequisites

- **Docker** and **Docker Compose** (required for containerized deployment)
- **Node.js 20+** and **npm 10+** (for frontend local development)
- **PHP 8.2** and **Composer** (for backend local development without Docker)
- **PostgreSQL 16** (for backend local development without Docker)

## Quick Start (Docker — Full Stack)

```bash
# Clone the repository
git clone <repo-url> hatchloom-delta
cd hatchloom-delta

# Build and start all services including frontend
docker compose up --build -d
```

Services start sequentially via healthchecks: PostgreSQL → Enrolment Service → Experience Service → Dashboard Service → Frontend. Each backend service automatically runs migrations and seeds test data. First startup takes approximately 60-90 seconds while images build.

Check that all containers are running:

```bash
docker compose ps
```

Then open **http://localhost:3000** in your browser. Click **School Admin** to log in and start exploring screens 300-303.

To verify backend health individually:

```bash
curl -4 http://localhost:8001/api/school/dashboard/health
curl -4 http://localhost:8002/api/school/experiences/health
curl -4 http://localhost:8003/api/school/enrolments/health
```

Each health endpoint returns `{ "status": "ok", "service": "<name>", "timestamp": "..." }`.

**Windows users:** In PowerShell, `curl` is an alias for `Invoke-WebRequest` and will not work. Use `curl.exe` instead:

```powershell
curl.exe -4 http://localhost:8001/api/school/dashboard/health
curl.exe -4 http://localhost:8002/api/school/experiences/health
curl.exe -4 http://localhost:8003/api/school/enrolments/health
```

The `-4` flag forces IPv4. Docker containers bind to `0.0.0.0` (IPv4 only), and Windows often defaults to IPv6 (`::1`), which will cause "connection refused" errors without this flag.

### Rebuilding After Code Changes

Code is baked into Docker images at build time (no volume mounts). After editing source files, rebuild before restarting:

```bash
docker compose build
docker compose up -d
```

To reset the database and start fresh:

```bash
docker compose down -v
docker compose up --build -d
```

## Quick Start (Local Development — Frontend + Docker Backend)

This is the ideal workflow for frontend development. Run the backend services in Docker and the frontend locally with hot reload:

```bash
# Start backend services
docker compose up --build -d postgres enrolment-service experience-service dashboard-service

# Wait for backends to become healthy (~30s)
docker compose ps

# Start frontend with hot reload
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Vite proxies all `/api` requests to the backend Docker services automatically:

| Path prefix | Target |
|-------------|--------|
| `/api/school/dashboard` | http://localhost:8001 |
| `/api/school/experiences`, `/api/school/courses` | http://localhost:8002 |
| `/api/school/cohorts`, `/api/school/enrolments` | http://localhost:8003 |

## Local Development (Without Docker)

Each backend service is an independent Laravel application. To run one locally:

```bash
cd experience-service
composer install
cp .env.example .env
```

Edit `.env` to set `DB_HOST=localhost` (the `.env.example` defaults to `postgres`, the Docker hostname) and generate an app key:

```bash
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8002
```

Repeat for `enrolment-service` (port 8003) and `dashboard-service` (port 8001).

For cross-service HTTP calls to work locally, set these environment variables in each service's `.env`:

```
# Dashboard Service .env
EXPERIENCE_SERVICE_URL=http://localhost:8002
ENROLMENT_SERVICE_URL=http://localhost:8003

# Experience Service .env
ENROLMENT_SERVICE_URL=http://localhost:8003
```

Then start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Running Tests

### Frontend Tests

The frontend has 135 tests covering UI components, auth context, API modules, and all page screens:

```bash
cd frontend
npm install
npm test
```

To run in watch mode during development:

```bash
npm run test:watch
```

### Backend Tests

Tests require dev dependencies (phpunit), which are not included in the production Docker images. To run tests via Docker, install dev dependencies first:

```bash
docker compose exec experience-service composer install --dev
docker compose exec experience-service php artisan test

docker compose exec enrolment-service composer install --dev
docker compose exec enrolment-service php artisan test

docker compose exec dashboard-service composer install --dev
docker compose exec dashboard-service php artisan test
```

To run tests locally (requires PHP 8.2 and Composer installed on your machine):

```bash
cd experience-service
composer install
cp .env.testing .env
php artisan test
```

Repeat for `enrolment-service` and `dashboard-service`. The `.env.testing` files are pre-configured with test database credentials (`hatchloom_test`). You must have a local PostgreSQL instance with a `hatchloom_test` database available.

Tests are also run automatically via GitHub Actions on push to `main` and on pull requests.

## Demo Walkthrough

1. Start all services: `docker compose up --build -d` (or use the local dev workflow above)
2. Open **http://localhost:3000** and click **School Admin**
3. **Dashboard** (Screen 300): See 6 metric cards, warning banners for unassigned students, tabbed Students/Cohorts tables. Click a student's arrow to drill into Enrolment filtered to that student.
4. **Experiences** (Screen 301): Browse the searchable experiences table. Click **Create Experience** to open the modal with course picker. Click **View** on an experience to see its detail.
5. **Experience Detail** (Screen 302): See cohorts, Content & Delivery section with course blocks, paginated student table. Click **Export** to download student CSV.
6. **Enrolment** (Screen 303): See metric cards and the attention banner for unassigned students. Filter by grade. Click **Remove** on a student to remove them from their cohort. Click **Export** to download all enrolments as CSV.
7. Sidebar links to Curriculum Alignment, Credentials, and Settings show placeholder pages (these are outside Team Delta's scope).

## Screens

### 300 — Dashboard
Overview with 6 metric cards, warning banners for unassigned students, and tabbed Students/Cohorts tables. Clicking a student drills into the Enrolment page filtered to that student.

### 301 — Experiences
Searchable table of all experiences with status, course contents, and cohort links. Includes Create Experience modal with course picker and delete confirmation.

### 302 — Experience Detail
Breadcrumb navigation, status pill, 3 metric cards, Content & Delivery section showing courses and block counts, and a paginated student table with CSV export.

### 303 — Enrolment
3 metric cards, attention banner for unassigned students, filter bar (grade, cohort), searchable student table with remove action and confirmation modal, CSV export.

## Frontend Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 with Hatchloom design tokens (Outfit + DM Sans fonts)
- TanStack React Query for server state management
- React Router v7 for client-side routing
- Vitest + React Testing Library + MSW for tests

### Frontend Project Structure

```
frontend/src/
  api/              API client and endpoint modules
    client.ts       Axios instance with auth interceptor
    dashboard.ts    GET /api/school/dashboard
    experiences.ts  Experience CRUD + sub-resources
    enrolments.ts   Cohort + enrolment endpoints
    courses.ts      GET /api/school/courses
  components/
    layout/
      AdminLayout.tsx   Top nav + sidebar + outlet
    ui/                 Button, Card, Badge, MetricCard, Modal,
                        Input, Spinner, EmptyState, Pagination, Table
  context/
    AuthContext.tsx  Token-based auth with role flags
  pages/
    LoginPage.tsx           Quick-login for demo tokens
    admin/
      DashboardPage.tsx     Screen 300
      ExperiencesPage.tsx   Screen 301
      ExperienceDetailPage.tsx  Screen 302
      EnrolmentsPage.tsx    Screen 303
      PlaceholderPage.tsx   Stub for non-Delta screens
  types/
    index.ts        Shared TypeScript interfaces
  __tests__/        Vitest setup, test utilities, MSW mocks
```

## Frontend Authentication

The frontend uses token-based mock auth for the demo. The login page offers two quick-login buttons:

| Token | User | Role |
|-------|------|------|
| `test-admin-token` | Ms. Patel | school_admin |
| `test-teacher-token` | Mr. Chen | school_teacher |

Tokens are stored in `localStorage`. The Axios interceptor attaches them as `Authorization: Bearer <token>` headers. The backend's `MockAuthMiddleware` maps tokens to users.

## API Contract

**Integrating with Delta?** See [`API-CONTRACT.docx`](API-CONTRACT.docx) for full endpoint documentation, request/response shapes, authentication tokens, data ownership, and integration contracts for each team.

### Quick Reference (Mock Auth Tokens)

| Token | User | Role |
|-------|------|------|
| `test-admin-token` | Admin User (id=1) | school_admin |
| `test-teacher-token` | Ms. Smith (id=2) | school_teacher |
| `test-student-token` | Student 1 (id=4) | student |
| `test-parent-token` | Parent of Student 1 (id=14) | parent |
| `test-hatchloom-teacher-token` | Hatchloom Course Builder (id=15) | hatchloom_teacher |
| `test-hatchloom-admin-token` | Hatchloom Platform Admin (id=16) | hatchloom_admin |

## Seed Data

The demo ships with pre-seeded data for a realistic school scenario:

| Entity | Count | Details |
|--------|-------|---------|
| School | 1 | Ridgewood Academy |
| Users | 16 | 1 admin, 2 teachers, 10 students (grades 8-12), 1 parent, 2 platform staff |
| Experiences | 3 | Business Foundations (active), Tech Explorers (active), Creative Problem Solving (draft) |
| Courses | 5 | Mock catalogue: Entrepreneurship, Financial Literacy, Marketing, Digital Skills, Coding |
| Cohorts | 5 | A (active), B (not started), C (active), D (completed), E (not started) |
| Enrolments | 12 | Including multi-cohort students, removed students, and 2 unassigned students for warning banners |

## Environment Variables

| Variable | Default | Used By | Description |
|----------|---------|---------|-------------|
| `APP_NAME` | Laravel | All backends | Service name |
| `APP_KEY` | (generated) | All backends | Laravel encryption key |
| `APP_ENV` | local | All backends | Environment (local, testing, production) |
| `APP_DEBUG` | true | All backends | Enable debug mode |
| `APP_URL` | http://localhost:{port} | All backends | Base URL for the service |
| `DB_CONNECTION` | pgsql | All backends | Database driver |
| `DB_HOST` | postgres | All backends | Database host (Docker service name or IP) |
| `DB_PORT` | 5432 | All backends | Database port |
| `DB_DATABASE` | hatchloom | All backends | Database name |
| `DB_USERNAME` | hatchloom | All backends | Database user |
| `DB_PASSWORD` | secret | All backends | Database password |
| `EXPERIENCE_SERVICE_URL` | http://experience-service:8002 | Dashboard | URL for Experience Service |
| `ENROLMENT_SERVICE_URL` | http://enrolment-service:8003 | Dashboard, Experience | URL for Enrolment Service |
| `CACHE_STORE` | array | All backends | Cache driver |
| `SESSION_DRIVER` | array | All backends | Session driver |
| `QUEUE_CONNECTION` | sync | All backends | Queue driver (synchronous for D1) |

## CI/CD

GitHub Actions runs on push to `main` and on pull requests. The pipeline:

1. Runs PHPUnit tests for each service (with a PostgreSQL service container)
2. Builds all Docker images via `docker compose build`

See `.github/workflows/ci.yml` for details.

## Startup Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `curl: (7) Failed to connect ... Connection refused` | Windows defaults to IPv6; Docker binds IPv4 only | Add `-4` flag: `curl -4 http://localhost:...` |
| PowerShell returns HTML or `Invoke-WebRequest` errors | PowerShell aliases `curl` to `Invoke-WebRequest` | Use `curl.exe` instead of `curl` |
| Container shows `unhealthy` or exits | Upstream dependency not ready yet | Wait 60-90s for healthcheck chain to complete, then run `docker compose ps` |
| Code changes not reflected | Source is baked into images at build time | Run `docker compose build` then `docker compose up -d` |
| Port conflict on 3000/8001/8002/8003 | Another process using the port | Stop the conflicting process or edit port mappings in `docker-compose.yml` |
| Frontend shows blank page or API errors | Backend services not running | Start backends first: `docker compose up -d`, wait for healthy, then start frontend |
| `npm run dev` proxy errors | Backend ports unreachable | Verify backends are healthy: `docker compose ps` or `curl -4 http://localhost:8001/api/school/dashboard/health` |

## Known Limitations

- **Authentication is mocked** -- hardcoded bearer token-to-user mapping via `MockAuthMiddleware`. Production auth will use session tokens validated by the API Gateway (see API contract for details).
- **Course data is mocked** -- the course catalogue from Team Papa is provided by a `MockCourseDataProvider` class rather than real HTTP calls. Only course IDs 1-5 exist.
- **Credential data is mocked** -- `MockCredentialDataProvider` returns sample data for all students. Real credential data will come from Karl's credential engine.
- **Progress data is mocked** -- `MockStudentProgressProvider` returns placeholder values. Real progress data will come from Team Papa's Course Service.
- **No real inter-team integration** -- all cross-team data (courses, credentials, progress) is provided by mock providers implementing strategy-pattern interfaces. See the API contract "Data Ownership" section for swap instructions.
- **School scoping uses mock data** -- only one school (Ridgewood Academy) is seeded. Multi-tenant isolation is implemented but not tested across multiple schools.
- **No API gateway** -- services call each other directly over the Docker network. In Docker, nginx in the frontend container handles API proxying. In local dev, Vite's proxy handles it.

## Team Members

**CSSD 2203 (Software Design):** Bhagya, Nathan, Neharika, Shlok

**CSSD 2211 (Cloud Computing):** Bhagya, Miguel, Neharika
