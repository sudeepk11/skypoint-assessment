import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  LogIn,
  Send,
  AlertCircle,
} from 'lucide-react';
import { jobs as jobsApi } from '../services/api';
import type { Job, EmploymentType } from '../types';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';

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

const PublicJobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'requirements'>('description');

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const data = await jobsApi.get(id);
        setJob(data);
      } catch {
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error ?? 'Job not found.'}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderCTA = () => {
    if (job.status === 'closed') {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">This position is no longer accepting applications.</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <LogIn size={15} />
          Login to Apply
        </button>
      );
    }

    if (user?.role === 'hr') {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500 italic">HR accounts cannot apply for jobs.</p>
        </div>
      );
    }

    // Authenticated candidate
    return (
      <button
        onClick={() => navigate(`/candidate/jobs/${job.id}`)}
        className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Send size={15} />
        Apply Now
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </button>

        {/* Job header */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>

              {job.company_name && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                  <Building2 size={15} />
                  {job.company_name}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={14} />
                  {job.location}
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {formatType(job.employment_type)}
                </span>
                {job.salary_range && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <DollarSign size={14} />
                    {job.salary_range}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  Posted {formatDate(job.created_at)}
                </div>
              </div>
            </div>
            <StatusBadge status={job.status} size="md" />
          </div>

          {/* CTA */}
          {renderCTA()}
        </div>

        {/* Required Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Required Skills</h3>
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
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['description', 'requirements'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {activeTab === 'description' ? job.description : job.requirements}
              </pre>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicJobDetail;
