// API functions for the course catalogue (read-only from Delta's perspective).
import client from './client';
import type { Course } from '../types';

// GET /school/courses — fetch all courses for the current school
export async function getCourses(): Promise<{ data: Course[] }> {
  const { data } = await client.get('/school/courses');
  return data;
}
