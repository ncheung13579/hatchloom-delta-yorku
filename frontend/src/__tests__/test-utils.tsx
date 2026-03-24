import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface WrapperOptions {
  routerProps?: MemoryRouterProps;
  authenticated?: boolean;
}

export function createWrapper({ routerProps, authenticated }: WrapperOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  if (authenticated) {
    localStorage.setItem('hatchloom_token', 'test-admin-token');
    localStorage.setItem(
      'hatchloom_user',
      JSON.stringify({
        id: 1,
        name: 'Ms. Patel',
        email: 'patel@ridgewood.edu',
        role: 'school_admin',
        school_id: 1,
        school_name: 'Ridgewood Academy',
      })
    );
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...routerProps}>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {}
) {
  const { routerProps, authenticated, ...renderOptions } = options;
  return render(ui, {
    wrapper: createWrapper({ routerProps, authenticated }),
    ...renderOptions,
  });
}
