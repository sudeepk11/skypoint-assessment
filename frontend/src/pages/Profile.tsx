import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profile as profileApi } from '../services/api';
import { HRLayout, CandidateLayout } from '../components/Layout';
import { UserCircle, Building2, Lock, CheckCircle, AlertCircle, Loader2, Link2, Linkedin, Github, Globe, Twitter, ExternalLink, ChevronDown, X, Search } from 'lucide-react';

// ── Skill Picker ────────────────────────────────────────────────────────────────

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Vue.js', 'Angular', 'Next.js', 'Svelte', 'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Laravel',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Elasticsearch',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD', 'GitHub Actions',
  'GraphQL', 'REST APIs', 'Microservices', 'gRPC',
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy',
  'React Native', 'Flutter', 'iOS', 'Android',
  'Figma', 'UI/UX Design', 'Tailwind CSS', 'SASS',
  'Git', 'Linux', 'Bash', 'Agile', 'Scrum',
];

const SKILL_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
];
function skillColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return SKILL_COLORS[n % SKILL_COLORS.length];
}

const SkillPicker: React.FC<{
  selected: string[];
  onChange: (skills: string[]) => void;
}> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (skill: string) => {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  const addCustom = () => {
    const trimmed = query.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setQuery('');
  };

  const filtered = COMMON_SKILLS.filter(
    (s) => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
  );

  return (
    <div ref={ref} className="relative">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${skillColor(s)}`}
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== s))}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
      >
        <span>{selected.length === 0 ? 'Select skills…' : `${selected.length} skill${selected.length > 1 ? 's' : ''} selected`}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-slate-700">
            <Search size={13} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder="Search or type a custom skill…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
            />
            {query && (
              <button
                type="button"
                onClick={addCustom}
                className="text-xs text-accent font-semibold hover:underline flex-shrink-0"
              >
                Add "{query}"
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1.5 px-1.5">
            {filtered.length === 0 && !query && (
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">
                All common skills selected — type to add custom ones.
              </p>
            )}
            {filtered.length === 0 && query && (
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-3">
                No match — press Enter or click "Add" to add custom.
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 p-1">
              {filtered.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggle(skill)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-accent hover:text-white dark:hover:bg-accent dark:hover:text-white transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ROLE_LABELS: Record<string, string> = {
  hr: 'HR / Recruiter',
  candidate: 'Job Seeker',
};

type Tab = 'personal' | 'company' | 'social' | 'security';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400';
const readonlyCls =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed select-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-500';

const Toast: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => (
  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
    type === 'success'
      ? 'bg-green-50 text-green-700 border border-green-200'
      : 'bg-red-50 text-red-700 border border-red-200'
  }`}>
    {type === 'success'
      ? <CheckCircle size={14} className="flex-shrink-0" />
      : <AlertCircle size={14} className="flex-shrink-0" />}
    {message}
  </div>
);

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  /* personal */
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState<string | null>(null);
  const [personalError, setPersonalError] = useState<string | null>(null);

  /* company */
  const [companyName, setCompanyName] = useState(user?.company_name ?? '');
  const [companyWebsite, setCompanyWebsite] = useState(user?.company_website ?? '');
  const [companyDescription, setCompanyDescription] = useState(user?.company_description ?? '');
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);

  /* social */
  const isHR = user?.role === 'hr';
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [linkedinUrl, setLinkedinUrl] = useState(isHR ? (user?.company_linkedin_url ?? '') : (user?.linkedin_url ?? ''));
  const [githubUrl, setGithubUrl] = useState(user?.github_url ?? '');
  const [glassdoorUrl, setGlassdoorUrl] = useState(user?.company_glassdoor_url ?? '');
  const [twitterUrl, setTwitterUrl] = useState(isHR ? (user?.company_twitter_url ?? '') : (user?.twitter_url ?? ''));
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url ?? '');
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialSuccess, setSocialSuccess] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  /* security */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    profileApi.get().then((data) => {
      setFullName(data.full_name);
      setCompanyName(data.company_name ?? '');
      setCompanyWebsite(data.company_website ?? '');
      setCompanyDescription(data.company_description ?? '');
      setHeadline(data.headline ?? '');
      setSkills(data.skills ?? []);
      const isHRUser = data.role === 'hr';
      setLinkedinUrl(isHRUser ? (data.company_linkedin_url ?? '') : (data.linkedin_url ?? ''));
      setGithubUrl(data.github_url ?? '');
      setGlassdoorUrl(data.company_glassdoor_url ?? '');
      setTwitterUrl(isHRUser ? (data.company_twitter_url ?? '') : (data.twitter_url ?? ''));
      setPortfolioUrl(data.portfolio_url ?? '');
    }).catch(() => {});
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalLoading(true); setPersonalSuccess(null); setPersonalError(null);
    try {
      const updated = await profileApi.update({ full_name: fullName });
      updateUser(updated);
      setPersonalSuccess('Changes saved.');
    } catch {
      setPersonalError('Failed to save. Please try again.');
    } finally { setPersonalLoading(false); }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyLoading(true); setCompanySuccess(null); setCompanyError(null);
    try {
      const updated = await profileApi.update({ company_name: companyName, company_website: companyWebsite, company_description: companyDescription });
      updateUser(updated);
      setCompanySuccess('Company details saved.');
    } catch {
      setCompanyError('Failed to save. Please try again.');
    } finally { setCompanyLoading(false); }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialLoading(true); setSocialSuccess(null); setSocialError(null);
    try {
      const payload = isHR
        ? { company_linkedin_url: linkedinUrl, company_twitter_url: twitterUrl, company_glassdoor_url: glassdoorUrl }
        : { headline, skills, linkedin_url: linkedinUrl, github_url: githubUrl, twitter_url: twitterUrl, portfolio_url: portfolioUrl };
      const updated = await profileApi.update(payload);
      updateUser(updated);
      setSocialSuccess('Social profile saved.');
    } catch {
      setSocialError('Failed to save. Please try again.');
    } finally { setSocialLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null); setPasswordError(null);
    if (newPassword.length < 8) return setPasswordError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match.');
    setPasswordLoading(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setPasswordError(axiosErr?.response?.data?.detail ?? 'Failed to update password.');
    } finally { setPasswordLoading(false); }
  };

  const initials = (user?.full_name ?? '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'personal',  label: 'Profile',  icon: <UserCircle size={14} /> },
    ...(user?.role === 'hr' ? [{ id: 'company' as Tab, label: 'Company', icon: <Building2 size={14} /> }] : []),
    { id: 'social',    label: 'Socials',  icon: <Link2 size={14} /> },
    { id: 'security',  label: 'Password', icon: <Lock size={14} /> },
  ];

  const SaveButton: React.FC<{ loading: boolean; label?: string }> = ({ loading, label = 'Save changes' }) => (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? <><Loader2 size={13} className="animate-spin" />Saving...</> : label}
    </button>
  );

  const content = (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">

      {/* ── profile header card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-6 py-5 flex items-center gap-4 mb-6 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.full_name}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent">
            {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
          </span>
        </div>
      </div>

      {/* ── tab bar ── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── tab panels ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* Personal */}
        {activeTab === 'personal' && (
          <form onSubmit={handleSavePersonal}>
            <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Personal Information</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Update your display name.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={user?.email ?? ''} readOnly className={readonlyCls} />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Email cannot be changed.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              {personalSuccess && <Toast type="success" message={personalSuccess} />}
              {personalError && <Toast type="error" message={personalError} />}
              {!personalSuccess && !personalError && <span />}
              <SaveButton loading={personalLoading} />
            </div>
          </form>
        )}

        {/* Company (HR only) */}
        {activeTab === 'company' && user?.role === 'hr' && (
          <form onSubmit={handleSaveCompany}>
            <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Company Details</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Shown to candidates on your job listings.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Corporation" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Website</label>
                <input type="url" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  About <span className="normal-case text-gray-400 dark:text-slate-500 font-normal">({companyDescription.length}/500)</span>
                </label>
                <textarea
                  value={companyDescription}
                  onChange={e => { if (e.target.value.length <= 500) setCompanyDescription(e.target.value); }}
                  rows={4} maxLength={500}
                  placeholder="Brief description of your company..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              {companySuccess && <Toast type="success" message={companySuccess} />}
              {companyError && <Toast type="error" message={companyError} />}
              {!companySuccess && !companyError && <span />}
              <SaveButton loading={companyLoading} label="Save details" />
            </div>
          </form>
        )}

        {/* Social */}
        {activeTab === 'social' && (
          <form onSubmit={handleSaveSocial}>
            <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Social Profiles & Links</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Shown to connections and recruiters on your profile.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {user?.role === 'candidate' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Senior React Developer · Open to work"
                      maxLength={255}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Skills</label>
                    <SkillPicker selected={skills} onChange={setSkills} />
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">Pick from the list or type to add custom skills. Shown to recruiters.</p>
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-gray-50 dark:border-slate-700 space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Social Links</p>
                {(isHR ? [
                  { icon: <Linkedin size={15} className="text-[#0a66c2]" />, label: 'LinkedIn URL', val: linkedinUrl, set: setLinkedinUrl, ph: 'https://linkedin.com/company/yourcompany' },
                  { icon: <Twitter size={15} className="text-[#1da1f2]" />, label: 'Twitter / X URL', val: twitterUrl, set: setTwitterUrl, ph: 'https://twitter.com/yourcompany' },
                  { icon: <ExternalLink size={15} className="text-green-600" />, label: 'Glassdoor URL', val: glassdoorUrl, set: setGlassdoorUrl, ph: 'https://glassdoor.com/...' },
                ] : [
                  { icon: <Linkedin size={15} className="text-[#0a66c2]" />, label: 'LinkedIn URL', val: linkedinUrl, set: setLinkedinUrl, ph: 'https://linkedin.com/in/yourname' },
                  { icon: <Github size={15} className="text-gray-700 dark:text-slate-300" />, label: 'GitHub URL', val: githubUrl, set: setGithubUrl, ph: 'https://github.com/yourname' },
                  { icon: <Twitter size={15} className="text-[#1da1f2]" />, label: 'Twitter / X URL', val: twitterUrl, set: setTwitterUrl, ph: 'https://twitter.com/yourname' },
                  { icon: <Globe size={15} className="text-purple-500" />, label: 'Portfolio / Website', val: portfolioUrl, set: setPortfolioUrl, ph: 'https://yourportfolio.com' },
                ]).map(({ icon, label, val, set, ph }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <input
                      type="url"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder={ph}
                      className={`${inputCls} flex-1`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              {socialSuccess && <Toast type="success" message={socialSuccess} />}
              {socialError && <Toast type="error" message={socialError} />}
              {!socialSuccess && !socialError && <span />}
              <SaveButton loading={socialLoading} label="Save socials" />
            </div>
          </form>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword}>
            <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Change Password</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Use a strong password with 8+ characters.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} placeholder="8+ characters" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Confirm</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Re-enter" className={inputCls} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
              {passwordSuccess && <Toast type="success" message={passwordSuccess} />}
              {passwordError && <Toast type="error" message={passwordError} />}
              {!passwordSuccess && !passwordError && <span />}
              <SaveButton loading={passwordLoading} label="Update password" />
            </div>
          </form>
        )}

      </div>
    </div>
  );

  return user?.role === 'hr'
    ? <HRLayout>{content}</HRLayout>
    : <CandidateLayout>{content}</CandidateLayout>;
};

export default Profile;
