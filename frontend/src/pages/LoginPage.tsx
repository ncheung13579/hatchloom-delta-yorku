import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
            <div>
              <div className="text-[0.72rem] font-bold text-soft uppercase tracking-wider mb-2">School Staff</div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => quickLogin('test-admin-token', '/admin/dashboard')} className="w-full">
                  School Admin
                </Button>
                <Button variant="secondary" onClick={() => quickLogin('test-teacher-token', '/admin/dashboard')} className="w-full">
                  Teacher
                </Button>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <div className="text-[0.72rem] font-bold text-soft uppercase tracking-wider mb-2">Students &amp; Parents</div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => quickLogin('test-student-token', '/student')} className="w-full">
                  Student
                </Button>
                <Button variant="secondary" onClick={() => quickLogin('test-parent-token', '/parent')} className="w-full">
                  Parent
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-soft text-center">
              Demo mode — tokens are mapped to mock users in the backend.
              <br />
              Admin and Teacher access screens 300-303. Students and Parents have read-only access to their own data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
