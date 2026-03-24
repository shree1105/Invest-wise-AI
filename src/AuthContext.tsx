import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'shreeb766@gmail.com';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  isAdmin: false,
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
        // Determine role: admin if email matches, else user
        const role = currentUser.email === ADMIN_EMAIL ? 'admin' : 'user';

        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            // First sign-in — create document with correct role
            const newUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role,
            };
            await setDoc(userRef, newUser);
            setProfile(newUser);
          } else {
            const existingData = userSnap.data();

            // If the email is the admin email but role was saved as 'user'
            // (e.g. created before this fix), patch it silently
            if (currentUser.email === ADMIN_EMAIL && existingData.role !== 'admin') {
              const patched = { ...existingData, role: 'admin' };
              await setDoc(userRef, patched);
              setProfile(patched);
            } else {
              setProfile(existingData);
            }
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

  // Derive isAdmin from profile so consumers don't have to repeat the check
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
