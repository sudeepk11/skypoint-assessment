import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { HRLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { jobs as jobsApi } from '../../services/api';
import type { Job, EmploymentType } from '../../types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatType = (t: EmploymentType) => {
  const map: Record<EmploymentType, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
  };
  return map[t] ?? t;
};

const HRJobList: React.FC = () => {
  const [jobList, setJobList] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsApi.hrList();
      setJobList(data);
    } catch {
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggle = async (job: Job) => {
    setActionLoading(job.id);
    try {
      const newStatus = job.status === 'open' ? 'closed' : 'open';
      const updated = await jobsApi.toggleStatus(job.id, newStatus);
      setJobList((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } catch {
      setError('Failed to update job status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await jobsApi.delete(id);
      setJobList((prev) => prev.filter((j) => j.id !== id));
    } catch {
      setError('Failed to delete job.');
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  return (
    <HRLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Manage Jobs</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {jobList.length} job{jobList.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          to="/hr/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle size={16} />
          Post New Job
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-5">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded" />
            ))}
          </div>
        ) : jobList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-accent" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-2">No jobs posted yet</h3>
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-4">
              Create your first job listing to start receiving applications.
            </p>
            <Link
              to="/hr/jobs/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={14} />
              Post New Job
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Location
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Applicants
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {jobList.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{job.title}</p>
                        {job.salary_range && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{job.salary_range}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{job.location}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {formatType(job.employment_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                      {job.applicant_count ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/hr/jobs/${job.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-accent transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </Link>
                        <button
                          onClick={() => handleToggle(job)}
                          disabled={actionLoading === job.id}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
                          title={job.status === 'open' ? 'Close job' : 'Open job'}
                        >
                          {actionLoading === job.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : job.status === 'open' ? (
                            <Lock size={15} />
                          ) : (
                            <Unlock size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(job.id)}
                          disabled={actionLoading === job.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 text-center mb-2">Delete Job</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm text-center mb-6">
              Are you sure you want to delete this job listing? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
};

export default HRJobList;
