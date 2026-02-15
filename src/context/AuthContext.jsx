import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        setUserProfile(userSnap.exists() ? userSnap.data() : null);
      } finally {
        setLoading(false);
        setProfileLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = useCallback(async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const payload = {
      uid: cred.user.uid,
      email: cred.user.email,
      fullName: "",
      phone: "",
      address: "",
      role: "customer",
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", cred.user.uid), payload);
    setUserProfile({
      uid: cred.user.uid,
      email: cred.user.email,
      fullName: "",
      phone: "",
      address: "",
      role: "customer",
    });
    return cred;
  }, []);

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, "users", cred.user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: cred.user.uid,
        email: cred.user.email,
        fullName: "",
        phone: "",
        address: "",
        role: "customer",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setUserProfile({
        uid: cred.user.uid,
        email: cred.user.email,
        fullName: "",
        phone: "",
        address: "",
        role: "customer",
      });
    } else {
      await setDoc(
        userRef,
        {
          email: cred.user.email,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
      setUserProfile({ ...userSnap.data(), email: cred.user.email });
    }

    return cred;
  }, []);

  const updateProfileDetails = useCallback(async (values) => {
    if (!currentUser) return;

    const payload = {
      fullName: values.fullName?.trim() || "",
      phone: values.phone?.trim() || "",
      address: values.address?.trim() || "",
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", currentUser.uid), payload, { merge: true });
    setUserProfile((prev) => ({ ...(prev || {}), ...payload }));
  }, [currentUser]);

  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      isAdmin: userProfile?.role === "admin",
      profileLoading,
      signup,
      login,
      updateProfileDetails,
      logout,
    }),
    [currentUser, login, logout, profileLoading, signup, updateProfileDetails, userProfile]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
