// Login / role-selector screen.
// Provides one-click demo login buttons for each role (admin, teacher, student, parent).
// Each button sets a hardcoded session token and redirects to the role's landing page.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Demo convenience: sets the session token and navigates in one click.
  // Tokens are mapped to seeded mock users on the backend.
  function quickLogin(token: string, path: string) {
    login(token);
    navigate(path);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold font-[family-name:var(--font-display)] text-charcoal">
            hatch<span className="text-primary">loom</span>
          </h1>
          <p className="text-soft mt-2">Sign in to your account</p>
        </div>

        <div className="bg-card rounded-2xl border-[1.5px] border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <p className="text-sm text-soft text-center mb-5">
            Select a role to log in with a demo account
          </p>

          <div className="space-y-4">
            <Button variant="secondary" onClick={() => quickLogin('test-admin-token', '/admin/dashboard')} className="w-full">
              School Admin
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-soft text-center">
              Demo mode — token is mapped to a mock admin user in the backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
