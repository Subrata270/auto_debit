import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { User, Role, SubRole } from "./types";

/**
 * Register a new user with Firebase Authentication and Firestore
 */
export const registerUser = async (
  email: string,
  password: string,
  userData: Omit<User, "id" | "email" | "password">
): Promise<User> => {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      "Firebase is not configured. Please add your Firebase credentials to .env.local file. Check FIREBASE_SETUP.md for instructions."
    );
  }

  try {
    // Create user in Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    // Create user document in Firestore
    const newUser: User = {
      id: userId,
      email,
      password: "", // Don't store password in Firestore
      ...userData,
    };

    // Save to Firestore users collection
    await setDoc(doc(db, "users", userId), {
      ...newUser,
      createdAt: new Date().toISOString(),
    });

    return newUser;
  } catch (error: any) {
    console.error("Registration error:", error);
    throw new Error(error.message || "Failed to register user");
  }
};

/**
 * Login user with Firebase Authentication
 */
export const loginUser = async (
  email: string,
  password: string,
  role: Role,
  subrole?: SubRole | null
): Promise<User | null> => {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      "Firebase is not configured. Please add your Firebase credentials to .env.local file. Check FIREBASE_SETUP.md for instructions."
    );
  }

  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      throw new Error("User data not found");
    }

    const userData = userDoc.data() as User;

    // Verify role matches
    if (userData.role !== role) {
      throw new Error("Invalid role for this portal");
    }

    // For finance role, verify subrole
    if (role === "finance" && userData.subrole !== subrole) {
      throw new Error("Invalid subrole for this portal");
    }

    return userData;
  } catch (error: any) {
    console.error("Login error:", error);
    return null;
  }
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured");
  }

  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error);
    throw new Error("Failed to logout");
  }
};

/**
 * Get current authenticated user from Firestore
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isFirebaseConfigured || !auth || !db) {
    return null;
  }

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as User;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Check if email already exists
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  if (!isFirebaseConfigured || !db) {
    return false;
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};
