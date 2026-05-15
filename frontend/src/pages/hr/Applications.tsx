import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Eye, Inbox, AlertCircle } from 'lucide-react';
import { HRLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import BulkEmailModal from '../../components/BulkEmailModal';
import { applications as appApi, jobs as jobsApi } from '../../services/api';
import type { Application, ApplicationStatus, Job } from '../../types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusTabs: { label: string; value: ApplicationStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Rejected', value: 'rejected' },
];

const HRApplications: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultJobId = searchParams.get('job_id') ?? '';

  const [appList, setAppList] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [jobFilter, setJobFilter] = useState(defaultJobId);
  const [bulkOpen, setBulkOpen] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (jobFilter) params.job_id = jobFilter;
      const data = await appApi.list(params);
      setAppList(data);
      setSelectedIds(new Set());
    } catch {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobsApi.hrList();
        setJobs(data);
      } catch {
        // ignore
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApps();
  }, [statusFilter, jobFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === appList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(appList.map((a) => a.id)));
    }
  };

  const allSelected = appList.length > 0 && selectedIds.size === appList.length;

  return (
    <HRLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {appList.length} application{appList.length !== 1 ? 's' : ''}
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </p>
        </div>
        <button
          onClick={() => setBulkOpen(true)}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Mail size={16} />
          Send Bulk Email
          {selectedIds.size > 0 && (
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
              {selectedIds.size}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-5">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Job filter */}
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white min-w-[180px]"
          >
            <option value="">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>

          {/* Status tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded" />
            ))}
          </div>
        ) : appList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={28} className="text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-600 mb-2">No applications found</h3>
            <p className="text-gray-400 text-sm">
              Try changing the filters or wait for candidates to apply.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Candidate
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Job Title
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Applied
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appList.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      selectedIds.has(app.id) ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 text-accent font-semibold flex items-center justify-center text-xs">
                          {app.candidate?.full_name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {app.candidate?.full_name ?? 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {app.candidate?.email ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {app.job?.title ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(app.applied_at)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/hr/applications/${app.id}`)}
                        className="flex items-center gap-1 text-xs text-accent font-medium hover:underline"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkEmailModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        applicationIds={Array.from(selectedIds)}
      />
    </HRLayout>
  );
};

export default HRApplications;
