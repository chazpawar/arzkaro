// Stub AuthContext - to be removed later
import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: null;
  profile: null;
  loading: false;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, profile: null, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
