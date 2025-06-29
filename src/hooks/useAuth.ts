import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Memoize the mapSupabaseUserToAuthUser function to prevent unnecessary re-renders
  const mapSupabaseUserToAuthUser = useCallback((supabaseUser: User): AuthUser => {
    // Extract role from user metadata or default to student
    const role = supabaseUser.user_metadata?.role || 'student';
    const name = supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User';
    
    return {
      id: supabaseUser.id,
      name,
      email: supabaseUser.email || '',
      role: role as 'student' | 'teacher'
    };
  }, []);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          setUser(mapSupabaseUserToAuthUser(session.user));
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUserToAuthUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [mapSupabaseUserToAuthUser]);

  const signUp = async (email: string, password: string, name: string, role: 'student' | 'teacher') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  return {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    // Legacy methods for backward compatibility
    login: (userData: AuthUser) => setUser(userData),
    logout: signOut
  };
}