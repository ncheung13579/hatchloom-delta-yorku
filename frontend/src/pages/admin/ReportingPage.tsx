import { useQuery } from '@tanstack/react-query';
import { getPosCoverage, getEngagement } from '../../api/dashboard';
import MetricCard from '../../components/ui/MetricCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.round(value));
  return (
    <div className="flex items-center gap-3">
      <span className="text-[0.85rem] text-body w-40 truncate">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-bg overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-teal to-[#2DD4BF] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[0.82rem] font-semibold text-charcoal w-12 text-right">{pct}%</span>
    </div>
  );
}

export default function ReportingPage() {
  const { data: posData, isLoading: loadingPos, error: posError } = useQuery({
    queryKey: ['pos-coverage'],
    queryFn: getPosCoverage,
  });

  const { data: engData, isLoading: loadingEng, error: engError } = useQuery({
    queryKey: ['engagement'],
    queryFn: getEngagement,
  });

  if (loadingPos && loadingEng) return <Spinner className="py-24" />;

  const pos = posData as Record<string, unknown> | undefined;
  const eng = engData as Record<string, unknown> | undefined;

  const posAreas = (pos?.pos_areas ?? []) as Array<Record<string, unknown>>;
  const schoolAveragesPos = pos?.school_averages as Record<string, unknown> | undefined;
  const studentCoverage = (pos?.student_coverage ?? []) as Array<Record<string, unknown>>;

  const studentEngagement = (eng?.student_engagement ?? []) as Array<Record<string, unknown>>;
  const schoolAveragesEng = eng?.school_averages as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.65rem] font-bold text-charcoal mb-1">Curriculum Alignment</h1>
        <p className="text-[0.92rem] text-soft">Alberta PoS curriculum coverage and student engagement metrics</p>
      </div>

      {/* PoS Coverage */}
      <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">PoS Curriculum Coverage</h2>
          {schoolAveragesPos && (
            <span className="text-[0.82rem] text-soft">
              School average: <strong className="text-charcoal">{schoolAveragesPos.overall_coverage as number ?? 0}%</strong>
            </span>
          )}
        </div>

        {posError ? (
          <EmptyState title="Failed to load PoS data" />
        ) : loadingPos ? (
          <Spinner className="py-8" />
        ) : (
          <div className="p-6 space-y-6">
            {/* PoS area bars */}
            {posAreas.length > 0 && (
              <div>
                <h3 className="font-semibold text-charcoal text-[0.88rem] mb-3">Program Areas</h3>
                <div className="space-y-2.5">
                  {posAreas.map((area, i) => (
                    <ProgressBar key={i} label={area.name as string} value={area.coverage as number ?? 0} />
                  ))}
                </div>
              </div>
            )}

            {/* Student coverage table */}
            {studentCoverage.length > 0 && (
              <div>
                <h3 className="font-semibold text-charcoal text-[0.88rem] mb-3">Student Coverage</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg">Student</th>
                        <th className="text-left px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg">Coverage</th>
                        <th className="text-left px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg">Areas Met</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentCoverage.map((s, i) => (
                        <tr key={i} className="hover:bg-[#FAFBFE]">
                          <td className="px-4 py-2.5 border-t border-border font-semibold text-charcoal text-[0.88rem]">{s.student_name as string}</td>
                          <td className="px-4 py-2.5 border-t border-border">
                            <div className="w-32"><ProgressBar label="" value={s.coverage as number ?? 0} /></div>
                          </td>
                          <td className="px-4 py-2.5 border-t border-border text-soft text-[0.85rem]">{s.areas_met as number ?? 0} / {s.total_areas as number ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Engagement */}
      <div className="bg-card border-[1.5px] border-border rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-charcoal">Engagement Rates</h2>
          {schoolAveragesEng && (
            <span className="text-[0.82rem] text-soft">
              School average: <strong className="text-charcoal">{schoolAveragesEng.overall_engagement as number ?? 0}%</strong>
            </span>
          )}
        </div>

        {engError ? (
          <EmptyState title="Failed to load engagement data" />
        ) : loadingEng ? (
          <Spinner className="py-8" />
        ) : (
          <div className="p-6">
            {schoolAveragesEng && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <MetricCard label="Login Frequency" value={`${schoolAveragesEng.login_frequency ?? 0}`} detail="avg per week" accent="teal" />
                <MetricCard label="Avg Session" value={`${schoolAveragesEng.avg_session_minutes ?? 0}m`} detail="minutes" accent="teal" />
                <MetricCard label="Completion Rate" value={`${schoolAveragesEng.completion_rate ?? 0}%`} detail="of assigned" accent="orange" />
              </div>
            )}

            {studentEngagement.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg">Student</th>
                      <th className="text-left px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg">Engagement</th>
                      <th className="text-left px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-[0.78rem] text-soft uppercase tracking-wider bg-bg">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentEngagement.map((s, i) => (
                      <tr key={i} className="hover:bg-[#FAFBFE]">
                        <td className="px-4 py-2.5 border-t border-border font-semibold text-charcoal text-[0.88rem]">{s.student_name as string}</td>
                        <td className="px-4 py-2.5 border-t border-border">
                          <div className="w-32"><ProgressBar label="" value={s.engagement as number ?? 0} /></div>
                        </td>
                        <td className="px-4 py-2.5 border-t border-border text-soft text-[0.85rem]">{s.last_active as string ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
