import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Fetch or create user document
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const newUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: 'user',
            };
            await setDoc(userRef, newUser);
            setProfile(newUser);
          } else {
            setProfile(userSnap.data());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
