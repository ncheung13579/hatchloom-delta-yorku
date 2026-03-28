import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { getEnrolments, getEnrolmentStatistics, removeStudent, exportEnrolments } from '../../api/enrolments';
import { getExperiences } from '../../api/experiences';
import MetricCard from '../../components/ui/MetricCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function EnrolmentsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get('student_id')
    ? Number(searchParams.get('student_id'))
    : undefined;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{
    cohort_id: number;
    student_id: number;
    student_name: string;
  } | null>(null);
  const perPage = 15;

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setTimer(t);
  };

  const buildParams = () => {
    const params: Record<string, unknown> = { page, per_page: perPage };
    if (debouncedSearch) params.search = debouncedSearch;
    if (gradeFilter) params.grade = gradeFilter;
    if (experienceFilter) params.experience_id = Number(experienceFilter);
    if (cohortFilter) params.cohort_id = Number(cohortFilter);
    if (initialStudentId) params.student_id = initialStudentId;
    return params;
  };

  const { data: enrolmentsData, isLoading: loadingEnrolments } = useQuery({
    queryKey: ['enrolments', page, perPage, debouncedSearch, gradeFilter, experienceFilter, cohortFilter, initialStudentId],
    queryFn: () => getEnrolments(buildParams()),
  });

  const { data: statistics } = useQuery({
    queryKey: ['enrolment-statistics'],
    queryFn: getEnrolmentStatistics,
  });

  const { data: experiencesData } = useQuery({
    queryKey: ['experiences-list'],
    queryFn: () => getExperiences(1, 100),
  });

  const removeMutation = useMutation({
    mutationFn: ({ cohort_id, student_id }: { cohort_id: number; student_id: number }) =>
      removeStudent(cohort_id, student_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolments'] });
      queryClient.invalidateQueries({ queryKey: ['enrolment-statistics'] });
      setRemoveTarget(null);
    },
  });

  const handleExport = async () => {
    try {
      const blob = await exportEnrolments();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'enrolments.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle export errors
    }
  };

  const enrolmentsRaw = enrolmentsData?.data ?? [];
  const meta = enrolmentsData?.meta;
  const gradeOptions = ['7', '8', '9', '10', '11', '12'];

  // Keep students grouped (one row per student with cohort pills) — matches reference screen 303
  const students = (enrolmentsRaw as Array<Record<string, unknown>>).map((student) => ({
    student_id: student.student_id as number,
    student_name: (student.name as string) ?? '-',
    student_email: (student.email as string) ?? '-',
    grade: (student.grade as string) ?? '-',
    cohort_assignments: ((student.cohort_assignments as Array<Record<string, unknown>>) ?? []).map((a) => ({
      cohort_id: a.cohort_id as number,
      cohort_name: (a.cohort_name as string) ?? '-',
      experience_name: (a.experience_name as string) ?? '',
      status: (a.status as string) ?? 'unknown',
    })),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.65rem] font-bold text-charcoal mb-1">Enrolment</h1>
          <p className="text-[0.92rem] text-soft">All students and their cohort assignments</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
        </Button>
      </div>

      {/* Metric cards */}
      {statistics && (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="Students Enrolled"
            value={statistics.total_students}
            detail="Across all experiences"
            accent="teal"
          />
          <MetricCard
            label="Active Assignments"
            value={statistics.enrolled}
            detail="Student-cohort placements"
            accent="teal"
          />
          <MetricCard
            label="Not in Any Active Cohort"
            value={statistics.not_assigned}
            detail="Need assignment"
            accent={statistics.not_assigned > 0 ? 'warning' : 'teal'}
          />
        </div>
      )}

      {/* Attention card for unassigned students */}
      {statistics && statistics.not_assigned > 0 && (
        <div className="rounded-[14px] px-5 py-3.5 flex items-center justify-between border-l-4 border-l-warning bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-[1.5px] border-[#FDE68A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-warning/15 text-[#B45309]">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <strong className="font-semibold text-charcoal text-[0.9rem]">
                {statistics.not_assigned} student{statistics.not_assigned !== 1 ? 's are' : ' is'} not in any active cohort
              </strong>
              <span className="text-soft text-[0.82rem] block mt-0.5">Enrolled but not assigned — they won't receive content until placed</span>
            </div>
          </div>
        </div>
      )}

      {/* Data table */}
      <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-visible relative">
        <div className="flex items-center justify-between px-6 py-4 min-h-[60px]">
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Students</span>
            <span className="text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">
              {meta?.total ?? students.length} enrolled
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
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
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

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-bg border-b border-border">
          <span className="text-[0.82rem] font-semibold text-soft mr-0.5">Filter:</span>
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border-[1.5px] border-border rounded-lg bg-card font-[family-name:var(--font-body)] text-[0.82rem] font-semibold text-charcoal cursor-pointer focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">All Grades</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
          <select
            value={experienceFilter}
            onChange={(e) => { setExperienceFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border-[1.5px] border-border rounded-lg bg-card font-[family-name:var(--font-body)] text-[0.82rem] font-semibold text-charcoal cursor-pointer focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">All Experiences</option>
            {(experiencesData?.data ?? []).map((exp) => (
              <option key={exp.id} value={exp.id}>{exp.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Cohort ID"
            value={cohortFilter}
            onChange={(e) => { setCohortFilter(e.target.value); setPage(1); }}
            className="w-28 px-3 py-1.5 border-[1.5px] border-border rounded-lg bg-card font-[family-name:var(--font-body)] text-[0.82rem] text-body focus:outline-none focus:border-primary transition-colors placeholder:text-[#B0B5BF]"
          />
        </div>

        {loadingEnrolments ? (
          <Spinner className="py-12" />
        ) : students.length === 0 ? (
          <EmptyState title="No enrolments found" description="Adjust your filters or search terms." />
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '24%' }}>Student</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '7%' }}>Grade</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '40%' }}>Cohorts</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '13%' }}>Status</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '12%' }}>Last Active</th>
                  <th className="text-left px-5 py-3 bg-bg border-b-[1.5px] border-border" style={{ width: '4%' }}></th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {students.map((student) => {
                  const hasNoCohorts = student.cohort_assignments.length === 0;
                  const isUnassigned = hasNoCohorts;

                  return (
                    <tr key={student.student_id} className={`transition-colors hover:bg-[#FAFBFE] ${isUnassigned ? 'bg-[rgba(255,31,90,0.03)]' : ''}`}>
                      <td className="px-5 py-3.5 border-b border-border">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-teal/20 to-teal flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-[0.7rem] flex-shrink-0">
                            {student.student_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-charcoal">{student.student_name}</div>
                            <div className="text-[0.8rem] text-soft">{student.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 border-b border-border">{student.grade}</td>
                      <td className="px-5 py-3.5 border-b border-border">
                        {hasNoCohorts ? (
                          <span className="text-[0.82rem] text-warning font-medium italic">No active cohorts</span>
                        ) : (
                          <div className="flex gap-1.5 flex-wrap">
                            {student.cohort_assignments.map((a, i) => (
                              <span
                                key={i}
                                className="text-[0.78rem] font-medium px-2.5 py-0.5 rounded-md bg-gradient-to-r from-teal/[0.08] to-teal/[0.04] text-teal font-semibold whitespace-nowrap"
                              >
                                {a.experience_name ? `${a.experience_name} · ` : ''}{a.cohort_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 border-b border-border">
                        {hasNoCohorts ? (
                          <div className="flex items-center gap-[7px]">
                            <span className="w-2.5 h-2.5 rounded-full bg-warning shadow-[0_0_0_3px_rgba(245,158,11,0.15)] flex-shrink-0" />
                            <span className="text-[0.82rem] text-soft">Unassigned</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-[7px]">
                            <span className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.15)] flex-shrink-0" />
                            <span className="text-[0.82rem] text-soft">Enrolled</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 border-b border-border text-soft text-[0.85rem]">-</td>
                      <td className="px-5 py-3.5 border-b border-border">
                        <Link to={`/admin/students/${student.student_id}`} className="text-border hover:text-soft hover:translate-x-0.5 transition-all text-xl no-underline">›</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {meta && (
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                perPage={meta.per_page}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Remove student modal */}
      <Modal open={removeTarget !== null} onClose={() => setRemoveTarget(null)} title="Remove Student">
        <p className="text-[0.9rem] text-soft leading-relaxed mb-5">
          Are you sure you want to remove <strong className="text-charcoal font-semibold">{removeTarget?.student_name}</strong> from
          this cohort? The student will be soft-deleted and can be reviewed later.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoveTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={removeMutation.isPending}
            onClick={() =>
              removeTarget &&
              removeMutation.mutate({
                cohort_id: removeTarget.cohort_id,
                student_id: removeTarget.student_id,
              })
            }
          >
            {removeMutation.isPending ? 'Removing...' : 'Remove Student'}
          </Button>
        </div>
        {removeMutation.isError && (
          <p className="text-sm text-danger mt-2">Failed to remove student. Please try again.</p>
        )}
      </Modal>
    </div>
  );
}
