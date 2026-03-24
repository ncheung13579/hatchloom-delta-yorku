import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getExperience,
  getExperienceStatistics,
  getExperienceStudents,
  getExperienceContents,
  exportExperienceStudents,
} from '../../api/experiences';
import MetricCard from '../../components/ui/MetricCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';

function enrolmentBadgeClass(status: string): string {
  switch (status) {
    case 'enrolled': return 'bg-success/10 text-[#16A34A]';
    case 'removed': return 'bg-danger/10 text-danger';
    default: return 'bg-bg text-soft';
  }
}

export default function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const experienceId = Number(id);

  const [studentPage, setStudentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const perPage = 15;

  const handleStudentSearch = (value: string) => {
    setStudentSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => {
      setDebouncedStudentSearch(value);
      setStudentPage(1);
    }, 400);
    setSearchTimer(t);
  };

  const { data: experience, isLoading: loadingExp } = useQuery({
    queryKey: ['experience', experienceId],
    queryFn: () => getExperience(experienceId),
    enabled: !isNaN(experienceId),
  });

  const { data: statistics } = useQuery({
    queryKey: ['experience-statistics', experienceId],
    queryFn: () => getExperienceStatistics(experienceId),
    enabled: !isNaN(experienceId),
  });

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['experience-students', experienceId, studentPage, perPage, debouncedStudentSearch],
    queryFn: () => getExperienceStudents(experienceId, studentPage, perPage, debouncedStudentSearch),
    enabled: !isNaN(experienceId),
  });

  const { data: contentsData } = useQuery({
    queryKey: ['experience-contents', experienceId],
    queryFn: () => getExperienceContents(experienceId),
    enabled: !isNaN(experienceId),
  });

  const handleExport = async () => {
    try {
      const blob = await exportExperienceStudents(experienceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experience-${experienceId}-students.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle export errors
    }
  };

  if (loadingExp) return <Spinner className="py-24" />;

  if (!experience) {
    return (
      <EmptyState
        title="Experience not found"
        description="The requested experience could not be loaded."
        action={<Link to="/admin/experiences"><Button variant="secondary">Back to Experiences</Button></Link>}
      />
    );
  }

  const stats = statistics as Record<string, unknown> | undefined;
  const enrolmentStats = stats?.enrolment as Record<string, unknown> | undefined;
  const completionStats = stats?.completion as Record<string, unknown> | undefined;
  const totalCohorts = experience.cohorts?.length ?? 0;
  const activeCohorts = experience.cohorts?.filter((c) => c.status === 'active').length ?? 0;
  const enrolledStudents = (enrolmentStats?.total_students as number) ?? 0;
  const completionRate = (completionStats?.completion_rate as number) ?? 0;

  const rawStudents = (studentsData as { data?: Array<Record<string, unknown>>; meta?: { current_page: number; last_page: number; total: number; per_page: number } })?.data ?? [];
  const studentsMeta = (studentsData as { meta?: { current_page: number; last_page: number; total: number; per_page: number } })?.meta;

  // Group rows by student_id so a student in multiple cohorts appears once
  const students = Object.values(
    rawStudents.reduce<Record<number, Record<string, unknown>>>((acc, row) => {
      const sid = row.student_id as number;
      if (!acc[sid]) {
        acc[sid] = { ...row, cohort_names: [row.cohort_name as string] };
      } else {
        (acc[sid].cohort_names as string[]).push(row.cohort_name as string);
      }
      return acc;
    }, {})
  );

  const contents = (contentsData as { courses?: Array<Record<string, unknown>> })?.courses ?? [];

  const statusPillClass = experience.status === 'active'
    ? 'bg-success/10 text-[#16A34A]'
    : experience.status === 'draft' ? 'bg-bg text-soft' : 'bg-bg text-soft';

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[0.85rem]">
        <Link to="/admin/experiences" className="text-teal no-underline font-medium hover:text-[#0E7490] hover:underline">
          Experiences
        </Link>
        <span className="text-soft">/</span>
        <span className="text-soft font-medium">{experience.name}</span>
      </nav>

      {/* Page header */}
      <div>
        <div className="flex items-center gap-3.5 mb-2">
          <h1 className="text-[1.65rem] font-bold text-charcoal">{experience.name}</h1>
          <span className={`text-[0.78rem] font-semibold px-3 py-1 rounded-full ${statusPillClass}`}>
            {experience.status.charAt(0).toUpperCase() + experience.status.slice(1)}
          </span>
        </div>
        {experience.description && (
          <p className="text-[0.88rem] text-soft">{experience.description}</p>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total Cohorts" value={totalCohorts} detail={`${activeCohorts} active`} accent="teal" />
        <MetricCard label="Enrolled Students" value={enrolledStudents} accent="teal" />
        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          detail="of enrolled students"
          accent={completionRate >= 70 ? 'success' : 'warning'}
        />
      </div>

      {/* Content & Delivery */}
      <div className="bg-card border-[1.5px] border-border rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
        <h3 className="font-[family-name:var(--font-display)] font-semibold text-[0.82rem] text-soft uppercase tracking-wider mb-3.5">
          Content &amp; Delivery
        </h3>
        {contents.length === 0 ? (
          <p className="text-[0.9rem] text-soft">No content available for this experience.</p>
        ) : (
          <div className="divide-y divide-border">
            {contents.map((course, ci) => {
              const blocks = (course.blocks as Array<Record<string, unknown>>) ?? [];
              return (
                <div key={(course.id as number) ?? ci} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-charcoal">
                      {course.name as string ?? `Course ${ci + 1}`}
                    </span>
                    <span className="text-[0.72rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-teal/[0.08] text-teal">
                      course
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <span className="text-[0.82rem] text-soft whitespace-nowrap">
                      {blocks.length} blocks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Students table */}
      <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Students</span>
            <span className="text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">
              {studentsMeta?.total ?? students.length} enrolled
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-bg focus-within:border-primary transition-colors">
              <svg className="w-4 h-4 text-soft flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => handleStudentSearch(e.target.value)}
                className="border-none bg-transparent font-[family-name:var(--font-body)] text-[0.85rem] text-body outline-none w-[140px] placeholder:text-[#B0B5BF]"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg hover:border-soft"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </button>
          </div>
        </div>
        <div className="h-px bg-border" />

        {loadingStudents ? (
          <Spinner className="py-12" />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            description={debouncedStudentSearch ? 'No students match your search.' : 'No students are enrolled in this experience yet.'}
          />
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '30%' }}>Student</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '12%' }}>Status</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '20%' }}>Cohort</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '20%' }}>Email</th>
                  <th className="text-left px-5 py-3 bg-bg border-b-[1.5px] border-border" style={{ width: '4%' }}></th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {students.map((s, i) => (
                  <tr key={(s.student_id as number) ?? i} className="transition-colors hover:bg-[#FAFBFE] cursor-pointer group">
                    <td className="px-5 py-3.5 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-teal/20 to-teal flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-[0.7rem] flex-shrink-0">
                          {((s.student_name as string) ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-charcoal">{s.student_name as string ?? '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full inline-block ${enrolmentBadgeClass(s.status as string ?? '')}`}>
                        {((s.status as string) ?? 'unknown').charAt(0).toUpperCase() + ((s.status as string) ?? 'unknown').slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 border-b border-border text-[0.9rem]">{((s.cohort_names as string[]) ?? []).join(', ') || '-'}</td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <span className="text-teal text-[0.82rem] no-underline hover:underline">{s.student_email as string ?? '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <Link to={`/admin/enrolments?student_id=${s.student_id as number}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                        ›
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {studentsMeta && (
              <Pagination
                currentPage={studentsMeta.current_page}
                lastPage={studentsMeta.last_page}
                total={studentsMeta.total}
                perPage={studentsMeta.per_page}
                onPageChange={setStudentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
