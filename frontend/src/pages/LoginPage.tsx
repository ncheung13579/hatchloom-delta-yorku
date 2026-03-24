import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  function quickLogin(token: string) {
    login(token);
    navigate('/admin/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold font-[family-name:var(--font-display)] text-charcoal">
            hatch<span className="text-primary">loom</span>
          </h1>
          <p className="text-soft mt-2">Sign in to your school admin account</p>
        </div>

        <div className="bg-card rounded-2xl border-[1.5px] border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <p className="text-sm text-soft text-center mb-5">
            Select a role to log in with a demo account
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => quickLogin('test-admin-token')} className="w-full">
              School Admin
            </Button>
            <Button variant="secondary" onClick={() => quickLogin('test-teacher-token')} className="w-full">
              Teacher
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-soft text-center">
              Demo mode — tokens are mapped to mock users in the backend.
              <br />
              Admin and Teacher roles can access screens 300–303.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
