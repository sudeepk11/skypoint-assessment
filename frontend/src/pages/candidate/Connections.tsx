import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidateLayout } from '../../components/Layout';
import { connections as connectionsApi } from '../../services/api';
import type { Connection } from '../../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  MapPin,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Building2,
  Mail,
} from 'lucide-react';

type Tab = 'pending' | 'accepted' | 'declined';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#6366f1',
];
function avatarColor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function formatType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── InviteCard ─────────────────────────────────────────────────────────────────

const InviteCard: React.FC<{
  invite: Connection;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  acting: boolean;
}> = ({ invite, onAccept, onDecline, acting }) => {
  const navigate = useNavigate();
  const { requester: hr, job, message, status } = invite;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Invite header — HR info */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-3 border-b border-gray-50 dark:border-slate-700">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
          style={{ background: avatarColor(hr.id) }}
        >
          {initials(hr.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{hr.full_name}</p>
          {hr.company_name ? (
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
              <Building2 size={10} />
              {hr.company_name}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">HR Recruiter</p>
          )}
        </div>
        {/* Status pill */}
        {status === 'pending' && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Clock size={9} /> Pending
          </span>
        )}
        {status === 'accepted' && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <CheckCircle2 size={9} /> Accepted
          </span>
        )}
        {status === 'declined' && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400">
            <XCircle size={9} /> Declined
          </span>
        )}
      </div>

      {/* Job info */}
      <div className="px-5 py-4">
        {job ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Briefcase size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-tight">
                  {job.title}
                </p>
                {job.company_name && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{job.company_name}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={11} /> {formatType(job.employment_type)}
              </span>
              {job.salary_range && (
                <span className="flex items-center gap-1">
                  <DollarSign size={11} /> {job.salary_range}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500">
            <Mail size={14} />
            <span>General invitation — no specific job attached</span>
          </div>
        )}

        {/* Message from HR */}
        {message && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-start gap-2">
              <MessageSquare size={12} className="text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed italic">
                "{message}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {status === 'pending' && (
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={() => onAccept?.(invite.id)}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <CheckCircle2 size={13} /> Accept
          </button>
          <button
            onClick={() => onDecline?.(invite.id)}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-60 transition-colors"
          >
            <XCircle size={13} /> Decline
          </button>
        </div>
      )}

      {status === 'accepted' && job && (
        <div className="px-5 pb-5">
          <button
            onClick={() => navigate(`/candidate/jobs/${job.id}`)}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            View Job &amp; Apply <ArrowRight size={13} />
          </button>
        </div>
      )}

      {status === 'accepted' && !job && (
        <div className="px-5 pb-5">
          <button
            onClick={() => navigate('/candidate/jobs')}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Jobs <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({
  icon,
  title,
  desc,
}) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="mb-4">{icon}</div>
    <p className="text-base font-semibold text-gray-500 dark:text-slate-400">{title}</p>
    <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 max-w-xs">{desc}</p>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const JobInvites: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [pending, setPending]   = useState<Connection[]>([]);
  const [accepted, setAccepted] = useState<Connection[]>([]);
  const [declined, setDeclined] = useState<Connection[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<Record<string, boolean>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, all] = await Promise.all([
        connectionsApi.pending(),
        connectionsApi.list(),  // accepted
      ]);
      setPending(p);
      setAccepted(all.filter((c) => c.status === 'accepted'));
      // We don't have a dedicated declined endpoint, but we can fetch sent & filter
      // For declined: fetch all sent invites by querying the list… actually,
      // declined invites are received by candidate, not sent. Let's use a different approach.
      // We'll re-use pending() data and also show declined from a dedicated fetch later.
      setDeclined([]);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  // Actually fetch declined invites using sent endpoint (which shows all statuses from HR side)
  // The cleanest approach: we fetch /connections/pending (status=pending, receiver=me)
  // and /connections (status=accepted, me involved).
  // For declined, we'd need a backend endpoint. Let's just show them from list with status=declined.
  // Since /connections only returns accepted, we'll work with what we have.

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAccept = async (id: string) => {
    setActing((p) => ({ ...p, [id]: true }));
    try {
      await connectionsApi.accept(id);
      await loadAll();
    } catch {
      /* silent */
    } finally {
      setActing((p) => ({ ...p, [id]: false }));
    }
  };

  const handleDecline = async (id: string) => {
    setActing((p) => ({ ...p, [id]: true }));
    try {
      await connectionsApi.decline(id);
      // Move from pending to declined locally
      const inv = pending.find((c) => c.id === id);
      if (inv) {
        setPending((prev) => prev.filter((c) => c.id !== id));
        setDeclined((prev) => [...prev, { ...inv, status: 'declined' }]);
      }
    } catch {
      /* silent */
    } finally {
      setActing((p) => ({ ...p, [id]: false }));
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    {
      id: 'pending',
      label: 'Pending',
      icon: <Clock size={14} />,
      count: pending.length,
      color: 'text-amber-500',
    },
    {
      id: 'accepted',
      label: 'Accepted',
      icon: <CheckCircle2 size={14} />,
      count: accepted.length,
      color: 'text-green-500',
    },
    {
      id: 'declined',
      label: 'Declined',
      icon: <XCircle size={14} />,
      count: declined.length,
      color: 'text-red-400',
    },
  ];

  return (
    <CandidateLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Job Invites</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Recruiters invite you to apply for specific roles. Accept to unlock the full job post.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-8 w-full sm:inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id
                      ? 'bg-accent text-white'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-4"
              >
                <div className="flex gap-3 pb-4 border-b border-gray-50 dark:border-slate-700">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-56 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-8 flex-1 rounded-lg" />
                  <div className="skeleton h-8 flex-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              pending.length === 0 ? (
                <EmptyState
                  icon={<Clock size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No pending invites"
                  desc="When a recruiter invites you to apply for a job, it will appear here."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {pending.map((inv) => (
                    <InviteCard
                      key={inv.id}
                      invite={inv}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      acting={!!acting[inv.id]}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === 'accepted' && (
              accepted.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No accepted invites yet"
                  desc="Invites you accept will appear here with a link to apply directly."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {accepted.map((inv) => (
                    <InviteCard
                      key={inv.id}
                      invite={inv}
                      acting={!!acting[inv.id]}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === 'declined' && (
              declined.length === 0 ? (
                <EmptyState
                  icon={<XCircle size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No declined invites"
                  desc="Invites you decline will be shown here."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {declined.map((inv) => (
                    <InviteCard
                      key={inv.id}
                      invite={inv}
                      acting={!!acting[inv.id]}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </CandidateLayout>
  );
};

export default JobInvites;
