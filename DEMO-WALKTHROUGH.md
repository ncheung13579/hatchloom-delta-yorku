# Demo Walkthrough — Team Delta (Screens 300-303)

Use this as a cheat sheet while clicking through the app. Each section maps to a school administrator user story from HatchloomProject.docx.

---

## Setup

- Make sure all 3 backend services are running (ports 8001, 8002, 8003) and the frontend dev server is up
- Start at the login page (http://localhost:3000)

---

## Part 1 — Admin Login & Access Privileges (User Story 5)

> "As a school administrator I should be able to create an account to log into the platform. My account should come with specific access privileges including student and instructor profiles, course pages, certification pages. I cannot change any personal information or static information (e.g., course or certification code), but I can change student registrations, teacher-course assignments and course-certification assignments."

### What to show: Admin logs in and has access to everything across the school

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
   - "This is the admin's access to **student profiles** — aggregated from the local users table and the Enrolment Service"
6. Click the **Cohorts tab**
   - Shows all cohorts with status, student count, experience name, end date
7. Scroll to the **Student Engagement** section
   - Login days, completion rate with progress bars, engagement level badges
   - "This is powered by the engagement_chart widget from the Factory Method pattern"
8. **Student profile drill-down:** Click any student row (e.g., "Aiden Carter")
   - You land on the **Student Drilldown** page
   - Point out: progress metrics, course progress, cohort assignments, credentials, curriculum mapping (PoS coverage)
   - "This is the admin's full access to a **student profile** — progress, credentials, and curriculum alignment"
9. Point out the **Credentials** section on the drilldown page
   - "This is the admin's access to **certification pages** — the credential data is mocked from Karl's credential engine"
10. Click **back** (browser back or breadcrumb) to return to Dashboard
11. Point out the **sidebar navigation**: Dashboard, Experiences, Enrolment, Curriculum Alignment, Credentials
    - "The admin has access to all content areas. Curriculum Alignment and Credentials pages are wired as placeholders ready for Karl's credential engine API."

### Key privileges to call out:
- Admin can **view** student profiles, instructor profiles (coordinator on experiences), course pages, certification pages
- Admin can **change** student registrations (enrol/remove), teacher-course assignments (coordinator), course-certification assignments (placeholder for Karl's engine)
- Admin **cannot change** personal information or static information like course codes — those are read-only, owned by other services

---

## Part 2 — Create Experiences & Manage Enrolment (User Story 6)

> "As a school administrator I should be able to create new courses. Courses must have names, codes and at least a brief description. I should also be able to assign principal and assistant instructors. I should be able to manually register students or approve the registration of students that have requested to be registered to the course by themselves. I should be able to enable or disable functions (e.g., the communication forum or specific activities) for specific courses. I should be able to explicitly define the connections between courses, if any, and between courses and specifications."

### What to show: Admin creates an experience, assigns instructor, manages student registrations

12. Click **"Experiences"** in the sidebar → **Screen 301**
    - Point out the table columns: Experience, Grade, Status, Coordinator, Contents, Credits, Cohorts
    - "Each experience has a grade level, shows the coordinating teacher, course count, total credits, and linked cohorts with student counts"
13. Click **"Create Experience"** button (top-right)
    - Fill in:
      - Name: "Financial Literacy 101"
      - Description: "Introduction to personal finance and budgeting"
      - Check 2-3 courses from the list
    - Click **"Create Experience"**
    - The new experience appears in the table
    - "Courses have **names** and a **description**. The course codes come from Team Papa's course catalogue — we select courses by checking them from the list. The **connections between courses** are defined by grouping them into an experience."
14. Click on the new experience you just created (**"Financial Literacy 101"**) → **Experience Detail** page
    - Shows courses and statistics for this experience
    - "This is the **course page** — it shows the experience's contents, cohorts, and performance metrics"
15. **Assign instructor**: Click the **"Edit" button** (pencil icon, top-right)
    - The Edit Experience modal opens
    - Point out the **Coordinator dropdown** — this only appears for admins, not teachers
    - Select **"Mr. Johnson"** as coordinator
    - Click **"Save Changes"**
    - "This demonstrates **assigning the principal instructor** — the admin can assign which teacher coordinates the experience"
16. **Create first cohort**: Click **"Create Cohort"** button
    - Fill in:
      - Name: "Spring 2026"
      - Start date: today's date
      - End date: a few months out
    - Click **"Create"**
    - The new cohort appears on the page
    - "The admin has created an experience from scratch, assigned an instructor, and set up its first cohort"
17. Click on the cohort you just created (**"Spring 2026"**) → **Screen 302 — Cohort Detail**
    - Point out the **3 metric cards**: Students Enrolled, Credit Progress, Timely Completion
    - Point out the **Contents & Delivery** section with courses and block progress bars
    - Point out the **Students table**: Student, Grade, Status dot, Last Active, Contact (email link), Credits
18. Show **search**: type a student name in the search box → table filters
19. Show **export**: click the "Export" button → CSV downloads
20. **Manually register a student**: click **"Enrol Student"** button
    - Enter a student ID (e.g., 12 for Noah Bergstrom)
    - Click **"Enrol"**
    - The student appears in the table
    - "This demonstrates the admin **manually registering a student** to the cohort"
21. **Remove a student**: hover over a student row, click the **✕ button** on the right
    - A confirmation modal appears: "Are you sure you want to remove [Name] from this cohort?"
    - Click **"Remove Student"**
    - The student is removed from the table
    - "The admin can both add and remove student registrations"
22. Show **cohort lifecycle**: click **"Activate Cohort"**
    - Status changes from "Not Started" to "Active"
    - "Cohort status follows the State pattern: Not Started → Active → Completed. One-directional, no going back."

---

## Part 3 — Enrolment Overview (User Story 6 continued)

23. Click **"Enrolment"** in the sidebar → **Screen 303**
    - Point out the **3 metric cards**: Students Enrolled, Active Assignments, Not in Any Active Cohort
    - If there's a warning banner: "3 students are not in any active cohort" — point it out
    - "This gives the admin a school-wide view of **all student registrations**"
24. Show **filters**: use the Grade, Experience, and Cohort dropdowns
    - Select "Grade 10" → table filters to grade 10 students only
    - Clear the filter
25. Show the **student table**: Student, Grade, Active Cohorts (as pills), Status, Last Active
    - Students with no cohorts show "No active cohorts" in amber text and "Unassigned" status
    - "Unassigned students are flagged so the admin knows who still needs to be registered"
26. Show **search**: type a name → table filters
27. Show **export**: click "Export" → CSV downloads
28. **Drill-down:** Click the arrow on any student row → Student Drilldown page
    - Same detailed view as from the Dashboard

---

## Part 4 — Role Switching (User Story 7)

> "As a school administrator I should be able to access all content under any role. For testing purposes, I should be able to change my role to student or instructor and access a course or certification page and see what I can have access to. When testing a role, I should not be able to make any changes. Then, I should be able to revert to my role and make any changes I want."

### What to show: Admin can see what every role sees

29. Click **"Sign Out"**
30. Click **"Teacher"**
    - Role badge changes to **"Teacher"**
    - Click **"Experiences"** — point out the teacher can also create experiences and manage cohorts
    - "Teachers build and run experiences day-to-day. The admin has additional privileges like reassigning coordinators."
31. Click **"Sign Out"**
32. Click **"Student"**
    - You're now in the **Student Portal** — completely different layout
    - "Students see only their own data — their courses, their progress, their credentials. This is what the admin would see when testing the student role."
33. Click **"Sign Out"**
34. Click **"Parent"**
    - You're in the **Parent Portal**
    - Shows linked children with their progress
    - "Parents can only see data for their linked children"
35. Click **"Sign Out"**
36. Click **"School Admin"** again
    - Full admin view is restored
    - "This demonstrates role-based access — each role sees a different view of the same data, enforced by the backend. The admin can switch between roles to verify what each role has access to, then revert to the admin role to make changes."

---

## Talking Points for Q&A

### "Why can you just click a button to log in?"

"Authentication is owned by Team Quebec. Our service uses the Strategy pattern — MockAuthMiddleware maps tokens to users for the demo. When Quebec's real auth service is ready, we swap the binding in AppServiceProvider to an HTTP-backed provider. No code changes in controllers or services."

### "The user story says the admin shouldn't be able to make changes when testing a role. Doesn't your role switch allow changes?"

"The user story describes an impersonation feature where the admin can preview another role in read-only mode. That would require a dedicated impersonation endpoint from Team Quebec's auth service — the admin would get a read-only token scoped to the target role. Our architecture supports this: the MockAuthMiddleware already maps tokens to users with specific roles, so a read-only impersonation token would work with zero changes to our controllers. For the demo, we show the concept by logging in as each role separately."

### "Where does the course data come from?"

"Courses are owned by Team Papa's Course Service. We use the Strategy pattern — MockCourseDataProvider returns mock course data. The interface (CourseDataProviderInterface) stays the same whether we're using mocks or real HTTP calls."

### "What about course codes? The user story mentions codes."

"Course codes are owned by Team Papa's Course Service — they're a property of the course itself, not something the admin sets when creating an experience. When Papa's real service is integrated, course codes will appear alongside course names in our UI. For now, our mock provider returns course names without codes."

### "What about assistant instructors?"

"The user story mentions assigning principal and assistant instructors. We've implemented the principal instructor (coordinator) assignment. Assistant instructor support would require extending the experience-course pivot table with a role column — it's a straightforward addition once the team coordination use cases are finalized."

### "What about enabling/disabling functions for specific courses?"

"Feature toggles per course (e.g., enabling/disabling the communication forum) are a platform-level capability that spans multiple teams. Our architecture supports this through the course data provider — when Papa's Course Service exposes feature flags, our UI can render toggle controls. For this deliverable, we focused on the core CRUD and enrolment flows."

### "What about credits and curriculum mapping?"

"Credit tracking and curriculum mapping (Alberta PoS) are owned by Karl's credential engine. We mock this data for the demo using MockCredentialDataProvider and MockStudentProgressProvider. The drill-down page shows per-student PoS coverage across Business Studies, CTF Design Studies, and CALM."

### "What about course-certification assignments?"

"The user story mentions the admin can change course-certification assignments. That mapping is owned by Karl's credential engine — our Curriculum Alignment and Credentials pages are wired up as placeholders ready to consume his API. For the demo we show the credential data on the Student Drilldown page (PoS coverage), which proves the integration point works. Once Karl's service is live, the admin will be able to edit those mappings through the Curriculum Alignment screen."

### "What design patterns are you using?"

1. **Strategy** — CourseDataProvider, CredentialDataProvider, LaunchPadDataProvider (swap mock <> real)
2. **State** — Cohort lifecycle: Not Started → Active → Completed (one-directional transitions)
3. **Factory Method** — DashboardWidgetFactory creates CohortSummary, StudentTable, EngagementChart widgets
4. **Observer** — StudentEnrolled / StudentRemoved events for decoupled side effects
5. **Decorator** — SchoolScope global scope for automatic multi-tenant WHERE clauses
6. **Service Layer** — Controller → Service → Model separation in every service
