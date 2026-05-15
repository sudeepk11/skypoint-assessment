import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle,
  Inbox,
  Star,
  PlusCircle,
  Eye,
  Edit3,
  Mail,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { HRLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import BulkEmailModal from '../../components/BulkEmailModal';
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

const COLORS = ['#ca8a04', '#2563eb', '#16a34a', '#dc2626'];

const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
    <div className="h-4 w-24 skeleton mb-4 rounded" />
    <div className="h-8 w-16 skeleton rounded" />
  </div>
);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = await dashboard.hr();
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
      label: 'Total Jobs Posted',
      value: data?.total_jobs ?? 0,
      icon: <Briefcase size={20} className="text-blue-600" />,
      bg: 'bg-blue-50',
      color: 'text-blue-700',
    },
    {
      label: 'Open Jobs',
      value: data?.open_jobs ?? 0,
      icon: <CheckCircle size={20} className="text-green-600" />,
      bg: 'bg-green-50',
      color: 'text-green-700',
    },
    {
      label: 'Total Applications',
      value: data?.total_applications ?? 0,
      icon: <Inbox size={20} className="text-purple-600" />,
      bg: 'bg-purple-50',
      color: 'text-purple-700',
    },
    {
      label: 'Shortlisted',
      value: data?.shortlisted_this_week ?? 0,
      icon: <Star size={20} className="text-yellow-600" />,
      bg: 'bg-yellow-50',
      color: 'text-yellow-700',
    },
  ];

  const chartData = data?.applications_by_status
    ? [
        { name: 'Pending', value: data.applications_by_status.pending, color: COLORS[0] },
        { name: 'Reviewing', value: data.applications_by_status.reviewing, color: COLORS[1] },
        { name: 'Shortlisted', value: data.applications_by_status.shortlisted, color: COLORS[2] },
        { name: 'Rejected', value: data.applications_by_status.rejected, color: COLORS[3] },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <HRLayout>
      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          to="/hr/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle size={16} />
          Post New Job
        </Link>
        <Link
          to="/hr/applications"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye size={16} />
          View All Applications
        </Link>
        <button
          onClick={() => setBulkOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Mail size={16} />
          Send Bulk Email
        </button>
      </div>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {getGreeting()}, {user?.full_name?.split(' ')[0]}. Here's what's happening today.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        {/* Pie chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Applications by Status</h2>
          {loading ? (
            <div className="h-48 skeleton rounded" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} applications`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No application data yet
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Applications</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 skeleton rounded" />
              ))}
            </div>
          ) : data?.recent_applications && data.recent_applications.length > 0 ? (
            <div className="space-y-3">
              {data.recent_applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {app.candidate_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{app.job_title}</p>
                  </div>
                  <StatusBadge status={app.status as ApplicationStatus} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No applications yet</p>
          )}
          {data && data.recent_applications?.length > 0 && (
            <Link
              to="/hr/applications"
              className="mt-4 block text-xs text-accent font-medium hover:underline text-center"
            >
              View all →
            </Link>
          )}
        </div>
      </div>

      {/* Jobs performance table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Jobs Performance</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 skeleton rounded" />
            ))}
          </div>
        ) : data?.jobs_performance && data.jobs_performance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Applicants</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.jobs_performance.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{job.title}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status as 'open' | 'closed'} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {job.applicant_count ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/hr/applications?job_id=${job.id}`}
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View
                        </Link>
                        <Link
                          to={`/hr/jobs/${job.id}/edit`}
                          className="text-xs text-gray-500 hover:underline flex items-center gap-1"
                        >
                          <Edit3 size={12} />
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
            <p className="text-gray-400 text-sm mb-3">No jobs posted yet</p>
            <Link
              to="/hr/jobs/new"
              className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline"
            >
              <PlusCircle size={14} />
              Post your first job
            </Link>
          </div>
        )}
      </div>

      {/* Bulk email modal (no pre-selected IDs from dashboard) */}
      <BulkEmailModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        applicationIds={[]}
      />
    </HRLayout>
  );
};

export default HRDashboard;
