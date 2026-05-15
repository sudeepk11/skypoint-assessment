export type UserRole = 'hr' | 'candidate';
export type JobStatus = 'open' | 'closed';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'remote';
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  // HR
  company_name?: string;
  company_website?: string;
  company_description?: string;
  // Candidate / shared
  headline?: string;
  skills?: string;          // JSON string — string[]
  // Social
  linkedin_url?: string;
  github_url?: string;
  glassdoor_url?: string;
  twitter_url?: string;
  portfolio_url?: string;
}

export interface UserPublic {
  id: string;
  full_name: string;
  role: UserRole;
  headline?: string;
  skills?: string;
  linkedin_url?: string;
  github_url?: string;
  glassdoor_url?: string;
  twitter_url?: string;
  portfolio_url?: string;
  company_name?: string;
}

export interface Connection {
  id: string;
  status: ConnectionStatus;
  requester: UserPublic;
  receiver: UserPublic;
}

export interface Suggestion {
  user: UserPublic;
  overlap: number;
  shared_skills: string[];
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  employment_type: EmploymentType;
  salary_range?: string;
  status: JobStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  applicant_count?: number;
  company_name?: string;
  skills?: string[];
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  resume_text: string;
  cover_letter?: string;
  status: ApplicationStatus;
  ai_evaluation?: string;  // JSON string
  applied_at: string;
  updated_at: string;
  job?: Job;
  candidate?: User;
}

export interface AIEvaluation {
  fit_score: number;
  strengths: string[];
  concerns: string[];
  recommendation: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
