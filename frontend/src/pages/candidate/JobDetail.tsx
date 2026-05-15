import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, DollarSign, CheckCircle, AlertCircle, Send, Building2 } from 'lucide-react';
import { CandidateLayout } from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { jobs as jobsApi, applications as appApi } from '../../services/api';
import type { Job, Application, EmploymentType } from '../../types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  if (diff < 30) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [existingApp, setExistingApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'requirements'>('description');

  // Apply form
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [jobData, apps] = await Promise.all([
          jobsApi.get(id),
          appApi.list(),
        ]);
        setJob(jobData);
        const existing = apps.find((a) => a.job_id === id);
        if (existing) setExistingApp(existing);
      } catch {
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setResumeError('Resume text is required.');
      return;
    }
    if (!id) return;

    setApplyLoading(true);
    setApplyError(null);
    setResumeError(null);

    try {
      const app = await appApi.apply(id, {
        resume_text: resumeText,
        cover_letter: coverLetter.trim() || undefined,
      });
      setExistingApp(app);
      setApplySuccess(true);
      setShowApplyForm(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      if (axiosErr?.response?.status === 400) {
        setApplyError(
          axiosErr?.response?.data?.detail ?? 'You have already applied to this position.'
        );
      } else {
        setApplyError('Failed to submit application. Please try again.');
      }
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <CandidateLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-32 skeleton rounded" />
          <div className="h-48 skeleton rounded-xl" />
          <div className="h-32 skeleton rounded-xl" />
        </div>
      </CandidateLayout>
    );
  }

  if (error || !job) {
    return (
      <CandidateLayout>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error ?? 'Job not found.'}
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/candidate/jobs')}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-5 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </button>

        {/* Job header */}
        <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-700 p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">{job.title}</h1>
              {job.company_name && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                  <Building2 size={15} />
                  {job.company_name}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                  <MapPin size={14} />
                  {job.location}
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {formatType(job.employment_type)}
                </span>
                {job.salary_range && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                    <DollarSign size={14} />
                    {job.salary_range}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                  <Clock size={12} />
                  Posted {formatDate(job.created_at)}
                </div>
              </div>
            </div>
            <StatusBadge status={job.status} size="md" />
          </div>

          {/* Apply button or status */}
          {existingApp ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  You've already applied to this position
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Current status: <StatusBadge status={existingApp.status} />
                </p>
              </div>
            </div>
          ) : applySuccess ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-800">
                Application submitted successfully!
              </p>
            </div>
          ) : job.status === 'closed' ? (
            <div className="p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-slate-400">This position is no longer accepting applications.</p>
            </div>
          ) : (
            <>
              {!showApplyForm && (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Send size={15} />
                  Apply Now
                </button>
              )}
            </>
          )}
        </div>

        {/* Apply form (inline) */}
        {showApplyForm && !existingApp && !applySuccess && (
          <div className="bg-white dark:bg-slate-700 rounded-xl border border-accent/30 p-6 mb-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 mb-4">Submit Your Application</h2>

            {applyError && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {applyError}
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Resume <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    if (e.target.value) setResumeError(null);
                  }}
                  rows={8}
                  placeholder="Paste your resume text here..."
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 ${
                    resumeError ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {resumeError && <p className="mt-1 text-xs text-red-600">{resumeError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Cover Letter{' '}
                  <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={5}
                  placeholder="Tell us why you're interested in this role..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {applyLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Required Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-700 p-6 mb-5">
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100 mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job details tabs */}
        <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-slate-700">
            {(['description', 'requirements'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300 font-sans leading-relaxed">
                {activeTab === 'description' ? job.description : job.requirements}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default JobDetail;
