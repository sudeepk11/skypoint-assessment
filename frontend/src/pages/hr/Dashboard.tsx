import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  Users,
  Sparkles,
  PlusCircle,
  Eye,
  ArrowRight,
  Circle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { HRLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { dashboard } from '../../services/api';
import type { ApplicationStatus } from '../../types';

interface RecentApp {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  status: string;
  applied_at: string;
}

interface JobPerf {
  id: string;
  title: string;
  status: string;
  applicant_count: number;
}

interface DashboardData {
  total_jobs: number;
  open_jobs: number;
  total_applications: number;
  shortlisted_this_week: number;
  applications_by_status: { pending: number; reviewing: number; shortlisted: number; rejected: number };
  recent_applications: RecentApp[];
  jobs_performance: JobPerf[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:     '#f59e0b',
  reviewing:   '#6366f1',
  shortlisted: '#16a34a',
  rejected:    '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending',
  reviewing:   'Reviewing',
  shortlisted: 'Shortlisted',
  rejected:    'Rejected',
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ── skeleton primitives ── */
const Sk = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded bg-gray-100 dark:bg-slate-700 ${className}`} />
);

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboard.hr()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  /* ── chart data ── */
  const chartData = data?.applications_by_status
    ? Object.entries(data.applications_by_status)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: STATUS_LABELS[key] ?? key,
          value,
          color: STATUS_COLORS[key] ?? '#94a3b8',
        }))
    : [];

  const totalApplications = chartData.reduce((s, d) => s + d.value, 0);

  /* ── kpi cards config ── */
  const kpis = [
    {
      label: 'Jobs Posted',
      value: data?.total_jobs ?? 0,
      sub: `${data?.open_jobs ?? 0} currently open`,
      icon: Briefcase,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueCls: 'text-blue-700',
    },
    {
      label: 'Total Applications',
      value: data?.total_applications ?? 0,
      sub: 'All time',
      icon: Users,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      valueCls: 'text-violet-700',
    },
    {
      label: 'Shortlisted',
      value: data?.shortlisted_this_week ?? 0,
      sub: 'This week',
      icon: Sparkles,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      valueCls: 'text-green-700',
    },
    {
      label: 'In Review',
      value: data?.applications_by_status?.reviewing ?? 0,
      sub: 'Needs attention',
      icon: TrendingUp,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueCls: 'text-amber-700',
    },
  ];

  return (
    <HRLayout>
      {/* ── page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
            Overview
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/hr/jobs/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={15} />
            Post Job
          </Link>
          <Link
            to="/hr/applications"
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye size={15} />
            Applications
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                <Sk className="h-3 w-20 mb-4" />
                <Sk className="h-8 w-12 mb-2" />
                <Sk className="h-3 w-28" />
              </div>
            ))
          : kpis.map((k) => (
              <div
                key={k.label}
                className="bg-white dark:bg-slate-700 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{k.label}</p>
                  <div className={`w-8 h-8 ${k.iconBg} rounded-lg flex items-center justify-center`}>
                    <k.icon size={15} className={k.iconColor} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${k.valueCls} mb-1`}>{k.value}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{k.sub}</p>
              </div>
            ))}
      </div>

      {/* ── middle row: chart + recent apps ── */}
      <div className="grid lg:grid-cols-5 gap-5 mb-5">

        {/* donut chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-700 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1">Application Pipeline</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Status breakdown</p>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Sk className="w-36 h-36 rounded-full" />
            </div>
          ) : chartData.length > 0 ? (
            <>
              <div className="relative flex-1">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v}`, '']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-800 dark:text-slate-100">{totalApplications}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">total</span>
                </div>
              </div>

              {/* legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <Circle size={8} fill={d.color} stroke="none" />
                    <span className="text-xs text-gray-500 dark:text-slate-400">{d.name}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-slate-500">No data yet</p>
            </div>
          )}
        </div>

        {/* recent applications */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-700 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Recent Applications</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Latest candidate activity</p>
            </div>
            <Link
              to="/hr/applications"
              className="flex items-center gap-1 text-xs text-accent font-medium hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Sk className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Sk className="h-3 w-32 mb-1.5" />
                    <Sk className="h-3 w-48" />
                  </div>
                  <Sk className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : data?.recent_applications?.length ? (
            <div className="flex-1 overflow-y-auto">
              {data.recent_applications.slice(0, 6).map((app) => {
                const initials = app.candidate_name
                  .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <Link
                    key={app.id}
                    to={`/hr/applications/${app.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                        {app.candidate_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                        {app.job_title} · {formatDate(app.applied_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status as ApplicationStatus} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <Users size={32} className="text-gray-200 dark:text-slate-600 mb-3" />
              <p className="text-sm text-gray-400 dark:text-slate-500">No applications yet</p>
              <Link to="/hr/jobs/new" className="mt-2 text-xs text-accent font-medium hover:underline">
                Post a job to get started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── jobs performance ── */}
      <div className="bg-white dark:bg-slate-700 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Jobs Performance</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Applicant count per posting</p>
          </div>
          <Link
            to="/hr/jobs"
            className="flex items-center gap-1 text-xs text-accent font-medium hover:underline"
          >
            Manage jobs <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-10" />)}
          </div>
        ) : data?.jobs_performance?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    Applicants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.jobs_performance.map((job, idx) => (
                  <tr
                    key={job.id}
                    className={`border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/20 dark:bg-slate-700/20'}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-slate-100">{job.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'open'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.status === 'open' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {job.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                          {job.applicant_count ?? 0}
                        </span>
                        <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                ((job.applicant_count ?? 0) /
                                  Math.max(1, ...data.jobs_performance.map((j) => j.applicant_count ?? 0))) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/hr/applications?job_id=${job.id}`}
                          className="text-xs text-accent font-medium hover:underline"
                        >
                          View apps
                        </Link>
                        <Link
                          to={`/hr/jobs/${job.id}/edit`}
                          className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Briefcase size={32} className="text-gray-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">No jobs posted yet</p>
            <Link
              to="/hr/jobs/new"
              className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline"
            >
              <PlusCircle size={14} />
              Post your first job
            </Link>
          </div>
        )}
      </div>

    </HRLayout>
  );
};

export default HRDashboard;
