// API functions for experience CRUD and related sub-resources (students, contents, stats).
import client from './client';
import type { Experience, PaginatedResponse } from '../types';

// GET /school/experiences — paginated list with optional search
export async function getExperiences(
  page = 1,
  perPage = 15,
  search = ''
): Promise<PaginatedResponse<Experience>> {
  const { data } = await client.get<PaginatedResponse<Experience>>('/school/experiences', {
    params: { page, per_page: perPage, ...(search && { search }) },
  });
  return data;
}

// POST /school/experiences — create a new experience with linked courses
export async function createExperience(body: {
  name: string;
  description: string;
  course_ids: number[];
}): Promise<Experience> {
  const { data } = await client.post<Experience>('/school/experiences', body);
  return data;
}

// GET /school/experiences/:id — fetch a single experience with courses and cohorts
export async function getExperience(id: number): Promise<Experience> {
  const { data } = await client.get<Experience>(`/school/experiences/${id}`);
  return data;
}

// DELETE /school/experiences/:id — delete an experience (must have no active cohorts)
export async function deleteExperience(id: number): Promise<void> {
  await client.delete(`/school/experiences/${id}`);
}

// PUT /school/experiences/:id — update experience details and course links
export async function updateExperience(
  id: number,
  body: { name?: string; description?: string; course_ids?: number[]; created_by?: number }
): Promise<Experience> {
  const { data } = await client.put<Experience>(`/school/experiences/${id}`, body);
  return data;
}

// GET /school/experiences/:id/students — paginated students enrolled in the experience
export async function getExperienceStudents(
  experienceId: number,
  page = 1,
  perPage = 15,
  search = ''
) {
  const { data } = await client.get(`/school/experiences/${experienceId}/students`, {
    params: { page, per_page: perPage, ...(search && { search }) },
  });
  return data;
}

// GET /school/experiences/:id/contents — course blocks within the experience
export async function getExperienceContents(experienceId: number) {
  const { data } = await client.get(`/school/experiences/${experienceId}/contents`);
  return data;
}

// GET /school/experiences/:id/statistics — completion and progress stats
export async function getExperienceStatistics(experienceId: number) {
  const { data } = await client.get(`/school/experiences/${experienceId}/statistics`);
  return data;
}

// GET /school/experiences/:id/students/export — download student list as CSV blob
export async function exportExperienceStudents(experienceId: number): Promise<Blob> {
  const response = await client.get(`/school/experiences/${experienceId}/students/export`, {
    responseType: 'blob',
  });
  return response.data;
}
