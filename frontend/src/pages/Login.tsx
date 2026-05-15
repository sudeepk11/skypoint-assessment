import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, Users, Briefcase, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';

const Login: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await auth.login({ email, password });
      login(data.access_token, data.user);
      navigate(data.user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      if (axiosErr?.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (axiosErr?.response?.data?.detail) {
        const detail = axiosErr.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Request failed. Please try again.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1a2f5e 50%, #1e3a7a 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />

        {/* Logo */}
        <Link to="/" className="relative z-10 inline-flex items-center">
          <span className="text-2xl font-bold text-white">Sky</span>
          <span className="text-2xl font-bold text-blue-400">Hire</span>
        </Link>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-3">
              Your next great<br />
              hire is one click<br />
              <span className="text-blue-400">away.</span>
            </h2>
            <p className="text-blue-200/80 text-base leading-relaxed">
              Streamline your hiring pipeline. Review applicants, shortlist talent, and build teams — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Briefcase, value: '500+', label: 'Jobs Posted' },
              { icon: Users, value: '8K+', label: 'Candidates' },
              { icon: TrendingUp, value: '2×', label: 'Faster Hiring' },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center"
              >
                <Icon size={16} className="text-blue-400 mx-auto mb-1.5" />
                <p className="text-white font-bold text-lg leading-none">{value}</p>
                <p className="text-blue-200/60 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-white/30 text-xs">
          © 2026 SkyHire · Built for India's growing companies
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center">
            <span className="text-2xl font-bold text-primary">Sky</span>
            <span className="text-2xl font-bold text-accent">Hire</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to continue to SkyHire</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #2563eb)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New to SkyHire?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
