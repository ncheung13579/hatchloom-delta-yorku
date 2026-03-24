import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getExperiences, createExperience, deleteExperience } from '../../api/experiences';
import { getCourses } from '../../api/courses';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import type { Experience } from '../../types';
import { AxiosError } from 'axios';

function statusPillClass(status: string): string {
  switch (status) {
    case 'active': return 'bg-success/10 text-[#16A34A]';
    case 'published': return 'bg-success/10 text-[#16A34A]';
    case 'draft': return 'bg-bg text-soft';
    case 'archived': return 'bg-bg text-soft';
    default: return 'bg-bg text-soft';
  }
}

export default function ExperiencesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);
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

  const { data, isLoading } = useQuery({
    queryKey: ['experiences', page, perPage, debouncedSearch],
    queryFn: () => getExperiences(page, perPage, debouncedSearch),
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses(),
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: createExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setShowCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setDeleteTarget(null);
    },
  });

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCourseIds, setFormCourseIds] = useState<number[]>([]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formName,
      description: formDesc,
      course_ids: formCourseIds,
    });
  };

  const openCreate = () => {
    setFormName('');
    setFormDesc('');
    setFormCourseIds([]);
    setShowCreate(true);
  };

  const toggleCourse = (courseId: number) => {
    setFormCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  if (isLoading) return <Spinner className="py-24" />;

  const experiences = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[1.65rem] font-bold text-charcoal mb-1">Experiences</h1>
          <p className="text-[0.92rem] text-soft">Programs your school has assembled from Hatchloom building blocks</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Experience
        </Button>
      </div>

      {/* Experiences table */}
      <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">All Experiences</span>
            <span className="text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full bg-bg text-soft">
              {meta?.total ?? experiences.length} experiences
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-[7px] border-[1.5px] border-border rounded-[10px] bg-bg focus-within:border-primary transition-colors">
              <svg className="w-4 h-4 text-soft flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search experiences..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="border-none bg-transparent font-[family-name:var(--font-body)] text-[0.85rem] text-body outline-none w-[160px] placeholder:text-[#B0B5BF]"
              />
            </div>
          </div>
        </div>
        <div className="h-px bg-border" />

        {experiences.length === 0 ? (
          <EmptyState
            title="No experiences found"
            description={debouncedSearch ? 'Try adjusting your search terms.' : 'Create your first experience to get started.'}
            action={!debouncedSearch ? <Button onClick={openCreate}>+ New Experience</Button> : undefined}
          />
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '22%' }}>Experience</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '8%' }}>Status</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '24%' }}>Contents</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '14%' }}>Cohorts</th>
                  <th className="text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg border-b-[1.5px] border-border" style={{ width: '10%' }}>Actions</th>
                  <th className="text-left px-5 py-3 bg-bg border-b-[1.5px] border-border" style={{ width: '3%' }}></th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {experiences.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-[#FAFBFE] group">
                    <td className="px-5 py-3.5 border-b border-border">
                      <span className="font-semibold text-charcoal">{exp.name}</span>
                      {exp.description && (
                        <div className="text-[0.8rem] text-soft mt-0.5 line-clamp-1">{exp.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <span className={`text-[0.78rem] font-semibold px-2.5 py-1 rounded-full inline-block ${statusPillClass(exp.status)}`}>
                        {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      {(exp.course_count ?? 0) > 0 ? (
                        <span className="text-[0.88rem] font-medium text-charcoal">
                          {exp.course_count} course{exp.course_count !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[0.85rem] text-soft italic">No courses</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      {(exp.cohort_count ?? 0) > 0 ? (
                        <Link
                          to={`/admin/experiences/${exp.id}`}
                          className="text-[0.85rem] font-semibold text-teal no-underline hover:underline"
                        >
                          {exp.cohort_count} cohort{exp.cohort_count !== 1 ? 's' : ''}
                        </Link>
                      ) : (
                        <span className="text-[0.85rem] text-soft italic">No cohorts</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/experiences/${exp.id}`} className="text-sm text-primary hover:underline no-underline">
                          View
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          className="text-sm text-danger hover:underline bg-transparent border-none cursor-pointer font-[family-name:var(--font-body)]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 border-b border-border">
                      <Link to={`/admin/experiences/${exp.id}`} className="text-border group-hover:text-soft group-hover:translate-x-0.5 transition-all text-xl no-underline">
                        ›
                      </Link>
                    </td>
                  </tr>
                ))}
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

      {/* Create Experience modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Experience" wide>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-body">Name</label>
            <input
              className="w-full rounded-[10px] border-[1.5px] border-border bg-bg px-3.5 py-2 text-[0.85rem] text-body font-[family-name:var(--font-body)] placeholder:text-[#B0B5BF] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              placeholder="Experience name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-body">Description</label>
            <textarea
              className="w-full rounded-[10px] border-[1.5px] border-border bg-bg px-3.5 py-2 text-[0.85rem] text-body font-[family-name:var(--font-body)] placeholder:text-[#B0B5BF] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              placeholder="Describe this experience..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-body">Courses</label>
            {!coursesData ? (
              <Spinner className="py-4" />
            ) : (coursesData.data ?? []).length === 0 ? (
              <p className="text-sm text-soft">No courses available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {(coursesData.data ?? []).map((course) => (
                  <label key={course.id} className="flex items-center gap-2 text-sm text-body cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCourseIds.includes(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    {course.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !formName.trim()}>
              {createMutation.isPending ? 'Creating...' : 'Create Experience'}
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-danger">
              {(createMutation.error instanceof AxiosError && createMutation.error.response?.data?.message)
                || 'Failed to create experience. Please try again.'}
            </p>
          )}
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Experience">
        <p className="text-sm text-body mb-4">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
        {deleteMutation.isError && (
          <p className="text-sm text-danger mt-2">
            {(deleteMutation.error instanceof AxiosError && deleteMutation.error.response?.data?.message)
              || 'Failed to delete experience. It may have active cohorts.'}
          </p>
        )}
      </Modal>
    </div>
  );
}
