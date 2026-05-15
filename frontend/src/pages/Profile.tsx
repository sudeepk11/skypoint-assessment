import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profile as profileApi } from '../services/api';
import { HRLayout, CandidateLayout } from '../components/Layout';
import { UserCircle, Building2, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  hr: 'HR / Recruiter',
  candidate: 'Candidate',
};

/* ---------- reusable alert components ---------- */
const SuccessAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
    <CheckCircle size={15} className="flex-shrink-0" />
    {message}
  </div>
);

const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
    <AlertCircle size={15} className="flex-shrink-0" />
    {message}
  </div>
);

/* ---------- main component ---------- */
const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();

  /* --- section 1: personal info --- */
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState<string | null>(null);
  const [personalError, setPersonalError] = useState<string | null>(null);

  /* --- section 2: company details (HR only) --- */
  const [companyName, setCompanyName] = useState(user?.company_name ?? '');
  const [companyWebsite, setCompanyWebsite] = useState(user?.company_website ?? '');
  const [companyDescription, setCompanyDescription] = useState(user?.company_description ?? '');
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);

  /* --- section 3: change password --- */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /* Sync form with fresh profile data on mount */
  useEffect(() => {
    profileApi.get().then((data) => {
      setFullName(data.full_name);
      setCompanyName(data.company_name ?? '');
      setCompanyWebsite(data.company_website ?? '');
      setCompanyDescription(data.company_description ?? '');
    }).catch(() => {/* ignore */});
  }, []);

  /* --- handlers --- */
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalLoading(true);
    setPersonalSuccess(null);
    setPersonalError(null);
    try {
      const updated = await profileApi.update({ full_name: fullName });
      updateUser(updated);
      setPersonalSuccess('Personal information updated successfully.');
    } catch {
      setPersonalError('Failed to update personal information. Please try again.');
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyLoading(true);
    setCompanySuccess(null);
    setCompanyError(null);
    try {
      const updated = await profileApi.update({
        company_name: companyName,
        company_website: companyWebsite,
        company_description: companyDescription,
      });
      updateUser(updated);
      setCompanySuccess('Company details updated successfully.');
    } catch {
      setCompanyError('Failed to update company details. Please try again.');
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setPasswordError(
        axiosErr?.response?.data?.detail ?? 'Failed to change password. Please try again.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const content = (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information and settings</p>
      </div>

      {/* Section 1: Personal Information */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <UserCircle size={18} className="text-accent" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Personal Information</h2>
        </div>

        <form onSubmit={handleSavePersonal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email address cannot be changed for security reasons.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            </div>
          </div>

          {personalSuccess && <SuccessAlert message={personalSuccess} />}
          {personalError && <ErrorAlert message={personalError} />}

          <div className="pt-1">
            <button
              type="submit"
              disabled={personalLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {personalLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Company Details (HR only) */}
      {user?.role === 'hr' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Company Details</h2>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Website</label>
              <input
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://www.example.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Description{' '}
                <span className="text-gray-400 font-normal">
                  ({companyDescription.length}/500)
                </span>
              </label>
              <textarea
                value={companyDescription}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setCompanyDescription(e.target.value);
                }}
                rows={4}
                maxLength={500}
                placeholder="Brief description of your company..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
              />
            </div>

            {companySuccess && <SuccessAlert message={companySuccess} />}
            {companyError && <ErrorAlert message={companyError} />}

            <div className="pt-1">
              <button
                type="submit"
                disabled={companyLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {companyLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Company Details'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 3: Change Password */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
            <Lock size={18} className="text-orange-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          {passwordSuccess && <SuccessAlert message={passwordSuccess} />}
          {passwordError && <ErrorAlert message={passwordError} />}

          <div className="pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (user?.role === 'hr') {
    return <HRLayout>{content}</HRLayout>;
  }

  return <CandidateLayout>{content}</CandidateLayout>;
};

export default Profile;
