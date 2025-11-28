/**
 * Home Page
 * 
 * Landing page that redirects authenticated users to dashboard
 * and unauthenticated users to login.
 * 
 * @module app/page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Footer } from '@/components/ui/footer';

/**
 * Home page component
 * 
 * @returns {JSX.Element} Home page or redirect
 */
export default function Home() {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized || loading) return;

    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [user, loading, initialized, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center flex-1 flex items-center justify-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center animate-pulse">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <div className="text-lg font-medium text-gray-700">Loading InstalEase...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
      <Footer variant="minimal" />
    </div>
  );
}
