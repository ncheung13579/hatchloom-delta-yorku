// Shared TypeScript interfaces for the Hatchloom Delta frontend.
// These mirror the JSON shapes returned by the backend API.

// --- Auth & shared types ---

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'school_admin' | 'school_teacher' | 'student' | 'parent';
  school_id: number;
  school_name?: string;
}

// Standard error envelope returned by the API on 4xx/5xx responses
export interface ApiError {
  error: true;
  message: string;
  code: string;
}

// --- Pagination ---

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// --- Experience types ---

export interface Experience {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'published' | 'draft' | 'archived';
  school_id: number;
  grade?: number;
  total_credits?: number;
  created_by: number | string; // number from API, string when displaying name
  created_by_id?: number;
  courses?: ExperienceCourse[];
  cohorts?: Cohort[];
  course_count?: number;
  cohort_count?: number;
  created_at: string;
  updated_at: string;
}

// Join between an experience and a course, with ordering
export interface ExperienceCourse {
  id: number;
  course_id: number;
  name?: string;
  sequence: number;
}

// --- Enrolment types ---

export interface Cohort {
  id: number;
  name: string;
  experience_id: number;
  experience_name?: string;
  status: 'not_started' | 'active' | 'completed'; // lifecycle: not_started -> active -> completed
  start_date: string;
  end_date: string;
  capacity?: number;
  teacher_id?: number;
  teacher_name?: string;
  school_id: number;
  student_count?: number;
  enrolled_count?: number;
  removed_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CohortEnrolment {
  id: number;
  cohort_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  status: 'enrolled' | 'removed';
  enrolled_at: string;
  removed_at?: string;
}

// --- Course types ---

export interface Course {
  id: number;
  name: string;
  description?: string;
  blocks?: Block[];
}

// A single content block within a course (e.g. video, quiz, reading)
export interface Block {
  id: number;
  course_id: number;
  title: string;
  type: string; // block card type (e.g. 'video', 'quiz', 'discussion')
  sequence: number;
}

// --- Dashboard types ---

export interface DashboardData {
  school: { id: number; name: string };
  summary: {
    problems_tackled: number;
    active_ventures: number;
    students: number;
    experiences: number;
    credit_progress: string;
    timely_completion: string;
  };
  cohorts: Cohort[];
  students: {
    total_enrolled: number;
    active_in_cohorts: number;
    not_assigned: number;
  };
  statistics: {
    enrolment_rate: number;
    average_completion: number;
    average_credit_progress: number;
  };
  warnings: Array<{ type: string; message: string; severity: string }>;
}

// --- Enrolment statistics ---

export interface EnrolmentStatistics {
  total_students: number;
  enrolled: number;
  assigned: number;
  not_assigned: number;
  removed: number;
  warnings: Array<{ type: string; message: string }>;
}
