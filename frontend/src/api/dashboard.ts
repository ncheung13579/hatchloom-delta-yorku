import client from './client';
import type { DashboardData } from '../types';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await client.get<DashboardData>('/school/dashboard');
  return data;
}

export async function getStudentDrilldown(studentId: number) {
  const { data } = await client.get(`/school/dashboard/students/${studentId}`);
  return data;
}

export async function getPosCoverage() {
  const { data } = await client.get('/school/dashboard/reporting/pos-coverage');
  return data;
}

export async function getEngagement() {
  const { data } = await client.get('/school/dashboard/reporting/engagement');
  return data;
}

export async function getWidgets() {
  const { data } = await client.get('/school/dashboard/widgets');
  return data;
}

export async function getWidget(type: string) {
  const { data } = await client.get(`/school/dashboard/widgets/${type}`);
  return data;
}
