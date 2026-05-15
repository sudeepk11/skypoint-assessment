import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, FileSearch, Mail, ChevronRight, Shield, ArrowRight } from 'lucide-react';

// Animated counter hook
function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

const StatItem: React.FC<{ value: string; label: string; isText?: boolean }> = ({
  value,
  label,
  isText,
}) => {
  const numericPart = parseInt(value.replace(/\D/g, ''));
  const suffix = value.replace(/\d+/, '');
  const { count, ref } = useCounter(isText ? 0 : numericPart);

  return (
    <div ref={ref} className="text-center px-6 py-4">
      <div className="text-3xl font-bold text-primary mb-1">
        {isText ? value : `${count}${suffix}`}
      </div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
    </div>
  );
};

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-white" style={{ textShadow: scrolled ? 'none' : '0 1px 3px rgba(0,0,0,0.3)', color: scrolled ? '#1a2744' : 'white' }}>
                Skypoint
              </span>
              <span className="text-xl font-bold" style={{ color: scrolled ? '#2563eb' : '#93c5fd' }}>
                .ai
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                  scrolled
                    ? 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                    : 'border-white/40 text-white hover:border-white hover:bg-white/10'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-accent text-white hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-primary hero-grid overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-blue-900/80" />

        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm font-medium mb-8">
            <span className="text-yellow-300">✦</span>
            Powered by Skypoint AI
          </div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Hire Smarter with{' '}
            <span className="text-blue-400">AI-Powered</span>
            <br />
            Recruitment
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            The intelligent hiring platform built for modern teams. Post jobs, screen resumes, and
            communicate — all powered by Skypoint AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register?role=hr"
              className="flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/30 text-sm sm:text-base"
            >
              Post a Job
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all text-sm sm:text-base"
            >
              Find Jobs
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs">Scroll to explore</span>
          <div className="w-0.5 h-8 bg-white/20 rounded" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-200 py-2">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
            <StatItem value="500+" label="Jobs Posted" />
            <StatItem value="2000+" label="Applications" />
            <StatItem value="AI-Powered" label="Resume Screening" isText />
            <StatItem value="HITRUST" label="Certified" isText />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Everything You Need to Hire Smarter
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Powered by Claude AI, our platform handles the heavy lifting so your team can focus
              on what matters — finding the right people.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Bot size={28} className="text-accent" />,
                title: 'AI Job Description Generator',
                desc: 'Generate compelling, role-specific job descriptions in seconds using Claude AI. Save hours and attract better candidates.',
                bg: 'bg-blue-50',
              },
              {
                icon: <FileSearch size={28} className="text-purple-600" />,
                title: 'Intelligent Resume Screening',
                desc: "Automatically evaluate candidate fit with AI-powered resume analysis and scoring. Get instant insights on every applicant.",
                bg: 'bg-purple-50',
              },
              {
                icon: <Mail size={28} className="text-green-600" />,
                title: 'Bulk Email Communication',
                desc: 'Keep candidates informed with templated bulk emails powered by AWS SES. Professional communication at scale.',
                bg: 'bg-green-50',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${f.bg} rounded-xl flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-primary mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">Simple steps to get you started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For HR */}
            <div className="bg-surface rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Briefcase size={18} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-primary">For HR Teams</h3>
              </div>
              <div className="space-y-4">
                {[
                  { step: '1', label: 'Post Job', desc: 'Create a job listing with AI-generated descriptions' },
                  { step: '2', label: 'Review Applications', desc: 'Browse incoming candidate applications' },
                  { step: '3', label: 'AI Screening', desc: 'Get instant AI fit scores and analysis' },
                  { step: '4', label: 'Hire', desc: 'Shortlist candidates and send bulk communications' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/register?role=hr"
                className="mt-6 flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                Start hiring <ChevronRight size={14} />
              </Link>
            </div>

            {/* For Candidates */}
            <div className="bg-surface rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <UserIcon size={18} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-primary">For Candidates</h3>
              </div>
              <div className="space-y-4">
                {[
                  { step: '1', label: 'Browse Jobs', desc: 'Explore open positions from top companies' },
                  { step: '2', label: 'Apply', desc: 'Submit your resume and cover letter in minutes' },
                  { step: '3', label: 'Track Status', desc: 'Monitor your application status in real-time' },
                  { step: '4', label: 'Get Hired', desc: 'Receive interview invitations and job offers' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/register?role=candidate"
                className="mt-6 flex items-center gap-2 text-sm font-medium text-green-600 hover:underline"
              >
                Start applying <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-10 bg-primary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/70 text-sm font-medium">
            {[
              { icon: <Shield size={16} />, label: 'HITRUST r2 Certified' },
              { icon: <Shield size={16} />, label: 'Enterprise-grade Security' },
              { icon: <Shield size={16} />, label: 'Healthcare AI Specialists' },
              { icon: <Shield size={16} />, label: 'Built on Skypoint AI' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-blue-400">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-white">Skypoint</span>
              <span className="text-xl font-bold text-blue-400">.ai</span>
            </div>
            <p className="text-sm text-white/50">AI Agents for Healthcare</p>
            <p className="text-sm text-white/30">© 2025 Skypoint.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Inline Briefcase component to avoid import issues
const Briefcase: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

// Inline User icon
const UserIcon: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default Landing;
