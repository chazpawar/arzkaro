import { User } from 'firebase/auth';

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  pass: string;
}

export interface SignupCredentials {
  email: string;
  pass: string;
}
