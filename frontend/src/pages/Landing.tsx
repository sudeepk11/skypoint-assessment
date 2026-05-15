import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Briefcase, Mail, Zap, Target } from 'lucide-react';

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
    <div ref={ref} className="text-center px-6 py-6">
      <div className="text-4xl font-bold mb-1" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-xl font-bold" style={{ color: scrolled ? '#0f172a' : 'white' }}>Sky</span>
              <span className="text-xl font-bold" style={{ color: scrolled ? '#3b82f6' : '#93c5fd' }}>Hire</span>
            </div>

            {/* Nav links + CTAs */}
            <div className="flex items-center gap-1 sm:gap-3">
              <Link
                to="/jobs"
                className={`hidden sm:block text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'
                }`}
              >
                For Candidates
              </Link>
              <Link
                to="/register?role=hr"
                className={`hidden sm:block text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'
                }`}
              >
                For HR
              </Link>
              <Link
                to="/login"
                className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
                  scrolled
                    ? 'border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                    : 'border-white/30 text-white hover:border-white hover:bg-white/10'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: '#0f172a' }}
      >
        {/* Animated gradient blobs */}
        <div
          className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
            transform: 'translate(-30%, -30%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-25 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            transform: 'translate(30%, 30%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Floating glassmorphism stat cards — desktop only */}
        <div
          className="hidden lg:flex absolute top-32 right-16 items-center gap-3 px-5 py-4 rounded-2xl border border-white/20"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Briefcase size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">482</p>
            <p className="text-white/60 text-xs mt-0.5">Jobs Posted</p>
          </div>
        </div>

        <div
          className="hidden lg:flex absolute top-56 left-12 items-center gap-3 px-5 py-4 rounded-2xl border border-white/20"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #db2777)' }}>
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">2,100+</p>
            <p className="text-white/60 text-xs mt-0.5">Applications</p>
          </div>
        </div>

        <div
          className="hidden lg:flex absolute bottom-40 right-20 items-center gap-3 px-5 py-4 rounded-2xl border border-white/20"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #059669, #3b82f6)' }}>
            <CheckCircle size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">94%</p>
            <p className="text-white/60 text-xs mt-0.5">Hire Rate</p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-32">
          {/* Beta badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-blue-200 text-sm font-medium mb-10"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
            <span>🚀</span>
            <span>Now in Beta — Free for startups</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-none tracking-tight mb-6">
            Hire Fast.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Build Better Teams.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            The modern hiring platform for growing companies. Post jobs, review applicants, and
            close offers — all in one place.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              to="/register?role=hr"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-sm sm:text-base transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 8px 30px rgba(37,99,235,0.4)',
              }}
            >
              Start Hiring Free
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-sm sm:text-base border border-white/30 transition-all hover:bg-white/10 hover:scale-[1.02]"
            >
              Find Jobs
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-white/40 text-sm font-medium tracking-wide">
            Trusted by <span className="text-white/60">500+ companies</span> · <span className="text-white/60">8,000+</span> active job seekers
          </p>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/20 rounded" />
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-2">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            <StatItem value="500+" label="Jobs Posted" />
            <StatItem value="8000+" label="Candidates" />
            <StatItem value="94%" label="Satisfaction" />
            <StatItem value="2x" label="Faster Hiring" isText />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>
              Platform
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4" style={{ color: '#0f172a' }}>
              Everything your team needs
              <br />
              <span style={{ background: 'linear-gradient(135deg, #0f172a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                to hire smarter
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              One platform. Zero friction. From job post to offer letter in record time.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap size={26} className="text-blue-600" />,
                iconBg: 'bg-blue-50',
                title: 'Post in Minutes',
                desc: 'Write job descriptions, set requirements, and go live in under 5 minutes. Reach thousands of qualified candidates instantly.',
                accent: '#3b82f6',
                emoji: '📋',
              },
              {
                icon: <Target size={26} className="text-purple-600" />,
                iconBg: 'bg-purple-50',
                title: 'Review & Shortlist',
                desc: 'All your applicants in one clean view. Filter by skills, location, and status. Move candidates through your pipeline effortlessly.',
                accent: '#2563eb',
                emoji: '🎯',
              },
              {
                icon: <Mail size={26} className="text-emerald-600" />,
                iconBg: 'bg-emerald-50',
                title: 'Keep Candidates Warm',
                desc: 'Send personalised bulk emails with one click. Interview invites, updates, rejections — never leave a candidate in the dark.',
                accent: '#059669',
                emoji: '✉️',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default"
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
              >
                <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#0f172a' }}>{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                <div className="mt-6 flex items-center gap-1 text-sm font-semibold" style={{ color: f.accent }}>
                  Learn more <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight" style={{ color: '#0f172a' }}>
              Simple steps.{' '}
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Real results.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* For HR Teams */}
            <div className="rounded-2xl p-8 border border-gray-100" style={{ background: '#f8fafc' }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #3b82f6)' }}>
                  <Briefcase size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#0f172a' }}>For HR Teams</h3>
              </div>
              <div className="space-y-5">
                {[
                  { step: '1', label: 'Create your account', desc: 'Sign up free and set up your company profile in under 2 minutes.' },
                  { step: '2', label: 'Post your job', desc: 'Fill in the role details, requirements, and publish — reach thousands instantly.' },
                  { step: '3', label: 'Review applicants', desc: 'Browse a clean dashboard of all candidates. Filter, shortlist, and collaborate with your team.' },
                  { step: '4', label: 'Close faster', desc: 'Send interview invites, bulk updates, and offer letters directly from the platform.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div
                      className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5" style={{ color: '#0f172a' }}>{item.label}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/register?role=hr"
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.25)' }}
              >
                Start hiring free <ArrowRight size={14} />
              </Link>
            </div>

            {/* For Job Seekers */}
            <div className="rounded-2xl p-8 border border-gray-100" style={{ background: '#f8fafc' }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #059669)' }}>
                  <Users size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#0f172a' }}>For Job Seekers</h3>
              </div>
              <div className="space-y-5">
                {[
                  { step: '1', label: 'Create your profile', desc: 'Sign up and upload your resume. Takes 60 seconds.' },
                  { step: '2', label: 'Discover opportunities', desc: 'Browse curated job listings from verified companies across industries.' },
                  { step: '3', label: 'Apply with one click', desc: 'Submit your application instantly. No repetitive forms — your profile does the talking.' },
                  { step: '4', label: 'Track and get hired', desc: 'Follow your application status in real-time. Get notified the moment things move.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div
                      className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #059669)' }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5" style={{ color: '#0f172a' }}>{item.label}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/register?role=candidate"
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2563eb, #059669)', boxShadow: '0 4px 15px rgba(124,58,237,0.25)' }}
              >
                Find your next role <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 60%, #2563eb 100%)' }}
      >
        {/* Blob accents */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', transform: 'translate(30%, -30%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)', transform: 'translate(-30%, 30%)', filter: 'blur(60px)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Ready to build your
            <br />
            <span style={{ background: 'linear-gradient(135deg, #93c5fd, #c4b5fd, #f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              dream team?
            </span>
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Join hundreds of companies already hiring faster with SkyHire. Free to start, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register?role=hr"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white font-semibold text-sm transition-all hover:shadow-2xl hover:scale-[1.02]"
              style={{ color: '#3b82f6' }}
            >
              Start Hiring Free
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-sm border border-white/30 transition-all hover:bg-white/10 hover:scale-[1.02]"
            >
              Browse Jobs
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="text-xl font-bold" style={{ color: '#0f172a' }}>Sky</span>
              <span className="text-xl font-bold" style={{ color: '#3b82f6' }}>Hire</span>
            </div>
            <p className="text-sm text-gray-400 font-medium">
              Built for India's growing companies
            </p>
            <p className="text-sm text-gray-400">© 2026 SkyHire. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
