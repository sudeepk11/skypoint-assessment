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
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #060e1e 0%, #0a1628 55%, #0d1f3c 100%)' }}
      >
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />

        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #3b82f6 40%, #06b6d4 60%, transparent 100%)' }}
        />

        {/* Gradient orbs */}
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.35), transparent 65%)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.2), transparent 65%)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', filter: 'blur(60px)' }}
        />

        {/* Main content grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-0 lg:min-h-screen lg:flex lg:items-center w-full">
          <div className="grid lg:grid-cols-[1fr,1.05fr] gap-10 xl:gap-16 items-center w-full">

            {/* ── LEFT: Copy ── */}
            <div className="text-center lg:text-left">

              {/* Eyebrow badge */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 border"
                style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)', color: '#93c5fd' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block flex-shrink-0" />
                Powered by Skypoint AI · Now in Beta
              </div>

              {/* Headline */}
              <h1 className="font-black text-white leading-[1.02] tracking-tight mb-6">
                <span className="block" style={{ fontSize: 'clamp(42px, 6.5vw, 80px)' }}>Recruit</span>
                <span
                  className="block"
                  style={{
                    fontSize: 'clamp(42px, 6.5vw, 80px)',
                    background: 'linear-gradient(90deg, #60a5fa 0%, #38bdf8 60%, #34d399 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Smarter.
                </span>
                <span className="block" style={{ fontSize: 'clamp(42px, 6.5vw, 80px)' }}>Hire</span>
                <span
                  className="block"
                  style={{
                    fontSize: 'clamp(42px, 6.5vw, 80px)',
                    background: 'linear-gradient(90deg, #60a5fa 0%, #38bdf8 60%, #34d399 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Faster.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-white/55 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
                The all-in-one ATS for modern teams. AI-generated job descriptions,
                intelligent resume screening, and bulk candidate communication — fully automated.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-12">
                <Link
                  to="/register?role=hr"
                  className="group flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.03] active:scale-[0.99]"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    boxShadow: '0 0 0 1px rgba(59,130,246,0.4), 0 10px 36px rgba(37,99,235,0.45)',
                  }}
                >
                  Start Hiring Free
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/register"
                  className="group flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border transition-all hover:bg-white/[0.06] active:scale-[0.99]"
                  style={{ color: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  Find Jobs
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Trust strip */}
              <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap">
                {/* Avatars */}
                <div className="flex -space-x-2.5">
                  {(
                    [
                      { bg: '#3b82f6', letter: 'S' },
                      { bg: '#06b6d4', letter: 'K' },
                      { bg: '#10b981', letter: 'A' },
                      { bg: '#8b5cf6', letter: 'R' },
                      { bg: '#f59e0b', letter: 'M' },
                    ] as { bg: string; letter: string }[]
                  ).map((av, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 flex-shrink-0"
                      style={{ borderColor: '#060e1e', background: av.bg }}
                    >
                      {av.letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-amber-400 text-xs">★</span>
                    ))}
                  </div>
                  <p className="text-white/40 text-xs leading-none">
                    Trusted by <span className="text-white/60 font-semibold">500+</span> companies · <span className="text-white/60 font-semibold">8k+</span> job seekers
                  </p>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Dashboard mockup ── */}
            <div className="hidden lg:block relative mt-8 lg:mt-0">

              {/* Floating chip — top left */}
              <div
                className="absolute -top-5 -left-5 z-20 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  background: 'rgba(6,14,30,0.92)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
                  color: '#34d399',
                }}
              >
                <CheckCircle size={14} />
                94% Hire Rate
              </div>

              {/* Floating chip — bottom right */}
              <div
                className="absolute -bottom-5 -right-5 z-20 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  background: 'rgba(6,14,30,0.92)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
                  color: '#fbbf24',
                }}
              >
                <Zap size={13} />
                2× Faster Hiring
              </div>

              {/* Main mock card */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(10,20,40,0.88)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 0 1px rgba(59,130,246,0.08), 0 40px 90px rgba(0,0,0,0.6)',
                }}
              >
                {/* Window chrome */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.7)' }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(245,158,11,0.7)' }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.7)' }} />
                    </div>
                    <span className="text-white/30 text-xs font-medium ml-1">SkyHire — Applications</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    <span className="text-green-400 text-[11px] font-semibold">Live</span>
                  </div>
                </div>

                {/* Mini stats row */}
                <div
                  className="grid grid-cols-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {(
                    [
                      { label: 'Open Jobs',   value: '24', delta: '+3 this week',  deltaColor: '#34d399' },
                      { label: 'Applicants',  value: '138', delta: '+12 today',    deltaColor: '#34d399' },
                      { label: 'Shortlisted', value: '31',  delta: '22% rate',     deltaColor: '#60a5fa' },
                    ] as { label: string; value: string; delta: string; deltaColor: string }[]
                  ).map((s, i) => (
                    <div
                      key={i}
                      className="px-4 py-3"
                      style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
                    >
                      <p className="text-white/35 text-[9px] font-semibold uppercase tracking-wide mb-1">{s.label}</p>
                      <p className="text-white font-bold text-xl leading-none mb-0.5">{s.value}</p>
                      <p className="text-[10px] font-medium" style={{ color: s.deltaColor }}>{s.delta}</p>
                    </div>
                  ))}
                </div>

                {/* Candidate list */}
                <div className="px-4 py-4">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-3 px-1">Recent Applications</p>
                  <div className="space-y-0.5">
                    {(
                      [
                        { name: 'Sarah Kim',    role: 'Senior Frontend Dev',  status: 'Shortlisted', sColor: '#34d399', sBg: 'rgba(52,211,153,0.1)',  av: '#3b82f6', init: 'SK', score: '9.2' },
                        { name: 'James Thorne', role: 'Product Manager',      status: 'Reviewing',   sColor: '#60a5fa', sBg: 'rgba(96,165,250,0.1)',  av: '#8b5cf6', init: 'JT', score: '8.7' },
                        { name: 'Anika Patel',  role: 'Data Analyst',         status: 'Pending',     sColor: '#fbbf24', sBg: 'rgba(251,191,36,0.1)',  av: '#06b6d4', init: 'AP', score: '7.9' },
                        { name: 'Rohan Mehta',  role: 'Backend Engineer',     status: 'Reviewing',   sColor: '#60a5fa', sBg: 'rgba(96,165,250,0.1)',  av: '#f59e0b', init: 'RM', score: '8.4' },
                      ] as { name: string; role: string; status: string; sColor: string; sBg: string; av: string; init: string; score: string }[]
                    ).map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl"
                        style={{ background: i === 0 ? 'rgba(59,130,246,0.07)' : 'transparent' }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ background: c.av }}
                        >
                          {c.init}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold leading-none mb-0.5 truncate">{c.name}</p>
                          <p className="text-white/35 text-[10px] truncate">{c.role}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-bold" style={{ color: '#60a5fa' }}>{c.score}</span>
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: c.sColor, background: c.sBg }}
                          >
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI bar */}
                <div
                  className="mx-4 mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(6,182,212,0.08))',
                    border: '1px solid rgba(59,130,246,0.18)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                  >
                    <Zap size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold leading-none mb-0.5">AI Evaluation Ready</p>
                    <p className="text-white/35 text-[10px]">Analyse resume fit in 1 click</p>
                  </div>
                  <div
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}
                  >
                    Run →
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.22)' }}>
          <span className="text-[10px] tracking-widest uppercase font-medium">Scroll</span>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }} />
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
