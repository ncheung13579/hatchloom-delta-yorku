export interface User {
  id: number;
  name: string;
  email: string;
  role: 'school_admin' | 'school_teacher' | 'student' | 'parent';
  school_id: number;
  school_name?: string;
}

export interface ApiError {
  error: true;
  message: string;
  code: string;
}

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

export interface Experience {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'published' | 'draft' | 'archived';
  school_id: number;
  created_by: number | string;
  courses?: ExperienceCourse[];
  cohorts?: Cohort[];
  course_count?: number;
  cohort_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ExperienceCourse {
  id: number;
  course_id: number;
  name?: string;
  sequence: number;
}

export interface Cohort {
  id: number;
  name: string;
  experience_id: number;
  experience_name?: string;
  status: 'not_started' | 'active' | 'completed';
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

export interface Course {
  id: number;
  name: string;
  description?: string;
  blocks?: Block[];
}

export interface Block {
  id: number;
  course_id: number;
  title: string;
  type: string;
  sequence: number;
}

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

export interface EnrolmentStatistics {
  total_students: number;
  enrolled: number;
  assigned: number;
  not_assigned: number;
  removed: number;
  warnings: Array<{ type: string; message: string }>;
}
