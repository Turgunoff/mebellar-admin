import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  email?: string;
  avatar_url?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      setAuth: (token: string, user: User) => {
        // Store in localStorage for API interceptor
        localStorage.setItem('token', token);
        localStorage.setItem('user_role', user.role);
        set({
          token,
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
