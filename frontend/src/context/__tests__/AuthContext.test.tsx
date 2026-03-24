import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';

function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user?.name ?? 'none'}</span>
      <span data-testid="admin">{String(auth.isAdmin)}</span>
      <span data-testid="teacher">{String(auth.isTeacher)}</span>
      <span data-testid="loading">{String(auth.loading)}</span>
      <button data-testid="login-admin" onClick={() => auth.login('test-admin-token')}>Login Admin</button>
      <button data-testid="login-teacher" onClick={() => auth.login('test-teacher-token')}>Login Teacher</button>
      <button data-testid="login-invalid" onClick={() => auth.login('bad-token')}>Login Invalid</button>
      <button data-testid="logout" onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initially has no user when no token in localStorage', async () => {
    renderAuth();

    // Wait for loading to finish
    expect(await screen.findByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');
  });

  it('restores user from localStorage token on mount', async () => {
    localStorage.setItem('hatchloom_token', 'test-admin-token');

    renderAuth();

    expect(await screen.findByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('Ms. Patel');
    expect(screen.getByTestId('admin')).toHaveTextContent('true');
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');
  });

  it('restores teacher user from localStorage token on mount', async () => {
    localStorage.setItem('hatchloom_token', 'test-teacher-token');

    renderAuth();

    expect(await screen.findByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('Mr. Chen');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
    expect(screen.getByTestId('teacher')).toHaveTextContent('true');
  });

  it('login() sets user and localStorage for admin', async () => {
    const user = userEvent.setup();
    renderAuth();

    // Wait for initial load
    expect(await screen.findByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');

    await user.click(screen.getByTestId('login-admin'));

    expect(screen.getByTestId('user')).toHaveTextContent('Ms. Patel');
    expect(screen.getByTestId('admin')).toHaveTextContent('true');
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');
    expect(localStorage.getItem('hatchloom_token')).toBe('test-admin-token');
    expect(localStorage.getItem('hatchloom_user')).toBeTruthy();

    const storedUser = JSON.parse(localStorage.getItem('hatchloom_user')!);
    expect(storedUser.name).toBe('Ms. Patel');
    expect(storedUser.role).toBe('school_admin');
  });

  it('login() sets user and localStorage for teacher', async () => {
    const user = userEvent.setup();
    renderAuth();

    expect(await screen.findByTestId('loading')).toHaveTextContent('false');

    await user.click(screen.getByTestId('login-teacher'));

    expect(screen.getByTestId('user')).toHaveTextContent('Mr. Chen');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
    expect(screen.getByTestId('teacher')).toHaveTextContent('true');
    expect(localStorage.getItem('hatchloom_token')).toBe('test-teacher-token');

    const storedUser = JSON.parse(localStorage.getItem('hatchloom_user')!);
    expect(storedUser.name).toBe('Mr. Chen');
    expect(storedUser.role).toBe('school_teacher');
  });

  it('logout() clears user and localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem('hatchloom_token', 'test-admin-token');

    renderAuth();

    expect(await screen.findByTestId('user')).toHaveTextContent('Ms. Patel');

    await user.click(screen.getByTestId('logout'));

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');
    expect(localStorage.getItem('hatchloom_token')).toBeNull();
    expect(localStorage.getItem('hatchloom_user')).toBeNull();
  });

  it('isAdmin is true only for school_admin role', async () => {
    const user = userEvent.setup();
    renderAuth();

    expect(await screen.findByTestId('loading')).toHaveTextContent('false');

    await user.click(screen.getByTestId('login-admin'));
    expect(screen.getByTestId('admin')).toHaveTextContent('true');
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');

    await user.click(screen.getByTestId('logout'));
    expect(screen.getByTestId('admin')).toHaveTextContent('false');

    await user.click(screen.getByTestId('login-teacher'));
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
    expect(screen.getByTestId('teacher')).toHaveTextContent('true');
  });

  it('isTeacher is true only for school_teacher role', async () => {
    const user = userEvent.setup();
    renderAuth();

    expect(await screen.findByTestId('loading')).toHaveTextContent('false');

    await user.click(screen.getByTestId('login-teacher'));
    expect(screen.getByTestId('teacher')).toHaveTextContent('true');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');

    await user.click(screen.getByTestId('logout'));
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');

    await user.click(screen.getByTestId('login-admin'));
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');
    expect(screen.getByTestId('admin')).toHaveTextContent('true');
  });

  it('invalid token does not set user', async () => {
    const user = userEvent.setup();
    renderAuth();

    expect(await screen.findByTestId('loading')).toHaveTextContent('false');

    await user.click(screen.getByTestId('login-invalid'));

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
    expect(screen.getByTestId('teacher')).toHaveTextContent('false');
    expect(localStorage.getItem('hatchloom_token')).toBeNull();
    expect(localStorage.getItem('hatchloom_user')).toBeNull();
  });

  it('restores user from saved hatchloom_user in localStorage', async () => {
    const savedUser = {
      id: 1,
      name: 'Ms. Patel',
      email: 'patel@ridgewood.edu',
      role: 'school_admin',
      school_id: 1,
      school_name: 'Ridgewood Academy',
    };
    localStorage.setItem('hatchloom_token', 'test-admin-token');
    localStorage.setItem('hatchloom_user', JSON.stringify(savedUser));

    renderAuth();

    expect(await screen.findByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('Ms. Patel');
    expect(screen.getByTestId('admin')).toHaveTextContent('true');
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth must be used within AuthProvider',
    );

    consoleSpy.mockRestore();
  });
});
