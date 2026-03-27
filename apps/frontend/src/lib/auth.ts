import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export const loginWithGoogle = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await setPersistence(auth, browserLocalPersistence);
  await signInWithPopup(auth, provider);
};

export const observeAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const logout = (): Promise<void> => {
  return signOut(auth);
};
