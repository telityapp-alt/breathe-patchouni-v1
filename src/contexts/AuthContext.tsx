import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: any | null;
  user: any | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if user previously selected guest mode in this session
    const guestState = localStorage.getItem('isGuest') === 'true';
    if (guestState) setIsGuest(true);

    // Default to guest since we are fully offline
    setIsGuest(true);
    setLoading(false);
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
  };

  const signOut = async () => {
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
