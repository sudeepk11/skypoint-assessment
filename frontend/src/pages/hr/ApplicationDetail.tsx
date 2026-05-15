import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Briefcase,
} from 'lucide-react';
import { HRLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { applications as appApi } from '../../services/api';
import type { Application, ApplicationStatus } from '../../types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatType = (t: string) => {
  const map: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
  };
  return map[t] ?? t;
};

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

const HRApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchApp = async () => {
    if (!id) return;
    try {
      const data = await appApi.get(id);
      setApp(data);
    } catch {
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!id || !app) return;
    setStatusLoading(true);
    try {
      const updated = await appApi.updateStatus(id, status);
      setApp(updated);
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <HRLayout>
        <div className="space-y-4">
          <div className="h-8 w-32 skeleton rounded" />
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 skeleton rounded-xl" />
              <div className="h-32 skeleton rounded-xl" />
            </div>
            <div className="lg:col-span-3">
              <div className="h-64 skeleton rounded-xl" />
            </div>
          </div>
        </div>
      </HRLayout>
    );
  }

  if (error || !app) {
    return (
      <HRLayout>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error ?? 'Application not found.'}
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/hr/applications')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Detail</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {app.candidate?.full_name} · {app.job?.title}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={app.status} size="md" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Candidate info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Candidate</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center">
                {app.candidate?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {app.candidate?.full_name ?? 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">{app.candidate?.email ?? '—'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Applied on {formatDate(app.applied_at)}
            </p>
          </div>

          {/* Job info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Position</h3>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{app.job?.title}</p>
            <p className="text-xs text-gray-500 mb-1">{app.job?.location}</p>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {formatType(app.job?.employment_type ?? '')}
            </span>
            {app.job?.salary_range && (
              <p className="text-xs text-gray-500 mt-2">{app.job.salary_range}</p>
            )}
          </div>

          {/* Status changer */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={statusLoading || app.status === opt.value}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    app.status === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  } disabled:cursor-not-allowed`}
                >
                  {statusLoading && app.status === opt.value ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    opt.label
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Resume */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resume</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-80 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {app.resume_text}
              </pre>
            </div>
          </div>

          {/* Cover letter */}
          {app.cover_letter && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Cover Letter</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {app.cover_letter}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
};

export default HRApplicationDetail;
