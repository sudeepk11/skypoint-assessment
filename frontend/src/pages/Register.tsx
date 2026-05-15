import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Briefcase, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';

/** Returns a strength level 0–4 based on how many rules the password satisfies. */
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

/** Validate password against all backend rules and return a list of error messages. */
function validatePasswordRules(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/\d/.test(password)) errors.push('At least one digit');
  return errors;
}

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    } else if (fullName.trim().length > 100) {
      newErrors.fullName = 'Full name must not exceed 100 characters.';
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
      const data = await auth.register({
        email,
        password,
        full_name: fullName,
        role,
      });
      login(data.access_token, data.user);
      navigate(data.user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard', {
        replace: true,
      });
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
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-bold text-primary">Skypoint</span>
            <span className="text-3xl font-bold text-accent">.ai</span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Get started</h1>

          {serverError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-5">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('hr')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  role === 'hr'
                    ? 'border-accent bg-blue-50 text-accent'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Briefcase size={16} />
                I'm Hiring (HR)
              </button>
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  role === 'candidate'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <UserCircle size={16} />
                Looking for Work
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors ${
                  errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Jane Smith"
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
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
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors pr-10 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          passwordStrength >= level
                            ? STRENGTH_COLORS[passwordStrength]
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${STRENGTH_TEXT_COLORS[passwordStrength]}`}>
                    {STRENGTH_LABELS[passwordStrength]}
                  </p>
                  {passwordRuleErrors.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {passwordRuleErrors.map((msg) => (
                        <li key={msg} className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                          {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors pr-10 ${
                    errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-accent text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
