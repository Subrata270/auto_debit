
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Subscription, AppNotification, Role, SubRole, SubscriptionStatus } from '@/lib/types';
import { mockUsers, mockSubscriptions, mockNotifications, departmentHODs } from '@/lib/data';
import { add, formatISO } from 'date-fns';
import { getAuth, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

interface AppState {
  users: User[];
  subscriptions: Subscription[];
  notifications: AppNotification[];
  currentUser: User | null;
  register: (user: Omit<User, 'id' | 'googleUid'>) => void;
  login: (email: string, password: string, role: Role, subrole?: SubRole) => User | null;
  loginWithGoogle: (role: Role, subrole?: SubRole) => Promise<User | null>;
  logout: () => void;
  addSubscriptionRequest: (request: Omit<Subscription, 'id' | 'status' | 'requestDate'>) => void;
  renewSubscription: (subscriptionId: string, renewalDuration: number, updatedCost: number, remarks: string, alertDays: number) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: 'Approved by HOD' | 'Declined', approverId: string, declineReason?: string) => void;
  approveByAPA: (subscriptionId: string, apaId: string) => void;
  markAsPaid: (subscriptionId: string, payerId: string, paymentMode: string) => void;
  addNotification: (userId: string, message: string) => void;
  readNotification: (notificationId: string) => void;
}

const generateId = () => `id-${new Date().getTime()}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      subscriptions: mockSubscriptions,
      notifications: mockNotifications,
      currentUser: null,

      register: (userData) => {
        const { users } = get();
        const normalizedEmail = userData.email.trim().toLowerCase();
        const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
        if (existingUser) {
          throw new Error('An account with this email already exists.');
        }

        const newUser: User = {
          ...userData,
          email: normalizedEmail,
          id: generateId(),
          subrole: userData.role === 'finance' ? (userData.subrole || null) : null,
        };

        set(state => ({
          users: [...state.users, newUser],
        }));
      },

      login: (email, password, role, subrole = null) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find(
          (u) =>
            u.email.toLowerCase() === normalizedEmail &&
            u.password === password &&
            u.role === role &&
            (role !== 'finance' || u.subrole === subrole)
        );

        if (user) {
          set({ currentUser: user });
          get().addNotification(user.id, `Welcome back, ${user.name}! You've successfully logged in.`);
          return user;
        }
        throw new Error("Invalid credentials or wrong portal.");
      },

      loginWithGoogle: async (role, subrole = null) => {
        const { auth } = initializeFirebase();
        auth.tenantId = 'autosubscription-6c04a.firebaseapp.com';
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;

            if (!googleUser.email) {
                throw new Error("Could not retrieve email from Google account.");
            }
            
            const normalizedEmail = googleUser.email.trim().toLowerCase();
            const appUser = get().users.find(u => u.email.toLowerCase() === normalizedEmail);
            
            if (!appUser) {
                // For demo purposes, creating a new user if not found.
                // In a real app, you might want to throw an error or handle it differently.
                const newUser: User = {
                    id: generateId(),
                    name: googleUser.displayName || 'New User',
                    email: normalizedEmail,
                    role: role,
                    subrole: subrole,
                    department: 'Unassigned', // Or prompt for department
                    googleUid: googleUser.uid,
                };
                set(state => ({ users: [...state.users, newUser], currentUser: newUser }));
                get().addNotification(newUser.id, `Welcome, ${newUser.name}! Your account has been created.`);
                return newUser;
            }

            const isRoleMatch = appUser.role === role;
            const isSubRoleMatch = role !== 'finance' || appUser.subrole === subrole;

            if (isRoleMatch && isSubRoleMatch) {
                const updatedUser: User = { ...appUser, googleUid: googleUser.uid };
                 set(state => ({
                    users: state.users.map(u => u.id === appUser.id ? updatedUser : u),
                    currentUser: updatedUser
                }));
                get().addNotification(updatedUser.id, `Welcome back, ${updatedUser.name}! You've successfully logged in with Google.`);
                return updatedUser;
            } else {
                 throw new Error("Access Denied: Your Google account does not match this portal's role.");
            }
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                 throw new Error("Login cancelled. Please try again.");
            }
            if (error.code === 'auth/invalid-continue-uri') {
                // This is a specific configuration error, let's provide a clearer message.
                throw new Error("Configuration error: The redirect URI is invalid. Please contact support.");
            }
            // Re-throw other errors to be caught by the UI
            throw error;
        }
      },

      logout: async () => {
        const { auth } = initializeFirebase();
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Error signing out: ", error);
        }
        set({ currentUser: null });
      },
      
      addSubscriptionRequest: (request) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const newSubscription: Subscription = {
          ...request,
          id: generateId(),
          status: 'Pending',
          requestDate: formatISO(new Date()),
          requestedBy: currentUser.id,
        };

        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }));

        // Notify requester and HOD
        get().addNotification(currentUser.id, `Your request for ${request.toolName} has been submitted.`);
        
        const hod = get().users.find(u => u.role === 'hod' && u.department === request.department);
        if (hod) {
          get().addNotification(hod.id, `New subscription request for ${request.toolName} from ${currentUser.name}.`);
        }
      },

      renewSubscription: (subscriptionId, renewalDuration, updatedCost, remarks, alertDays) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const existingSub = get().subscriptions.find(s => s.id === subscriptionId);
        if(!existingSub) return;
        
        const renewalRequest: Subscription = {
          ...existingSub,
          id: generateId(),
          duration: renewalDuration,
          cost: updatedCost,
          remarks,
          alertDays,
          status: 'Pending',
          requestDate: formatISO(new Date()),
          requestedBy: currentUser.id,
          // Reset approval/payment info
          approvedBy: undefined,
          approvalDate: undefined,
          paidBy: undefined,
          paymentDate: undefined,
        };

        set(state => ({
          subscriptions: [...state.subscriptions, renewalRequest]
        }));
        
        get().addNotification(currentUser.id, `Your renewal request for ${existingSub.toolName} has been submitted.`);
        const hod = get().users.find(u => u.role === 'hod' && u.department === existingSub.department);
        if (hod) {
          get().addNotification(hod.id, `New renewal request for ${existingSub.toolName} from ${currentUser.name}.`);
        }
      },
      
      updateSubscriptionStatus: (subscriptionId, status, approverId, reason) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
              const requester = get().users.find(u => u.id === sub.requestedBy);
              
              if (status === 'Approved by HOD') {
                if (requester) get().addNotification(requester.id, `Your request for ${sub.toolName} has been approved by the HOD.`);
                const apaUsers = get().users.filter(u => u.role === 'finance' && u.subrole === 'apa');
                apaUsers.forEach(fu => get().addNotification(fu.id, `Subscription for ${sub.toolName} is approved by HOD and waiting for your verification.`));
                return { ...sub, status: 'Approved by HOD', approvedBy: approverId, approvalDate: formatISO(new Date()) };
              }
              if (status === 'Declined') {
                 if (requester) get().addNotification(requester.id, `Your request for ${sub.toolName} has been declined. Reason: ${reason}`);
                return { ...sub, status, remarks: `Declined by HOD: ${reason}`, approvalDate: formatISO(new Date()), approvedBy: approverId };
              }
              return sub;
            }
            return sub;
          }),
        }));
      },

      approveByAPA: (subscriptionId, apaId) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
              const requester = get().users.find(u => u.id === sub.requestedBy);
              if (requester) get().addNotification(requester.id, `Your request for ${sub.toolName} has been approved by Finance (APA).`);
              
              const amUsers = get().users.filter(u => u.role === 'finance' && u.subrole === 'am');
              amUsers.forEach(fu => get().addNotification(fu.id, `Subscription for ${sub.toolName} is approved by APA and ready for payment.`));

              return { ...sub, status: 'Approved by APA', apaApprovedBy: apaId, apaApprovalDate: formatISO(new Date()) };
            }
            return sub;
          }),
        }));
      },

      markAsPaid: (subscriptionId, payerId, paymentMode) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
               const requester = get().users.find(u => u.id === sub.requestedBy);
               if(requester) get().addNotification(requester.id, `Payment for ${sub.toolName} has been completed. Your subscription is now active.`);

              return {
                ...sub,
                status: 'Active',
                paidBy: payerId,
                paymentDate: formatISO(new Date()),
                expiryDate: formatISO(add(new Date(), { months: sub.duration })),
                remarks: `Paid via ${paymentMode}`
              };
            }
            return sub;
          }),
        }));
      },

      addNotification: (userId, message) => {
        const newNotification: AppNotification = {
          id: generateId(),
          userId,
          message,
          isRead: false,
          createdAt: formatISO(new Date()),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      readNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
        }));
      },
    }),
    {
      name: 'autotrack-pro-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
