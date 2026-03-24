import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../api/dashboard';
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'cohorts'>('students');
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
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
                className="border-none bg-transparent font-[family-name:var(--font-body)] text-[0.85rem] text-body outline-none w-[140px] placeholder:text-[#B0B5BF]"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg hover:border-soft">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </button>
          </div>
        </div>
        <div className="h-px bg-border" />

        {/* Students tab — summary cards (dashboard endpoint returns aggregate counts, not individual records) */}
        {activeTab === 'students' && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-[14px] border-[1.5px] border-border bg-bg p-5">
                <div className="text-[0.82rem] text-soft font-semibold uppercase tracking-wider mb-2">Total Enrolled</div>
                <div className="text-[1.8rem] font-bold text-charcoal leading-tight">{students.total_enrolled}</div>
                <div className="text-[0.82rem] text-soft mt-1">students across all cohorts</div>
              </div>
              <div className="rounded-[14px] border-[1.5px] border-border bg-bg p-5">
                <div className="text-[0.82rem] text-soft font-semibold uppercase tracking-wider mb-2">Active in Cohorts</div>
                <div className="text-[1.8rem] font-bold text-teal leading-tight">{students.active_in_cohorts}</div>
                <div className="text-[0.82rem] text-soft mt-1">currently participating</div>
              </div>
              <div className="rounded-[14px] border-[1.5px] border-border bg-bg p-5">
                <div className="text-[0.82rem] text-soft font-semibold uppercase tracking-wider mb-2">Not Assigned</div>
                <div className="text-[1.8rem] font-bold text-charcoal leading-tight">{students.not_assigned}</div>
                <div className="text-[0.82rem] text-soft mt-1">awaiting cohort placement</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link
                to="/admin/enrolments"
                className="text-[0.85rem] font-semibold text-primary hover:text-primary/80 transition-colors no-underline"
              >
                View all students &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Cohorts tab */}
        {activeTab === 'cohorts' && (
          <div>
            {cohorts.length === 0 ? (
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
                    {cohorts.map((cohort) => (
                      <tr key={cohort.id} className="transition-colors hover:bg-[#FAFBFE] cursor-pointer group">
                        <td className="px-5 py-3.5 text-[0.9rem] border-b border-border">
                          <div className="font-semibold text-charcoal">{cohort.name}</div>
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
                          <Link to={`/admin/experiences/${cohort.experience_id}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                            ›
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3.5 flex items-center justify-between border-t border-border">
                  <span className="text-[0.82rem] text-soft">
                    {cohorts.length} cohorts &middot; {cohorts.filter(c => c.status === 'active').length} active
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
