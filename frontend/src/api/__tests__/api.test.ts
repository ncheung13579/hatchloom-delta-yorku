import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDashboard } from '../../api/dashboard';
import {
  getExperiences,
  createExperience,
  getExperience,
  deleteExperience,
  getExperienceStudents,
  getExperienceContents,
  getExperienceStatistics,
  exportExperienceStudents,
} from '../../api/experiences';
import { getCourses } from '../../api/courses';
import {
  getCohorts,
  createCohort,
  getCohort,
  activateCohort,
  completeCohort,
  enrolStudent,
  removeStudent,
  getEnrolments,
  getEnrolmentStatistics,
  exportEnrolments,
} from '../../api/enrolments';
import client from '../../api/client';
import {
  mockDashboard,
  mockExperiences,
  mockExperience,
  mockCourses,
  mockExperienceStudents,
  mockExperienceContents,
  mockExperienceStatistics,
  mockEnrolments,
  mockEnrolmentStatistics,
} from '../../__tests__/mocks/handlers';

describe('Dashboard API', () => {
  beforeEach(() => {
    localStorage.setItem('hatchloom_token', 'test-admin-token');
  });

  it('getDashboard() returns dashboard data', async () => {
    const data = await getDashboard();
    expect(data).toEqual(mockDashboard);
    expect(data.school.name).toBe('Ridgewood Academy');
    expect(data.summary.experiences).toBe(3);
    expect(data.cohorts).toHaveLength(1);
    expect(data.students.total_enrolled).toBe(10);
    expect(data.warnings).toHaveLength(1);
  });
});

describe('Experiences API', () => {
  beforeEach(() => {
    localStorage.setItem('hatchloom_token', 'test-admin-token');
  });

  it('getExperiences() returns paginated experiences', async () => {
    const data = await getExperiences();
    expect(data).toEqual(mockExperiences);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe('Startup Sprint');
    expect(data.meta.current_page).toBe(1);
    expect(data.meta.total).toBe(1);
  });

  it('createExperience() returns the new experience', async () => {
    const data = await createExperience({
      name: 'New Experience',
      description: 'A new experience',
      course_ids: [1, 2],
    });
    expect(data).toEqual(mockExperience);
    expect(data.id).toBe(1);
    expect(data.name).toBe('Startup Sprint');
  });

  it('getExperience() returns a single experience', async () => {
    const data = await getExperience(1);
    expect(data).toEqual(mockExperience);
    expect(data.id).toBe(1);
    expect(data.status).toBe('active');
  });

  it('deleteExperience() does not throw', async () => {
    await expect(deleteExperience(1)).resolves.toBeUndefined();
  });

  it('getExperienceStudents() returns paginated students', async () => {
    const data = await getExperienceStudents(1);
    expect(data).toEqual(mockExperienceStudents);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].student_name).toBe('Alice Johnson');
  });

  it('getExperienceContents() returns course contents', async () => {
    const data = await getExperienceContents(1);
    expect(data).toEqual(mockExperienceContents);
    expect(data.courses).toHaveLength(1);
    expect(data.courses[0].name).toBe('Intro to Entrepreneurship');
    expect(data.courses[0].blocks).toHaveLength(2);
  });

  it('getExperienceStatistics() returns statistics', async () => {
    const data = await getExperienceStatistics(1);
    expect(data).toEqual(mockExperienceStatistics);
    expect(data.enrolment.total_students).toBe(8);
    expect(data.enrolment.active).toBe(6);
    expect(data.completion.completion_rate).toBe(75);
  });

  it('exportExperienceStudents() calls the correct endpoint', async () => {
    // Blob responseType + MSW XMLHttpRequest interceptor causes stream errors
    // in jsdom, so we spy on the axios client to verify wiring instead.
    const getSpy = vi.spyOn(client, 'get').mockResolvedValueOnce({ data: 'csv,data' });

    const data = await exportExperienceStudents(1);
    expect(data).toBe('csv,data');
    expect(getSpy).toHaveBeenCalledWith('/school/experiences/1/students/export', {
      responseType: 'blob',
    });

    getSpy.mockRestore();
  });
});

describe('Courses API', () => {
  beforeEach(() => {
    localStorage.setItem('hatchloom_token', 'test-admin-token');
  });

  it('getCourses() returns course list', async () => {
    const data = await getCourses();
    expect(data).toEqual(mockCourses);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].name).toBe('Intro to Entrepreneurship');
    expect(data.data[1].name).toBe('Financial Literacy');
  });
});

describe('Enrolments API', () => {
  beforeEach(() => {
    localStorage.setItem('hatchloom_token', 'test-admin-token');
  });

  it('getCohorts() returns cohort list', async () => {
    const data = await getCohorts();
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe('Cohort Alpha');
    expect(data.data[0].status).toBe('active');
  });

  it('createCohort() returns the new cohort', async () => {
    const data = await createCohort({
      experience_id: 1,
      name: 'Cohort Beta',
      start_date: '2026-03-01',
      end_date: '2026-08-01',
    });
    expect(data.id).toBe(1);
    expect(data.name).toBe('Cohort Alpha');
    expect(data.experience_id).toBe(1);
  });

  it('getCohort() returns a single cohort', async () => {
    const data = await getCohort(1);
    expect(data.id).toBe(1);
    expect(data.name).toBe('Cohort Alpha');
    expect(data.status).toBe('active');
  });

  it('activateCohort() returns updated cohort with active status', async () => {
    const data = await activateCohort(1);
    expect(data.id).toBe(1);
    expect(data.status).toBe('active');
  });

  it('completeCohort() returns updated cohort with completed status', async () => {
    const data = await completeCohort(1);
    expect(data.id).toBe(1);
    expect(data.status).toBe('completed');
  });

  it('enrolStudent() returns enrolment data', async () => {
    const data = await enrolStudent(1, 10);
    expect(data).toBeTruthy();
    expect(data.id).toBe(1);
  });

  it('removeStudent() does not throw', async () => {
    await expect(removeStudent(1, 10)).resolves.toBeUndefined();
  });

  it('getEnrolments() returns paginated enrolments', async () => {
    const data = await getEnrolments();
    expect(data).toEqual(mockEnrolments);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe('Alice Johnson');
    expect(data.meta.total).toBe(1);
  });

  it('getEnrolmentStatistics() returns statistics', async () => {
    const data = await getEnrolmentStatistics();
    expect(data).toEqual(mockEnrolmentStatistics);
    expect(data.total_students).toBe(12);
    expect(data.enrolled).toBe(10);
    expect(data.assigned).toBe(8);
    expect(data.not_assigned).toBe(2);
    expect(data.removed).toBe(1);
    expect(data.warnings).toHaveLength(0);
  });

  it('exportEnrolments() calls the correct endpoint', async () => {
    // Same blob + MSW caveat as exportExperienceStudents above.
    const getSpy = vi.spyOn(client, 'get').mockResolvedValueOnce({ data: 'csv,data' });

    const data = await exportEnrolments();
    expect(data).toBe('csv,data');
    expect(getSpy).toHaveBeenCalledWith('/school/enrolments/export', {
      responseType: 'blob',
    });

    getSpy.mockRestore();
  });
});
