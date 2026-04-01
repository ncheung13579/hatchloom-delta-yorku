// API functions for the admin dashboard: summary stats, reporting, and widgets.
import client from './client';
import type { DashboardData } from '../types';

// GET /school/dashboard — fetch full dashboard summary for the current school
export async function getDashboard(): Promise<DashboardData> {
  const { data } = await client.get<DashboardData>('/school/dashboard');
  return data;
}

// GET /school/dashboard/students/:id — per-student progress drilldown
export async function getStudentDrilldown(studentId: number) {
  const { data } = await client.get(`/school/dashboard/students/${studentId}`);
  return data;
}

// GET /school/dashboard/reporting/pos-coverage — programme-of-study coverage report
export async function getPosCoverage() {
  const { data } = await client.get('/school/dashboard/reporting/pos-coverage');
  return data;
}

// GET /school/dashboard/reporting/engagement — student engagement metrics
export async function getEngagement() {
  const { data } = await client.get('/school/dashboard/reporting/engagement');
  return data;
}

// GET /school/dashboard/widgets — fetch all dashboard widget configurations
export async function getWidgets() {
  const { data } = await client.get('/school/dashboard/widgets');
  return data;
}

// GET /school/dashboard/widgets/:type — fetch a single widget by type
export async function getWidget(type: string) {
  const { data } = await client.get(`/school/dashboard/widgets/${type}`);
  return data;
}
