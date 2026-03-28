# Team Delta Demo Guide

This guide prepares you to demo the Hatchloom School Administration module and answer questions from the professor and TAs. Read time: ~90 minutes.

---

## Table of Contents

1. [What We Built](#1-what-we-built)
2. [The Bigger Picture: Hatchloom Platform](#2-the-bigger-picture-hatchloom-platform)
3. [How to Run It](#3-how-to-run-it)
4. [Architecture at a Glance](#4-architecture-at-a-glance)
5. [Login and Roles](#5-login-and-roles)
6. [Demo Walkthrough: Teacher Flow](#6-demo-walkthrough-teacher-flow)
7. [Demo Walkthrough: Admin Flow](#7-demo-walkthrough-admin-flow)
8. [Demo Walkthrough: Student and Parent](#8-demo-walkthrough-student-and-parent)
9. [Design Patterns (6 Patterns)](#9-design-patterns-6-patterns)
10. [Cross-Team Dependencies and Mock Providers](#10-cross-team-dependencies-and-mock-providers)
11. [API Endpoint Reference](#11-api-endpoint-reference)
12. [Anticipated Questions and Answers](#12-anticipated-questions-and-answers)
13. [Demo Script Cheat Sheet](#13-demo-script-cheat-sheet)

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

## 2. The Bigger Picture: Hatchloom Platform

Before diving into our code, you should understand what Hatchloom is and where Delta fits. This context will help you answer "big picture" questions during the demo.

### What is Hatchloom?

Hatchloom is a **youth entrepreneurship learning platform**. Think of it as a school LMS (like Google Classroom) combined with a startup incubator for high school students. Students don't just take courses — they build simulated businesses, compete in challenges with real entrepreneurs, and earn credentials mapped to the Alberta curriculum.

The platform has **three pillars**:

### Pillar 1: Explore (Team Papa)

**Explore** is the core learning engine. This is where students take courses.

- **Courses** contain **Blocks**, which contain **Nodes**, which contain **Activity Cards** — a 4-level hierarchy
- There are **10 activity card types**: Watch Video, Read Document, Complete Quiz, Answer Question, Vote/Poll, Live Session, Social Activity, Explore Gallery, Listen to Podcast, Submit Solution
- **Challenges** are special learning events with a lifecycle: they get revealed, students work on them, submit solutions, and present on pitch day. Challenges are often linked to real entrepreneurs (e.g., a local business owner named Sarah Chen from BrandLab Calgary poses a real business problem)
- **Gamification**: Students earn **XP** (experience points) and maintain **streaks** (consecutive days of activity). These are tracked by Papa's service and surfaced on Romeo's student dashboard
- **Milestones**: Upcoming deadlines like challenge reveals, submission due dates, and pitch days are aggregated into a feed on the student's home screen
- **Progress tracking**: Papa tracks which blocks, nodes, and cards a student has completed, and calculates completion percentages. This is the data our `MockStudentProgressProvider` simulates

**Where Delta touches Explore:** Our Experience service groups Papa's courses into "Experiences" (curated programs a school assembles). When a school admin views the dashboard, the "Problems Tackled" metric and "Credit Progress" come from Papa's progress data. Our student drill-down shows per-course completion bars — that data comes from Papa in production.

### Pillar 2: LaunchPad (Team Quebec)

**LaunchPad** is the startup incubator. This is where students build businesses.

- **Sandbox**: A workspace for early-stage experimentation. Students brainstorm ideas, use simplified tools, and prototype concepts. The student dashboard shows "In the Lab" counts for sandbox projects.
- **SideHustle**: A more structured simulated business. Students create a SideHustle, build a **BMC (Business Model Canvas)** with the 9 standard sections (Key Partners, Key Activities, Value Propositions, Customer Segments, etc.), form **Teams**, and post **Open Positions** to recruit other students.
- **"Active Ventures"**: On our dashboard, the "Active Ventures: 7" KPI card counts how many SideHustle projects are currently active at the school. This comes from `MockLaunchPadDataProvider.countActiveVentures()`.
- **Student ventures**: On the student drill-down page, the "LaunchPad Ventures" section shows a student's individual SideHustle projects (e.g., "Campus Snack Box" — active, "Study Buddy Tutoring" — completed). This comes from `MockLaunchPadDataProvider.getStudentVentures()`.

**Where Delta touches LaunchPad:** We display LaunchPad summary data on the school dashboard (venture counts) and the student drill-down (individual venture details). In production, our Dashboard Service would call Quebec's LaunchPad API. Right now, our mock returns realistic sample data.

### Pillar 3: ConnectHub (Team Quebec)

**ConnectHub** is the social and collaboration layer.

- **Feed**: Students share achievements (e.g., winning Entrepreneur's Choice Award), post announcements, and see classmate activity
- **Classifieds**: SideHustle teams post open positions (e.g., "Looking for a marketing lead for Campus Snack Box"). Other students can browse and apply. Positions are marked OPEN or FILLED.
- **Messaging**: Direct messaging between students and instructors, with context linking (messages can be about a specific course, challenge, or SideHustle)

**Where Delta touches ConnectHub:** We don't directly consume ConnectHub data. It's primarily student-to-student. However, school admins might eventually see ConnectHub activity in engagement metrics.

### The Golden Path

The "Golden Path" is the scripted demo flow that Ejaaj (Role C) is responsible for. It follows a student named **Alex** through a complete journey:

1. Alex logs in, sees the Student Home (streaks, XP, active courses, upcoming milestones)
2. Alex opens a course (Design Thinking 101), works through blocks and activity cards
3. A challenge is revealed — a real entrepreneur poses a business problem
4. Alex submits a solution, votes on other students' solutions, attends pitch day
5. Alex wins the Entrepreneur's Choice Award, shares it on ConnectHub
6. Alex's credential appears in the Credential Wallet
7. Alex's school admin sees the updated dashboard metrics
8. Alex's parent sees the achievement on the Parent Dashboard

**Team Delta powers steps 7 and 8** — the school admin and parent views. The student-facing steps (1-6) are Team Romeo (dashboards), Team Papa (courses/challenges), and Team Quebec (auth, ConnectHub, LaunchPad).

### Curriculum Mapping — Alberta Program of Studies

Hatchloom courses map to Alberta high school curriculum requirements. There are three areas:

- **Business Studies** — e.g., "Identify business opportunities" (BS-1.1), "Develop a business plan" (BS-2.1)
- **CTF Design Studies** (Career and Technology Foundations) — e.g., "Apply design thinking process" (CTF-1.1), "Use digital tools for prototyping" (CTF-2.1)
- **CALM** (Career and Life Management) — e.g., "Set personal and financial goals" (CALM-1.1), "Manage personal finances" (CALM-2.1)

Karl's database schema defines the `CurriculumMapping` model that links Hatchloom activities to these standards. Our student drill-down page shows coverage per area with progress bars and individual requirement codes. The school reporting page shows school-wide averages.

**If asked about curriculum mapping:** "Each Hatchloom course covers certain Alberta PoS requirements. Karl's credential engine tracks which requirements a student has met through their coursework. We display that mapping on the student drill-down and the reporting page — showing, for example, that Alex has met 3 of 8 Business Studies requirements through Intro to Entrepreneurship and Marketing Basics."

### Credentials, Badges, and Certificates

Students earn three types of achievements:

- **Credentials**: Formal recognitions tied to course completion (e.g., "Entrepreneurial Thinking Foundations")
- **Badges**: Special achievements like "Entrepreneur's Choice Award" — often tied to challenges
- **Certificates**: Course or program completion certificates (e.g., "Financial Literacy Completion")

Karl's credential engine manages the earning logic. Team Romeo displays them in the Credential Wallet (Screen 901). Team Delta displays them on the student drill-down page and the school reporting page.

### Team and Role Summary

| Team/Role | People | What they own | Screens |
|-----------|--------|--------------|---------|
| **Delta** (us) | Your team | School admin module — experiences, cohorts, enrolments, dashboard | 300, 301, 302, 303 |
| **Papa** | Salam, Alice, Efua, Mahdis | Explore pillar — courses, challenges, activity cards, progress | 000, 020 |
| **Quebec** | Andrew, Anthony, Daniel, Ronald | Auth, LaunchPad (Sandbox, SideHustle), ConnectHub (feed, classifieds, messaging) | 100, 200 |
| **Romeo** | Jahiem, Tharuk, Jefferson, Huzaifa | Student-facing dashboards, credential wallet, parent dashboard | 999, 900, 901, 400 |
| **Matt** (Role A) | Architecture lead | Tech stack, API gateway, cross-service patterns, supervises Papa | — |
| **Karl** (Role B) | Database lead | DB schema, credential engine, security, GitHub/Discord setup, supervises Quebec | — |
| **Ejaaj** (Role C) | Golden Path lead | End-to-end demo simulation, supervises Romeo | — |
| **Eva** | CEO | All leads report to her | — |

### How the teams connect

```
 Papa (Courses, Progress)          Quebec (Auth, LaunchPad, ConnectHub)
       │                                    │
       │  course data, progress             │  auth tokens, venture data
       ▼                                    ▼
 ┌─────────────────────────────────────────────────┐
 │              Team Delta (Us)                     │
 │   Dashboard ◄── Experience ◄── Enrolment         │
 │   Aggregates everything into school admin views  │
 └─────────────────────────────────────────────────┘
       │                                    │
       │  dashboard data                    │  credential data
       ▼                                    ▼
 Romeo (Student Dashboards)        Karl (Credential Engine, DB Schema)
```

Delta sits in the middle — we aggregate upstream data from Papa and Quebec, and Romeo consumes our API for school-level views. Karl's credential engine provides the data that powers curriculum mapping and credential displays across both Delta and Romeo.

---

## 3. How to Run It

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

## 4. Architecture at a Glance

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

## 5. Login and Roles

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

## 6. Demo Walkthrough: Teacher Flow

Login as **Teacher** (Mr. Chen). This is the most feature-rich role and should be the primary demo.

### 6.1 Dashboard (Screen 300)

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

### 6.2 Experiences (Screen 301)

**URL:** `/admin/experiences`

What you'll see:
- Experience table with name, status pill, coordinator, course count, cohort count
- Search bar (debounced, 400ms delay)
- "Create Experience" button (top right)

**Demo actions:**
1. **Search**: Type a few letters in the search box — results filter in real time
2. **Create Experience**: Click the button, fill in name/description, select courses from the checkbox list, submit. The new experience appears in the table.
3. **Navigate**: Click any experience row to go to the detail page

### 6.3 Experience Detail (Screen 302)

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

### 6.4 Cohort Detail

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

### 6.5 Enrolment (Screen 303)

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

### 6.6 Student Drill-Down

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

### 6.7 Reporting / Curriculum

**URL:** `/admin/curriculum`

What you'll see:
- **Alberta PoS Coverage** section: per-student coverage percentages for Business Studies, CTF Design Studies, and CALM
- **Engagement Rates** section: login frequency, activity completion rates, engagement levels
- School-wide averages

---

## 7. Demo Walkthrough: Admin Flow

Login as **School Admin** (Ms. Patel).

Everything looks the same as Teacher **except**:
- No "Create Experience" button on the experiences page
- No "Edit" or "Create Cohort" buttons on experience detail
- No "Edit", "Activate Cohort", or "Complete Cohort" buttons on cohort detail
- **"Enrol Student"** button IS still visible — admins can manage enrolments

This demonstrates **role-based access control**. The backend enforces it (returns 403); the frontend hides the buttons so the user never encounters an error.

---

## 8. Demo Walkthrough: Student and Parent

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

## 9. Design Patterns (6 Patterns)

The workpack requires a minimum of 6 design patterns by D3. Here's where each one lives:

### 9.1 Strategy Pattern

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

### 9.2 Factory Method Pattern

**Where:** `dashboard-service/app/Factories/DashboardWidgetFactory.php`

The dashboard has **widgets** (cohort_summary, student_table, engagement_chart). The factory maps type strings to widget classes and instantiates them with a shared context. Adding a new widget means adding one line to the `WIDGET_MAP` constant.

**API:** `GET /api/school/dashboard/widgets` returns all widgets; `GET /api/school/dashboard/widgets/{type}` returns one.

**If asked:** "The factory encapsulates widget creation. Controllers don't know about specific widget classes — they ask the factory for a type and get back a `DashboardWidget` interface."

### 9.3 State Pattern

**Where:** `enrolment-service/app/States/`

Cohorts have a lifecycle: `not_started` -> `active` -> `completed`. Each state is a class implementing `CohortState`:

- `NotStartedState` — `canActivate()` returns true, `canComplete()` returns false
- `ActiveState` — `canActivate()` returns false, `canComplete()` returns true
- `CompletedState` — both return false (terminal state)

**Demo it live:** Activate a cohort, then complete it. Try to activate a completed cohort — it returns a 422 error.

**If asked:** "The State pattern encapsulates transition rules. The controller doesn't have if/else chains checking status strings — it delegates to the state object."

### 9.4 Observer Pattern (Events and Listeners)

**Where:** `enrolment-service/app/Events/` and `enrolment-service/app/Listeners/`

When a student is enrolled or removed, events are dispatched:

| Event | Listeners |
|-------|-----------|
| `StudentEnrolled` | `UpdateDashboardCounts`, `NotifyTeacher`, `TriggerCredentialCheck` |
| `StudentRemoved` | `UpdateDashboardCounts`, `NotifyTeacher` |

**If asked:** "When `enrolStudent()` runs, it doesn't directly update dashboard counts or send notifications. It fires a `StudentEnrolled` event. Three independent listeners react to it. This decoupling means we can add new side effects (like sending an email) without modifying the enrolment code."

### 9.5 Repository Pattern

**Where:** `dashboard-service/app/Services/DashboardService.php`

The `DashboardService` is the repository boundary between controllers and all data sources (HTTP calls to other services + injected provider interfaces). Controllers never make HTTP calls directly — they call `DashboardService` methods.

**If asked:** "The DashboardService abstracts away whether data comes from an HTTP call, a database query, or a mock provider. The controller doesn't know or care."

### 9.6 Dependency Injection (via Laravel Container)

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

## 10. Cross-Team Dependencies and Mock Providers

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

## 11. API Endpoint Reference

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

## 12. Anticipated Questions and Answers

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

### Broader Platform / Other Teams

**Q: What is gamification in Hatchloom?**
A: Gamification is handled by Team Papa's Explore service. Students earn XP (experience points) for completing activity cards and maintaining daily streaks. Challenges add a competitive element — students submit solutions to real business problems posed by entrepreneurs, vote on each other's work, and compete for awards like the Entrepreneur's Choice. These game mechanics drive engagement. We display the downstream effects on our dashboard — "Problems Tackled" counts completed challenges, and engagement metrics show activity levels.

**Q: What is LaunchPad?**
A: LaunchPad is Quebec's startup incubator pillar. It has two main components: Sandbox (a workspace for early idea experimentation) and SideHustle (a structured simulated business). Students create SideHustles, build a Business Model Canvas with 9 standard sections, form teams, and post open positions. On our dashboard, "Active Ventures: 7" counts active SideHustles at the school. On the student drill-down, we show each student's individual ventures. All LaunchPad data comes from Quebec's service — we consume it via our mock provider.

**Q: What is ConnectHub?**
A: ConnectHub is Quebec's social and collaboration pillar. It includes a feed (where students share achievements and announcements), classifieds (where SideHustle teams post open positions that other students can browse), and messaging. Delta doesn't directly consume ConnectHub data, but it's part of the overall platform experience.

**Q: What is the Business Model Canvas (BMC)?**
A: The BMC is a standard business planning tool with 9 sections: Key Partners, Key Activities, Key Resources, Value Propositions, Customer Relationships, Channels, Customer Segments, Cost Structure, and Revenue Streams. In Hatchloom, each SideHustle has its own BMC that students edit collaboratively. This is built and managed by Quebec's LaunchPad service.

**Q: What are the 10 activity card types?**
A: These are the learning content types in Papa's Explore pillar: Watch Video, Read Document, Complete Quiz, Answer Question, Vote/Poll, Live Session, Social Activity, Explore Gallery, Listen to Podcast, and Submit Solution. Each type has a different content model (e.g., Quiz has a questions array with scoring; Video has URL, duration, and transcript). Students work through these cards within course blocks.

**Q: What does Team Romeo do?**
A: Romeo builds the student-facing dashboards and reporting. They own the Student Home (Screen 999) showing streaks, XP, and active courses; the Student Profile (Screen 900); the Credential Wallet (Screen 901) where earned badges and certificates are displayed; and the Parent Dashboard (Screen 400). Romeo consumes our API for school-level data but we don't depend on them.

**Q: What does the Golden Path demo show?**
A: The Golden Path follows a student named Alex through a complete journey — from logging in, taking a course, competing in a challenge with a real entrepreneur, winning an award, all the way to the school admin seeing updated metrics and the parent seeing the achievement. Team Delta powers the school admin and parent views at the end of that journey.

**Q: How does the Alberta PoS curriculum mapping work?**
A: Hatchloom courses are mapped to Alberta high school curriculum requirements across three areas: Business Studies, CTF Design Studies (Career and Technology Foundations), and CALM (Career and Life Management). Karl's credential engine defines which course activities meet which requirements. When a student completes relevant coursework, the mapping updates. We display this on the student drill-down (per-student coverage with progress bars) and the reporting page (school-wide averages).

### Testing

**Q: How did you test this?**
A: We have unit tests in each Laravel service (run with `php artisan test`), plus a comprehensive bash stress test (`frontend/stress_test.sh`) with 69 checks covering all endpoints, role-based access, CRUD operations, error handling, and seeded data integrity. All 69 pass.

---

## 13. Demo Script Cheat Sheet

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
