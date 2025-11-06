
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import MainSidebar from './components/main-sidebar';
import Header from './components/header';
import { useAppStore } from '@/store/app-store';
import { FirebaseClientProvider } from '@/firebase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);
  
  if (!currentUser) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <FirebaseClientProvider>
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
    </FirebaseClientProvider>
  );
}
