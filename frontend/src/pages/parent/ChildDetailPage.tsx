// Parent child-detail screen.
// Shows a single child's full profile from the parent's perspective:
// progress metrics, course completion, cohort assignments, and credentials.

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentDrilldown } from '../../api/dashboard';
import { getStudentDetail } from '../../api/enrolments';
import MetricCard from '../../components/ui/MetricCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

// Renders a horizontal bar with percentage label, clamped to 0-100%.
function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.round(value));
  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-teal to-[#2DD4BF]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[0.82rem] font-semibold text-charcoal w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function ChildDetailPage() {
  const { studentId } = useParams();
  const id = Number(studentId);

  const { data: drilldown, isLoading, error } = useQuery({
    queryKey: ['student-drilldown', id],
    queryFn: () => getStudentDrilldown(id),
    enabled: !!id,
  });

  const { data: enrolmentDetail } = useQuery({
    queryKey: ['student-enrolment-detail', id],
    queryFn: () => getStudentDetail(id),
    enabled: !!id,
  });

  if (isLoading) return <Spinner className="py-24" />;
  if (error || !drilldown) {
    return <EmptyState title="Access denied" description="You may not have permission to view this student's data." />;
  }

  // Destructure the loosely-typed drilldown response into typed sections.
  const student = (drilldown as Record<string, unknown>).student as Record<string, unknown>;
  const progress = (drilldown as Record<string, unknown>).progress as Record<string, unknown> | undefined;
  const credentials = ((drilldown as Record<string, unknown>).credentials ?? []) as Array<Record<string, unknown>>;
  const courses = (progress as Record<string, unknown>)?.courses as Array<Record<string, unknown>> | undefined;

  // Enrolment detail may nest cohort_assignments at the top level or under .data.
  const enrolmentStudent = enrolmentDetail as Record<string, unknown> | undefined;
  const enrolmentData = enrolmentStudent?.data as Record<string, unknown> | undefined;
  const cohortAssignments = ((enrolmentStudent?.cohort_assignments ?? enrolmentData?.cohort_assignments ?? []) as Array<Record<string, unknown>>);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[0.85rem] text-soft">
        <Link to="/parent" className="hover:text-primary transition-colors no-underline text-soft">My Children</Link>
        <span>/</span>
        <span className="text-charcoal font-semibold">{student.name as string}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal/20 to-teal flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-lg">
          {((student.name as string) ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <h1 className="text-[1.65rem] font-bold text-charcoal">{student.name as string}</h1>
          <p className="text-[0.92rem] text-soft">{student.email as string}{student.grade ? ` · Grade ${student.grade}` : ''}</p>
        </div>
      </div>

      {progress && (
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Overall Progress" value={`${progress.overall_completion ?? 0}%`} accent="teal" />
          <MetricCard label="Courses" value={Number(progress.courses_enrolled ?? 0)} accent="teal" />
          <MetricCard label="Blocks Done" value={Number(progress.blocks_completed ?? 0)} detail={`of ${progress.total_blocks ?? 0}`} accent="teal" />
          <MetricCard label="Credits" value={`${progress.credit_progress ?? 0}%`} accent="orange" />
        </div>
      )}

      {courses && courses.length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Course Progress</h2>
          </div>
          <div className="divide-y divide-border">
            {courses.map((c, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-charcoal text-[0.9rem]">{c.name as string}</div>
                  <div className="text-[0.82rem] text-soft">{c.blocks_completed as number ?? 0} of {c.total_blocks as number ?? 0} blocks</div>
                </div>
                <div className="w-48"><ProgressBar value={c.completion as number ?? 0} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cohortAssignments.length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Cohort Assignments</h2>
          </div>
          <div className="divide-y divide-border">
            {cohortAssignments.map((a, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                <span className="font-semibold text-charcoal">{a.cohort_name as string ?? `Cohort ${a.cohort_id}`}</span>
                <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full ${
                  a.status === 'enrolled' ? 'bg-success/10 text-[#16A34A]' : 'bg-danger/10 text-danger'
                }`}>
                  {(a.status as string ?? '').charAt(0).toUpperCase() + (a.status as string ?? '').slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {credentials.length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] overflow-hidden">
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
    </div>
  );
}
