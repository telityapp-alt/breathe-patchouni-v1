import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if user previously selected guest mode in this session
    const guestState = localStorage.getItem('isGuest') === 'true';
    if (guestState) setIsGuest(true);

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
           setIsGuest(false);
           localStorage.removeItem('isGuest');
        }
      });

      return () => subscription.unsubscribe();
    } else {
        // If Supabase not configured, default to guest
        setIsGuest(true);
        setLoading(false);
    }
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
  };

  const signOut = async () => {
    if (supabase) {
       await supabase.auth.signOut();
    }
    setIsGuest(false);
    localStorage.removeItem('isGuest');
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isGuest, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
