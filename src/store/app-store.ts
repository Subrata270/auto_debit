"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Subscription, AppNotification, Role, SubRole, SubscriptionStatus } from '@/lib/types';
import { mockUsers, mockSubscriptions, mockNotifications } from '@/lib/data';
import { add, formatISO } from 'date-fns';
import { getAuth, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

interface AppState {
  users: User[];
  subscriptions: Subscription[];
  notifications: AppNotification[];
  currentUser: User | null;
  register: (user: Omit<User, 'id' | 'subrole' | 'googleUid'>) => void;
  login: (email: string, password: string, role: Role, subrole?: SubRole) => User | null;
  loginWithGoogle: (role: Role, subrole?: SubRole) => Promise<User | null>;
  logout: () => void;
  addSubscriptionRequest: (request: Omit<Subscription, 'id' | 'status' | 'requestDate'>) => void;
  renewSubscription: (subscriptionId: string, renewalDuration: number, updatedCost: number, remarks: string) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: SubscriptionStatus, approverId?: string) => void;
  markAsPaid: (subscriptionId: string, payerId: string) => void;
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
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
          throw new Error('An account with this email already exists.');
        }

        const newUser: User = {
          ...userData,
          id: generateId(),
          subrole: null, // Subrole can be assigned later if needed
        };

        set(state => ({
          users: [...state.users, newUser],
        }));
      },

      login: (email, password, role, subrole = null) => {
        const user = get().users.find(
          (u) =>
            u.email === email &&
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
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;

            if (!googleUser.email) {
                throw new Error("Could not retrieve email from Google account.");
            }

            const appUser = get().users.find(u => u.email === googleUser.email);
            
            if (!appUser) {
                throw new Error("You are not registered. Please create an account or contact an administrator.");
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
            // Re-throw other errors to be caught by the UI
            throw error;
        }
      },

      logout: async () => {
        const { auth } = initializeFirebase();
        await auth.signOut();
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
        const hod = get().users.find(u => u.role === 'hod' && u.department === currentUser.department);
        if (hod) {
          get().addNotification(hod.id, `New subscription request for ${request.toolName} from ${currentUser.name}.`);
        }
      },

      renewSubscription: (subscriptionId, renewalDuration, updatedCost, remarks) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const existingSub = get().subscriptions.find(s => s.id === subscriptionId);
        if(!existingSub) return;
        
        // This simulates a renewal request workflow. In a real app, this might create a new request record.
        // For the prototype, we'll create a new "pending" request based on the old one.
        const renewalRequest: Subscription = {
          ...existingSub,
          id: generateId(),
          duration: renewalDuration,
          cost: updatedCost,
          remarks,
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
        const hod = get().users.find(u => u.role === 'hod' && u.department === currentUser.department);
        if (hod) {
          get().addNotification(hod.id, `New renewal request for ${existingSub.toolName} from ${currentUser.name}.`);
        }
      },
      
      updateSubscriptionStatus: (subscriptionId, status, reason) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
              const requester = get().users.find(u => u.id === sub.requestedBy);
              
              if (status === 'Approved') {
                if (requester) get().addNotification(requester.id, `Your request for ${sub.toolName} has been approved.`);
                const financeUsers = get().users.filter(u => u.role === 'finance');
                financeUsers.forEach(fu => get().addNotification(fu.id, `Subscription for ${sub.toolName} is approved and waiting for payment.`));
                return { ...sub, status: 'Approved', approvedBy: currentUser.id, approvalDate: formatISO(new Date()) };
              }
              if (status === 'Declined') {
                 if (requester) get().addNotification(requester.id, `Your request for ${sub.toolName} has been declined. Reason: ${reason}`);
                return { ...sub, status, remarks: `Declined by HOD: ${reason}` };
              }
              return { ...sub, status };
            }
            return sub;
          }),
        }));
      },

      markAsPaid: (subscriptionId, payerId) => {
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
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for this prototype
    }
  )
);
