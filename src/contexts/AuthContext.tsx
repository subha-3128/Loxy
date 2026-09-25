import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService, isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemo: (email?: string, name?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (mounted && data?.session?.user) {
            setUser(data.session.user);
          }
          
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
              setUser(session?.user ?? null);
              setLoading(false);
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Local developer session check
          const demoUser = await authService.getCurrentUser();
          if (mounted && demoUser) {
            setUser(demoUser);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      if (!isSupabaseConfigured) {
        const demoUser = await authService.getCurrentUser();
        setUser(demoUser);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = (email?: string, name?: string) => {
    const demo = authService.signInDemoUser(email, name);
    setUser(demo);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        signInWithGoogle,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
