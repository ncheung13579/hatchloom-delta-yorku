// Admin student drilldown screen (screen 303).
// Shows a single student's full profile: progress metrics, course completion,
// cohort assignments, LaunchPad ventures, credentials, and curriculum mapping.

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentDrilldown } from '../../api/dashboard';
import { getStudentDetail } from '../../api/enrolments';
import MetricCard from '../../components/ui/MetricCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

// Renders a horizontal bar with percentage label, clamped to 0-100%.
function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-teal to-[#2DD4BF] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[0.82rem] font-semibold text-charcoal w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function StudentDrilldownPage() {
  const { studentId } = useParams();
  const id = Number(studentId);

  const { data: drilldown, isLoading: loadingDrilldown, error: drilldownError } = useQuery({
    queryKey: ['student-drilldown', id],
    queryFn: () => getStudentDrilldown(id),
    enabled: !!id,
  });

  const { data: enrolmentDetail } = useQuery({
    queryKey: ['student-enrolment-detail', id],
    queryFn: () => getStudentDetail(id),
    enabled: !!id,
  });

  if (loadingDrilldown) return <Spinner className="py-24" />;
  if (drilldownError || !drilldown) {
    return <EmptyState title="Failed to load student data" description="The student may not exist or you may not have permission to view their data." />;
  }

  // Destructure the loosely-typed drilldown response into typed sections.
  const student = (drilldown as Record<string, unknown>).student as Record<string, unknown> | undefined;
  const progress = (drilldown as Record<string, unknown>).progress as Record<string, unknown> | undefined;
  const credentials = (drilldown as Record<string, unknown>).credentials as Array<Record<string, unknown>> | undefined;
  const curriculum = (drilldown as Record<string, unknown>).curriculum_mapping as Record<string, unknown> | undefined;
  const ventures = (drilldown as Record<string, unknown>).ventures as Record<string, unknown> | undefined;

  // Enrolment detail may nest cohort_assignments at the top level or under .data.
  const enrolmentStudent = enrolmentDetail as Record<string, unknown> | undefined;
  const enrolmentData = enrolmentStudent?.data as Record<string, unknown> | undefined;
  const cohortAssignments = ((enrolmentStudent?.cohort_assignments ?? enrolmentData?.cohort_assignments ?? []) as Array<Record<string, unknown>>);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[0.85rem] text-soft">
        <Link to="/admin/dashboard" className="hover:text-primary transition-colors no-underline text-soft">Dashboard</Link>
        <span>/</span>
        <span className="text-charcoal font-semibold">{(student?.name as string) ?? `Student #${id}`}</span>
      </div>

      {/* Student header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal/20 to-teal flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-lg">
          {((student?.name as string) ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <h1 className="text-[1.65rem] font-bold text-charcoal">{(student?.name as string) ?? `Student #${id}`}</h1>
          <p className="text-[0.92rem] text-soft">
            {(student?.email as string) ?? ''}{student?.grade ? ` · Grade ${student.grade}` : ''}
          </p>
        </div>
      </div>

      {/* Progress metrics */}
      {progress && (
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Overall Progress" value={`${Math.round(Number(progress.overall_completion ?? 0) * 100)}%`} detail="Course completion" accent="teal" />
          <MetricCard label="Courses Enrolled" value={Number(progress.courses_enrolled ?? 0)} detail="Active courses" accent="teal" />
          <MetricCard label="Blocks Completed" value={Number(progress.blocks_completed ?? 0)} detail={`of ${progress.total_blocks ?? 0}`} accent="teal" />
          <MetricCard label="Credit Progress" value={`${progress.credit_progress ?? 0}%`} detail="of target" accent="orange" />
        </div>
      )}

      {/* Course progress detail */}
      {progress && Array.isArray((progress as Record<string, unknown>).courses) && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Course Progress</h2>
          </div>
          <div className="divide-y divide-border">
            {((progress as Record<string, unknown>).courses as Array<Record<string, unknown>>).map((course, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-charcoal text-[0.9rem]">{course.name as string}</div>
                  <div className="text-[0.82rem] text-soft">{course.blocks_completed as number ?? 0} of {course.total_blocks as number ?? 0} blocks</div>
                </div>
                <div className="w-48">
                  <ProgressBar value={course.completion as number ?? 0} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cohort assignments from enrolment service */}
      {cohortAssignments.length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Cohort Assignments</h2>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Cohort</th>
                <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Status</th>
                <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {cohortAssignments.map((a, i) => (
                <tr key={i} className="hover:bg-[#FAFBFE] transition-colors">
                  <td className="px-5 py-3.5 border-b border-border font-semibold text-charcoal">{a.cohort_name as string ?? `Cohort ${a.cohort_id}`}</td>
                  <td className="px-5 py-3.5 border-b border-border">
                    <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full inline-block ${
                      a.status === 'enrolled' ? 'bg-success/10 text-[#16A34A]' : 'bg-danger/10 text-danger'
                    }`}>
                      {(a.status as string ?? 'unknown').charAt(0).toUpperCase() + (a.status as string ?? 'unknown').slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-border text-soft text-[0.85rem]">
                    {a.enrolled_at ? new Date(a.enrolled_at as string).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LaunchPad Ventures */}
      {ventures && ((ventures.ventures as Array<Record<string, unknown>>) ?? []).length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">LaunchPad Ventures</h2>
            <div className="flex items-center gap-3">
              <span className="text-[0.78rem] font-semibold px-2.5 py-0.5 rounded-full bg-success/10 text-[#16A34A]">
                {Number(ventures.active ?? 0)} active
              </span>
              <span className="text-[0.78rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">
                {Number(ventures.completed ?? 0)} completed
              </span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {((ventures.ventures as Array<Record<string, unknown>>) ?? []).map((v, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-charcoal text-[0.9rem]">{v.name as string}</div>
                  <div className="text-[0.82rem] text-soft">
                    Started {v.created_at ? new Date(v.created_at as string).toLocaleDateString() : '-'}
                  </div>
                </div>
                <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full ${
                  v.status === 'active' ? 'bg-success/10 text-[#16A34A]' : 'bg-teal/10 text-teal'
                }`}>
                  {(v.status as string ?? 'unknown').charAt(0).toUpperCase() + (v.status as string ?? 'unknown').slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credentials */}
      {credentials && credentials.length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Credentials</h2>
          </div>
          <div className="divide-y divide-border">
            {credentials.map((cred, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-charcoal text-[0.9rem]">{cred.name as string}</div>
                  <div className="text-[0.82rem] text-soft">{cred.issuer as string ?? 'Hatchloom'}</div>
                </div>
                <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full ${
                  cred.status === 'earned' ? 'bg-success/10 text-[#16A34A]' : 'bg-bg text-soft'
                }`}>
                  {(cred.status as string ?? 'pending').charAt(0).toUpperCase() + (cred.status as string ?? 'pending').slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curriculum mapping */}
      {curriculum && Object.keys(curriculum).length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Curriculum Mapping</h2>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(curriculum).map(([key, rawArea]) => {
              const area = rawArea as Record<string, unknown>;
              const areaName = (area.area_name as string) ?? key;
              const reqsMet = (area.requirements_met as Array<Record<string, unknown>>) ?? [];
              const totalReqs = (area.total_requirements as number) ?? 0;
              const coverage = (area.coverage_percentage as number) ?? 0;
              const pct = Math.round(coverage * 100);

              return (
                <div key={key} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-charcoal text-[0.95rem]">{areaName}</div>
                    <span className="text-[0.78rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">
                      {reqsMet.length} of {totalReqs} requirements
                    </span>
                  </div>
                  <div className="mb-3">
                    <ProgressBar value={pct} />
                  </div>
                  {reqsMet.length > 0 && (
                    <div className="space-y-1.5">
                      {reqsMet.map((req, i) => (
                        <div key={i} className="flex items-start gap-2 text-[0.82rem]">
                          <span className="font-mono font-semibold text-teal bg-teal/[0.08] px-1.5 py-0.5 rounded text-[0.75rem] flex-shrink-0">{req.code as string}</span>
                          <span className="text-body">{req.description as string}</span>
                          <span className="text-soft ml-auto flex-shrink-0">via {req.met_by as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
