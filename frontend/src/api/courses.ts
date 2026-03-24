import client from './client';
import type { Course } from '../types';

export async function getCourses(): Promise<{ data: Course[] }> {
  const { data } = await client.get('/school/courses');
  return data;
}
