import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { Subscription, AppNotification, SubscriptionStatus } from "./types";

// Helper to ensure db is available
const ensureFirestore = () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      "Firebase is not configured. Please add your Firebase credentials to .env.local"
    );
  }
  return db;
};

/**
 * Add a new subscription request to Firestore
 */
export const addSubscriptionRequest = async (
  subscription: Omit<Subscription, "id" | "status" | "requestDate">
): Promise<string> => {
  const firestore = ensureFirestore();

  try {
    const subscriptionsRef = collection(firestore, "subscriptions");
    const newSubscription = {
      ...subscription,
      status: "Pending" as SubscriptionStatus,
      requestDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(subscriptionsRef, newSubscription);
    return docRef.id;
  } catch (error) {
    console.error("Error adding subscription:", error);
    throw new Error("Failed to create subscription request");
  }
};

/**
 * Get all subscriptions
 */
export const getAllSubscriptions = async (): Promise<Subscription[]> => {
  const firestore = ensureFirestore();

  try {
    const subscriptionsRef = collection(firestore, "subscriptions");
    const querySnapshot = await getDocs(subscriptionsRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subscription[];
  } catch (error) {
    console.error("Error getting subscriptions:", error);
    return [];
  }
};

/**
 * Get subscriptions by user ID
 */
export const getSubscriptionsByUser = async (
  userId: string
): Promise<Subscription[]> => {
  const firestore = ensureFirestore();

  try {
    const subscriptionsRef = collection(firestore, "subscriptions");
    const q = query(subscriptionsRef, where("requestedBy", "==", userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subscription[];
  } catch (error) {
    console.error("Error getting user subscriptions:", error);
    return [];
  }
};

/**
 * Get subscriptions by department
 */
export const getSubscriptionsByDepartment = async (
  department: string
): Promise<Subscription[]> => {
  const firestore = ensureFirestore();

  try {
    const subscriptionsRef = collection(firestore, "subscriptions");
    const q = query(subscriptionsRef, where("department", "==", department));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subscription[];
  } catch (error) {
    console.error("Error getting department subscriptions:", error);
    return [];
  }
};

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = async (
  subscriptionId: string,
  status: SubscriptionStatus,
  approverId?: string
): Promise<void> => {
  const firestore = ensureFirestore();

  try {
    const subscriptionRef = doc(firestore, "subscriptions", subscriptionId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === "Approved" && approverId) {
      updateData.approvedBy = approverId;
      updateData.approvalDate = new Date().toISOString();
    }

    await updateDoc(subscriptionRef, updateData);
  } catch (error) {
    console.error("Error updating subscription status:", error);
    throw new Error("Failed to update subscription status");
  }
};

/**
 * Mark subscription as paid
 */
export const markSubscriptionAsPaid = async (
  subscriptionId: string,
  payerId: string
): Promise<void> => {
  const firestore = ensureFirestore();

  try {
    const subscriptionRef = doc(firestore, "subscriptions", subscriptionId);
    await updateDoc(subscriptionRef, {
      status: "Paid",
      paidBy: payerId,
      paymentDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking as paid:", error);
    throw new Error("Failed to mark subscription as paid");
  }
};

/**
 * Renew a subscription
 */
export const renewSubscription = async (
  subscriptionId: string,
  renewalDuration: number,
  updatedCost: number,
  remarks: string,
  requestedBy: string
): Promise<string> => {
  const firestore = ensureFirestore();

  try {
    // Get the existing subscription
    const subscriptionRef = doc(firestore, "subscriptions", subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      throw new Error("Subscription not found");
    }

    const existingSub = subscriptionDoc.data() as Subscription;

    // Create a new renewal request
    const renewalRequest = {
      ...existingSub,
      duration: renewalDuration,
      cost: updatedCost,
      remarks,
      status: "Pending" as SubscriptionStatus,
      requestDate: new Date().toISOString(),
      requestedBy,
      approvedBy: undefined,
      approvalDate: undefined,
      paidBy: undefined,
      paymentDate: undefined,
      createdAt: serverTimestamp(),
    };

    const subscriptionsRef = collection(firestore, "subscriptions");
    const docRef = await addDoc(subscriptionsRef, renewalRequest);
    return docRef.id;
  } catch (error) {
    console.error("Error renewing subscription:", error);
    throw new Error("Failed to renew subscription");
  }
};

/**
 * Add a notification to Firestore
 */
export const addNotification = async (
  userId: string,
  message: string
): Promise<string> => {
  const firestore = ensureFirestore();

  try {
    const notificationsRef = collection(firestore, "notifications");
    const notification = {
      userId,
      message,
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(notificationsRef, notification);
    return docRef.id;
  } catch (error) {
    console.error("Error adding notification:", error);
    throw new Error("Failed to create notification");
  }
};

/**
 * Get notifications for a user
 */
export const getNotificationsByUser = async (
  userId: string
): Promise<AppNotification[]> => {
  const firestore = ensureFirestore();

  try {
    const notificationsRef = collection(firestore, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AppNotification[];
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  const firestore = ensureFirestore();

  try {
    const notificationRef = doc(firestore, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
};

/**
 * Get user by ID from Firestore
 */
export const getUserById = async (userId: string) => {
  const firestore = ensureFirestore();

  try {
    const userDoc = await getDoc(doc(firestore, "users", userId));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: string) => {
  const firestore = ensureFirestore();

  try {
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting users by role:", error);
    return [];
  }
};
