import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';

import { renderWithProviders } from '../../__tests__/test-utils';
import {
  mockDashboard,
  mockExperiences,
  mockEnrolments,
  mockEnrolmentStatistics,
} from '../../__tests__/mocks/handlers';

import LoginPage from '../LoginPage';
import DashboardPage from '../admin/DashboardPage';
import ExperiencesPage from '../admin/ExperiencesPage';
import ExperienceDetailPage from '../admin/ExperienceDetailPage';
import EnrolmentsPage from '../admin/EnrolmentsPage';
import PlaceholderPage from '../admin/PlaceholderPage';

// ---------------------------------------------------------------------------
// 1. LoginPage
// ---------------------------------------------------------------------------
describe('LoginPage', () => {
  it('renders login card with "hatchloom" text', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('hatch')).toBeInTheDocument();
    expect(screen.getByText('loom')).toBeInTheDocument();
  });

  it('has "School Admin" and "Teacher" buttons', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /school admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /teacher/i })).toBeInTheDocument();
  });

  it('clicking "School Admin" sets localStorage with admin token', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const adminBtn = screen.getByRole('button', { name: /school admin/i });
    await user.click(adminBtn);

    expect(localStorage.getItem('hatchloom_token')).toBe('test-admin-token');
  });
});

// ---------------------------------------------------------------------------
// 2. DashboardPage
// ---------------------------------------------------------------------------
describe('DashboardPage', () => {
  it('shows loading spinner initially', () => {
    renderWithProviders(<DashboardPage />, { authenticated: true });
    // The Spinner component renders a container with role="status" or a visual spinner.
    // Since the query is in-flight the page returns <Spinner />.
    // We just verify the heading is NOT present yet.
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows "Dashboard" heading after data loads', async () => {
    renderWithProviders(<DashboardPage />, { authenticated: true });
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('shows metric values from mockDashboard.summary', async () => {
    renderWithProviders(<DashboardPage />, { authenticated: true });

    // experiences = 3 appears in metric cards ("Problems Tackled" and "Experiences")
    const threes = await screen.findAllByText(String(mockDashboard.summary.experiences));
    expect(threes.length).toBeGreaterThanOrEqual(1);
    // students = 12
    expect(await screen.findByText(String(mockDashboard.summary.students))).toBeInTheDocument();
  });

  it('shows warning banner text', async () => {
    renderWithProviders(<DashboardPage />, { authenticated: true });
    expect(await screen.findByText(mockDashboard.warnings[0].message)).toBeInTheDocument();
  });

  it('shows student summary counts from mockDashboard.students', async () => {
    renderWithProviders(<DashboardPage />, { authenticated: true });
    // Dashboard students tab shows summary cards with counts, not individual names
    expect(await screen.findByText(String(mockDashboard.students.total_enrolled))).toBeInTheDocument();
  });

  it('shows "Students" and "Cohorts" tab buttons', async () => {
    renderWithProviders(<DashboardPage />, { authenticated: true });

    expect(await screen.findByRole('button', { name: /students/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cohorts/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. ExperiencesPage
// ---------------------------------------------------------------------------
describe('ExperiencesPage', () => {
  it('shows "Experiences" heading', async () => {
    renderWithProviders(<ExperiencesPage />, { authenticated: true });
    expect(await screen.findByText('Experiences')).toBeInTheDocument();
  });

  it('shows "Create Experience" button', async () => {
    renderWithProviders(<ExperiencesPage />, { authenticated: true });
    expect(await screen.findByRole('button', { name: /create experience/i })).toBeInTheDocument();
  });

  it('shows experience name from mock data after loading', async () => {
    renderWithProviders(<ExperiencesPage />, { authenticated: true });
    expect(await screen.findByText(mockExperiences.data[0].name)).toBeInTheDocument();
  });

  it('has search input with placeholder "Search experiences..."', async () => {
    renderWithProviders(<ExperiencesPage />, { authenticated: true });
    expect(await screen.findByPlaceholderText('Search experiences...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. ExperienceDetailPage
// ---------------------------------------------------------------------------
describe('ExperienceDetailPage', () => {
  function renderDetailPage() {
    return renderWithProviders(
      <Routes>
        <Route path="/admin/experiences/:id" element={<ExperienceDetailPage />} />
      </Routes>,
      {
        authenticated: true,
        routerProps: { initialEntries: ['/admin/experiences/1'] },
      },
    );
  }

  it('shows experience name after loading', async () => {
    renderDetailPage();
    // "Startup Sprint" appears in both the breadcrumb and the h1; target the heading
    const heading = await screen.findByRole('heading', { name: 'Startup Sprint' });
    expect(heading).toBeInTheDocument();
  });

  it('shows breadcrumb with "Experiences" link', async () => {
    renderDetailPage();
    const link = await screen.findByRole('link', { name: /experiences/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/experiences');
  });

  it('shows course name from contents', async () => {
    renderDetailPage();
    expect(await screen.findByText('Intro to Entrepreneurship')).toBeInTheDocument();
  });

  it('shows student name "Alice Johnson"', async () => {
    renderDetailPage();
    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5. EnrolmentsPage
// ---------------------------------------------------------------------------
describe('EnrolmentsPage', () => {
  it('shows "Enrolment" heading', async () => {
    renderWithProviders(<EnrolmentsPage />, { authenticated: true });
    expect(await screen.findByText('Enrolment')).toBeInTheDocument();
  });

  it('shows metric value from mockEnrolmentStatistics (total_students)', async () => {
    renderWithProviders(<EnrolmentsPage />, { authenticated: true });
    expect(
      await screen.findByText(String(mockEnrolmentStatistics.total_students)),
    ).toBeInTheDocument();
  });

  it('shows attention banner about unassigned students', async () => {
    renderWithProviders(<EnrolmentsPage />, { authenticated: true });
    // not_assigned = 2, so the banner says "2 students are not in any active cohort"
    expect(
      await screen.findByText(/2 students are not in any active cohort/i),
    ).toBeInTheDocument();
  });

  it('shows student name from mockEnrolments', async () => {
    renderWithProviders(<EnrolmentsPage />, { authenticated: true });
    expect(await screen.findByText(mockEnrolments.data[0].name)).toBeInTheDocument();
  });

  it('has "Remove" button for enrolled students', async () => {
    renderWithProviders(<EnrolmentsPage />, { authenticated: true });
    expect(await screen.findByRole('button', { name: /remove/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6. PlaceholderPage
// ---------------------------------------------------------------------------
describe('PlaceholderPage', () => {
  it('shows "Curriculum Alignment" title for /admin/curriculum', () => {
    renderWithProviders(<PlaceholderPage />, {
      routerProps: { initialEntries: ['/admin/curriculum'] },
    });
    expect(screen.getByText('Curriculum Alignment')).toBeInTheDocument();
  });

  it('shows "Not Available in This Demo" text', () => {
    renderWithProviders(<PlaceholderPage />, {
      routerProps: { initialEntries: ['/admin/curriculum'] },
    });
    expect(screen.getByText('Not Available in This Demo')).toBeInTheDocument();
  });

  it('shows "Settings" title for /admin/settings', () => {
    renderWithProviders(<PlaceholderPage />, {
      routerProps: { initialEntries: ['/admin/settings'] },
    });
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
