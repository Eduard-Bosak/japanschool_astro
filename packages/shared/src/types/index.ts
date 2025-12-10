// Shared types for japanschool monorepo
// Move API types here for use across web, server, and portal

export interface LeadFormData {
  name: string;
  email: string;
  goal: string;
  level: string;
  message?: string;
  source: string;
}

export interface ProgramFormData {
  email: string;
  program: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface Submission extends LeadFormData {
  id: string;
  timestamp: string;
  ip?: string;
}
