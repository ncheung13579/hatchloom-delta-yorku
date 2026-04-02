# Hatchloom Team Delta — School Administration Backend

Three Laravel microservices powering the School Administration backend (Screens 300–303) of the Hatchloom digital learning platform. Built for CSSD 2211 (Cloud Computing) and CSSD 2203 (Software Design).

Hatchloom is a learning and community platform for teens aged 12–17, built across four York University student teams. Team Delta owns the backend APIs that school administrators and teachers use to manage experiences, cohorts, enrolments, and view dashboards.

> **Note on the React frontend:** The frontend included in this repository is **not part of the workpack deliverable**. It was built as a test harness to validate the backend APIs and demonstrate the screens during development. Team Delta's scope is the backend services only.

---

## Quick Start

```bash
git clone <repo-url> hatchloom-delta
cd hatchloom-delta
docker compose up --build -d
```

Services start sequentially via healthchecks: PostgreSQL → Enrolment → Experience → Dashboard → Frontend. First startup takes ~60–90 seconds. Migrations and seed data run automatically.

Once all containers are running (`docker compose ps`), open **http://localhost:3000** and click a role button to log in.

**Windows PowerShell users:** Use `curl.exe` (not `curl`, which is aliased to `Invoke-WebRequest`) and add `-4` to force IPv4 — Docker binds to `0.0.0.0`, and Windows often defaults to IPv6.

### Rebuilding After Code Changes

Source code is baked into Docker images at build time:

```bash
docker compose build && docker compose up -d
```

To reset the database: `docker compose down -v && docker compose up --build -d`

---

## Architecture

```
                    +---------------------------------+
                    |    React Frontend (test UI)     |
                    |          (port 3000)            |
                    +-----+--------+--------+---------+
                          |        |        |
                     /dashboard /experiences /enrolments
                          |    /courses     /cohorts
                          |        |        |
              +-----------v--+ +---v--------+ +v--------------+
              | Dashboard    | | Experience | |  Enrolment    |
              |  Service     | |  Service   | |   Service     |
              | (port 8001)  | |(port 8002) | | (port 8003)   |
              | Screen 300   | |Screens     | |  Screen 303   |
              | Aggregation  | |301-302     | |               |
              +------+-------+ +-----+------+ +------+--------+
                     |               |               |
                     +---------------+---------------+
                                     |
                            +--------v---------+
                            |  PostgreSQL 16   |
                            |   (port 5432)    |
                            +------------------+
```

| Service | Port | Owns Tables | Role |
|---------|------|-------------|------|
| Dashboard | 8001 | None (aggregation only) | Calls the other two services over HTTP, merges results. Returns partial responses with `service_degraded` warnings if a downstream service is down. |
| Experience | 8002 | `experiences`, `experience_courses` | Experience CRUD, course assignments, student lists, CSV export |
| Enrolment | 8003 | `cohorts`, `cohort_enrolments` | Cohort lifecycle, student enrolment/removal, statistics, CSV export |
| Frontend | 3000 | — | Test UI (not part of deliverable). React SPA with Vite, Tailwind CSS, TanStack Query. |

All three backend services share one PostgreSQL database. The `schools`, `users`, and `parent_student_links` tables are shared reference data.

---

## Screens

### Screen 300 — Dashboard (Admin only)

Overview with 6 KPI metric cards (Problems Tackled, Active Ventures, Students, Experiences, Credit Progress, Timely Completion), warning banners for unassigned students, tabbed Students/Cohorts tables, and an Engagement widget. Click any student row to drill down into progress, credentials, and curriculum mapping.

### Screen 301 — Experiences

Searchable table of all experiences with status pills, course counts, and cohort links. Create, edit, and archive experiences. Assign courses from Team Papa's catalogue.

### Screen 302 — Experience Detail

Breadcrumb navigation, 3 metric cards, Content & Delivery section with course block counts, cohort management (create, activate, complete), paginated student table with CSV export, and individual student drill-down.

### Screen 303 — Enrolment

School-wide enrolment overview with grade/experience/cohort filters, metric cards, attention banners for unassigned students, enrol/remove actions, CSV export, and student detail with credentials.

---

## Login

Open http://localhost:3000 and click **School Admin** to log in. This uses a mock admin token (`test-admin-token`) mapped to a seeded admin user with full access to all screens and actions.

The authentication mode is set via the `AUTH_MODE` environment variable. The demo uses `AUTH_MODE=mock` with a static bearer token. Setting `AUTH_MODE=http` switches to real JWT validation via Team Quebec's User Service — no code changes required.

```bash
curl.exe -4 -H "Authorization: Bearer test-admin-token" http://localhost:8001/api/school/dashboard
```

---

## Demo Walkthrough

1. Log in as **School Admin** → lands on Dashboard (Screen 300)
2. **Dashboard**: view 6 KPI cards, warning banner for unassigned students, Students/Cohorts tabs, Engagement widget
3. Click a student row → **Student Drill-Down**: progress metrics, course progress bars, LaunchPad ventures, credentials, Alberta PoS curriculum mapping
4. Navigate to **Experiences** (Screen 301): search experiences, click "Create Experience" — fill in name/description, select courses from Team Papa's catalogue, submit
5. **Experience Detail** (Screen 302): click an experience → view metric cards, course contents, cohorts
6. **Create Cohort**: click "Create Cohort", fill in name/dates/capacity
7. **Cohort lifecycle**: click a cohort → "Activate Cohort" (not_started → active), then "Complete Cohort" (active → completed). Buttons disappear after each transition — completed is terminal. *(This demonstrates the State pattern.)*
8. **Enrol Student**: on an active cohort, click "Enrol Student", enter a student ID, submit. Student appears immediately.
9. Navigate to **Enrolment** (Screen 303): filter by grade/experience/cohort, view metric cards, export CSV

---

## Design Patterns

Six design patterns are implemented across the codebase:

### 1. Strategy Pattern

All external data sources use interfaces with mock and HTTP implementations, bound in each service's `AppServiceProvider` and toggled by `AUTH_MODE`:

| Interface | Mock / HTTP | External Source |
|-----------|-------------|-----------------|
| Auth middleware | `MockAuthMiddleware` / `HttpAuthMiddleware` | Quebec User Service (JWT) |
| `CourseDataProviderInterface` | `MockCourseDataProvider` / `HttpCourseDataProvider` | Papa Course Service |
| `StudentProgressProviderInterface` | `MockStudentProgressProvider` / `HttpStudentProgressProvider` | Papa Course Service |
| `LaunchPadDataProviderInterface` | `MockLaunchPadDataProvider` / `HttpLaunchPadDataProvider` | Quebec User Service |
| `CredentialDataProviderInterface` | `MockCredentialDataProvider` / `HttpCredentialDataProvider` | Karl's Credential Engine |

Switching from mock to HTTP requires zero changes to controllers or services — only the environment variable.

### 2. Factory Method Pattern

`dashboard-service/app/Factories/DashboardWidgetFactory.php` maps widget type strings (`cohort_summary`, `student_table`, `engagement_chart`) to widget classes. Adding a new widget means adding one line to `WIDGET_MAP`.

### 3. State Pattern

`enrolment-service/app/States/` — Cohort lifecycle uses a one-directional state machine: `not_started` → `active` → `completed`. Each state is a class implementing `CohortState`. The controller delegates to the state object rather than using if/else chains.

### 4. Observer Pattern

`enrolment-service/app/Events/` — When a student is enrolled or removed, events are dispatched (`StudentEnrolled`, `StudentRemoved`). Independent listeners react: `UpdateDashboardCounts`, `NotifyTeacher`, `TriggerCredentialCheck`.

### 5. Repository Pattern

`DashboardService` abstracts whether data comes from HTTP calls, database queries, or mock providers. Controllers never make HTTP calls directly.

### 6. Dependency Injection (Laravel Container)

All provider interfaces are bound in the service container. Services declare dependencies in constructor parameters. Laravel automatically injects the correct implementation based on `AUTH_MODE`.

---

## API Endpoints

### Dashboard Service (Port 8001)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/school/dashboard` | Admin only | Full dashboard overview with KPIs |
| GET | `/api/school/dashboard/students/{id}` | Admin/Teacher | Student drill-down |
| GET | `/api/school/dashboard/widgets` | Admin only | All dashboard widgets |
| GET | `/api/school/dashboard/widgets/{type}` | Admin only | Single widget |
| GET | `/api/school/dashboard/reporting/pos-coverage` | Admin only | Curriculum coverage |
| GET | `/api/school/dashboard/reporting/engagement` | Admin only | Engagement rates |
| GET | `/api/school/dashboard/health` | Public | Health check |

### Experience Service (Port 8002)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/school/experiences` | Admin/Teacher | List experiences |
| POST | `/api/school/experiences` | Admin/Teacher | Create experience |
| GET | `/api/school/experiences/{id}` | Admin/Teacher | Experience detail |
| PUT | `/api/school/experiences/{id}` | Admin/Teacher | Update experience |
| DELETE | `/api/school/experiences/{id}` | Admin/Teacher | Archive experience |
| GET | `/api/school/experiences/{id}/students` | Admin/Teacher | Student list |
| GET | `/api/school/experiences/{id}/students/{studentId}` | Admin/Teacher | Student detail |
| GET | `/api/school/experiences/{id}/students/export` | Admin/Teacher | CSV export |
| GET | `/api/school/experiences/{id}/contents` | Admin/Teacher | Course blocks |
| GET | `/api/school/experiences/{id}/statistics` | Admin/Teacher | Stats |
| GET | `/api/school/courses` | Admin/Teacher | Course catalogue |
| GET | `/api/school/experiences/health` | Public | Health check |

### Enrolment Service (Port 8003)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/school/cohorts` | Admin/Teacher | List cohorts |
| POST | `/api/school/cohorts` | Admin/Teacher | Create cohort |
| GET | `/api/school/cohorts/{id}` | Admin/Teacher | Cohort detail |
| PUT | `/api/school/cohorts/{id}` | Admin/Teacher | Update cohort |
| PATCH | `/api/school/cohorts/{id}/activate` | Admin/Teacher | Activate cohort |
| PATCH | `/api/school/cohorts/{id}/complete` | Admin/Teacher | Complete cohort |
| POST | `/api/school/cohorts/{id}/enrolments` | Admin only | Enrol student |
| DELETE | `/api/school/cohorts/{id}/enrolments/{studentId}` | Admin only | Remove student (soft-delete) |
| GET | `/api/school/enrolments` | Admin/Teacher | Enrolment overview |
| GET | `/api/school/enrolments/statistics` | Admin/Teacher | Aggregate stats |
| GET | `/api/school/enrolments/export` | Admin/Teacher | CSV export |
| GET | `/api/school/enrolments/students/{id}` | Admin/Teacher | Student detail |
| GET | `/api/school/enrolments/health` | Public | Health check |

---

## Seed Data

The demo ships with pre-seeded data for a realistic school scenario. Seeders run automatically on startup.

| Entity | Count | Details |
|--------|-------|---------|
| School | 1 | Ridgewood Academy |
| Users | 16 | 1 admin, 2 teachers, 10 students (grades 8–12), 1 parent, 2 platform staff |
| Experiences | 3 | Business Foundations (active), Tech Explorers (active), Creative Problem Solving (draft) |
| Cohorts | 4 | A (active, 6 students), B (not started, 0), C (active, 3), D (completed, 4) |
| Enrolments | 13 | Includes multi-cohort students, removed students, and 2 unassigned students (trigger warning banners) |

---

## Running Tests

### Frontend (Vitest)

```bash
cd frontend
npm install
npm test
```

### Backend (PHPUnit)

Tests require dev dependencies not included in the production Docker images:

```bash
docker compose exec experience-service sh -c "composer install --dev && php artisan test"
docker compose exec enrolment-service sh -c "composer install --dev && php artisan test"
docker compose exec dashboard-service sh -c "composer install --dev && php artisan test"
```

### CI/CD

GitHub Actions runs on push to `main` and on pull requests: PHPUnit for each service, then Docker image build. See `.github/workflows/ci.yml`.

---

## Environment Variables

Key variables (all configurable in `docker-compose.yml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_MODE` | `mock` | `mock` for static tokens, `http` for real JWT via Quebec |
| `DB_HOST` | `postgres` | Database host (Docker service name) |
| `DB_DATABASE` | `hatchloom` | Database name |
| `DB_USERNAME` | `hatchloom` | Database user |
| `DB_PASSWORD` | `secret` | Database password |
| `USER_SERVICE_URL` | `http://localhost:8080` | Quebec User Service (JWT validation, when AUTH_MODE=http) |
| `COURSE_SERVICE_URL` | `http://localhost:8004` | Papa Course Service (when AUTH_MODE=http) |
| `CREDENTIAL_SERVICE_URL` | `http://localhost:8005` | Karl's Credential Engine (when AUTH_MODE=http) |
| `EXPERIENCE_SERVICE_URL` | `http://experience-service:8002` | Internal: Experience Service |
| `ENROLMENT_SERVICE_URL` | `http://enrolment-service:8003` | Internal: Enrolment Service |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Connection refused` on curl | Use `-4` flag to force IPv4: `curl.exe -4 http://localhost:...` |
| PowerShell returns HTML or errors | Use `curl.exe` instead of `curl` |
| Container `unhealthy` | Wait 60–90s for healthcheck chain, then `docker compose ps` |
| Code changes not reflected | `docker compose build && docker compose up -d` |
| Port conflict | Stop conflicting process or edit ports in `docker-compose.yml` |
| Frontend blank page | Ensure backends are healthy first: `docker compose ps` |

---

## Team

**CSSD 2203 (Software Design):** Bhagya, Nathan, Neharika, Shlok

**CSSD 2211 (Cloud Computing):** Bhagya, Miguel, Neharika
