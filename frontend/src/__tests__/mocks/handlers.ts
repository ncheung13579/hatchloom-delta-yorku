import { http, HttpResponse } from 'msw';

// Shared mock data — matches actual backend response shapes

export const mockDashboard = {
  school: { id: 1, name: 'Ridgewood Academy' },
  summary: {
    problems_tackled: 3,
    active_ventures: 2,
    students: 12,
    experiences: 3,
    credit_progress: '71%',
    timely_completion: '82%',
  },
  cohorts: [
    {
      id: 1,
      name: 'Cohort Alpha',
      experience_id: 1,
      experience_name: 'Startup Sprint',
      status: 'active' as const,
      start_date: '2026-01-15',
      end_date: '2026-06-15',
      enrolled_count: 5,
      student_count: 5,
      school_id: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  students: {
    total_enrolled: 10,
    active_in_cohorts: 8,
    not_assigned: 2,
  },
  statistics: {
    enrolment_rate: 0.83,
    average_completion: 0.0,
    average_credit_progress: 0.0,
  },
  warnings: [
    { type: 'unassigned_students', message: '2 students are not in any active cohort', severity: 'warning' },
  ],
};

export const mockExperiences = {
  data: [
    {
      id: 1,
      name: 'Startup Sprint',
      description: 'Build a startup in 8 weeks',
      status: 'active' as const,
      course_count: 1,
      cohort_count: 1,
      created_by: 'Ms. Smith',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

export const mockExperience = {
  id: 1,
  name: 'Startup Sprint',
  description: 'Build a startup in 8 weeks',
  status: 'active' as const,
  courses: [{ id: 1, name: 'Intro to Entrepreneurship', sequence: 1, blocks: [{ id: 101, name: 'What is a Business?', status: 'complete' }] }],
  cohorts: [
    {
      id: 1,
      name: 'Cohort Alpha',
      experience_id: 1,
      status: 'active' as const,
      start_date: '2026-01-15',
      end_date: '2026-06-15',
      enrolled_count: 5,
      student_count: 5,
      school_id: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  created_by: 'Ms. Smith',
  created_at: '2026-01-01T00:00:00Z',
};

export const mockCourses = {
  data: [
    { id: 1, name: 'Intro to Entrepreneurship', description: 'Learn the basics.' },
    { id: 2, name: 'Financial Literacy', description: 'Money management.' },
  ],
};

export const mockExperienceStatistics = {
  experience_id: 1,
  enrolment: { total_students: 8, active: 6, removed: 2 },
  completion: { completed: 0, in_progress: 6, not_started: 0, completion_rate: 75 },
  credit_progress: { average: 0.0, students_with_credits: 0 },
};

export const mockExperienceStudents = {
  data: [
    {
      student_id: 10,
      cohort_id: 1,
      student_name: 'Alice Johnson',
      student_email: 'alice@ridgewood.edu',
      cohort_name: 'Cohort Alpha',
      status: 'enrolled',
      enrolled_at: '2026-01-20T00:00:00Z',
    },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

export const mockExperienceContents = {
  experience_id: 1,
  courses: [
    {
      id: 1,
      name: 'Intro to Entrepreneurship',
      sequence: 1,
      blocks: [
        { id: 101, name: 'What is a Business?', status: 'complete' },
        { id: 102, name: 'Business Models', status: 'active' },
      ],
    },
  ],
};

export const mockEnrolments = {
  data: [
    {
      student_id: 10,
      name: 'Alice Johnson',
      email: 'alice@ridgewood.edu',
      cohort_assignments: [
        {
          cohort_id: 1,
          cohort_name: 'Cohort Alpha',
          experience_id: 1,
          experience_name: 'Startup Sprint',
          status: 'enrolled',
          enrolled_at: '2026-01-20T00:00:00Z',
        },
      ],
      assignment_status: 'assigned',
    },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

export const mockEnrolmentStatistics = {
  total_students: 12,
  enrolled: 10,
  assigned: 8,
  not_assigned: 2,
  removed: 1,
  warnings: [],
};

export const handlers = [
  // Dashboard
  http.get('/api/school/dashboard', () => HttpResponse.json(mockDashboard)),

  // Experiences
  http.get('/api/school/experiences', ({ request }) => {
    const url = new URL(request.url);
    const id = url.pathname.match(/\/experiences\/(\d+)/);
    if (id) return HttpResponse.json(mockExperience);
    return HttpResponse.json(mockExperiences);
  }),
  http.get('/api/school/experiences/:id', () => HttpResponse.json(mockExperience)),
  http.post('/api/school/experiences', () => HttpResponse.json(mockExperience, { status: 201 })),
  http.delete('/api/school/experiences/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/school/experiences/:id/students', () => HttpResponse.json(mockExperienceStudents)),
  http.get('/api/school/experiences/:id/students/export', () =>
    new HttpResponse('csv,data', { headers: { 'Content-Type': 'text/csv' } })
  ),
  http.get('/api/school/experiences/:id/contents', () => HttpResponse.json(mockExperienceContents)),
  http.get('/api/school/experiences/:id/statistics', () => HttpResponse.json(mockExperienceStatistics)),

  // Courses
  http.get('/api/school/courses', () => HttpResponse.json(mockCourses)),

  // Cohorts
  http.get('/api/school/cohorts', () => HttpResponse.json({ data: mockDashboard.cohorts })),
  http.get('/api/school/cohorts/:id', () => HttpResponse.json(mockDashboard.cohorts[0])),
  http.post('/api/school/cohorts', () => HttpResponse.json(mockDashboard.cohorts[0], { status: 201 })),
  http.patch('/api/school/cohorts/:id/activate', () => HttpResponse.json({ ...mockDashboard.cohorts[0], status: 'active' })),
  http.patch('/api/school/cohorts/:id/complete', () => HttpResponse.json({ ...mockDashboard.cohorts[0], status: 'completed' })),
  http.post('/api/school/cohorts/:id/enrolments', () => HttpResponse.json({ id: 1 }, { status: 201 })),
  http.delete('/api/school/cohorts/:id/enrolments/:studentId', () => new HttpResponse(null, { status: 204 })),

  // Enrolments
  http.get('/api/school/enrolments', () => HttpResponse.json(mockEnrolments)),
  http.get('/api/school/enrolments/statistics', () => HttpResponse.json(mockEnrolmentStatistics)),
  http.get('/api/school/enrolments/export', () =>
    new HttpResponse('csv,data', { headers: { 'Content-Type': 'text/csv' } })
  ),
];
