import React, { useEffect, useState, useCallback } from 'react';
import { HRLayout } from '../../components/Layout';
import { connections as connectionsApi } from '../../services/api';
import type { Connection, Suggestion } from '../../types';
import {
  Users, UserPlus, Clock, CheckCircle2, XCircle,
  Linkedin, Github, Globe, Twitter, ExternalLink,
  Search, Zap, Building2,
} from 'lucide-react';

type Tab = 'discover' | 'connected' | 'pending' | 'sent';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseSkills(json: string | undefined): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
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

// ── sub-components ────────────────────────────────────────────────────────────

const SocialLink: React.FC<{ href?: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
    >
      {icon}
    </a>
  );
};

const UserAvatar: React.FC<{ id: string; name: string; size?: 'sm' | 'md' | 'lg' }> = ({ id, name, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: avatarColor(id) }}
    >
      {initials(name)}
    </div>
  );
};

// ── CandidateCard (Discover) ──────────────────────────────────────────────────

const CandidateCard: React.FC<{
  suggestion: Suggestion;
  onInvite: (userId: string) => void;
  inviting: boolean;
  invited: boolean;
}> = ({ suggestion, onInvite, inviting, invited }) => {
  const { user, shared_skills } = suggestion;
  const skills = parseSkills(user.skills);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <UserAvatar id={user.id} name={user.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{user.full_name}</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0 uppercase tracking-wide">
              {user.role === 'hr' ? 'HR' : 'Candidate'}
            </span>
          </div>
          {user.headline && (
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{user.headline}</p>
          )}
          {user.company_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 size={10} className="text-gray-400" />
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user.company_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Shared skills */}
      {shared_skills.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Zap size={11} className="text-amber-500 flex-shrink-0" />
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mr-1">Matching:</span>
          {shared_skills.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium">
              {s}
            </span>
          ))}
          {shared_skills.length > 4 && (
            <span className="text-[10px] text-gray-400">+{shared_skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
              {s}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500">
              +{skills.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-slate-700 mt-auto">
        <div className="flex gap-1">
          <SocialLink href={user.linkedin_url} icon={<Linkedin size={13} />} label="LinkedIn" />
          <SocialLink href={user.github_url} icon={<Github size={13} />} label="GitHub" />
          <SocialLink href={user.twitter_url} icon={<Twitter size={13} />} label="Twitter" />
          <SocialLink href={user.portfolio_url} icon={<Globe size={13} />} label="Portfolio" />
          <SocialLink href={user.glassdoor_url} icon={<ExternalLink size={13} />} label="Glassdoor" />
        </div>
        <button
          onClick={() => !invited && onInvite(user.id)}
          disabled={inviting || invited}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            invited
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
              : 'bg-accent text-white hover:bg-blue-700 disabled:opacity-60'
          }`}
        >
          {invited ? (
            <><CheckCircle2 size={12} /> Invited</>
          ) : inviting ? (
            <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
          ) : (
            <><UserPlus size={12} /> Reach Out</>
          )}
        </button>
      </div>
    </div>
  );
};

// ── ConnectionCard ─────────────────────────────────────────────────────────────

const ConnectionCard: React.FC<{
  connection: Connection;
  perspective: 'requester' | 'receiver' | 'accepted';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onRemove?: (id: string) => void;
  acting?: boolean;
}> = ({ connection, perspective, onAccept, onDecline, onRemove, acting }) => {
  const other = perspective === 'requester' ? connection.receiver : connection.requester;
  const skills = parseSkills(other.skills);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <UserAvatar id={other.id} name={other.full_name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 dark:text-slate-100">{other.full_name}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            {other.role === 'hr' ? 'HR' : 'Candidate'}
          </span>
        </div>
        {other.headline && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{other.headline}</p>
        )}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {skills.slice(0, 4).map((s) => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-1 mt-2">
          <SocialLink href={other.linkedin_url} icon={<Linkedin size={12} />} label="LinkedIn" />
          <SocialLink href={other.github_url} icon={<Github size={12} />} label="GitHub" />
          <SocialLink href={other.twitter_url} icon={<Twitter size={12} />} label="Twitter" />
          <SocialLink href={other.portfolio_url} icon={<Globe size={12} />} label="Portfolio" />
          <SocialLink href={other.glassdoor_url} icon={<ExternalLink size={12} />} label="Glassdoor" />
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        {perspective === 'receiver' && connection.status === 'pending' && (
          <>
            <button
              onClick={() => onAccept?.(connection.id)}
              disabled={acting}
              className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <CheckCircle2 size={11} /> Accept
            </button>
            <button
              onClick={() => onDecline?.(connection.id)}
              disabled={acting}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-60 transition-colors"
            >
              <XCircle size={11} /> Decline
            </button>
          </>
        )}
        {perspective === 'requester' && connection.status === 'pending' && (
          <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-lg">
            <Clock size={11} /> Pending
          </span>
        )}
        {perspective === 'accepted' && (
          <button
            onClick={() => onRemove?.(connection.id)}
            disabled={acting}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-60 transition-colors"
          >
            <XCircle size={11} /> Remove
          </button>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="mb-4">{icon}</div>
    <p className="text-base font-semibold text-gray-500 dark:text-slate-400">{title}</p>
    <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 max-w-xs">{desc}</p>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────────

const TalentNetwork: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filtered, setFiltered] = useState<Suggestion[]>([]);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [sent, setSent] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviting, setInviting] = useState<Record<string, boolean>>({});
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, p, se] = await Promise.all([
        connectionsApi.suggestions(),
        connectionsApi.list(),
        connectionsApi.pending(),
        connectionsApi.sent(),
      ]);
      setSuggestions(s);
      setFiltered(s);
      setMyConnections(c);
      setPending(p);
      setSent(se);
      const sentIds = new Set(se.map((conn) => conn.receiver.id));
      setInvited(sentIds);
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Live search filter on suggestions
  useEffect(() => {
    if (!search.trim()) { setFiltered(suggestions); return; }
    const q = search.toLowerCase();
    setFiltered(
      suggestions.filter(
        ({ user }) =>
          user.full_name.toLowerCase().includes(q) ||
          user.headline?.toLowerCase().includes(q) ||
          parseSkills(user.skills).some((s) => s.toLowerCase().includes(q))
      )
    );
  }, [search, suggestions]);

  const handleInvite = async (userId: string) => {
    setInviting((p) => ({ ...p, [userId]: true }));
    try {
      await connectionsApi.invite(userId);
      setInvited((prev) => new Set(prev).add(userId));
      await loadAll();
    } catch {/* silent */} finally {
      setInviting((p) => ({ ...p, [userId]: false }));
    }
  };

  const handleAccept = async (id: string) => {
    setActing((p) => ({ ...p, [id]: true }));
    try { await connectionsApi.accept(id); await loadAll(); }
    catch {/* silent */} finally { setActing((p) => ({ ...p, [id]: false })); }
  };

  const handleDecline = async (id: string) => {
    setActing((p) => ({ ...p, [id]: true }));
    try { await connectionsApi.decline(id); await loadAll(); }
    catch {/* silent */} finally { setActing((p) => ({ ...p, [id]: false })); }
  };

  const handleRemove = async (id: string) => {
    setActing((p) => ({ ...p, [id]: true }));
    try { await connectionsApi.remove(id); await loadAll(); }
    catch {/* silent */} finally { setActing((p) => ({ ...p, [id]: false })); }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'discover',   label: 'Talent Pool',   icon: <Users size={14} />,       count: suggestions.length },
    { id: 'connected',  label: 'Connected',      icon: <CheckCircle2 size={14} />, count: myConnections.length },
    { id: 'pending',    label: 'Invites',         icon: <Clock size={14} />,        count: pending.length },
    { id: 'sent',       label: 'Sent',            icon: <UserPlus size={14} />,     count: sent.length },
  ];

  return (
    <HRLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Talent Network</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Discover candidates, reach out directly, and build your hiring pipeline.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-6 w-full sm:w-auto sm:inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar — only on Discover tab */}
        {activeTab === 'discover' && (
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, headline or skill…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="skeleton w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-3 w-48 rounded" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-8 w-24 rounded-lg ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'discover' && (
              filtered.length === 0 ? (
                <EmptyState
                  icon={<Users size={40} className="text-gray-300 dark:text-slate-600" />}
                  title={search ? 'No matches found' : 'No candidates yet'}
                  desc={search ? 'Try a different name or skill.' : 'Candidates will appear here once they register.'}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((s) => (
                    <CandidateCard
                      key={s.user.id}
                      suggestion={s}
                      onInvite={handleInvite}
                      inviting={!!inviting[s.user.id]}
                      invited={invited.has(s.user.id)}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === 'connected' && (
              myConnections.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No connections yet"
                  desc="Reach out to candidates from the Talent Pool tab."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {myConnections.map((c) => (
                    <ConnectionCard key={c.id} connection={c} perspective="accepted" onRemove={handleRemove} acting={!!acting[c.id]} />
                  ))}
                </div>
              )
            )}

            {activeTab === 'pending' && (
              pending.length === 0 ? (
                <EmptyState
                  icon={<Clock size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No pending invites"
                  desc="When a candidate sends you a connection request, it'll show up here."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pending.map((c) => (
                    <ConnectionCard key={c.id} connection={c} perspective="receiver" onAccept={handleAccept} onDecline={handleDecline} acting={!!acting[c.id]} />
                  ))}
                </div>
              )
            )}

            {activeTab === 'sent' && (
              sent.length === 0 ? (
                <EmptyState
                  icon={<UserPlus size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No outreach sent"
                  desc="Go to Talent Pool and reach out to candidates."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {sent.map((c) => (
                    <ConnectionCard key={c.id} connection={c} perspective="requester" acting={!!acting[c.id]} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </HRLayout>
  );
};

export default TalentNetwork;
