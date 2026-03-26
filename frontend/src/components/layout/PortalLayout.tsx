import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PortalLayout() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel = user.role === 'parent' ? 'Parent Portal' : 'Student Portal';

  return (
    <div className="min-h-screen bg-bg">
      <nav className="sticky top-0 z-50 h-[58px] bg-card border-b-[1.5px] border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <a href="/" className="font-[family-name:var(--font-display)] font-extrabold text-[1.35rem] text-charcoal tracking-tight no-underline">
            hatch<span className="text-primary">loom</span>
          </a>
          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] text-[#059669] text-[0.78rem] font-semibold px-3 py-1 rounded-full tracking-wide">
            {roleLabel}
          </div>
          <div className="font-[family-name:var(--font-display)] font-semibold text-[0.92rem] text-charcoal">
            {user.school_name}
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 py-1 pl-1 pr-3 rounded-full bg-bg cursor-default">
            <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#059669] to-[#10B981] flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-[0.75rem]">
              {user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <span className="text-[0.85rem] font-semibold text-charcoal">{user.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-[7px] bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-xl
              font-[family-name:var(--font-body)] text-[0.82rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </nav>
      <main className="max-w-[900px] mx-auto p-6 px-8">
        <Outlet />
      </main>
    </div>
  );
}
