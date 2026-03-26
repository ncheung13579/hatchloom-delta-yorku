import client from './client';
import type { Cohort, EnrolmentStatistics, PaginatedResponse } from '../types';

export async function getCohorts(params?: {
  experience_id?: number;
  status?: string;
}): Promise<{ data: Cohort[] }> {
  const { data } = await client.get('/school/cohorts', { params });
  return data;
}

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

export async function getCohort(id: number): Promise<Cohort> {
  const { data } = await client.get<Cohort>(`/school/cohorts/${id}`);
  return data;
}

export async function activateCohort(id: number): Promise<Cohort> {
  const { data } = await client.patch<Cohort>(`/school/cohorts/${id}/activate`);
  return data;
}

export async function completeCohort(id: number): Promise<Cohort> {
  const { data } = await client.patch<Cohort>(`/school/cohorts/${id}/complete`);
  return data;
}

export async function enrolStudent(cohortId: number, studentId: number) {
  const { data } = await client.post(`/school/cohorts/${cohortId}/enrolments`, {
    student_id: studentId,
  });
  return data;
}

export async function removeStudent(cohortId: number, studentId: number): Promise<void> {
  await client.delete(`/school/cohorts/${cohortId}/enrolments/${studentId}`);
}

export async function getEnrolments(params?: Record<string, unknown>): Promise<PaginatedResponse<Record<string, unknown>>> {
  const { data } = await client.get('/school/enrolments', { params });
  return data;
}

export async function getEnrolmentStatistics(): Promise<EnrolmentStatistics> {
  const { data } = await client.get<EnrolmentStatistics>('/school/enrolments/statistics');
  return data;
}

export async function exportEnrolments(): Promise<Blob> {
  const response = await client.get('/school/enrolments/export', {
    responseType: 'blob',
  });
  return response.data;
}

export async function getStudentDetail(studentId: number) {
  const { data } = await client.get(`/school/enrolments/students/${studentId}`);
  return data;
}
