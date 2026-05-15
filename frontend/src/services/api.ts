import axios, { AxiosError } from 'axios';
import type { AuthResponse, User, Job, Application, ApplicationStatus, JobStatus } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Send the HttpOnly auth cookie on every request
  withCredentials: true,
});

// Response interceptor: handle 401 (redirect to login, but not on the login endpoint itself)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Authentication — register, login, logout, current user. */
export const auth = {
  register: (data: { email: string; password: string; full_name: string; role: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: () => api.post('/auth/logout').catch(() => {}),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
};

/** Jobs — list, create, update, toggle status, delete. */
export const jobs = {
  list: (params?: { search?: string; status?: string; employment_type?: string; location?: string; skills?: string }) =>
    api.get<Job[]>('/jobs', { params }).then((r) => r.data),

  get: (id: string) => api.get<Job>(`/jobs/${id}`).then((r) => r.data),

  create: (data: Partial<Job>) => api.post<Job>('/jobs', data).then((r) => r.data),

  update: (id: string, data: Partial<Job>) =>
    api.put<Job>(`/jobs/${id}`, data).then((r) => r.data),

  toggleStatus: (id: string, status: JobStatus) =>
    api.patch<Job>(`/jobs/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) => api.delete(`/jobs/${id}`).then((r) => r.data),

  hrList: () => api.get<Job[]>('/hr/jobs').then((r) => r.data),
};

/** Applications — apply, list, get, update status. */
export const applications = {
  apply: (jobId: string, data: { resume_text: string; cover_letter?: string }) =>
    api.post<Application>(`/jobs/${jobId}/apply`, data).then((r) => r.data),

  list: (params?: { job_id?: string; status?: string; candidate_id?: string }) =>
    api.get<Application[]>('/applications', { params }).then((r) => r.data),

  get: (id: string) => api.get<Application>(`/applications/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: ApplicationStatus) =>
    api.patch<Application>(`/applications/${id}/status`, { status }).then((r) => r.data),
};

/** Email — send bulk status notifications. */
export const email = {
  sendBulk: (applicationIds: string[], subject: string, body: string) =>
    api
      .post('/email/bulk', { application_ids: applicationIds, subject, body })
      .then((r) => r.data),
};

/** Dashboard — HR and candidate summary stats. */
export const dashboard = {
  hr: () => api.get('/dashboard/hr').then((r) => r.data),
  candidate: () => api.get('/dashboard/candidate').then((r) => r.data),
};

/** Profile — get, update, change password. */
export const profile = {
  get: () => api.get<User>('/profile').then((r) => r.data),
  update: (data: Partial<User & { company_name?: string; company_website?: string; company_description?: string }>) =>
    api.put<User>('/profile', data).then((r) => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.put('/profile/password', { current_password, new_password }).then((r) => r.data),
};

export default api;
