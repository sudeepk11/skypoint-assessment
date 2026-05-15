import React, { useEffect, useState, useCallback } from 'react';
import { HRLayout } from '../../components/Layout';
import { connections as connectionsApi, jobs as jobsApi } from '../../services/api';
import type { Connection, UserPublic, Job } from '../../types';
import {
  Users, UserPlus, Clock, CheckCircle2, XCircle,
  Linkedin, Github, Globe, Twitter, ExternalLink,
  Search, Briefcase, Send, ChevronDown, X,
} from 'lucide-react';

type Tab = 'pool' | 'sent' | 'accepted';

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1'];
const avatarColor = (id: string) => { let n=0; for(const c of id) n+=c.charCodeAt(0); return COLORS[n%COLORS.length]; };

const SocialLink: React.FC<{href?: string; icon: React.ReactNode; label: string}> = ({href,icon,label}) => {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors">
      {icon}
    </a>
  );
};

// ── Invite Modal ──────────────────────────────────────────────────────────────

const InviteModal: React.FC<{
  candidate: UserPublic;
  jobs: Job[];
  onSend: (jobId: string | undefined, message: string) => Promise<void>;
  onClose: () => void;
  sending: boolean;
}> = ({ candidate, jobs, onSend, onClose, sending }) => {
  const [selectedJob, setSelectedJob] = useState('');
  const [message, setMessage] = useState('');

  const openJobs = jobs.filter((j) => j.status === 'open');
  const chosenJob = openJobs.find((j) => j.id === selectedJob);

  const handleSend = async () => {
    await onSend(selectedJob || undefined, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Invite to Apply</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Sending to <span className="font-semibold text-gray-700 dark:text-slate-200">{candidate.full_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Job picker */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            Job Position <span className="text-red-400">*</span>
          </label>
          {openJobs.length === 0 ? (
            <p className="text-sm text-red-500">No open jobs. Please post a job first.</p>
          ) : (
            <div className="relative">
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              >
                <option value="">— Select a job —</option>
                {openJobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} · {j.location}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          {/* Job preview chip */}
          {chosenJob && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Briefcase size={13} className="text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">{chosenJob.title}</p>
                <p className="text-[10px] text-blue-500 dark:text-blue-400">{chosenJob.location} · {chosenJob.employment_type.replace('_', ' ')}{chosenJob.salary_range ? ` · ${chosenJob.salary_range}` : ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            Personal Message <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={`Hi ${candidate.full_name.split(' ')[0]}, we'd love for you to apply for this role…`}
            maxLength={500}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{message.length}/500</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !selectedJob || openJobs.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
            ) : (
              <><Send size={14} />Send Invite</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Candidate Card ────────────────────────────────────────────────────────────

const CandidateCard: React.FC<{
  candidate: UserPublic;
  inviteStatus: 'none' | 'sent' | 'accepted';
  onInvite: (c: UserPublic) => void;
}> = ({ candidate, inviteStatus, onInvite }) => {
  const skills = candidate.skills ?? [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
             style={{ background: avatarColor(candidate.id) }}>
          {initials(candidate.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{candidate.full_name}</p>
          {candidate.headline
            ? <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{candidate.headline}</p>
            : <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 italic">No headline yet</p>
          }
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 6).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium">
              {s}
            </span>
          ))}
          {skills.length > 6 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400">+{skills.length - 6}</span>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 dark:text-slate-500 italic">No skills added yet</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-slate-700 mt-auto">
        <div className="flex gap-1">
          <SocialLink href={candidate.linkedin_url} icon={<Linkedin size={13}/>} label="LinkedIn"/>
          <SocialLink href={candidate.github_url}   icon={<Github size={13}/>}   label="GitHub"/>
          <SocialLink href={candidate.twitter_url}  icon={<Twitter size={13}/>}  label="Twitter"/>
          <SocialLink href={candidate.portfolio_url} icon={<Globe size={13}/>}   label="Portfolio"/>
          <SocialLink href={candidate.glassdoor_url} icon={<ExternalLink size={13}/>} label="Glassdoor"/>
        </div>

        {inviteStatus === 'accepted' ? (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <CheckCircle2 size={12}/> Accepted
          </span>
        ) : inviteStatus === 'sent' ? (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Clock size={12}/> Invite Sent
          </span>
        ) : (
          <button onClick={() => onInvite(candidate)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-blue-700 transition-colors">
            <UserPlus size={12}/> Invite to Apply
          </button>
        )}
      </div>
    </div>
  );
};

// ── Invite List Card ──────────────────────────────────────────────────────────

const InviteCard: React.FC<{
  conn: Connection;
  currentUserId: string;
  onRemove: (id: string) => void;
  acting: boolean;
}> = ({ conn, currentUserId, onRemove, acting }) => {
  const other = conn.requester.id === currentUserId ? conn.receiver : conn.requester;
  const skills = other.skills ?? [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
           style={{ background: avatarColor(other.id) }}>
        {initials(other.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-slate-100">{other.full_name}</p>
        {other.headline && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{other.headline}</p>}

        {/* Job the invite is for */}
        {conn.job && (
          <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 w-fit">
            <Briefcase size={11} className="text-blue-500 flex-shrink-0"/>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium truncate">
              {conn.job.title} · {conn.job.location}
            </p>
          </div>
        )}

        {/* Message preview */}
        {conn.message && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 italic line-clamp-2">"{conn.message}"</p>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {skills.slice(0, 4).map((s) => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">{s}</span>
            ))}
          </div>
        )}
        <div className="flex gap-1 mt-2">
          <SocialLink href={other.linkedin_url} icon={<Linkedin size={12}/>} label="LinkedIn"/>
          <SocialLink href={other.github_url}   icon={<Github size={12}/>}   label="GitHub"/>
          <SocialLink href={other.portfolio_url} icon={<Globe size={12}/>}   label="Portfolio"/>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          conn.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
          conn.status === 'declined' ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400' :
          'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
        }`}>
          {conn.status.charAt(0).toUpperCase() + conn.status.slice(1)}
        </span>
        <button onClick={() => onRemove(conn.id)} disabled={acting}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
          <XCircle size={11}/> Withdraw
        </button>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{icon: React.ReactNode; title: string; desc: string}> = ({icon, title, desc}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="mb-4">{icon}</div>
    <p className="font-semibold text-gray-500 dark:text-slate-400">{title}</p>
    <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 max-w-xs">{desc}</p>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const TalentNetwork: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pool');
  const [candidates, setCandidates] = useState<UserPublic[]>([]);
  const [filtered, setFiltered] = useState<UserPublic[]>([]);
  const [sentInvites, setSentInvites] = useState<Connection[]>([]);
  const [accepted, setAccepted] = useState<Connection[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalCandidate, setModalCandidate] = useState<UserPublic | null>(null);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  // Map candidateId → invite status from sent invites
  const inviteStatusMap = React.useMemo(() => {
    const m: Record<string, 'sent' | 'accepted'> = {};
    for (const c of accepted)  m[c.receiver.id] = 'accepted';
    for (const c of sentInvites) if (!m[c.receiver.id]) m[c.receiver.id] = 'sent';
    return m;
  }, [sentInvites, accepted]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cands, sent, acc, jobs] = await Promise.all([
        connectionsApi.candidates(),
        connectionsApi.sent(),
        connectionsApi.list(),
        jobsApi.hrList(),
      ]);
      setCandidates(cands);
      setFiltered(cands);
      setSentInvites(sent);
      setAccepted(acc);
      setMyJobs(jobs);
    } catch {/* silent */} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(candidates); return; }
    const q = search.toLowerCase();
    setFiltered(candidates.filter((c) =>
      c.full_name.toLowerCase().includes(q) ||
      c.headline?.toLowerCase().includes(q) ||
      (c.skills ?? []).some((s) => s.toLowerCase().includes(q))
    ));
  }, [search, candidates]);

  const handleSend = async (jobId: string | undefined, message: string) => {
    if (!modalCandidate) return;
    setSending(true);
    try {
      await connectionsApi.invite(modalCandidate.id, jobId, message || undefined);
      setModalCandidate(null);
      setToast(`Invite sent to ${modalCandidate.full_name}!`);
      setTimeout(() => setToast(null), 3000);
      await loadAll();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setToast(err?.response?.data?.detail ?? 'Failed to send invite.');
      setTimeout(() => setToast(null), 3000);
    } finally { setSending(false); }
  };

  const handleRemove = async (id: string) => {
    setActing((p) => ({ ...p, [id]: true }));
    try { await connectionsApi.remove(id); await loadAll(); }
    catch {/* silent */} finally { setActing((p) => ({ ...p, [id]: false })); }
  };

  const allSent = sentInvites; // sent() already includes accepted/declined — no need to merge

  const tabs = [
    { id: 'pool' as Tab,     label: 'Talent Pool',  icon: <Users size={14}/>,       count: candidates.length },
    { id: 'sent' as Tab,     label: 'Sent Invites', icon: <Send size={14}/>,         count: allSent.length },
    { id: 'accepted' as Tab, label: 'Accepted',     icon: <CheckCircle2 size={14}/>, count: accepted.length },
  ];

  // Need current user id for InviteCard — get from accepted list
  const currentUserId = accepted[0]?.requester?.id ?? sentInvites[0]?.requester?.id ?? '';

  return (
    <HRLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Talent Network</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Browse candidates and invite them to apply for your open positions.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-6 w-full sm:w-auto sm:inline-flex">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}>
              {tab.icon}{tab.label}
              {tab.count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search — pool tab only */}
        {activeTab === 'pool' && (
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, headline or skill…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"/>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_,i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-3">
                <div className="flex gap-3"><div className="skeleton w-12 h-12 rounded-full"/><div className="flex-1 space-y-2"><div className="skeleton h-4 w-32 rounded"/><div className="skeleton h-3 w-48 rounded"/></div></div>
                <div className="flex gap-1">{[...Array(4)].map((_,j)=><div key={j} className="skeleton h-5 w-16 rounded-full"/>)}</div>
                <div className="skeleton h-8 w-28 rounded-lg ml-auto"/>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'pool' && (
              filtered.length === 0
                ? <EmptyState icon={<Users size={40} className="text-gray-300 dark:text-slate-600"/>} title={search ? 'No matches' : 'No candidates yet'} desc={search ? 'Try a different name or skill.' : 'Candidates will appear here once they register.'}/>
                : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((c) => (
                      <CandidateCard key={c.id} candidate={c} inviteStatus={inviteStatusMap[c.id] ?? 'none'} onInvite={setModalCandidate}/>
                    ))}
                  </div>
            )}

            {activeTab === 'sent' && (
              allSent.length === 0
                ? <EmptyState icon={<Send size={40} className="text-gray-300 dark:text-slate-600"/>} title="No invites sent yet" desc="Go to Talent Pool and invite candidates to apply."/>
                : <div className="grid sm:grid-cols-2 gap-4">
                    {allSent.map((c) => <InviteCard key={c.id} conn={c} currentUserId={currentUserId} onRemove={handleRemove} acting={!!acting[c.id]}/>)}
                  </div>
            )}

            {activeTab === 'accepted' && (
              accepted.length === 0
                ? <EmptyState icon={<CheckCircle2 size={40} className="text-gray-300 dark:text-slate-600"/>} title="No accepted invites yet" desc="Candidates who accept your invite will appear here."/>
                : <div className="grid sm:grid-cols-2 gap-4">
                    {accepted.map((c) => <InviteCard key={c.id} conn={c} currentUserId={currentUserId} onRemove={handleRemove} acting={!!acting[c.id]}/>)}
                  </div>
            )}
          </>
        )}
      </div>

      {/* Invite modal */}
      {modalCandidate && (
        <InviteModal
          candidate={modalCandidate}
          jobs={myJobs}
          onSend={handleSend}
          onClose={() => setModalCandidate(null)}
          sending={sending}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl toast-enter">
          {toast}
        </div>
      )}
    </HRLayout>
  );
};

export default TalentNetwork;
