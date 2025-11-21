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
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-lg">Loading...</div>
      </div>
    </div>
  );
}
