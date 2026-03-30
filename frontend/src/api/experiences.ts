import client from './client';
import type { Experience, PaginatedResponse } from '../types';

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

export async function createExperience(body: {
  name: string;
  description: string;
  course_ids: number[];
}): Promise<Experience> {
  const { data } = await client.post<Experience>('/school/experiences', body);
  return data;
}

export async function getExperience(id: number): Promise<Experience> {
  const { data } = await client.get<Experience>(`/school/experiences/${id}`);
  return data;
}

export async function deleteExperience(id: number): Promise<void> {
  await client.delete(`/school/experiences/${id}`);
}

export async function updateExperience(
  id: number,
  body: { name?: string; description?: string; course_ids?: number[]; created_by?: number }
): Promise<Experience> {
  const { data } = await client.put<Experience>(`/school/experiences/${id}`, body);
  return data;
}

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

export async function getExperienceContents(experienceId: number) {
  const { data } = await client.get(`/school/experiences/${experienceId}/contents`);
  return data;
}

export async function getExperienceStatistics(experienceId: number) {
  const { data } = await client.get(`/school/experiences/${experienceId}/statistics`);
  return data;
}

export async function exportExperienceStudents(experienceId: number): Promise<Blob> {
  const response = await client.get(`/school/experiences/${experienceId}/students/export`, {
    responseType: 'blob',
  });
  return response.data;
}
