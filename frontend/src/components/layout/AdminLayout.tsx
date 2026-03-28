import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
  },
  {
    to: '/admin/experiences',
    label: 'Experiences',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    to: '/admin/enrolments',
    label: 'Enrolment',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013.5 17.7a6.5 6.5 0 0110.714-4.572M12 9.75a3 3 0 11-6 0 3 3 0 016 0zm8.25 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    to: '/admin/curriculum',
    label: 'Curriculum Alignment',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    to: '/admin/credentials',
    label: 'Credentials',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    to: '/admin/billing',
    label: 'Plan & Billing',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/admin/contact',
    label: 'Contact Hatchloom',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
];

function TopNav({ user, logout }: { user: { name: string; email?: string; role?: string; school_name?: string }; logout: () => void }) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = user.role === 'school_teacher' ? 'Teacher' : 'School Admin';

  return (
    <nav className="sticky top-0 z-50 h-[58px] bg-card border-b-[1.5px] border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <a href="/admin/dashboard" className="font-[family-name:var(--font-display)] font-extrabold text-[1.35rem] text-charcoal tracking-tight no-underline">
          hatch<span className="text-primary">loom</span>
        </a>
        <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] text-[#4338CA] text-[0.78rem] font-semibold px-3 py-1 rounded-full tracking-wide">
          {roleLabel}
        </div>
        <div className="font-[family-name:var(--font-display)] font-semibold text-[0.92rem] text-charcoal">
          {user.school_name ?? 'Ridgewood Academy'}
        </div>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center cursor-pointer transition-colors hover:bg-bg relative text-soft">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center cursor-pointer transition-colors hover:bg-bg relative text-soft">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-card" />
        </div>
        <div className="flex items-center gap-2 py-1 pl-1 pr-3 rounded-full bg-bg cursor-pointer hover:bg-border transition-colors">
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-[0.75rem]">
            {initials}
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
  );
}

function SidebarLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-5 py-2.5 text-[0.92rem] font-medium
        transition-all border-l-[3px] no-underline
        ${
          isActive
            ? 'bg-gradient-to-r from-primary/[0.06] to-transparent border-l-primary text-primary font-semibold'
            : 'border-l-transparent text-body hover:bg-bg hover:text-charcoal'
        }`
      }
    >
      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px]">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <TopNav user={user} logout={logout} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 58px)' }}>
        {/* Sidebar */}
        <aside className="w-[215px] flex-shrink-0 bg-card border-r-[1.5px] border-border sticky top-[58px] flex flex-col py-4 overflow-y-auto" style={{ height: 'calc(100vh - 58px)' }}>
          <div className="font-[family-name:var(--font-display)] font-bold text-[0.72rem] text-soft uppercase tracking-wider px-5 py-3 pb-1.5">
            Ridgewood Academy
          </div>

          <nav>
            {navItems.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </nav>

          <div className="flex-1 min-h-6" />

          <div className="font-[family-name:var(--font-display)] font-bold text-[0.72rem] text-soft uppercase tracking-wider px-5 py-3 pb-1.5">
            Account
          </div>

          <SidebarLink to="/admin/billing" label="Plan & Billing" icon={bottomItems[0].icon} />

          <div className="h-px bg-border mx-5 my-2" />

          <SidebarLink to="/admin/settings" label="Settings" icon={bottomItems[1].icon} />

          <button
            onClick={() => { window.location.href = '/admin/contact'; }}
            className="mx-4 mt-2 p-2.5 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-xl
              font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer text-center
              transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)]
              flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Contact Hatchloom
          </button>

        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 px-8 max-w-[1200px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
