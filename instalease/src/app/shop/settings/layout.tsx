'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ShopSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, initialized, signOut } = useAuthStore();
  const router = useRouter();

  const canAccessSettings = profile?.role === 'super_admin' || 
                           profile?.role === 'admin' || 
                           profile?.role === 'shop_owner';

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!canAccessSettings) {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, initialized, router, canAccessSettings]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !canAccessSettings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                ⚙️ Shop Settings
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link 
                  href="/shop/settings/notifications" 
                  className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
                >
                  🔔 Notifications
                </Link>
                <Link 
                  href="/shop/settings/profile" 
                  className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
                >
                  🏪 Shop Profile
                </Link>
                <Link 
                  href="/shop/settings/team" 
                  className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
                >
                  👥 Team
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile?.username || user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
