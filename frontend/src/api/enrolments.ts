// API functions for cohort management and student enrolment workflows.
import client from './client';
import type { Cohort, EnrolmentStatistics, PaginatedResponse } from '../types';

// GET /school/cohorts — list cohorts, optionally filtered by experience or status
export async function getCohorts(params?: {
  experience_id?: number;
  status?: string;
}): Promise<{ data: Cohort[] }> {
  const { data } = await client.get('/school/cohorts', { params });
  return data;
}

// POST /school/cohorts — create a new cohort under an experience
export async function createCohort(body: {
  experience_id: number;
  name: string;
  start_date: string;
  end_date: string;
  capacity?: number;
  teacher_id?: number;
}): Promise<Cohort> {
  const { data } = await client.post<Cohort>('/school/cohorts', body);
  return data;
}

// GET /school/cohorts/:id — fetch a single cohort with enrolment counts
export async function getCohort(id: number): Promise<Cohort> {
  const { data } = await client.get<Cohort>(`/school/cohorts/${id}`);
  return data;
}

// PUT /school/cohorts/:id — update cohort metadata (name, dates, capacity, teacher)
export async function updateCohort(id: number, body: {
  name?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
  teacher_id?: number;
}): Promise<Cohort> {
  const { data } = await client.put<Cohort>(`/school/cohorts/${id}`, body);
  return data;
}

// PATCH /school/cohorts/:id/activate — transition cohort from not_started to active
export async function activateCohort(id: number): Promise<Cohort> {
  const { data } = await client.patch<Cohort>(`/school/cohorts/${id}/activate`);
  return data;
}

// PATCH /school/cohorts/:id/complete — transition cohort from active to completed
export async function completeCohort(id: number): Promise<Cohort> {
  const { data } = await client.patch<Cohort>(`/school/cohorts/${id}/complete`);
  return data;
}

// POST /school/cohorts/:id/enrolments — enrol a student into a cohort
export async function enrolStudent(cohortId: number, studentId: number) {
  const { data } = await client.post(`/school/cohorts/${cohortId}/enrolments`, {
    student_id: studentId,
  });
  return data;
}

// DELETE /school/cohorts/:id/enrolments/:studentId — remove a student from a cohort
export async function removeStudent(cohortId: number, studentId: number): Promise<void> {
  await client.delete(`/school/cohorts/${cohortId}/enrolments/${studentId}`);
}

// GET /school/enrolments?cohort_id=:id — paginated enrolments for a specific cohort
export async function getCohortEnrolments(cohortId: number, params?: Record<string, unknown>): Promise<PaginatedResponse<Record<string, unknown>>> {
  const { data } = await client.get('/school/enrolments', { params: { cohort_id: cohortId, ...params } });
  return data;
}

// GET /school/enrolments — paginated list of all enrolments, with optional filters
export async function getEnrolments(params?: Record<string, unknown>): Promise<PaginatedResponse<Record<string, unknown>>> {
  const { data } = await client.get('/school/enrolments', { params });
  return data;
}

// GET /school/enrolments/statistics — aggregate counts (enrolled, assigned, removed)
export async function getEnrolmentStatistics(): Promise<EnrolmentStatistics> {
  const { data } = await client.get<EnrolmentStatistics>('/school/enrolments/statistics');
  return data;
}

// GET /school/enrolments/export — download enrolment data as CSV blob
export async function exportEnrolments(params?: { cohort_id?: number; experience_id?: number }): Promise<Blob> {
  const response = await client.get('/school/enrolments/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

// GET /school/enrolments/students/:id — full detail for a single student
export async function getStudentDetail(studentId: number) {
  const { data } = await client.get(`/school/enrolments/students/${studentId}`);
  return data;
}
