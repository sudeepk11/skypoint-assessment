import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Clock,
  Star,
  XCircle,
  Briefcase,
  ArrowRight,
  Search,
} from 'lucide-react';
import { CandidateLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { dashboard } from '../../services/api';
import type { Application } from '../../types';

interface CandidateDashboardData {
  total_applied: number;
  pending: number;
  shortlisted: number;
  rejected: number;
  recent_applications: Application[];
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── skeleton ── */
const Sk = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded bg-gray-100 dark:bg-slate-700 ${className}`} />
);

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CandidateDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboard.candidate()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      label: 'Applied',
      value: data?.total_applied ?? 0,
      icon: Send,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueCls: 'text-blue-700',
    },
    {
      label: 'Pending',
      value: data?.pending ?? 0,
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueCls: 'text-amber-700',
    },
    {
      label: 'Shortlisted',
      value: data?.shortlisted ?? 0,
      icon: Star,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      valueCls: 'text-green-700',
    },
    {
      label: 'Rejected',
      value: data?.rejected ?? 0,
      icon: XCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      valueCls: 'text-red-600',
    },
  ];

  /* success rate */
  const total = data?.total_applied ?? 0;
  const shortlisted = data?.shortlisted ?? 0;
  const successRate = total > 0 ? Math.round((shortlisted / total) * 100) : 0;

  return (
    <CandidateLayout>
      <div className="space-y-6">

        {/* ── welcome header ── */}
        <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute top-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />

          <p className="text-blue-200 text-sm font-medium mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold mb-1">
            {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-blue-200 text-sm mb-5">
            {total === 0
              ? "Start your job search today — your next opportunity is waiting."
              : `You've applied to ${total} job${total !== 1 ? 's' : ''}. Keep going!`}
          </p>
          <Link
            to="/candidate/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            <Search size={15} />
            Browse Open Jobs
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
                  <Sk className="h-3 w-16 mb-4" />
                  <Sk className="h-8 w-10 mb-1" />
                  <Sk className="h-2 w-12" />
                </div>
              ))
            : kpis.map((k) => (
                <div
                  key={k.label}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{k.label}</p>
                    <div className={`w-7 h-7 ${k.iconBg} rounded-lg flex items-center justify-center`}>
                      <k.icon size={13} className={k.iconColor} />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${k.valueCls}`}>{k.value}</p>
                </div>
              ))}
        </div>

        {/* ── main content row ── */}
        <div className="grid sm:grid-cols-5 gap-5">

          {/* recent applications — wider */}
          <div className="sm:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Recent Applications</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Your latest submissions</p>
              </div>
              <Link
                to="/candidate/applications"
                className="flex items-center gap-1 text-xs text-accent font-medium hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Sk className="w-9 h-9 rounded-xl flex-shrink-0" />
                    <div className="flex-1">
                      <Sk className="h-3 w-36 mb-1.5" />
                      <Sk className="h-3 w-24" />
                    </div>
                    <Sk className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : data?.recent_applications?.length ? (
              <div>
                {data.recent_applications.slice(0, 5).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-accent/8 border border-accent/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={15} className="text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                        {app.job?.title ?? 'Unknown Position'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                        {app.job?.location ?? ''} · {formatDate(app.applied_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase size={32} className="text-gray-200 dark:text-slate-600 mb-3" />
                <p className="text-sm text-gray-400 dark:text-slate-500 mb-2">No applications yet</p>
                <Link
                  to="/candidate/jobs"
                  className="text-xs text-accent font-medium hover:underline"
                >
                  Browse open jobs →
                </Link>
              </div>
            )}
          </div>

          {/* right column */}
          <div className="sm:col-span-2 space-y-4">

            {/* success rate card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1">Shortlist Rate</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Based on your applications</p>

              {loading ? (
                <Sk className="h-20" />
              ) : (
                <>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-bold text-gray-800 dark:text-slate-100">{successRate}%</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 pb-1">shortlisted</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                    {shortlisted} of {total} application{total !== 1 ? 's' : ''} shortlisted
                  </p>
                </>
              )}
            </div>

            {/* status breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-4">Status Breakdown</h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-6" />)}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { label: 'Pending',     value: data?.pending ?? 0,    color: 'bg-amber-400' },
                    { label: 'Shortlisted', value: data?.shortlisted ?? 0, color: 'bg-green-500' },
                    { label: 'Rejected',    value: data?.rejected ?? 0,    color: 'bg-red-400' },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-slate-400">{row.label}</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{row.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${row.color} rounded-full transition-all duration-700`}
                          style={{ width: total > 0 ? `${Math.round((row.value / total) * 100)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </CandidateLayout>
  );
};

export default CandidateDashboard;
