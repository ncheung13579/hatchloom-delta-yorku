import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard, getWidgets, getWidget } from '../../api/dashboard';
import MetricCard from '../../components/ui/MetricCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusPillClass(status: string): string {
  switch (status) {
    case 'active': return 'bg-success/10 text-[#16A34A]';
    case 'not_started': return 'bg-bg text-soft';
    case 'completed': return 'bg-teal/10 text-teal';
    default: return 'bg-bg text-soft';
  }
}

function relativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function studentStatusLabel(status: string): string {
  switch (status) {
    case 'active':
    case 'enrolled': return 'On track';
    case 'inactive': return 'At risk';
    case 'unassigned': return 'Not assigned';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function studentStatusDotClass(status: string): string {
  switch (status) {
    case 'active':
    case 'enrolled': return 'bg-[#22C55E] shadow-[0_0_0_3px_rgba(34,197,94,0.15)]';
    case 'inactive': return 'bg-[#F59E0B] shadow-[0_0_0_3px_rgba(245,158,11,0.15)]';
    default: return 'bg-border';
  }
}

function EngagementBadge({ level }: { level: string }) {
  const cls = level === 'excellent' ? 'bg-success/10 text-[#16A34A]'
    : level === 'good' ? 'bg-teal/10 text-teal'
    : level === 'moderate' ? 'bg-warning/10 text-[#B45309]'
    : 'bg-danger/10 text-danger';
  return (
    <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full inline-block ${cls}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'cohorts'>('students');
  const [dashSearch, setDashSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  const { data: widgetsResponse } = useQuery({
    queryKey: ['widgets'],
    queryFn: getWidgets,
  });

  const { data: engagementWidget } = useQuery({
    queryKey: ['widget', 'engagement_chart'],
    queryFn: () => getWidget('engagement_chart'),
  });

  if (isLoading) return <Spinner className="py-24" />;
  if (error || !data) {
    return <EmptyState title="Failed to load dashboard" description="An error occurred while fetching dashboard data." />;
  }

  const { summary, students, warnings } = data;
  const cohorts = Array.isArray(data.cohorts) ? data.cohorts : (data.cohorts as Record<string, unknown>)?.data as typeof data.cohorts ?? [];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[1.65rem] font-bold text-charcoal mb-1">Dashboard</h1>
        <p className="text-[0.92rem] text-soft">
          Welcome back, {data.school.name ? `${data.school.name}` : 'Administrator'} &middot; Last updated just now
        </p>
      </div>

      {/* Warning banners */}
      {warnings.map((w, i) => (
        <div
          key={i}
          className="rounded-[14px] px-5 py-3.5 flex items-center justify-between border-l-4 border-l-warning
            bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-warning/15 text-[#B45309]">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <strong className="font-semibold text-charcoal text-[0.9rem]">{w.type.replace(/_/g, ' ')}</strong>
              <span className="text-soft text-[0.82rem] block mt-0.5">{w.message}</span>
            </div>
          </div>
          {w.severity === 'high' && (
            <span className="text-[0.78rem] font-semibold px-2.5 py-1 rounded-full bg-warning/15 text-[#B45309] whitespace-nowrap">
              High priority
            </span>
          )}
        </div>
      ))}

      {/* Metric cards — 6 columns to match HTML mockup */}
      <div className="grid grid-cols-6 gap-3">
        <MetricCard label="Problems Tackled" value={summary.problems_tackled} detail="Real-world challenges" accent="orange" />
        <MetricCard label="Active Ventures" value={summary.active_ventures} detail="Student cohorts" accent="orange" />
        <MetricCard label="Students" value={summary.students} detail={`${students.active_in_cohorts} active`} accent="teal" />
        <MetricCard label="Experiences" value={summary.experiences} detail={`${cohorts.filter(c => c.status === 'active').length} active cohorts`} accent="teal" />
        <MetricCard label="Credit Progress" value={summary.credit_progress} detail="of target" accent="teal" />
        <MetricCard label="Timely Completion" value={summary.timely_completion} detail="On schedule" accent="teal" />
      </div>

      {/* Tabbed data section */}
      <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Tab header + actions */}
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-5 py-2.5 pb-3 font-[family-name:var(--font-display)] font-semibold text-[0.92rem]
                border-b-2 transition-all cursor-pointer bg-transparent
                ${activeTab === 'students' ? 'text-primary border-b-primary' : 'text-soft border-b-transparent hover:text-charcoal'}`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('cohorts')}
              className={`px-5 py-2.5 pb-3 font-[family-name:var(--font-display)] font-semibold text-[0.92rem]
                border-b-2 transition-all cursor-pointer bg-transparent
                ${activeTab === 'cohorts' ? 'text-primary border-b-primary' : 'text-soft border-b-transparent hover:text-charcoal'}`}
            >
              Cohorts
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-bg focus-within:border-primary transition-colors">
              <svg className="w-4 h-4 text-soft flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder={activeTab === 'students' ? 'Search students...' : 'Search cohorts...'}
                value={dashSearch}
                onChange={(e) => setDashSearch(e.target.value)}
                className="border-none bg-transparent font-[family-name:var(--font-body)] text-[0.85rem] text-body outline-none w-[140px] placeholder:text-[#B0B5BF]"
              />
            </div>
            <Link
              to="/admin/enrolments"
              className="flex items-center gap-1.5 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg hover:border-soft no-underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </Link>
          </div>
        </div>
        <div className="h-px bg-border" />

        {/* Students tab — summary + student table from widgets API */}
        {activeTab === 'students' && (() => {
          const widgetsList = ((widgetsResponse as Record<string, unknown>)?.widgets ?? []) as Array<Record<string, unknown>>;
          const studentTableWidget = widgetsList.find(w => w.type === 'student_table');
          const allWidgetStudents = ((studentTableWidget?.data as Record<string, unknown>)?.students ?? []) as Array<Record<string, unknown>>;
          const lowerSearch = dashSearch.toLowerCase();
          const widgetStudents = lowerSearch
            ? allWidgetStudents.filter(s => ((s.name as string) ?? '').toLowerCase().includes(lowerSearch) || ((s.email as string) ?? '').toLowerCase().includes(lowerSearch))
            : allWidgetStudents;

          return (
            <div>
              {widgetStudents.length > 0 && (
                <>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '26%' }}>Student</th>
                        <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '7%' }}>Grade</th>
                        <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '32%' }}>Cohorts</th>
                        <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '13%' }}>Status</th>
                        <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '13%' }}>Last Active</th>
                        <th className="text-left px-5 py-3 bg-bg border-b-[1.5px] border-border" style={{ width: '4%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {widgetStudents.map((s, i) => {
                        const cohortNames = (s.cohort_names ?? s.cohorts ?? []) as string[];
                        const lastActive = (s.last_active ?? s.last_active_at) as string | undefined;
                        return (
                        <tr key={i} onClick={() => navigate(`/admin/students/${s.student_id}`)} className="transition-colors hover:bg-[#FAFBFE] cursor-pointer group">
                          <td className="px-5 py-3.5 border-b border-border">
                            <div className="flex items-center gap-2.5">
                              <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-teal/20 to-teal flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-[0.7rem] flex-shrink-0">
                                {((s.name as string) ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div className="font-semibold text-charcoal text-[0.9rem]">{s.name as string}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 border-b border-border text-[0.9rem] text-body">{(s.grade as string) ?? '-'}</td>
                          <td className="px-5 py-3.5 border-b border-border">
                            <div className="flex flex-wrap gap-1.5">
                              {cohortNames.length > 0 ? cohortNames.map((name, ci) => (
                                <span key={ci} className={`text-[0.78rem] font-medium px-2.5 py-0.5 rounded-md whitespace-nowrap ${ci === 0 ? 'bg-teal/10 text-teal' : 'bg-bg text-body'}`}>
                                  {name}
                                </span>
                              )) : (
                                <span className="text-[0.82rem] text-soft">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 border-b border-border">
                            <div className="flex items-center gap-[7px]">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${studentStatusDotClass(s.status as string)}`} />
                              <span className="text-[0.82rem] text-soft">{studentStatusLabel(s.status as string ?? '')}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 border-b border-border text-soft text-[0.85rem]">
                            {relativeDate(lastActive)}
                          </td>
                          <td className="px-5 py-3.5 border-b border-border">
                            <Link to={`/admin/students/${s.student_id}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                              &rsaquo;
                            </Link>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}

              <div className="px-6 py-3 flex items-center justify-between border-t border-border">
                <span className="text-[0.82rem] text-soft">
                  Showing {widgetStudents.length} of {allWidgetStudents.length} students
                </span>
                <Link
                  to="/admin/enrolments"
                  className="text-[0.85rem] font-semibold text-primary hover:text-primary/80 transition-colors no-underline"
                >
                  View all students &rarr;
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Cohorts tab */}
        {activeTab === 'cohorts' && (
          <div>
            {(() => {
              const lowerSearch = dashSearch.toLowerCase();
              const filteredCohorts = lowerSearch
                ? cohorts.filter(c => c.name.toLowerCase().includes(lowerSearch) || (c.experience_name ?? '').toLowerCase().includes(lowerSearch))
                : cohorts;
              return filteredCohorts.length === 0 ? (
              <EmptyState title="No cohorts yet" description="Create an experience and add cohorts to get started." />
            ) : (
              <>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '35%' }}>Cohort</th>
                      <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '14%' }}>Status</th>
                      <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '12%' }}>Students</th>
                      <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '22%' }}>Experience</th>
                      <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '13%' }}>Ends</th>
                      <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '4%' }}></th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {filteredCohorts.map((cohort) => (
                      <tr key={cohort.id} className="transition-colors hover:bg-[#FAFBFE] cursor-pointer group">
                        <td className="px-5 py-3.5 text-[0.9rem] border-b border-border">
                          <Link to={`/admin/cohorts/${cohort.id}`} className="font-semibold text-charcoal no-underline hover:text-teal">
                            {cohort.name}
                          </Link>
                          <div className="text-[0.8rem] text-soft">{cohort.experience_name}</div>
                        </td>
                        <td className="px-5 py-3.5 border-b border-border">
                          <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full inline-block ${statusPillClass(cohort.status)}`}>
                            {statusLabel(cohort.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 border-b border-border font-semibold">{cohort.enrolled_count ?? cohort.student_count ?? 0}</td>
                        <td className="px-5 py-3.5 border-b border-border text-[0.9rem]">{cohort.experience_name ?? '-'}</td>
                        <td className="px-5 py-3.5 border-b border-border text-soft text-[0.85rem]">
                          {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                        </td>
                        <td className="px-5 py-3.5 border-b border-border">
                          <Link to={`/admin/cohorts/${cohort.id}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                            &rsaquo;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3.5 flex items-center justify-between border-t border-border">
                  <span className="text-[0.82rem] text-soft">
                    {filteredCohorts.length} cohorts &middot; {filteredCohorts.filter(c => c.status === 'active').length} active
                  </span>
                </div>
              </>
            );
            })()}
          </div>
        )}
      </div>

      {/* Engagement widget — uses getWidgets() + getWidget('engagement_chart') */}
      {(() => {
        const engWidget = engagementWidget as Record<string, unknown> | undefined;
        const engData = engWidget?.data as Record<string, unknown> | undefined;
        const studentMetrics = (engData?.student_metrics ?? []) as Array<Record<string, unknown>>;
        const averages = engData?.school_averages as Record<string, unknown> | undefined;
        const distribution = engData?.distribution as Record<string, unknown> | undefined;

        if (!studentMetrics.length) return null;

        return (
          <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Student Engagement</span>
                <span className="text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">Last 30 days</span>
              </div>
              {averages && (
                <span className="text-[0.82rem] text-soft">
                  Avg completion: <strong className="text-charcoal">{Math.round(Number(averages.avg_completion_rate ?? 0) * 100)}%</strong>
                </span>
              )}
            </div>
            {distribution && (
              <div className="px-6 pb-3 flex gap-3">
                {(['excellent', 'good', 'moderate', 'low'] as const).map(level => {
                  const count = Number((distribution as Record<string, unknown>)[level] ?? 0);
                  if (!count) return null;
                  return (
                    <div key={level} className="flex items-center gap-1.5">
                      <EngagementBadge level={level} />
                      <span className="text-[0.82rem] text-soft">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="h-px bg-border" />
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Student</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Login Days</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Completion</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Level</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Last Active</th>
                  <th className="text-left px-5 py-3 bg-bg border-b-[1.5px] border-border" style={{ width: '4%' }}></th>
                </tr>
              </thead>
              <tbody>
                {studentMetrics.map((s, i) => (
                  <tr key={i} onClick={() => navigate(`/admin/students/${s.student_id}`)} className="transition-colors hover:bg-[#FAFBFE] cursor-pointer group">
                    <td className="px-5 py-3.5 border-b border-border font-semibold text-charcoal">{s.student_name as string}</td>
                    <td className="px-5 py-3.5 border-b border-border text-[0.9rem]">{String(s.login_days)}</td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-bg overflow-hidden">
                          <div className="h-full rounded-full bg-teal" style={{ width: `${Math.round(Number(s.completion_rate ?? 0) * 100)}%` }} />
                        </div>
                        <span className="text-[0.82rem] text-soft">{Math.round(Number(s.completion_rate ?? 0) * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <EngagementBadge level={s.engagement_level as string} />
                    </td>
                    <td className="px-5 py-3.5 border-b border-border text-soft text-[0.85rem]">
                      {s.last_active_at ? new Date(s.last_active_at as string).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <Link to={`/admin/students/${s.student_id}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                        &rsaquo;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
}
