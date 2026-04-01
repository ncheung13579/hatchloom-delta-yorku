// Experience detail page — shows a single experience with its statistics, course contents,
// cohort list, and enrolled students. Supports editing the experience, creating cohorts,
// deleting the experience, and exporting student data as CSV.
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExperience,
  getExperienceStatistics,
  getExperienceStudents,
  getExperienceContents,
  exportExperienceStudents,
  updateExperience,
  deleteExperience,
} from '../../api/experiences';
import { createCohort } from '../../api/enrolments';
import { AxiosError } from 'axios';
import MetricCard from '../../components/ui/MetricCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

// Returns Tailwind classes for enrolled/removed enrolment status badges.
function enrolmentBadgeClass(status: string): string {
  switch (status) {
    case 'enrolled': return 'bg-success/10 text-[#16A34A]';
    case 'removed': return 'bg-danger/10 text-danger';
    default: return 'bg-bg text-soft';
  }
}

export default function ExperienceDetailPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'school_teacher';
  const { id } = useParams<{ id: string }>();
  const experienceId = Number(id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Student search with debounce
  const [studentPage, setStudentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Create-cohort modal form state
  const [showCreateCohort, setShowCreateCohort] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortStart, setCohortStart] = useState('');
  const [cohortEnd, setCohortEnd] = useState('');
  const [cohortCapacity, setCohortCapacity] = useState('');

  // Edit-experience modal form state
  const [showEditExp, setShowEditExp] = useState(false);
  const [editExpName, setEditExpName] = useState('');
  const [editExpDesc, setEditExpDesc] = useState('');
  const [editCoordinator, setEditCoordinator] = useState<number | ''>('');

  // Create a new cohort under this experience with name, date range, and optional capacity.
  const createCohortMut = useMutation({
    mutationFn: () => createCohort({
      experience_id: experienceId,
      name: cohortName,
      start_date: cohortStart,
      end_date: cohortEnd,
      ...(cohortCapacity ? { capacity: Number(cohortCapacity) } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience', experienceId] });
      setShowCreateCohort(false);
      setCohortName('');
      setCohortStart('');
      setCohortEnd('');
      setCohortCapacity('');
    },
  });

  // Update the experience name, description, and optionally the coordinator.
  const updateExpMut = useMutation({
    mutationFn: () => updateExperience(experienceId, {
      name: editExpName,
      description: editExpDesc,
      ...(editCoordinator ? { created_by: Number(editCoordinator) } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience', experienceId] });
      setShowEditExp(false);
    },
  });

  // Permanently delete this experience, then redirect to the experiences list.
  const deleteExpMut = useMutation({
    mutationFn: () => deleteExperience(experienceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      navigate('/admin/experiences');
    },
  });

  const perPage = 15;

  // Debounce student search: waits 400ms after the last keystroke before firing the query.
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

  // Download enrolled students as a CSV file via a temporary blob URL.
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

  // Unpack statistics sub-objects for the metric cards
  const stats = statistics as Record<string, unknown> | undefined;
  const enrolmentStats = stats?.enrolment as Record<string, unknown> | undefined;
  const completionStats = stats?.completion as Record<string, unknown> | undefined;
  const creditStats = stats?.credit_progress as Record<string, unknown> | undefined;
  const totalCohorts = experience.cohorts?.length ?? 0;
  const activeCohorts = experience.cohorts?.filter((c) => c.status === 'active').length ?? 0;
  const enrolledStudents = (enrolmentStats?.total_students as number) ?? 0;
  const completionRate = (completionStats?.completion_rate as number) ?? 0;

  const rawStudents = (studentsData as { data?: Array<Record<string, unknown>>; meta?: { current_page: number; last_page: number; total: number; per_page: number } })?.data ?? [];
  const studentsMeta = (studentsData as { meta?: { current_page: number; last_page: number; total: number; per_page: number } })?.meta;

  // Deduplicate rows by student_id: a student enrolled in multiple cohorts
  // appears once with all their cohort_names merged into a single array.
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
          {experience.created_by && (
            <span className="text-[0.85rem] text-soft flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              {experience.created_by}
            </span>
          )}
          {(isTeacher || user?.role === 'school_admin') && (
            <button
              onClick={() => { setEditExpName(experience.name); setEditExpDesc(experience.description); setEditCoordinator(experience.created_by_id ?? ''); setShowEditExp(true); }}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-card
                font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg hover:border-soft"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
          )}
          {(isTeacher || user?.role === 'school_admin') && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-[7px] border-[1.5px] border-danger/30 rounded-[10px] bg-card
                font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-danger cursor-pointer transition-all hover:bg-danger/5 hover:border-danger/50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </button>
          )}
        </div>
        {experience.description && (
          <p className="text-[0.88rem] text-soft">{experience.description}</p>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total Cohorts" value={totalCohorts} detail={`${activeCohorts} active`} accent="teal" />
        <MetricCard label="Enrolled Students" value={enrolledStudents} accent="teal" />
        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          detail="of enrolled students"
          accent={completionRate >= 70 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Credit Progress"
          value={`${creditStats?.average ?? 0}%`}
          detail={`${creditStats?.students_with_credits ?? 0} students earning`}
          accent="orange"
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

      {/* Cohorts */}
      {experience.cohorts && experience.cohorts.length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Cohorts</span>
              <span className="text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">
                {experience.cohorts.length}
              </span>
            </div>
            {(isTeacher || user?.role === 'school_admin') && (
              <button
                onClick={() => setShowCreateCohort(true)}
                className="flex items-center gap-1.5 px-3.5 py-[7px] bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-[10px]
                  font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Cohort
              </button>
            )}
          </div>
          <div className="h-px bg-border" />
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Cohort</th>
                <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Status</th>
                <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Students</th>
                <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border">Dates</th>
                <th className="text-left px-5 py-3 bg-bg border-b-[1.5px] border-border" style={{ width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {experience.cohorts.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[#FAFBFE] cursor-pointer group">
                  <td className="px-5 py-3.5 border-b border-border">
                    <Link to={`/admin/cohorts/${c.id}`} className="font-semibold text-charcoal no-underline hover:text-teal">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 border-b border-border">
                    <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full inline-block ${
                      c.status === 'active' ? 'bg-success/10 text-[#16A34A]'
                        : c.status === 'completed' ? 'bg-teal/10 text-teal'
                        : 'bg-bg text-soft'
                    }`}>
                      {c.status.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-border text-[0.9rem]">
                    {c.enrolled_count ?? c.student_count ?? 0}
                  </td>
                  <td className="px-5 py-3.5 border-b border-border text-soft text-[0.85rem]">
                    {new Date(c.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 border-b border-border">
                    <Link to={`/admin/cohorts/${c.id}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                      &rsaquo;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create cohort button if no cohorts yet */}
      {(isTeacher || user?.role === 'school_admin') && (!experience.cohorts || experience.cohorts.length === 0) && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowCreateCohort(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-xl
              font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create First Cohort
          </button>
        </div>
      )}

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
                      <Link to={`/admin/students/${s.student_id as number}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                        &rsaquo;
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

      {/* Create Cohort Modal */}
      <Modal open={showCreateCohort} onClose={() => setShowCreateCohort(false)} title="Create Cohort">
        <div className="space-y-4">
          <div>
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Cohort Name</label>
            <input
              type="text"
              value={cohortName}
              onChange={e => setCohortName(e.target.value)}
              placeholder="e.g. Cohort A"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Start Date</label>
              <input
                type="date"
                value={cohortStart}
                onChange={e => setCohortStart(e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">End Date</label>
              <input
                type="date"
                value={cohortEnd}
                onChange={e => setCohortEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Capacity (optional)</label>
            <input
              type="number"
              value={cohortCapacity}
              onChange={e => setCohortCapacity(e.target.value)}
              placeholder="e.g. 30"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
            />
          </div>
          {createCohortMut.isError && (
            <p className="text-danger text-[0.82rem]">
              {(createCohortMut.error instanceof AxiosError && createCohortMut.error.response?.data?.message)
                || 'Failed to create cohort. Please check the fields and try again.'}
            </p>
          )}
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setShowCreateCohort(false)}
              className="px-4 py-2 border-[1.5px] border-border rounded-xl bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg"
            >
              Cancel
            </button>
            <button
              onClick={() => createCohortMut.mutate()}
              disabled={!cohortName || !cohortStart || !cohortEnd || createCohortMut.isPending}
              className="px-4 py-2 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-xl font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)] disabled:opacity-50"
            >
              {createCohortMut.isPending ? 'Creating...' : 'Create Cohort'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Experience Modal */}
      <Modal open={showEditExp} onClose={() => setShowEditExp(false)} title="Edit Experience">
        <div className="space-y-4">
          <div>
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Name</label>
            <input
              type="text"
              value={editExpName}
              onChange={e => setEditExpName(e.target.value)}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Description</label>
            <textarea
              value={editExpDesc}
              onChange={e => setEditExpDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          {user?.role === 'school_admin' && (
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Coordinator</label>
              <select
                value={editCoordinator}
                onChange={e => setEditCoordinator(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors bg-card"
              >
                <option value="">— Select coordinator —</option>
                <option value="2">Ms. Smith</option>
                <option value="3">Mr. Johnson</option>
              </select>
            </div>
          )}
          {updateExpMut.isError && (
            <p className="text-danger text-[0.82rem]">Failed to update experience.</p>
          )}
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setShowEditExp(false)}
              className="px-4 py-2 border-[1.5px] border-border rounded-xl bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg"
            >
              Cancel
            </button>
            <button
              onClick={() => updateExpMut.mutate()}
              disabled={!editExpName || updateExpMut.isPending}
              className="px-4 py-2 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-xl font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)] disabled:opacity-50"
            >
              {updateExpMut.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Experience Confirmation Modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Experience">
        <div className="space-y-4">
          <p className="text-[0.9rem] text-body">
            Are you sure you want to delete <span className="font-semibold">{experience?.name}</span>? This action cannot be undone.
          </p>
          {deleteExpMut.isError && (
            <p className="text-danger text-[0.82rem]">Failed to delete experience.</p>
          )}
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border-[1.5px] border-border rounded-xl bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteExpMut.mutate()}
              disabled={deleteExpMut.isPending}
              className="px-4 py-2 bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white border-none rounded-xl font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)] disabled:opacity-50"
            >
              {deleteExpMut.isPending ? 'Deleting...' : 'Delete Experience'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
