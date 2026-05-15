import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { HRLayout } from '../../components/Layout';
import { jobs as jobsApi } from '../../services/api';
import type { EmploymentType, Job } from '../../types';
import SkillsInput from '../../components/SkillsInput';

interface FormData {
  title: string;
  location: string;
  employment_type: EmploymentType;
  salary_range: string;
  requirements: string;
  description: string;
  skills: string[];
}

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
];

type Currency = 'USD' | 'INR';
const CURRENCY_SYMBOL: Record<Currency, string> = { USD: '$', INR: '₹' };

const buildSalaryRange = (currency: Currency, min: string, max: string): string => {
  const sym = CURRENCY_SYMBOL[currency];
  if (!min && !max) return '';
  if (min && max) return `${sym}${Number(min).toLocaleString()} – ${sym}${Number(max).toLocaleString()} / year`;
  if (min) return `From ${sym}${Number(min).toLocaleString()} / year`;
  return `Up to ${sym}${Number(max).toLocaleString()} / year`;
};

/** Try to parse existing salary_range string back into currency + min/max */
const parseSalaryRange = (raw: string): { currency: Currency; min: string; max: string } => {
  const isINR = raw.includes('₹');
  const currency: Currency = isINR ? 'INR' : 'USD';
  const nums = raw.replace(/[^0-9,–\-]/g, '').split(/[–\-]/).map((s) => s.replace(/,/g, '').trim()).filter(Boolean);
  return { currency, min: nums[0] ?? '', max: nums[1] ?? '' };
};

const EditJob: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    title: '',
    location: '',
    employment_type: 'full_time',
    salary_range: '',
    requirements: '',
    description: '',
    skills: [],
  });
  const [originalJob, setOriginalJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Salary fields
  const [currency, setCurrency] = useState<Currency>('USD');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  const handleSalaryChange = (newCurrency: Currency, min: string, max: string) => {
    setCurrency(newCurrency);
    setSalaryMin(min);
    setSalaryMax(max);
    setForm((prev) => ({ ...prev, salary_range: buildSalaryRange(newCurrency, min, max) }));
  };

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const job = await jobsApi.get(id);
        setOriginalJob(job);
        setForm({
          title: job.title,
          location: job.location,
          employment_type: job.employment_type,
          salary_range: job.salary_range ?? '',
          requirements: job.requirements,
          description: job.description,
          skills: job.skills ?? [],
        });
        // Pre-fill salary fields by parsing existing value
        if (job.salary_range) {
          const parsed = parseSalaryRange(job.salary_range);
          setCurrency(parsed.currency);
          setSalaryMin(parsed.min);
          setSalaryMax(parsed.max);
        }
      } catch {
        setFetchError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = 'Job title is required.';
    if (!form.location.trim()) e.location = 'Location is required.';
    if (!form.requirements.trim()) e.requirements = 'Requirements are required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await jobsApi.update(id, form);
      navigate('/hr/jobs');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setSubmitError(axiosErr?.response?.data?.detail ?? 'Failed to update job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <HRLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 skeleton rounded" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </HRLayout>
    );
  }

  if (fetchError) {
    return (
      <HRLayout>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {fetchError}
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/hr/jobs')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Edit Job</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Editing: {originalJob?.title}</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 space-y-5">
            {submitError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-slate-700 dark:text-slate-100 ${
                  errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-slate-700 dark:text-slate-100 ${
                    errors.location ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-red-600">{errors.location}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) => set('employment_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white dark:bg-slate-700 dark:text-slate-100"
                >
                  {employmentTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Salary Range <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                {/* Currency toggle */}
                <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden flex-shrink-0">
                  {(['USD', 'INR'] as Currency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleSalaryChange(c, salaryMin, salaryMax)}
                      className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                        currency === c
                          ? 'bg-accent text-white'
                          : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {CURRENCY_SYMBOL[c]} {c}
                    </button>
                  ))}
                </div>
                {/* Min */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm font-medium">
                    {CURRENCY_SYMBOL[currency]}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={salaryMin}
                    onChange={(e) => handleSalaryChange(currency, e.target.value, salaryMax)}
                    placeholder="Min"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                  />
                </div>
                <span className="text-gray-400 dark:text-slate-500 font-medium text-sm flex-shrink-0">—</span>
                {/* Max */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm font-medium">
                    {CURRENCY_SYMBOL[currency]}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={salaryMax}
                    onChange={(e) => handleSalaryChange(currency, salaryMin, e.target.value)}
                    placeholder="Max"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                  />
                </div>
                <span className="text-gray-400 dark:text-slate-500 text-sm flex-shrink-0">/yr</span>
              </div>
              {form.salary_range && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400">Preview: {form.salary_range}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                rows={4}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none dark:bg-slate-700 dark:text-slate-100 ${
                  errors.requirements ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.requirements && (
                <p className="mt-1 text-xs text-red-600">{errors.requirements}</p>
              )}
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Skills Required
              </label>
              <SkillsInput
                value={form.skills}
                onChange={(skills) => setForm(prev => ({ ...prev, skills }))}
                placeholder="Add required skills (e.g. React, Python, SQL...)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={6}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none dark:bg-slate-700 dark:text-slate-100 ${
                  errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/hr/jobs')}
                className="px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </HRLayout>
  );
};

export default EditJob;
