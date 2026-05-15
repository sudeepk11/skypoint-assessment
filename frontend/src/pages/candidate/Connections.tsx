import React, { useEffect, useState, useCallback } from 'react';
import { CandidateLayout } from '../../components/Layout';
import { connections as connectionsApi } from '../../services/api';
import type { Connection, Suggestion } from '../../types';
import {
  Users, UserPlus, Clock, CheckCircle2, XCircle,
  Linkedin, Github, Globe, Twitter, ExternalLink, Zap,
} from 'lucide-react';

type Tab = 'suggestions' | 'connections' | 'pending' | 'sent';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseSkills(json: string | undefined): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1',
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

// ── SuggestionCard ────────────────────────────────────────────────────────────

const SuggestionCard: React.FC<{
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
          <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{user.full_name}</p>
          {user.headline && (
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{user.headline}</p>
          )}
          {user.company_name && (
            <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">{user.company_name}</p>
          )}
        </div>
      </div>

      {/* Shared skills */}
      {shared_skills.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Zap size={11} className="text-amber-500 flex-shrink-0" />
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mr-1">Shared:</span>
          {shared_skills.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
              {s}
            </span>
          ))}
          {shared_skills.length > 4 && (
            <span className="text-[10px] text-gray-400">+{shared_skills.length - 4}</span>
          )}
        </div>
      )}

      {/* All skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
              {s}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
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
            <><UserPlus size={12} /> Connect</>
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
  const other = perspective === 'requester'
    ? connection.receiver
    : connection.requester;
  const skills = parseSkills(other.skills);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <UserAvatar id={other.id} name={other.full_name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-slate-100">{other.full_name}</p>
        {other.headline && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{other.headline}</p>
        )}
        {other.company_name && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{other.company_name}</p>
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
        {/* Social links */}
        <div className="flex gap-1 mt-2">
          <SocialLink href={other.linkedin_url} icon={<Linkedin size={12} />} label="LinkedIn" />
          <SocialLink href={other.github_url} icon={<Github size={12} />} label="GitHub" />
          <SocialLink href={other.twitter_url} icon={<Twitter size={12} />} label="Twitter" />
          <SocialLink href={other.portfolio_url} icon={<Globe size={12} />} label="Portfolio" />
          <SocialLink href={other.glassdoor_url} icon={<ExternalLink size={12} />} label="Glassdoor" />
        </div>
      </div>

      {/* Actions */}
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

// ── Main page ──────────────────────────────────────────────────────────────────

const Connections: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('suggestions');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [sent, setSent] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
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
      setMyConnections(c);
      setPending(p);
      setSent(se);
      // Pre-mark already-invited suggestions
      const sentIds = new Set([...se.map((conn) => conn.receiver.id)]);
      setInvited(sentIds);
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

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
    { id: 'suggestions', label: 'Discover', icon: <Users size={14} />, count: suggestions.length },
    { id: 'connections', label: 'Connected', icon: <CheckCircle2 size={14} />, count: myConnections.length },
    { id: 'pending', label: 'Invites', icon: <Clock size={14} />, count: pending.length },
    { id: 'sent', label: 'Sent', icon: <UserPlus size={14} />, count: sent.length },
  ];

  return (
    <CandidateLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Connections</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Discover professionals with similar skills, send invites, and grow your network.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-8 w-full sm:w-auto sm:inline-flex">
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
            {/* Suggestions */}
            {activeTab === 'suggestions' && (
              suggestions.length === 0 ? (
                <EmptyState
                  icon={<Users size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No suggestions yet"
                  desc="Add skills to your profile to discover people with similar expertise."
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {suggestions.map((s) => (
                    <SuggestionCard
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

            {/* Connected */}
            {activeTab === 'connections' && (
              myConnections.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No connections yet"
                  desc="Start by sending invites from the Discover tab."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {myConnections.map((c) => (
                    <ConnectionCard
                      key={c.id}
                      connection={c}
                      perspective="accepted"
                      onRemove={handleRemove}
                      acting={!!acting[c.id]}
                    />
                  ))}
                </div>
              )
            )}

            {/* Pending invites received */}
            {activeTab === 'pending' && (
              pending.length === 0 ? (
                <EmptyState
                  icon={<Clock size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No pending invites"
                  desc="When someone sends you a connection request, it'll appear here."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pending.map((c) => (
                    <ConnectionCard
                      key={c.id}
                      connection={c}
                      perspective="receiver"
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      acting={!!acting[c.id]}
                    />
                  ))}
                </div>
              )
            )}

            {/* Sent invites */}
            {activeTab === 'sent' && (
              sent.length === 0 ? (
                <EmptyState
                  icon={<UserPlus size={40} className="text-gray-300 dark:text-slate-600" />}
                  title="No invites sent"
                  desc="Go to Discover and reach out to professionals in your field."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {sent.map((c) => (
                    <ConnectionCard
                      key={c.id}
                      connection={c}
                      perspective="requester"
                      acting={!!acting[c.id]}
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

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="mb-4">{icon}</div>
    <p className="text-base font-semibold text-gray-500 dark:text-slate-400">{title}</p>
    <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 max-w-xs">{desc}</p>
  </div>
);

export default Connections;
