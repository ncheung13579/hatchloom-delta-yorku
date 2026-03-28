import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCohort, getCohortEnrolments, activateCohort, completeCohort, enrolStudent, updateCohort } from '../../api/enrolments';
import { getExperience, getExperienceContents } from '../../api/experiences';
import { useAuth } from '../../context/AuthContext';
import MetricCard from '../../components/ui/MetricCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

function statusPillClass(status: string): string {
  switch (status) {
    case 'active': return 'bg-success/10 text-[#16A34A]';
    case 'completed': return 'bg-teal/10 text-teal';
    default: return 'bg-bg text-soft';
  }
}

export default function CohortDetailPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'school_teacher';
  const { cohortId } = useParams();
  const id = Number(cohortId);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const perPage = 8;

  const [showEnrol, setShowEnrol] = useState(false);
  const [enrolStudentId, setEnrolStudentId] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  const { data: cohort, isLoading, error } = useQuery({
    queryKey: ['cohort', id],
    queryFn: () => getCohort(id),
    enabled: !!id,
  });

  const experienceId = cohort?.experience_id;

  const { data: experience } = useQuery({
    queryKey: ['experience', experienceId],
    queryFn: () => getExperience(experienceId!),
    enabled: !!experienceId,
  });

  const { data: contentsData } = useQuery({
    queryKey: ['experience-contents', experienceId],
    queryFn: () => getExperienceContents(experienceId!),
    enabled: !!experienceId,
  });

  const { data: enrolmentsData } = useQuery({
    queryKey: ['cohort-enrolments', id],
    queryFn: () => getCohortEnrolments(id),
    enabled: !!id,
  });

  const activateMut = useMutation({
    mutationFn: () => activateCohort(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cohort', id] }),
  });

  const completeMut = useMutation({
    mutationFn: () => completeCohort(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cohort', id] }),
  });

  const enrolMut = useMutation({
    mutationFn: (studentId: number) => enrolStudent(id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort', id] });
      queryClient.invalidateQueries({ queryKey: ['cohort-enrolments', id] });
      setShowEnrol(false);
      setEnrolStudentId('');
    },
  });

  const updateMut = useMutation({
    mutationFn: () => updateCohort(id, {
      name: editName,
      start_date: editStart,
      end_date: editEnd,
      ...(editCapacity ? { capacity: Number(editCapacity) } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort', id] });
      setShowEdit(false);
    },
  });

  if (isLoading) return <Spinner className="py-24" />;
  if (error || !cohort) {
    return (
      <EmptyState
        title="Cohort not found"
        description="The requested cohort could not be loaded."
        action={<Link to="/admin/experiences" className="text-primary font-semibold no-underline hover:underline">Back to Experiences</Link>}
      />
    );
  }

  const enrolments = (enrolmentsData?.data ?? []) as Array<Record<string, unknown>>;

  const contents = ((contentsData as Record<string, unknown>)?.courses ?? []) as Array<Record<string, unknown>>;

  // Enrolment data has: student_id, name, email, cohort_assignments[]
  const filtered = enrolments.filter(e => {
    if (!search) return true;
    const name = ((e.name as string) ?? (e.student_name as string) ?? '').toLowerCase();
    const email = ((e.email as string) ?? (e.student_email as string) ?? '').toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const totalStudents = filtered.length;
  const totalPages = Math.ceil(totalStudents / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const statusLabel = cohort.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[0.85rem]">
        <Link to="/admin/experiences" className="text-teal no-underline font-medium hover:text-[#0E7490] hover:underline">
          Experiences
        </Link>
        <span className="text-soft">&rsaquo;</span>
        {experience && (
          <>
            <Link to={`/admin/experiences/${experience.id}`} className="text-teal no-underline font-medium hover:text-[#0E7490] hover:underline">
              {experience.name}
            </Link>
            <span className="text-soft">&rsaquo;</span>
          </>
        )}
        <span className="text-soft font-medium">{cohort.name}</span>
      </nav>

      {/* Page header */}
      <div>
        <div className="flex items-center gap-3.5 mb-2">
          <h1 className="text-[1.65rem] font-bold text-charcoal">
            {experience?.name ? `${experience.name} · ` : ''}{cohort.name}
          </h1>
          <span className={`text-[0.78rem] font-semibold px-3 py-1 rounded-full ${statusPillClass(cohort.status)}`}>
            {statusLabel}
          </span>
          {isTeacher && cohort.status !== 'completed' && (
            <button
              onClick={() => {
                setEditName(cohort.name);
                setEditStart(cohort.start_date);
                setEditEnd(cohort.end_date);
                setEditCapacity(cohort.capacity ? String(cohort.capacity) : '');
                setShowEdit(true);
              }}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-card
                font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg hover:border-soft"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
          )}
        </div>
        <div className="flex items-center gap-5 text-[0.88rem] text-soft">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' – '}
            {new Date(cohort.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          {cohort.teacher_name && (
            <>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Coordinator: {cohort.teacher_name}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5">
        {isTeacher && cohort.status === 'not_started' && (
          <button
            onClick={() => activateMut.mutate()}
            disabled={activateMut.isPending}
            className="px-4 py-2 bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white border-none rounded-xl
              font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer
              transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,197,94,0.25)] disabled:opacity-50"
          >
            {activateMut.isPending ? 'Activating...' : 'Activate Cohort'}
          </button>
        )}
        {isTeacher && cohort.status === 'active' && (
          <button
            onClick={() => completeMut.mutate()}
            disabled={completeMut.isPending}
            className="px-4 py-2 bg-gradient-to-br from-teal to-[#0E7490] text-white border-none rounded-xl
              font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer
              transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(8,145,178,0.25)] disabled:opacity-50"
          >
            {completeMut.isPending ? 'Completing...' : 'Complete Cohort'}
          </button>
        )}
        {cohort.status !== 'completed' && (
          <button
            onClick={() => setShowEnrol(true)}
            className="px-4 py-2 border-[1.5px] border-border rounded-xl bg-card
              font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer
              transition-all hover:bg-bg hover:border-soft"
          >
            Enrol Student
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Students Enrolled"
          value={cohort.enrolled_count ?? enrolments.length}
          detail={`${enrolments.length} active`}
          accent="teal"
        />
        <MetricCard
          label="Credit Progress"
          value={cohort.capacity ? `${cohort.capacity}` : '\u2013'}
          detail={cohort.capacity ? 'Capacity' : 'Not set'}
          accent="teal"
        />
        <MetricCard
          label="Date Range"
          value={`${Math.ceil((new Date(cohort.end_date).getTime() - new Date(cohort.start_date).getTime()) / (1000 * 60 * 60 * 24))}d`}
          detail="Duration"
          accent="teal"
        />
      </div>

      {/* Contents & Delivery */}
      {contents.length > 0 && (
        <div className="bg-card border-[1.5px] border-border rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-[0.82rem] text-soft uppercase tracking-wider mb-3.5">
            Contents &amp; Delivery
          </h3>
          <div className="divide-y divide-border">
            {contents.map((course, ci) => {
              const blocks = ((course.blocks as Array<Record<string, unknown>>) ?? []);
              const totalBlocks = blocks.length;
              const pct = totalBlocks > 0 ? Math.round((totalBlocks / totalBlocks) * 100) : 0;
              return (
                <div key={(course.id as number) ?? ci} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-teal/[0.08] text-teal">
                      Course
                    </span>
                    <span className="font-semibold text-charcoal">{course.name as string}</span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <span className="text-[0.82rem] text-soft whitespace-nowrap">
                      {totalBlocks} blocks
                      <span className="inline-block w-[60px] h-1 rounded-full bg-border ml-2 relative overflow-hidden align-middle">
                        <span className="absolute left-0 top-0 h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Students table */}
      <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Students</span>
            <span className="text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">
              {totalStudents} enrolled
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
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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

        {paged.length === 0 ? (
          <EmptyState
            title="No students found"
            description={search ? 'No students match your search.' : 'No students are enrolled in this cohort yet.'}
          />
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '30%' }}>Student</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '10%' }}>Status</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '28%' }}>Contact</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '15%' }}>Enrolled</th>
                  <th className="text-left px-5 py-3 bg-bg border-b-[1.5px] border-border" style={{ width: '4%' }}></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((student, i) => {
                  const studentName = (student.name as string) ?? (student.student_name as string) ?? '-';
                  const studentEmail = (student.email as string) ?? (student.student_email as string) ?? '-';
                  const studentId = (student.student_id as number) ?? i;
                  const cohortAssignments = (student.cohort_assignments ?? []) as Array<Record<string, unknown>>;
                  const thisCohort = cohortAssignments.find(a => (a.cohort_id as number) === id);
                  const enrolledAt = thisCohort?.enrolled_at as string | undefined;
                  const enrolledStatus = (thisCohort?.status as string) ?? (student.assignment_status as string) ?? 'enrolled';

                  return (
                    <tr key={studentId} className="transition-colors hover:bg-[#FAFBFE] cursor-pointer group">
                      <td className="px-5 py-3.5 border-b border-border">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-teal/20 to-teal flex items-center justify-center text-white font-[family-name:var(--font-display)] font-bold text-[0.7rem] flex-shrink-0">
                            {studentName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-charcoal">{studentName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 border-b border-border">
                        <div className="flex items-center gap-[7px]">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            enrolledStatus === 'enrolled' || enrolledStatus === 'assigned'
                              ? 'bg-[#22C55E] shadow-[0_0_0_3px_rgba(34,197,94,0.15)]'
                              : 'bg-[#EF4444] shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
                          }`} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 border-b border-border">
                        <a
                          href={`mailto:${studentEmail}`}
                          className="text-teal text-[0.82rem] no-underline hover:text-[#0E7490] hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          {studentEmail}
                        </a>
                      </td>
                      <td className="px-5 py-3.5 border-b border-border text-soft text-[0.85rem]">
                        {enrolledAt ? new Date(enrolledAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-3.5 border-b border-border">
                        <Link
                          to={`/admin/students/${studentId}`}
                          className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline inline-block"
                        >
                          &rsaquo;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-5 py-3.5 flex items-center justify-between border-t border-border">
              <span className="text-[0.82rem] text-soft">
                Showing {page * perPage + 1}&ndash;{Math.min((page + 1) * perPage, totalStudents)} of {totalStudents} students
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border-[1.5px] border-border rounded-lg bg-card font-[family-name:var(--font-body)] text-[0.82rem] text-soft cursor-pointer transition-all hover:bg-bg disabled:cursor-default disabled:hover:bg-card"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 border-[1.5px] border-border rounded-lg bg-card font-[family-name:var(--font-body)] text-[0.82rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg disabled:cursor-default disabled:hover:bg-card"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enrol Student Modal */}
      <Modal open={showEnrol} onClose={() => setShowEnrol(false)} title="Enrol Student">
        <div className="space-y-4">
          <div>
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Student ID</label>
            <input
              type="number"
              value={enrolStudentId}
              onChange={e => setEnrolStudentId(e.target.value)}
              placeholder="Enter student ID..."
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
            />
          </div>
          {enrolMut.isError && (
            <p className="text-danger text-[0.82rem]">Failed to enrol student. They may already be enrolled or the ID is invalid.</p>
          )}
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setShowEnrol(false)}
              className="px-4 py-2 border-[1.5px] border-border rounded-xl bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg"
            >
              Cancel
            </button>
            <button
              onClick={() => enrolMut.mutate(Number(enrolStudentId))}
              disabled={!enrolStudentId || enrolMut.isPending}
              className="px-4 py-2 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-xl font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)] disabled:opacity-50"
            >
              {enrolMut.isPending ? 'Enrolling...' : 'Enrol'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Cohort Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Cohort">
        <div className="space-y-4">
          <div>
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Cohort Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Start Date</label>
              <input
                type="date"
                value={editStart}
                onChange={e => setEditStart(e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">End Date</label>
              <input
                type="date"
                value={editEnd}
                onChange={e => setEditEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1">Capacity (optional)</label>
            <input
              type="number"
              value={editCapacity}
              onChange={e => setEditCapacity(e.target.value)}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-xl font-[family-name:var(--font-body)] text-[0.9rem] text-body outline-none focus:border-primary transition-colors"
            />
          </div>
          {updateMut.isError && (
            <p className="text-danger text-[0.82rem]">Failed to update cohort.</p>
          )}
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setShowEdit(false)}
              className="px-4 py-2 border-[1.5px] border-border rounded-xl bg-card font-[family-name:var(--font-body)] text-[0.85rem] font-semibold text-body cursor-pointer transition-all hover:bg-bg"
            >
              Cancel
            </button>
            <button
              onClick={() => updateMut.mutate()}
              disabled={!editName || !editStart || !editEnd || updateMut.isPending}
              className="px-4 py-2 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-xl font-[family-name:var(--font-body)] text-[0.85rem] font-semibold cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,31,90,0.25)] disabled:opacity-50"
            >
              {updateMut.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
