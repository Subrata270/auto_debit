"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);

  useEffect(() => {
    if (currentUser) {
      router.replace(`/dashboard/${currentUser.role}`);
    } else {
        // If there's no user, maybe they logged out, redirect to home
        router.replace('/');
    }
  }, [currentUser, router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>Loading your dashboard...</p>
    </div>
  );
}