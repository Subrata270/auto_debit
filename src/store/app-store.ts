"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  User,
  Subscription,
  AppNotification,
  Role,
  SubRole,
  SubscriptionStatus,
} from "@/lib/types";
import { mockUsers, mockSubscriptions, mockNotifications } from "@/lib/data";
import { add, formatISO } from "date-fns";
import { registerUser, loginUser, logoutUser } from "@/lib/auth";
import {
  addSubscriptionRequest as addSubscriptionToFirestore,
  getAllSubscriptions,
  updateSubscriptionStatus as updateSubscriptionStatusInFirestore,
  markSubscriptionAsPaid as markSubscriptionAsPaidInFirestore,
  renewSubscription as renewSubscriptionInFirestore,
  addNotification as addNotificationToFirestore,
  getNotificationsByUser,
  markNotificationAsRead,
  getUsersByRole,
} from "@/lib/firestore";

interface AppState {
  users: User[];
  subscriptions: Subscription[];
  notifications: AppNotification[];
  currentUser: User | null;
  isLoading: boolean;
  register: (user: Omit<User, "id" | "subrole">) => Promise<void>;
  login: (
    email: string,
    password: string,
    role: Role,
    subrole?: SubRole
  ) => Promise<User | null>;
  logout: () => Promise<void>;
  loadSubscriptions: () => Promise<void>;
  loadNotifications: (userId: string) => Promise<void>;
  addSubscriptionRequest: (
    request: Omit<Subscription, "id" | "status" | "requestDate">
  ) => Promise<void>;
  renewSubscription: (
    subscriptionId: string,
    renewalDuration: number,
    updatedCost: number,
    remarks: string
  ) => Promise<void>;
  updateSubscriptionStatus: (
    subscriptionId: string,
    status: SubscriptionStatus,
    approverId?: string
  ) => Promise<void>;
  markAsPaid: (subscriptionId: string, payerId: string) => Promise<void>;
  addNotification: (userId: string, message: string) => Promise<void>;
  readNotification: (notificationId: string) => Promise<void>;
}

const generateId = () => `id-${new Date().getTime()}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      subscriptions: mockSubscriptions,
      notifications: mockNotifications,
      currentUser: null,
      isLoading: false,

      register: async (userData) => {
        try {
          set({ isLoading: true });

          if (!userData.email || !userData.password) {
            throw new Error("Email and password are required");
          }

          const newUser = await registerUser(
            userData.email,
            userData.password,
            {
              name: userData.name,
              role: userData.role,
              department: userData.department,
              subrole: null,
            }
          );

          set((state) => ({
            users: [...state.users, newUser],
            isLoading: false,
          }));
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      login: async (email, password, role, subrole = null) => {
        try {
          set({ isLoading: true });
          const user = await loginUser(email, password, role, subrole);

          if (user) {
            set({ currentUser: user, isLoading: false });
            await get().addNotification(
              user.id,
              `Welcome back, ${user.name}! You've successfully logged in.`
            );

            // Load user's subscriptions and notifications
            await get().loadSubscriptions();
            await get().loadNotifications(user.id);

            return user;
          }

          set({ isLoading: false });
          return null;
        } catch (error) {
          set({ isLoading: false });
          return null;
        }
      },

      logout: async () => {
        try {
          await logoutUser();
          set({ currentUser: null, subscriptions: [], notifications: [] });
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      loadSubscriptions: async () => {
        try {
          const subscriptions = await getAllSubscriptions();
          set({ subscriptions });
        } catch (error) {
          console.error("Error loading subscriptions:", error);
        }
      },

      loadNotifications: async (userId: string) => {
        try {
          const notifications = await getNotificationsByUser(userId);
          set({ notifications });
        } catch (error) {
          console.error("Error loading notifications:", error);
        }
      },

      addSubscriptionRequest: async (request) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        try {
          const subscriptionId = await addSubscriptionToFirestore({
            ...request,
            requestedBy: currentUser.id,
          });

          // Reload subscriptions
          await get().loadSubscriptions();

          // Notify requester and HOD
          await get().addNotification(
            currentUser.id,
            `Your request for ${request.toolName} has been submitted.`
          );

          const hodUsers = await getUsersByRole("hod");
          const hod = hodUsers.find(
            (u: any) => u.department === currentUser.department
          );
          if (hod) {
            await get().addNotification(
              hod.id,
              `New subscription request for ${request.toolName} from ${currentUser.name}.`
            );
          }
        } catch (error) {
          console.error("Error adding subscription request:", error);
          throw error;
        }
      },

      renewSubscription: async (
        subscriptionId,
        renewalDuration,
        updatedCost,
        remarks
      ) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        try {
          const existingSub = get().subscriptions.find(
            (s) => s.id === subscriptionId
          );
          if (!existingSub) return;

          await renewSubscriptionInFirestore(
            subscriptionId,
            renewalDuration,
            updatedCost,
            remarks,
            currentUser.id
          );

          // Reload subscriptions
          await get().loadSubscriptions();

          await get().addNotification(
            currentUser.id,
            `Your renewal request for ${existingSub.toolName} has been submitted.`
          );

          const hodUsers = await getUsersByRole("hod");
          const hod = hodUsers.find(
            (u: any) => u.department === currentUser.department
          );
          if (hod) {
            await get().addNotification(
              hod.id,
              `New renewal request for ${existingSub.toolName} from ${currentUser.name}.`
            );
          }
        } catch (error) {
          console.error("Error renewing subscription:", error);
          throw error;
        }
      },

      updateSubscriptionStatus: async (subscriptionId, status, approverId) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        try {
          // Update in Firestore
          await updateSubscriptionStatusInFirestore(
            subscriptionId,
            status,
            approverId || currentUser.id
          );

          // Get subscription details for notifications
          const sub = get().subscriptions.find((s) => s.id === subscriptionId);
          if (!sub) return;

          // Reload subscriptions
          await get().loadSubscriptions();

          // Send notifications
          if (status === "Approved") {
            await get().addNotification(
              sub.requestedBy,
              `Your request for ${sub.toolName} has been approved.`
            );
            const financeUsers = await getUsersByRole("finance");
            for (const fu of financeUsers) {
              await get().addNotification(
                (fu as any).id,
                `Subscription for ${sub.toolName} is approved and waiting for payment.`
              );
            }
          } else if (status === "Declined") {
            await get().addNotification(
              sub.requestedBy,
              `Your request for ${sub.toolName} has been declined.`
            );
          }
        } catch (error) {
          console.error("Error updating subscription status:", error);
          throw error;
        }
      },

      markAsPaid: async (subscriptionId, payerId) => {
        try {
          // Get subscription details before updating
          const sub = get().subscriptions.find((s) => s.id === subscriptionId);
          if (!sub) return;

          // Update in Firestore
          await markSubscriptionAsPaidInFirestore(subscriptionId, payerId);

          // Reload subscriptions
          await get().loadSubscriptions();

          // Notify requester
          await get().addNotification(
            sub.requestedBy,
            `Payment for ${sub.toolName} has been completed. Your subscription is now active.`
          );
        } catch (error) {
          console.error("Error marking as paid:", error);
          throw error;
        }
      },

      addNotification: async (userId, message) => {
        try {
          await addNotificationToFirestore(userId, message);

          // Reload notifications if it's for the current user
          const currentUser = get().currentUser;
          if (currentUser && currentUser.id === userId) {
            await get().loadNotifications(userId);
          }
        } catch (error) {
          console.error("Error adding notification:", error);
        }
      },

      readNotification: async (notificationId) => {
        try {
          await markNotificationAsRead(notificationId);

          // Update local state
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          }));
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      },
    }),
    {
      name: "autotrack-pro-storage",
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for this prototype
    }
  )
);
