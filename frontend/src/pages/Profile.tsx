import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profile as profileApi } from '../services/api';
import { HRLayout, CandidateLayout } from '../components/Layout';
import { UserCircle, Building2, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  hr: 'HR / Recruiter',
  candidate: 'Job Seeker',
};

type Tab = 'personal' | 'company' | 'security';

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
      <div className="bg-white dark:bg-slate-700 rounded-2xl border border-gray-100 dark:border-slate-700 px-6 py-5 flex items-center gap-4 mb-6 shadow-sm">
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
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── tab panels ── */}
      <div className="bg-white dark:bg-slate-700 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

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
