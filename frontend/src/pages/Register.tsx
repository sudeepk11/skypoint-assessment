import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, Briefcase, UserCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
const STRENGTH_TEXT_COLORS = ['', 'text-red-600', 'text-yellow-600', 'text-blue-600', 'text-green-600'];

function validatePasswordRules(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/\d/.test(password)) errors.push('One digit');
  return errors;
}

const PERKS_HR = [
  'Post unlimited job listings',
  'Review & shortlist candidates',
  'Track pipeline in one place',
];

const PERKS_CANDIDATE = [
  'Browse 500+ open positions',
  'One-click apply to any job',
  'Track every application live',
];

const Register: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') === 'hr' ? 'hr' : 'candidate';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'hr' | 'candidate'>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const passwordStrength = getPasswordStrength(password);
  const passwordRuleErrors = password ? validatePasswordRules(password) : [];
  const perks = role === 'hr' ? PERKS_HR : PERKS_CANDIDATE;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else {
      const ruleErrors = validatePasswordRules(password);
      if (ruleErrors.length > 0) {
        newErrors.password = `Password requires: ${ruleErrors.join(', ')}.`;
      }
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      const data = await auth.register({ email, password, full_name: fullName, role });
      login(data.access_token, data.user);
      navigate(data.user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      if (axiosErr?.response?.status === 400) {
        setServerError(axiosErr.response?.data?.detail || 'Email already registered.');
      } else if (axiosErr?.response?.data?.detail) {
        setServerError(axiosErr.response.data.detail);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1a2f5e 55%, #1e3a7a 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-0 left-[-80px] w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

        {/* Logo */}
        <Link to="/" className="relative z-10 inline-flex items-center">
          <span className="text-2xl font-bold text-white">Sky</span>
          <span className="text-2xl font-bold text-blue-400">Hire</span>
        </Link>

        {/* Main copy — changes based on role */}
        <div className="relative z-10 space-y-6">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 ${
              role === 'hr'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {role === 'hr' ? <Briefcase size={12} /> : <UserCircle size={12} />}
              {role === 'hr' ? 'For HR Teams' : 'For Job Seekers'}
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-3">
              {role === 'hr'
                ? <>Build your dream<br />team, <span className="text-blue-400">faster.</span></>
                : <>Land the role<br />you <span className="text-green-400">deserve.</span></>}
            </h2>
            <p className="text-blue-200/70 text-sm leading-relaxed">
              {role === 'hr'
                ? 'Everything your hiring team needs — post jobs, review applications, and track candidates in one clean dashboard.'
                : 'Search hundreds of open roles, apply in seconds, and follow every step of your application journey.'}
            </p>
          </div>

          {/* Perks list */}
          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  role === 'hr' ? 'bg-blue-500/25' : 'bg-green-500/25'
                }`}>
                  <CheckCircle2 size={12} className={role === 'hr' ? 'text-blue-400' : 'text-green-400'} />
                </div>
                <span className="text-white/80 text-sm">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © 2026 SkyHire · Free to get started
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-10 sm:px-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6">
          <Link to="/" className="inline-flex items-center">
            <span className="text-2xl font-bold text-primary">Sky</span>
            <span className="text-2xl font-bold text-accent">Hire</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1">Free forever · No credit card needed</p>
          </div>

          {serverError && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Role selector */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">I want to...</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('hr')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                  role === 'hr'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50'
                }`}
              >
                <Briefcase size={18} className={role === 'hr' ? 'text-blue-600' : 'text-gray-400'} />
                <span>Hire Talent</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                  role === 'candidate'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50'
                }`}
              >
                <UserCircle size={18} className={role === 'candidate' ? 'text-green-600' : 'text-gray-400'} />
                <span>Find a Job</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="Priya Sharma"
                autoComplete="name"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-11 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          passwordStrength >= level ? STRENGTH_COLORS[passwordStrength] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${STRENGTH_TEXT_COLORS[passwordStrength]}`}>
                      {STRENGTH_LABELS[passwordStrength]}
                    </p>
                    {passwordRuleErrors.length > 0 && (
                      <p className="text-xs text-gray-400">{passwordRuleErrors[0]}</p>
                    )}
                  </div>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-11 ${
                    errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #2563eb)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
