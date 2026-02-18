import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
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
    // Handles Google redirect flow return on mobile browsers.
    getRedirectResult(auth).catch(() => {
      // Auth pages handle user-visible errors.
    });
  }, []);

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

  const upsertUserProfile = useCallback(async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const payload = {
        uid: user.uid,
        email: user.email || "",
        fullName: user.displayName || "",
        phone: user.phoneNumber || "",
        address: "",
        role: "customer",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, payload);
      setUserProfile({
        uid: user.uid,
        email: user.email || "",
        fullName: user.displayName || "",
        phone: user.phoneNumber || "",
        address: "",
        role: "customer",
      });
      return;
    }

    await setDoc(
      userRef,
      {
        email: user.email || "",
        fullName: userSnap.data()?.fullName || user.displayName || "",
        phone: userSnap.data()?.phone || user.phoneNumber || "",
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
    setUserProfile({ ...userSnap.data(), email: user.email || "" });
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
    await upsertUserProfile(cred.user);

    return cred;
  }, [upsertUserProfile]);

  const googleSignIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      await upsertUserProfile(cred.user);
      return cred;
    } catch (error) {
      const code = error?.code || "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw error;
    }
  }, [upsertUserProfile]);

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
      googleSignIn,
      updateProfileDetails,
      logout,
    }),
    [currentUser, googleSignIn, login, logout, profileLoading, signup, updateProfileDetails, userProfile]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
