import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, DollarSign, CheckCircle, Briefcase, Building2, X } from 'lucide-react';
import { CandidateLayout } from '../../components/Layout';
import { jobs as jobsApi, applications as appApi } from '../../services/api';
import type { Job, EmploymentType, Application } from '../../types';

const POPULAR_SKILLS = ['React', 'Python', 'SQL', 'JavaScript', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Java', 'Machine Learning', 'PostgreSQL', 'Go'];

type SalaryFilter = 'any' | 'entry' | 'mid' | 'senior';

function parseSalaryMax(salaryRange: string | undefined): number | null {
  if (!salaryRange) return null;
  const nums = salaryRange.replace(/[^\d,]/g, ' ').trim().split(/\s+/).map(s => parseInt(s.replace(/,/g, ''), 10)).filter(n => !isNaN(n));
  return nums.length > 0 ? Math.max(...nums) : null;
}

function matchesSalaryFilter(salaryRange: string | undefined, filter: SalaryFilter): boolean {
  if (filter === 'any') return true;
  const max = parseSalaryMax(salaryRange);
  if (max === null) return false;
  const isINR = salaryRange?.includes('₹') ?? false;
  if (isINR) {
    const maxL = max / 100000;
    if (filter === 'entry') return maxL <= 15;
    if (filter === 'mid') return maxL > 15 && maxL <= 30;
    if (filter === 'senior') return maxL > 30;
  } else {
    if (filter === 'entry') return max <= 80000;
    if (filter === 'mid') return max > 80000 && max <= 130000;
    if (filter === 'senior') return max > 130000;
  }
  return true;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  if (diff < 30) return `${diff} days ago`;
  const months = Math.floor(diff / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
};

const formatType = (t: EmploymentType) => {
  const map: Record<EmploymentType, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
  };
  return map[t] ?? t;
};

const typeColors: Record<EmploymentType, string> = {
  full_time: 'bg-blue-100 text-blue-700',
  part_time: 'bg-purple-100 text-purple-700',
  contract: 'bg-orange-100 text-orange-700',
  remote: 'bg-green-100 text-green-700',
};

const employmentTypes: EmploymentType[] = ['full_time', 'part_time', 'contract', 'remote'];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const JobBoard: React.FC = () => {
  const [jobList, setJobList] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EmploymentType | ''>('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [salaryFilter, setSalaryFilter] = useState<SalaryFilter>('any');

  const debouncedSearch = useDebounce(search, 300);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: 'open' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.employment_type = typeFilter;
      if (locationFilter) params.location = locationFilter;
      const data = await jobsApi.list(params);
      setJobList(data);
    } catch {
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, locationFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        const data = await appApi.list();
        setMyApplications(data);
      } catch {
        // ignore
      }
    };
    fetchMyApps();
  }, []);

  const appliedJobIds = new Set(myApplications.map((a) => a.job_id));

  const filteredJobs = jobList.filter(job => {
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.every(sk => (job.skills || []).some(s => s.toLowerCase() === sk.toLowerCase()));
    const matchesSalary = matchesSalaryFilter(job.salary_range, salaryFilter);
    return matchesSkills && matchesSalary;
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const hasActiveFilters = selectedSkills.length > 0 || locationFilter || salaryFilter !== 'any' || typeFilter;

  const clearAllFilters = () => {
    setSearch('');
    setTypeFilter('');
    setLocationFilter('');
    setSelectedSkills([]);
    setSalaryFilter('any');
  };

  return (
    <CandidateLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Browse Jobs</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Find your next opportunity from {filteredJobs.length} open position{filteredJobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search + filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-6 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job titles..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Type:</span>
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === ''
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {employmentTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {formatType(t)}
            </button>
          ))}

          <div className="ml-2 relative">
            <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location..."
              className="pl-8 pr-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent w-32 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>

          {/* Salary filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Salary:</span>
            {(['any', 'entry', 'mid', 'senior'] as SalaryFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setSalaryFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  salaryFilter === s
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {s === 'any' ? 'Any' : s === 'entry' ? 'Entry' : s === 'mid' ? 'Mid' : 'Senior'}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>

        {/* Skills filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Skills:</span>
          {POPULAR_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSkills.includes(skill)
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-5">
          {error}
        </div>
      )}

      {/* Job cards grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-5 w-3/4 skeleton rounded mb-3" />
              <div className="h-4 w-1/2 skeleton rounded mb-4" />
              <div className="h-8 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-gray-300 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-600 dark:text-slate-300 mb-2">No jobs found</h3>
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            Try adjusting your search or filters to find more results.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-4 text-sm text-accent hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => {
            const alreadyApplied = appliedJobIds.has(job.id);
            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Job type badge */}
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      typeColors[job.employment_type]
                    }`}
                  >
                    {formatType(job.employment_type)}
                  </span>
                  {alreadyApplied && (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle size={12} />
                      Applied
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1 leading-snug">
                  {job.title}
                </h3>

                {/* Company */}
                {job.company_name && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300 font-medium mb-1">
                    <Building2 size={11} />
                    {job.company_name}
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mb-2">
                  <MapPin size={11} />
                  {job.location}
                </div>

                {/* Salary */}
                {job.salary_range && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mb-2">
                    <DollarSign size={11} />
                    {job.salary_range}
                  </div>
                )}

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {job.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full text-xs">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Posted */}
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 mb-4">
                  <Clock size={11} />
                  {formatDate(job.created_at)}
                </div>

                {/* CTA */}
                <Link
                  to={`/candidate/jobs/${job.id}`}
                  className={`block w-full text-center text-sm font-semibold py-2 rounded-lg transition-colors ${
                    alreadyApplied
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-accent text-white hover:bg-blue-700'
                  }`}
                >
                  {alreadyApplied ? 'View Application ✓' : 'View & Apply →'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </CandidateLayout>
  );
};

export default JobBoard;
