# Demo Walkthrough — Team Delta (Screens 300-303)

Use this as a cheat sheet while clicking through the app. Each section maps to a user story from HatchloomProject.docx.

---

## Setup

- Make sure all 3 backend services are running (ports 8001, 8002, 8003) and the frontend dev server is up
- Start at the login page (http://localhost:3000)

---

## Part 1 — Admin Login & Privileges (User Story 5)

> "As a school administrator I should be able to create an account to log into the platform."

### What to show: Admin logs in and sees aggregated data across the school

1. On the login page, click **"School Admin"**
2. You land on **Screen 300 — Dashboard**
   - Point out the **role badge** in the top nav bar: "School Admin"
   - Point out the school name: "Ridgewood Academy"
3. Walk through the **6 metric cards** at the top:
   - Problems Tackled, Active Ventures, Students, Experiences, Credit Progress, Timely Completion
   - "These aggregate data from the Experience Service, Enrolment Service, and mock providers for LaunchPad and credentials"
4. Show the **warning banner** (yellow) if visible
   - "The dashboard raises warnings when services are degraded or students are unassigned"
5. In the **Students tab**, point out:
   - Student names with avatars, grade, cohort pills, status dots (green = on track, amber = at risk, gray = not assigned), last active
   - "This data is aggregated from the local users table and the Enrolment Service"
6. Click the **Cohorts tab**
   - Shows all cohorts with status, student count, experience name, end date
7. Scroll to the **Student Engagement** section
   - Login days, completion rate with progress bars, engagement level badges
   - "This is powered by the engagement_chart widget from the Factory Method pattern"
8. **Drill-down:** Click any student row (e.g., "Aiden Carter")
   - You land on the **Student Drilldown** page
   - Point out: progress metrics, course progress, cohort assignments, credentials, curriculum mapping (PoS coverage)
   - "This shows the admin can drill down into any student's full profile"
9. Click **back** (browser back or breadcrumb) to return to Dashboard

### Key privileges to point out:
- Admin can **create experiences**, **edit them**, and **reassign coordinators** (teacher-course assignments)
- Admin can **create cohorts**, **enrol students**, and **remove students** (student registrations)
- Admin can **see all students** across the school
- Sidebar shows all navigation items: Dashboard, Experiences, Enrolment, Curriculum Alignment, Credentials

---

## Part 2 — Create Experiences & Manage Enrolment (User Stories 5 & 6)

> "As a school administrator I should be able to create new courses."
> "I can change student registrations, teacher-course assignments and course-certification assignments."

### What to show: Admin creates an experience, manages cohorts, enrols/removes students, reassigns coordinator

10. Click **"Experiences"** in the sidebar → **Screen 301**
    - Point out the table columns: Experience, Grade, Status, Coordinator, Contents, Credits, Cohorts
    - "Each experience has a grade level, shows the coordinating teacher, course count, total credits, and linked cohorts with student counts"
11. Click **"Create Experience"** button (top-right)
    - Fill in:
      - Name: "Financial Literacy 101"
      - Description: "Introduction to personal finance and budgeting"
      - Check 2-3 courses from the list
    - Click **"Create Experience"**
    - The new experience appears in the table
    - "The admin can create experiences directly — both admin and teacher roles have this ability"
12. Click on an existing experience name (e.g., **"Business Foundations"**) → **Experience Detail** page
    - Shows courses, cohorts, and statistics for this experience
13. **Reassign coordinator**: Click the **"Edit" button** (pencil icon, top-right)
    - The Edit Experience modal opens
    - Point out the **Coordinator dropdown** — this only appears for admins, not teachers
    - Change the coordinator from "Ms. Smith" to **"Mr. Johnson"**
    - Click **"Save Changes"**
    - "This demonstrates teacher-course assignments — the admin can reassign which teacher coordinates an experience"
14. Click on a cohort name (e.g., **"Cohort A"**) → **Screen 302 — Cohort Detail**
    - Point out the **3 metric cards**: Students Enrolled, Credit Progress, Timely Completion
    - Point out the **Contents & Delivery** section with courses and block progress bars
    - Point out the **Students table**: Student, Grade, Status dot, Last Active, Contact (email link), Credits
15. Show **search**: type a student name in the search box → table filters
16. Show **export**: click the "Export" button → CSV downloads
17. Show **enrol a student**: click **"Enrol Student"** button
    - Enter a student ID (e.g., 12 for Noah Bergstrom)
    - Click **"Enrol"**
    - The student appears in the table
    - "This demonstrates the admin adding a student registration"
18. Show **remove a student**: hover over a student row, click the **✕ button** on the right
    - A confirmation modal appears: "Are you sure you want to remove [Name] from this cohort?"
    - Click **"Remove Student"**
    - The student is removed from the table
    - "This demonstrates the admin removing a student registration — both add and remove are supported"
19. Show **cohort lifecycle**: if the cohort is "Not Started", click **"Activate Cohort"**
    - Status changes to "Active"
    - "Cohort status follows the State pattern: Not Started → Active → Completed. One-directional, no going back."

---

## Part 3 — Enrolment Management (also User Story 6)

20. Click **"Enrolment"** in the sidebar → **Screen 303**
    - Point out the **3 metric cards**: Students Enrolled, Active Assignments, Not in Any Active Cohort
    - If there's a warning banner: "3 students are not in any active cohort" — point it out
21. Show **filters**: use the Grade, Experience, and Cohort dropdowns
    - Select "Grade 10" → table filters to grade 10 students only
    - Clear the filter
22. Show the **student table**: Student, Grade, Active Cohorts (as pills), Status, Last Active
    - Students with no cohorts show "No active cohorts" in amber text and "Unassigned" status
23. Show **search**: type a name → table filters
24. Show **export**: click "Export" → CSV downloads
25. **Drill-down:** Click the arrow on any student row → Student Drilldown page
    - Same detailed view as from the Dashboard

---

## Part 4 — Role Switching (User Story 7)

> "As a school administrator I should be able to access all content under any role."

26. Click **"Sign Out"**
27. Click **"Teacher"**
    - Role badge changes to **"Teacher"**
    - Point out the teacher can also create experiences and manage cohorts
    - "Teachers build and run experiences day-to-day — both roles can create, but the admin has additional privileges like reassigning coordinators"
28. Click **"Sign Out"**
29. Click **"Student"**
    - You're now in the **Student Portal** — completely different layout
    - "Students see only their own data — their courses, their progress, their credentials"
30. Click **"Sign Out"**
31. Click **"Parent"**
    - You're in the **Parent Portal**
    - Shows linked children with their progress
    - "Parents can only see data for their linked children"
32. Click **"Sign Out"**
33. Click **"School Admin"** again
    - Full admin view is restored
    - "This demonstrates role-based access — each role sees a different view of the same data, enforced by the backend"

---

## Talking Points for Q&A

### "Why can you just click a button to log in?"

"Authentication is owned by Team Quebec. Our service uses the Strategy pattern — MockAuthMiddleware maps tokens to users for the demo. When Quebec's real auth service is ready, we swap the binding in AppServiceProvider to an HTTP-backed provider. No code changes in controllers or services."

### "Where does the course data come from?"

"Courses are owned by Team Papa's Course Service. We use the Strategy pattern again — MockCourseDataProvider returns mock course data. The interface (CourseDataProviderInterface) stays the same whether we're using mocks or real HTTP calls."

### "What about credits and curriculum mapping?"

"Credit tracking and curriculum mapping (Alberta PoS) are owned by Karl's credential engine. We mock this data for the demo using MockCredentialDataProvider and MockStudentProgressProvider. The drill-down page shows per-student PoS coverage across Business Studies, CTF Design Studies, and CALM."

### "What about course-certification assignments?"

"The user story mentions the admin can change course-certification assignments. That mapping is owned by Karl's credential engine — our Curriculum Alignment and Credentials pages are wired up as placeholders ready to consume his API. For the demo we show the credential data on the Student Drilldown page (PoS coverage), which proves the integration point works. Once Karl's service is live, the admin will be able to edit those mappings through the Curriculum Alignment screen."

### "What design patterns are you using?"

1. **Strategy** — CourseDataProvider, CredentialDataProvider, LaunchPadDataProvider (swap mock ↔ real)
2. **State** — Cohort lifecycle: Not Started → Active → Completed (one-directional transitions)
3. **Factory Method** — DashboardWidgetFactory creates CohortSummary, StudentTable, EngagementChart widgets
4. **Observer** — StudentEnrolled / StudentRemoved events for decoupled side effects
5. **Decorator** — SchoolScope global scope for automatic multi-tenant WHERE clauses
6. **Service Layer** — Controller → Service → Model separation in every service
