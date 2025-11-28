export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface UserResponse {
  data: UserProfile | null;
  error: string | null;
}
