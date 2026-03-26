import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentDrilldown } from '../../api/dashboard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

// Parent (id=14) is linked to student ids 4 and 5 via parent_student_links
const LINKED_CHILDREN = [4, 5];

function ChildCard({ studentId }: { studentId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student-drilldown', studentId],
    queryFn: () => getStudentDrilldown(studentId),
  });

  if (isLoading) return <Spinner className="py-8" />;
  if (error) {
    return (
      <div className="bg-card border-[1.5px] border-border rounded-[18px] p-6">
        <p className="text-danger text-[0.9rem]">Unable to load data for student #{studentId}</p>
      </div>
    );
  }

  const drilldown = data as Record<string, unknown>;
  const student = drilldown.student as Record<string, unknown>;
  const progress = drilldown.progress as Record<string, unknown> | undefined;
  const credentials = (drilldown.credentials ?? []) as Array<Record<string, unknown>>;

  return (
    <Link
      to={`/parent/child/${studentId}`}
      className="block bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden
        transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:border-primary/30 no-underline"
    >
      <div className="p-6">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal/20 to-teal flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-[0.9rem]">
            {((student.name as string) ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-charcoal text-[1.05rem]">{student.name as string}</div>
            <div className="text-[0.82rem] text-soft">{student.email as string}{student.grade ? ` · Grade ${student.grade}` : ''}</div>
          </div>
        </div>

        {progress && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-bg p-3">
              <div className="text-[0.72rem] font-bold text-soft uppercase tracking-wider">Progress</div>
              <div className="text-[1.3rem] font-bold text-charcoal mt-1">{String(progress.overall_completion ?? 0)}%</div>
            </div>
            <div className="rounded-xl bg-bg p-3">
              <div className="text-[0.72rem] font-bold text-soft uppercase tracking-wider">Courses</div>
              <div className="text-[1.3rem] font-bold text-charcoal mt-1">{String(progress.courses_enrolled ?? 0)}</div>
            </div>
            <div className="rounded-xl bg-bg p-3">
              <div className="text-[0.72rem] font-bold text-soft uppercase tracking-wider">Credentials</div>
              <div className="text-[1.3rem] font-bold text-charcoal mt-1">{credentials.filter(c => c.status === 'earned').length}/{credentials.length}</div>
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-3 border-t border-border bg-bg flex items-center justify-between">
        <span className="text-[0.82rem] font-semibold text-primary">View full details</span>
        <span className="text-primary text-lg">›</span>
      </div>
    </Link>
  );
}

export default function ParentDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.65rem] font-bold text-charcoal mb-1">My Children</h1>
        <p className="text-[0.92rem] text-soft">
          Welcome, {user?.name}. View your children's progress and achievements.
        </p>
      </div>

      {LINKED_CHILDREN.length === 0 ? (
        <EmptyState title="No linked children" description="No students are linked to your account." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LINKED_CHILDREN.map((id) => (
            <ChildCard key={id} studentId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
