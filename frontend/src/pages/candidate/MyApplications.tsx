import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, X, FileText, Inbox } from 'lucide-react';
import { CandidateLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { applications as appApi } from '../../services/api';
import type { Application, EmploymentType } from '../../types';

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

const MyApplications: React.FC = () => {
  const [appList, setAppList] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await appApi.list();
        setAppList(data);
      } catch {
        setError('Failed to load your applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <CandidateLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">My Applications</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Track the status of all your job applications.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-5">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded" />
            ))}
          </div>
        ) : appList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={28} className="text-gray-300 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-600 dark:text-slate-300 mb-2">No applications yet</h3>
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-4">
              Browse jobs and submit your first application.
            </p>
            <Link
              to="/candidate/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Job Title
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Location
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Applied
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {appList.map((app) => (
                    <React.Fragment key={app.id}>
                      <tr
                        className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors ${
                          expandedId === app.id ? 'bg-blue-50/30 dark:bg-slate-700/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                            {app.job?.title ?? 'Unknown Position'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                          {app.job?.location ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            {app.job?.employment_type ? formatType(app.job.employment_type) : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                          {formatDate(app.applied_at)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleExpand(app.id)}
                            className="flex items-center gap-1 text-xs text-accent font-medium hover:underline"
                          >
                            {expandedId === app.id ? (
                              <>
                                <X size={13} />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye size={13} />
                                View
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expandedId === app.id && (
                        <tr className="bg-blue-50/20 dark:bg-slate-700/20 border-b border-gray-100 dark:border-slate-700">
                          <td colSpan={6} className="px-6 py-5">
                            <div className="grid md:grid-cols-2 gap-5">
                              {/* Resume */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText size={14} className="text-gray-400 dark:text-slate-500" />
                                  <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide">
                                    Resume
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3 max-h-48 overflow-y-auto">
                                  <pre className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-words font-mono leading-relaxed">
                                    {app.resume_text}
                                  </pre>
                                </div>
                              </div>

                              {/* Cover letter + status */}
                              <div className="space-y-4">
                                {app.cover_letter && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText size={14} className="text-gray-400 dark:text-slate-500" />
                                      <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide">
                                        Cover Letter
                                      </span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3 max-h-48 overflow-y-auto">
                                      <pre className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                                        {app.cover_letter}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {/* Status details */}
                                <div className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3">
                                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide mb-2">
                                    Application Status
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={app.status} size="md" />
                                    <span className="text-xs text-gray-400 dark:text-slate-500">
                                      Updated {formatDate(app.updated_at)}
                                    </span>
                                  </div>
                                </div>

                                <Link
                                  to={`/candidate/jobs/${app.job_id}`}
                                  className="block text-xs text-accent font-medium hover:underline"
                                >
                                  View job listing →
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </CandidateLayout>
  );
};

export default MyApplications;
