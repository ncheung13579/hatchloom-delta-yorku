# Team Delta Demo Guide

This guide prepares you to demo the Hatchloom School Administration module and answer questions from the professor and TAs. Read time: ~90 minutes.

---

## Table of Contents

1. [What We Built](#1-what-we-built)
2. [How to Run It](#2-how-to-run-it)
3. [Architecture at a Glance](#3-architecture-at-a-glance)
4. [Login and Roles](#4-login-and-roles)
5. [Demo Walkthrough: Teacher Flow](#5-demo-walkthrough-teacher-flow)
6. [Demo Walkthrough: Admin Flow](#6-demo-walkthrough-admin-flow)
7. [Demo Walkthrough: Student and Parent](#7-demo-walkthrough-student-and-parent)
8. [Design Patterns (6 Patterns)](#8-design-patterns-6-patterns)
9. [Cross-Team Dependencies and Mock Providers](#9-cross-team-dependencies-and-mock-providers)
10. [API Endpoint Reference](#10-api-endpoint-reference)
11. [Anticipated Questions and Answers](#11-anticipated-questions-and-answers)
12. [Demo Script Cheat Sheet](#12-demo-script-cheat-sheet)

---

## 1. What We Built

Team Delta owns the **School Administration backend** — the screens that tie the entire Hatchloom experience together. We built:

- **Screen 300 — School Admin Dashboard**: Aggregated KPIs, student/cohort tables, engagement metrics, warnings
- **Screen 301 — Experiences Dashboard**: List, search, and create learning experiences
- **Screen 302 — Experience Screen**: Experience detail with cohorts, enrolled students, contents, statistics, and student drill-down
- **Screen 303 — Enrolment**: All students across all experiences, with grade/experience/cohort filters, export, and warnings

We also built read-only views for **students** and **parents**, and a **reporting/curriculum** page.

The system is three Laravel microservices + a React frontend, all running in Docker.

---

## 2. How to Run It

### Prerequisites

- Docker Desktop running
- Git

### Start everything

```bash
cd hatchloom-delta-presentation-only
docker compose up -d --build
```

Wait about 30 seconds for all services to boot and run their database migrations.

### Verify it's running

Open http://localhost:3000 in your browser. You should see the Hatchloom login page.

### Service ports

| Service | Port | What it does |
|---------|------|-------------|
| Frontend (Nginx + React) | 3000 | Serves the UI |
| Dashboard Service | 8001 | Aggregation layer, no own tables |
| Experience Service | 8002 | Manages experiences and courses |
| Enrolment Service | 8003 | Manages cohorts and enrolments |
| PostgreSQL | 5432 | Shared database |

### If something looks wrong

```bash
# Check all containers are running
docker compose ps

# Restart everything
docker compose down && docker compose up -d --build

# See logs for a specific service
docker compose logs dashboard-service
```

---

## 3. Architecture at a Glance

```
                    ┌─────────────────────┐
                    │   Frontend (React)   │  Port 3000
                    │   Nginx + Vite SPA   │
                    └──────┬──┬──┬────────┘
                           │  │  │
              ┌────────────┘  │  └────────────┐
              ▼               ▼               ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Dashboard    │  │  Experience  │  │  Enrolment   │
   │  Service      │  │  Service     │  │  Service     │
   │  Port 8001    │  │  Port 8002   │  │  Port 8003   │
   │               │  │              │  │              │
   │  Aggregation  │  │  Experiences │  │  Cohorts     │
   │  KPIs, Drill  │  │  Courses     │  │  Enrolments  │
   │  Widgets      │  │  Contents    │  │  State mgmt  │
   └──────┬────────┘  └──────┬───────┘  └──────┬───────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │  Port 5432
                    │   Shared DB     │
                    └─────────────────┘
```

**Key architectural decisions:**

- The **Dashboard Service owns no database tables**. It calls the other two services over HTTP and merges the results. If one service is down, it still returns a partial response (graceful degradation).
- The **Experience Service** owns the `experiences` and `experience_courses` tables.
- The **Enrolment Service** owns the `cohorts` and `cohort_enrolments` tables.
- All three share `users` and `schools` tables (seeded as reference data).
- External team data (courses from Papa, auth from Quebec, credentials from Karl) is provided by **mock providers** using the Strategy pattern. One line change swaps in real implementations.

---

## 4. Login and Roles

Go to http://localhost:3000. You'll see four role buttons.

| Button | Role | User | What they see |
|--------|------|------|--------------|
| **School Admin** | `school_admin` | Ms. Patel | Dashboard, Experiences, Enrolments — **read-only** for experiences/cohorts, can enrol/remove students |
| **Teacher** | `school_teacher` | Mr. Chen | Same screens — **full write access**: create/edit experiences, create/edit/activate/complete cohorts, enrol/remove students |
| **Student** | `student` | Alex Johnson | Personal dashboard with their own enrolments, progress, credentials |
| **Parent** | `parent` | Mrs. Johnson | Dashboard showing linked children's data (Alex Johnson + one more) |

### Key permission difference to highlight in demo

When logged in as **Teacher**, you'll see action buttons: "Create Experience", "Edit", "Create Cohort", "Activate Cohort", etc.

When logged in as **Admin**, those buttons are **hidden** — the admin is read-only for content management but can manage student enrolments.

This matches our backend role checks. The backend returns 403 if an admin tries a teacher-only action; the frontend hides the buttons so the user never hits that error.

---

## 5. Demo Walkthrough: Teacher Flow

Login as **Teacher** (Mr. Chen). This is the most feature-rich role and should be the primary demo.

### 5.1 Dashboard (Screen 300)

**URL:** `/admin/dashboard`

What you'll see:
- **6 KPI metric cards** across the top: Problems Tackled, Active Ventures, Students, Experiences, Credit Progress, Timely Completion
- **Warning banner** (yellow): "6 students are not assigned to any active cohort" — this is a real-time warning computed from enrolment data
- **Students tab**: breakdown cards (Total Enrolled, Active in Cohorts, Not Assigned) + student table with status dots, cohort counts, and drill-down arrows
- **Cohorts tab**: click to see all cohorts with status pills (Active/Not Started/Completed), student counts, experience names, and end dates
- **Engagement widget**: student engagement table showing login days, completion rates, engagement levels (Excellent/Good/Moderate/Low), and last active dates

**Things to point out:**
- The "Active Ventures: 7" card is data from Quebec's LaunchPad Service (via our mock provider)
- Click any student row's arrow (>) to drill down into their detail page
- The warning is dynamically computed — if you enrol all students into cohorts, it disappears

### 5.2 Experiences (Screen 301)

**URL:** `/admin/experiences`

What you'll see:
- Experience table with name, status pill, coordinator, course count, cohort count
- Search bar (debounced, 400ms delay)
- "Create Experience" button (top right)

**Demo actions:**
1. **Search**: Type a few letters in the search box — results filter in real time
2. **Create Experience**: Click the button, fill in name/description, select courses from the checkbox list, submit. The new experience appears in the table.
3. **Navigate**: Click any experience row to go to the detail page

### 5.3 Experience Detail (Screen 302)

**URL:** `/admin/experiences/{id}` (click any experience)

What you'll see:
- Breadcrumb navigation (Experiences > Experience Name)
- Header with name, status pill, and **Edit** button
- **3 metric cards**: Total Cohorts, Enrolled Students, Completion Rate
- **Content & Delivery** section: courses with block counts
- **Cohorts table**: name, status, student count, date range, arrow to detail
- **Students table**: name, status, cohort, email, drill-down arrow — with search and CSV export

**Demo actions:**
1. **Edit Experience**: Click Edit, change the name, save — it updates immediately
2. **Create Cohort**: Click "Create Cohort", fill in name, start/end dates, optional capacity, submit
3. **Export**: Click Export button to download a CSV of enrolled students
4. **Drill down**: Click a student row to see their individual progress, credentials, and curriculum mapping

### 5.4 Cohort Detail

**URL:** `/admin/cohorts/{id}` (click any cohort)

What you'll see:
- Breadcrumb (Experiences > Experience Name > Cohort Name)
- Header with status pill, date range, coordinator name
- **Action buttons**: Activate Cohort / Complete Cohort (depending on state) + Edit + Enrol Student
- **3 metric cards**: Students Enrolled, Capacity, Duration
- **Contents & Delivery**: courses inherited from the parent experience
- **Students table**: name, status dot, email, enrolled date

**Demo actions — State Pattern:**
1. Find a cohort with status "Not Started"
2. Click **"Activate Cohort"** — status changes to "Active" (green pill)
3. Now click **"Complete Cohort"** — status changes to "Completed"
4. Notice: once completed, Edit/Activate/Complete buttons disappear. This is the **State pattern** — `not_started -> active -> completed` is one-directional.

**Demo actions — Enrolment:**
1. Click **"Enrol Student"**, enter a student ID (try 5, 6, or 7), click Enrol
2. The student appears in the table immediately
3. Navigate to Enrolments page to see the student's new cohort assignment

### 5.5 Enrolment (Screen 303)

**URL:** `/admin/enrolments`

What you'll see:
- **3 metric cards**: Students Enrolled, Active Assignments, Not in Any Active Cohort
- **Attention card** (yellow): warning about unassigned students
- **Filter bar**: Grade dropdown, Experience dropdown, Cohort ID input
- **Student table**: name, email, grade, cohort pills (teal badges), status, drill-down arrow

**Demo actions:**
1. **Filter by grade**: Select "Grade 10" — only grade 10 students shown
2. **Filter by experience**: Select an experience name — only students in that experience shown
3. **Search**: Type a student name
4. **Export**: Click Export for CSV download

### 5.6 Student Drill-Down

**URL:** `/admin/students/{id}` (click any student arrow)

What you'll see:
- Student header with avatar initials, name, email
- **Progress metric cards**: Overall Progress, Courses Enrolled, Blocks Completed, Credit Progress
- **Course Progress**: per-course progress bars with block counts
- **Cohort Assignments**: table showing which cohorts the student is in
- **LaunchPad Ventures**: SideHustle sandbox projects (e.g., "Campus Snack Box" — active, "Study Buddy Tutoring" — completed)
- **Credentials**: earned badges, certificates, and credentials with status pills
- **Curriculum Mapping**: Alberta Program of Studies coverage — Business Studies, CTF Design Studies, CALM — each with a progress bar, requirement count, and individual requirement codes (e.g., BS-1.1, CTF-2.1)

**Things to point out:**
- The Ventures section is data from Quebec's LaunchPad mock provider
- Credentials and Curriculum Mapping come from Karl's credential engine mock provider
- Progress data comes from Papa's course service mock provider
- All of these are wired via the **Strategy pattern** — swap one line in `AppServiceProvider` to use real data

### 5.7 Reporting / Curriculum

**URL:** `/admin/curriculum`

What you'll see:
- **Alberta PoS Coverage** section: per-student coverage percentages for Business Studies, CTF Design Studies, and CALM
- **Engagement Rates** section: login frequency, activity completion rates, engagement levels
- School-wide averages

---

## 6. Demo Walkthrough: Admin Flow

Login as **School Admin** (Ms. Patel).

Everything looks the same as Teacher **except**:
- No "Create Experience" button on the experiences page
- No "Edit" or "Create Cohort" buttons on experience detail
- No "Edit", "Activate Cohort", or "Complete Cohort" buttons on cohort detail
- **"Enrol Student"** button IS still visible — admins can manage enrolments

This demonstrates **role-based access control**. The backend enforces it (returns 403); the frontend hides the buttons so the user never encounters an error.

---

## 7. Demo Walkthrough: Student and Parent

### Student (Alex Johnson)

**URL:** `/student`

- Personal dashboard showing their enrolled experiences, cohort assignments, and progress
- Read-only — students cannot modify anything

### Parent (Mrs. Johnson)

**URL:** `/parent`

- Shows a list of linked children (many-to-many via `parent_student_links` table)
- Click a child to see their detail (same data as admin drill-down, but scoped to that parent's children only)
- Parents cannot see other students' data — enforced by the backend

**Security point:** Parent-child links use a `parent_student_links` join table. The backend verifies the parent actually owns the child before returning data. A parent cannot pass a random student ID and see their data.

---

## 8. Design Patterns (6 Patterns)

The workpack requires a minimum of 6 design patterns by D3. Here's where each one lives:

### 8.1 Strategy Pattern

**Where:** All three services

The system uses **interfaces** for external data sources. Mock implementations are bound in `AppServiceProvider`. Swap one line to use a real HTTP implementation — no controller or service code changes needed.

| Interface | Mock Implementation | Real Source |
|-----------|-------------------|-------------|
| `CourseDataProviderInterface` | `MockCourseDataProvider` | Papa's Course API |
| `StudentProgressProviderInterface` | `MockStudentProgressProvider` | Papa's Progress API |
| `CredentialDataProviderInterface` | `MockCredentialDataProvider` | Karl's Credential Engine |
| `LaunchPadDataProviderInterface` | `MockLaunchPadDataProvider` | Quebec's LaunchPad API |

**Code location:** `dashboard-service/app/Providers/AppServiceProvider.php` (lines 30-40)

**If asked "how would you switch to real data?"** — "Change the binding in AppServiceProvider from MockCourseDataProvider to a new HttpCourseDataProvider that calls Papa's API. No other code changes needed. That's the Strategy pattern."

### 8.2 Factory Method Pattern

**Where:** `dashboard-service/app/Factories/DashboardWidgetFactory.php`

The dashboard has **widgets** (cohort_summary, student_table, engagement_chart). The factory maps type strings to widget classes and instantiates them with a shared context. Adding a new widget means adding one line to the `WIDGET_MAP` constant.

**API:** `GET /api/school/dashboard/widgets` returns all widgets; `GET /api/school/dashboard/widgets/{type}` returns one.

**If asked:** "The factory encapsulates widget creation. Controllers don't know about specific widget classes — they ask the factory for a type and get back a `DashboardWidget` interface."

### 8.3 State Pattern

**Where:** `enrolment-service/app/States/`

Cohorts have a lifecycle: `not_started` -> `active` -> `completed`. Each state is a class implementing `CohortState`:

- `NotStartedState` — `canActivate()` returns true, `canComplete()` returns false
- `ActiveState` — `canActivate()` returns false, `canComplete()` returns true
- `CompletedState` — both return false (terminal state)

**Demo it live:** Activate a cohort, then complete it. Try to activate a completed cohort — it returns a 422 error.

**If asked:** "The State pattern encapsulates transition rules. The controller doesn't have if/else chains checking status strings — it delegates to the state object."

### 8.4 Observer Pattern (Events and Listeners)

**Where:** `enrolment-service/app/Events/` and `enrolment-service/app/Listeners/`

When a student is enrolled or removed, events are dispatched:

| Event | Listeners |
|-------|-----------|
| `StudentEnrolled` | `UpdateDashboardCounts`, `NotifyTeacher`, `TriggerCredentialCheck` |
| `StudentRemoved` | `UpdateDashboardCounts`, `NotifyTeacher` |

**If asked:** "When `enrolStudent()` runs, it doesn't directly update dashboard counts or send notifications. It fires a `StudentEnrolled` event. Three independent listeners react to it. This decoupling means we can add new side effects (like sending an email) without modifying the enrolment code."

### 8.5 Repository Pattern

**Where:** `dashboard-service/app/Services/DashboardService.php`

The `DashboardService` is the repository boundary between controllers and all data sources (HTTP calls to other services + injected provider interfaces). Controllers never make HTTP calls directly — they call `DashboardService` methods.

**If asked:** "The DashboardService abstracts away whether data comes from an HTTP call, a database query, or a mock provider. The controller doesn't know or care."

### 8.6 Dependency Injection (via Laravel Container)

**Where:** Everywhere, but especially `AppServiceProvider.php` in each service

All provider interfaces are bound in the service container. Services declare their dependencies in constructor parameters, and Laravel automatically injects the correct implementation.

```php
// DashboardService constructor — all four dependencies are auto-injected
public function __construct(
    private readonly CredentialDataProviderInterface $credentialProvider,
    private readonly StudentProgressProviderInterface $progressProvider,
    private readonly LaunchPadDataProviderInterface $launchPadProvider,
    private readonly DashboardWidgetFactory $widgetFactory
) {}
```

**If asked:** "We never use `new MockCredentialDataProvider()` in our code. The service container resolves the interface to the correct implementation. This makes testing easy — we can bind a test double without changing any service code."

---

## 9. Cross-Team Dependencies and Mock Providers

Our services aggregate data from other teams. Since those teams' services don't exist yet, we use mock providers:

| Dependency | Team | What we get | Our mock |
|-----------|------|-------------|----------|
| Course catalogue, block data, progress tracking | **Papa** | Course names, block counts, completion percentages | `MockCourseDataProvider`, `MockStudentProgressProvider` |
| Auth, session tokens, parent-child links | **Quebec** | User identity, role, school scoping | `MockAuthMiddleware` with hardcoded tokens |
| LaunchPad, SideHustle ventures | **Quebec** | Venture counts, student venture data | `MockLaunchPadDataProvider` |
| Credential engine, curriculum mapping | **Karl (Role B)** | Badges, certificates, Alberta PoS coverage | `MockCredentialDataProvider` |

**How mocks work:** Each mock returns realistic hardcoded data that demonstrates the correct response structure. For example, `MockCredentialDataProvider` returns three Alberta PoS areas (Business Studies, CTF Design Studies, CALM) with specific requirement codes and coverage percentages.

**How to swap to real data:** Change one line in `AppServiceProvider::register()`. Example:

```php
// Before (mock)
$this->app->bind(CourseDataProviderInterface::class, MockCourseDataProvider::class);

// After (real)
$this->app->bind(CourseDataProviderInterface::class, HttpCourseDataProvider::class);
```

No other code changes needed anywhere.

---

## 10. API Endpoint Reference

### Dashboard Service (Port 8001)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/school/dashboard` | Admin/Teacher | Full dashboard overview with KPIs |
| GET | `/api/school/dashboard/students/{id}` | All roles | Student drill-down (scoped by role) |
| GET | `/api/school/dashboard/widgets` | Admin/Teacher | All dashboard widgets |
| GET | `/api/school/dashboard/widgets/{type}` | Admin/Teacher | Single widget (cohort_summary, student_table, engagement_chart) |
| GET | `/api/school/dashboard/reporting/pos-coverage` | Admin/Teacher | Alberta PoS curriculum coverage |
| GET | `/api/school/dashboard/reporting/engagement` | Admin/Teacher | Engagement rates |
| GET | `/api/school/dashboard/health` | Public | Health check |

### Experience Service (Port 8002)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/school/experiences` | All roles | List experiences (Screen 301) |
| POST | `/api/school/experiences` | **Teacher only** | Create experience |
| GET | `/api/school/experiences/{id}` | All roles | Experience detail |
| PUT | `/api/school/experiences/{id}` | **Teacher only** | Update experience |
| DELETE | `/api/school/experiences/{id}` | **Teacher only** | Archive experience |
| GET | `/api/school/experiences/{id}/students` | Admin/Teacher | Student list for experience |
| GET | `/api/school/experiences/{id}/students/export` | Admin/Teacher | CSV export |
| GET | `/api/school/experiences/{id}/contents` | All roles | Course blocks and contents |
| GET | `/api/school/experiences/{id}/statistics` | Admin/Teacher | Enrolment/completion stats |
| GET | `/api/school/courses` | All roles | Course catalogue |

### Enrolment Service (Port 8003)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/school/cohorts` | All roles | List cohorts |
| POST | `/api/school/cohorts` | **Teacher only** | Create cohort |
| GET | `/api/school/cohorts/{id}` | All roles | Cohort detail |
| PUT | `/api/school/cohorts/{id}` | **Teacher only** | Update cohort |
| PATCH | `/api/school/cohorts/{id}/activate` | **Teacher only** | Activate (State pattern) |
| PATCH | `/api/school/cohorts/{id}/complete` | **Teacher only** | Complete (State pattern) |
| POST | `/api/school/cohorts/{id}/enrolments` | Admin/Teacher | Enrol student |
| DELETE | `/api/school/cohorts/{id}/enrolments/{studentId}` | Admin/Teacher | Remove student (soft-delete) |
| GET | `/api/school/enrolments` | All roles | Paginated student overview |
| GET | `/api/school/enrolments/statistics` | Admin/Teacher | Aggregate stats + warnings |
| GET | `/api/school/enrolments/export` | Admin/Teacher | CSV export |
| GET | `/api/school/enrolments/students/{id}` | All roles | Student enrolment detail |

---

## 11. Anticipated Questions and Answers

### Architecture

**Q: Why three separate services instead of one monolith?**
A: Each service has a distinct responsibility — experiences (content), enrolments (student management), and dashboard (aggregation). This separation allows independent development and deployment. The Dashboard Service owns no tables; it's purely an aggregation layer. In production, each service could be scaled independently based on load.

**Q: Why a shared database instead of one per service?**
A: This is a pragmatic choice for our scope. The services share `users` and `schools` as reference data. In production, this would likely become per-service databases with a sync mechanism — that architectural decision is flagged as an open item for Role A (Matt) to resolve.

**Q: What happens if one service goes down?**
A: The Dashboard Service uses graceful degradation. Every cross-service HTTP call has a 5-second timeout and is wrapped in try/catch. If Experience Service is down, the dashboard still loads — it just shows zero for experience-related metrics and adds a "service_degraded" warning to the response.

**Q: How does the frontend talk to three different backend services?**
A: The frontend talks to all three directly. Each API module (`api/dashboard.ts`, `api/experiences.ts`, `api/enrolments.ts`) has its own Axios client configured with the correct base URL and Authorization header.

### Security

**Q: How does authentication work?**
A: In our presentation, we use a `MockAuthMiddleware` that maps bearer tokens to users. In production, Quebec's Auth Service would handle session-based auth. The API gateway (Role A) would validate session tokens centrally and propagate identity via headers. Our services already expect `X-User-Id` and `X-User-Role` headers for this transition.

**Q: How do you prevent a parent from seeing other students' data?**
A: The backend queries the `parent_student_links` table to get the parent's children, then scopes all queries to those student IDs only. If a parent tries to access `/students/999`, they get a 404 — the query includes a `WHERE student_id IN (child_ids)` clause.

**Q: How do you handle role-based permissions?**
A: Two layers. Backend: controller middleware checks the user's role before allowing write operations (teacher-only actions return 403 for admins). Frontend: uses `useAuth()` to check the role and hides buttons the user can't use.

### Design Patterns

**Q: How does the Strategy pattern work in your system?**
A: We define interfaces like `CourseDataProviderInterface` with methods like `getCourses()`. The mock implementation returns hardcoded data. In `AppServiceProvider`, we bind the interface to the mock. When Papa's real API is ready, we create `HttpCourseDataProvider` and change one binding line. No service or controller code changes.

**Q: Can you show the State pattern in action?**
A: Yes — go to a cohort with "Not Started" status. Click "Activate" — it becomes "Active". Click "Complete" — it becomes "Completed". Now the action buttons disappear. The backend uses `NotStartedState`, `ActiveState`, and `CompletedState` classes. Each knows which transitions are valid from its state. The controller delegates to the state object rather than having if/else chains.

**Q: What triggers the Observer pattern?**
A: When `EnrolmentService::enrolStudent()` runs, it dispatches a `StudentEnrolled` event. Three listeners react independently: `UpdateDashboardCounts` (refreshes stats), `NotifyTeacher` (alerts the coordinator), and `TriggerCredentialCheck` (evaluates earned credentials). Adding a new side effect means adding a new listener — no changes to the enrolment code.

### Data

**Q: Where does the curriculum mapping data come from?**
A: The three Alberta PoS areas (Business Studies, CTF Design Studies, CALM) come from Karl's credential engine, which we mock via `MockCredentialDataProvider`. Each area has specific requirement codes (e.g., BS-1.1 "Identify business opportunities") mapped to Hatchloom courses.

**Q: What are the "Active Ventures" on the dashboard?**
A: Those are SideHustle sandbox projects from Quebec's LaunchPad Service. Students create simulated businesses. We show the count on the dashboard and individual venture details on the student drill-down page. Currently served by `MockLaunchPadDataProvider`.

**Q: How does the export work?**
A: The Experience and Enrolment services have `/export` endpoints that return CSV files. The frontend creates a temporary blob URL, triggers a download via a programmatic `<a>` click, then revokes the URL.

### Testing

**Q: How did you test this?**
A: We have unit tests in each Laravel service (run with `php artisan test`), plus a comprehensive bash stress test (`frontend/stress_test.sh`) with 69 checks covering all endpoints, role-based access, CRUD operations, error handling, and seeded data integrity. All 69 pass.

---

## 12. Demo Script Cheat Sheet

Use this as a quick reference during the live demo. Each step takes ~30 seconds.

### Opening (2 min)

1. Open http://localhost:3000
2. Briefly explain: "This is the Hatchloom school administration module. Four roles can log in."

### Teacher Demo — Main Flow (8 min)

3. Click **Teacher** to log in
4. **Dashboard**: Point out the 6 KPI cards, the warning banner, the student table. Click the "Cohorts" tab to show cohort data. Scroll down to show the engagement widget.
5. **Experiences**: Click "Experiences" in the sidebar. Show the search. Click "Create Experience" and create one.
6. **Experience Detail**: Click into an experience. Show metric cards, contents, cohorts table.
7. **Create Cohort**: Click "Create Cohort", fill in fields, submit. Show it appears in the table.
8. **Cohort Detail**: Click into a cohort. Show the state transitions — activate it, then complete it. Point out the buttons disappearing (State pattern).
9. **Enrol Student**: Go to another active cohort. Click "Enrol Student", enter student ID 6, submit.
10. **Student Drill-Down**: Click a student arrow. Show progress, ventures, credentials, curriculum mapping.

### Admin Demo — Permission Differences (2 min)

11. Click **Sign Out**
12. Log in as **School Admin**
13. Go to Experiences — point out "Create Experience" button is gone
14. Go to an Experience — "Edit" and "Create Cohort" are gone
15. Go to a Cohort — "Edit", "Activate", "Complete" are gone, but "Enrol Student" is still there
16. Say: "Admin is read-only for content management but can manage student enrolments"

### Enrolment Page (2 min)

17. Go to **Enrolment** in sidebar
18. Show the attention card about unassigned students
19. Demo the **grade filter** and **experience filter** dropdowns
20. Click **Export** to show CSV download

### Student and Parent (2 min)

21. Sign out, log in as **Student**
22. Show the student dashboard — read-only view of their own data
23. Sign out, log in as **Parent**
24. Show the parent dashboard with linked children
25. Click a child to drill down

### Architecture Talking Points (2 min)

26. "Three microservices — Dashboard aggregates from the other two"
27. "Six design patterns: Strategy, Factory, State, Observer, Repository, DI"
28. "External data from Papa, Quebec, and Karl is mocked via Strategy pattern — one line swap for real data"
29. "69 automated test checks, all passing"

### Total: ~18 minutes
