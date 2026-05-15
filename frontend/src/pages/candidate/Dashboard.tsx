import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Clock, Star, XCircle, Briefcase } from 'lucide-react';
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
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
    <div className="h-4 w-24 skeleton mb-4 rounded" />
    <div className="h-8 w-16 skeleton rounded" />
  </div>
);

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CandidateDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = await dashboard.candidate();
        setData(d);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpiCards = [
    {
      label: 'Total Applied',
      value: data?.total_applied ?? 0,
      icon: <Send size={20} className="text-blue-600" />,
      bg: 'bg-blue-50',
      color: 'text-blue-700',
    },
    {
      label: 'Pending',
      value: data?.pending ?? 0,
      icon: <Clock size={20} className="text-yellow-600" />,
      bg: 'bg-yellow-50',
      color: 'text-yellow-700',
    },
    {
      label: 'Shortlisted',
      value: data?.shortlisted ?? 0,
      icon: <Star size={20} className="text-green-600" />,
      bg: 'bg-green-50',
      color: 'text-green-700',
    },
    {
      label: 'Rejected',
      value: data?.rejected ?? 0,
      icon: <XCircle size={20} className="text-red-500" />,
      bg: 'bg-red-50',
      color: 'text-red-600',
    },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <CandidateLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {getGreeting()}, {user?.full_name?.split(' ')[0]}. Here's your job search progress.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpiCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                    {card.icon}
                  </div>
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
      </div>

      {/* Recent applications */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Recent Applications</h2>
          <Link
            to="/candidate/applications"
            className="text-xs text-accent font-medium hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded" />
            ))}
          </div>
        ) : data?.recent_applications && data.recent_applications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {data.recent_applications.slice(0, 5).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {app.job?.title ?? 'Unknown Position'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {app.job?.location} · Applied {formatDate(app.applied_at)}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm mb-3">No applications yet</p>
            <Link
              to="/candidate/jobs"
              className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline"
            >
              Browse open jobs →
            </Link>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-primary rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase size={24} className="text-white" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Ready for your next opportunity?</h3>
        <p className="text-blue-200 text-sm mb-5">
          Browse hundreds of open positions from top companies.
        </p>
        <Link
          to="/candidate/jobs"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors"
        >
          Browse Open Jobs →
        </Link>
      </div>
    </CandidateLayout>
  );
};

export default CandidateDashboard;
