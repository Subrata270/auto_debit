
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Subscription, AppNotification, Role, SubRole } from '@/lib/types';
import { add, formatISO } from 'date-fns';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, getDoc, addDoc, updateDoc } from 'firebase/firestore';

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  register: (userData: Omit<User, 'id' | 'googleUid'>) => Promise<void>;
  login: (email: string, password: string, role: Role, subrole?: SubRole) => Promise<User | null>;
  loginWithGoogle: (role: Role, subrole?: SubRole) => Promise<User | null>;
  logout: () => Promise<void>;
  addSubscriptionRequest: (request: Omit<Subscription, 'id' | 'status' | 'requestDate' | 'requestedBy'>) => void;
  renewSubscription: (subscriptionId: string, renewalDuration: number, updatedCost: number, remarks: string, alertDays: number) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: 'Approved by HOD' | 'Declined by HOD', approverId: string, declineReason?: string) => void;
  updateFinanceStatus: (subscriptionId: string, status: 'Approved by APA' | 'Declined by APA', approverId: string, declineReason?: string) => void;
  markAsPaid: (subscriptionId: string, payerId: string, paymentDetails: { mode: string, transactionId?: string, date: string }) => void;
  addNotification: (userId: string, message: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      register: async (userData) => {
        if (!userData.email) {
            throw new Error('Email is required.');
        }
        if (!userData.password || userData.password.length < 6) {
          throw new Error('Password is required and must be at least 6 characters long.');
        }

        const { auth, firestore } = initializeFirebase();
        const normalizedEmail = userData.email.trim().toLowerCase();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, userData.password);
            const firebaseUser = userCredential.user;

            const newUser: Omit<User, 'id'> & { id: string } = {
                id: firebaseUser.uid,
                name: userData.name,
                email: normalizedEmail,
                role: userData.role,
                department: userData.department,
                subrole: userData.role === 'finance' ? (userData.subrole || 'apa') : null,
            };

            const userDocRef = doc(firestore, "users", firebaseUser.uid);
            await setDoc(userDocRef, newUser);

            set({ currentUser: newUser });

        } catch (error: any) {
            console.error("Registration failed:", error);
            throw error;
        }
      },

      login: async (email, password, role, subrole = null) => {
        const { auth, firestore } = initializeFirebase();
        const normalizedEmail = email.trim().toLowerCase();
        
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const firebaseUser = userCredential.user;

        const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
        if (!userDoc.exists()) {
            await signOut(auth);
            throw new Error("User profile not found in database.");
        }

        const appUser = userDoc.data() as User;

        if (appUser.role !== role || (role === 'finance' && appUser.subrole !== subrole)) {
            await signOut(auth);
            throw new Error("Access Denied: Your account role does not match this portal.");
        }
        
        set({ currentUser: appUser });
        get().addNotification(appUser.id, `Welcome back, ${appUser.name}!`);
        return appUser;
      },

      loginWithGoogle: async (role, subrole = null) => {
        const { auth, firestore } = initializeFirebase();
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;

            if (!googleUser.email) {
                throw new Error("Could not retrieve email from Google account.");
            }
            
            const userDocRef = doc(firestore, "users", googleUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const newUser: User = {
                    id: googleUser.uid,
                    name: googleUser.displayName || 'New User',
                    email: googleUser.email,
                    role: role,
                    subrole: subrole,
                    department: 'Unassigned',
                    googleUid: googleUser.uid,
                };
                await setDoc(userDocRef, newUser);
                set({ currentUser: newUser });
                get().addNotification(newUser.id, `Welcome, ${newUser.name}! Your account has been created.`);
                return newUser;
            }

            const appUser = userDoc.data() as User;
            const isRoleMatch = appUser.role === role;
            const isSubRoleMatch = role !== 'finance' || appUser.subrole === subrole;

            if (isRoleMatch && isSubRoleMatch) {
                set({ currentUser: appUser });
                get().addNotification(appUser.id, `Welcome back, ${appUser.name}!`);
                return appUser;
            } else {
                 await signOut(auth);
                 throw new Error("Access Denied: Your Google account does not match this portal's role.");
            }
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                 throw new Error("Login cancelled. Please try again.");
            }
            throw error;
        }
      },

      logout: async () => {
        const { auth } = initializeFirebase();
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
        set({ currentUser: null });
      },
      
      addSubscriptionRequest: async (request) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        const { firestore } = initializeFirebase();

        const newSubscription: Omit<Subscription, 'id'> = {
          ...request,
          status: 'Pending',
          requestDate: formatISO(new Date()),
          requestedBy: currentUser.id,
        };

        const docRef = await addDoc(collection(firestore, 'subscriptions'), newSubscription);
        await updateDoc(docRef, { id: docRef.id });


        get().addNotification(currentUser.id, `Your request for ${request.toolName} has been submitted.`);
        
        // This part needs to query users, which is complex for a store.
        // Let's assume a notification is created. A backend function would be better here.
      },

      renewSubscription: async (subscriptionId, renewalDuration, updatedCost, remarks, alertDays) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const { firestore } = initializeFirebase();
        const subsCollection = collection(firestore, 'subscriptions');
        const originalSubDoc = await getDoc(doc(subsCollection, subscriptionId));

        if(!originalSubDoc.exists()) return;
        const existingSub = originalSubDoc.data();
        
        const renewalRequest: Omit<Subscription, 'id'> = {
          ...existingSub,
          duration: renewalDuration,
          cost: updatedCost,
          remarks,
          alertDays,
          status: 'Pending',
          requestDate: formatISO(new Date()),
          requestedBy: currentUser.id,
          approvedBy: undefined,
          approvalDate: undefined,
          paidBy: undefined,
          paymentDate: undefined,
        };

        const docRef = await addDoc(subsCollection, renewalRequest);
        await updateDoc(docRef, { id: docRef.id });
        
        get().addNotification(currentUser.id, `Your renewal request for ${existingSub.toolName} has been submitted.`);
      },
      
      updateSubscriptionStatus: async (subscriptionId, status, approverId, reason) => {
        const { firestore } = initializeFirebase();
        const subDocRef = doc(firestore, 'subscriptions', subscriptionId);
        
        const updateData: Partial<Subscription> = {
            status,
            approvedBy: approverId,
            approvalDate: formatISO(new Date()),
        };
        if (status === 'Declined by HOD' && reason) {
            updateData.remarks = `Declined by HOD: ${reason}`;
        }
        
        await updateDoc(subDocRef, updateData);
        const subDoc = await getDoc(subDocRef);
        const sub = subDoc.data() as Subscription;

        if (status === 'Approved by HOD') {
            get().addNotification(sub.requestedBy, `Your request for ${sub.toolName} has been approved by the HOD.`);
        } else if (status === 'Declined by HOD') {
            get().addNotification(sub.requestedBy, `Your request for ${sub.toolName} has been declined by HOD. Reason: ${reason}`);
        }
      },

      updateFinanceStatus: async (subscriptionId, status, approverId, reason) => {
        const { firestore } = initializeFirebase();
        const subDocRef = doc(firestore, 'subscriptions', subscriptionId);

        const updateData: Partial<Subscription> = {
            status,
            apaApprovedBy: approverId,
            apaApprovalDate: formatISO(new Date()),
        };
        if (status === 'Declined by APA' && reason) {
            updateData.remarks = `Declined by APA: ${reason}`;
        }

        await updateDoc(subDocRef, updateData);
        const subDoc = await getDoc(subDocRef);
        const sub = subDoc.data() as Subscription;

        if (status === 'Approved by APA') {
            get().addNotification(sub.requestedBy, `Your request for ${sub.toolName} has been approved by Finance.`);
        } else if (status === 'Declined by APA') {
            get().addNotification(sub.requestedBy, `Your request for ${sub.toolName} has been declined by Finance. Reason: ${reason}`);
        }
      },

      markAsPaid: async (subscriptionId, payerId, paymentDetails) => {
        const { firestore } = initializeFirebase();
        const subDocRef = doc(firestore, 'subscriptions', subscriptionId);
        const subDoc = await getDoc(subDocRef);
        const sub = subDoc.data() as Subscription;

        const updateData: Partial<Subscription> = {
            status: 'Active',
            paidBy: payerId,
            paymentDate: paymentDetails.date,
            expiryDate: formatISO(add(new Date(paymentDetails.date), { months: sub.duration })),
            paymentDetails: {
                mode: paymentDetails.mode,
                transactionId: paymentDetails.transactionId,
            },
            remarks: `Paid via ${paymentDetails.mode}`
        };

        await updateDoc(subDocRef, updateData);
        
        get().addNotification(sub.requestedBy, `Payment for ${sub.toolName} has been completed. Your subscription is now active.`);
      },

      addNotification: async (userId, message) => {
        const { firestore } = initializeFirebase();
        const newNotification: Omit<AppNotification, 'id'> = {
          userId,
          message,
          isRead: false,
          createdAt: formatISO(new Date()),
        };
        const docRef = await addDoc(collection(firestore, 'notifications'), newNotification);
        await updateDoc(docRef, {id: docRef.id});
      },

    }),
    {
      name: 'autotrack-pro-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
