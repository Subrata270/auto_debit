
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import MainSidebar from './components/main-sidebar';
import Header from './components/header';
import { useAppStore } from '@/store/app-store';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { User } from '@/lib/types';


function AppContent({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const { currentUser, setCurrentUser } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  useEffect(() => {
    const syncUser = async () => {
      if (!isUserLoading) {
        if (!firebaseUser) {
          // If no Firebase user, clear Zustand and redirect to login
          if (pathname !== '/') {
            setCurrentUser(null);
            router.push('/');
          }
        } else if (!currentUser || currentUser.id !== firebaseUser.uid) {
          // If there's a Firebase user but Zustand is out of sync
          const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser(userData);
          } else {
            // User exists in Auth, but not in Firestore DB.
            // This can happen, e.g. if DB entry failed during registration.
            // For now, log them out. A real app might try to repair the user entry.
            router.push('/');
          }
        }
      }
    };
    syncUser();
  }, [firebaseUser, isUserLoading, currentUser, setCurrentUser, router, firestore, pathname]);

  if (isUserLoading || !currentUser) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-background">
              <p>Loading...</p>
          </div>
      );
  }

  return (
      <SidebarProvider>
          <div className="flex min-h-screen w-screen bg-background">
              <MainSidebar />
              <div className="flex-1 flex flex-col">
                  <Header />
                  <main className="flex-1 overflow-y-auto bg-secondary/40">
                      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                          {children}
                      </div>
                  </main>
              </div>
          </div>
      </SidebarProvider>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppContent>{children}</AppContent>
    </FirebaseClientProvider>
  );
}

    