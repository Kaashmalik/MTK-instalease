'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, initialized, signOut } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/super-admin/applications', label: 'Applications', icon: '📋' },
    { href: '/super-admin/payments', label: 'Payments', icon: '💳' },
    { href: '/super-admin/shops', label: 'Shops', icon: '🏪' },
    { href: '/super-admin/users', label: 'Users', icon: '👥' },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (profile?.role !== 'super_admin') {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, initialized, router]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-purple-800 dark:from-purple-950 dark:to-purple-900 text-white shadow-lg sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo & Desktop Nav */}
            <div className="flex items-center gap-4 lg:gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg sm:text-xl font-bold whitespace-nowrap">
                <span className="text-2xl">🔐</span>
                <span className="hidden sm:inline">InstalEase</span>
                <span className="text-purple-300 text-sm hidden md:inline">Super Admin</span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-white/20 text-white'
                        : 'text-purple-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Side - User Info & Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-sm font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="text-sm text-purple-200 hidden md:block">
                  {profile?.username || user.email}
                </span>
              </div>
              <ThemeSwitcher variant="icon" className="text-white" />
              <Button 
                variant="outline" 
                size="sm"
                className="text-white border-white/30 hover:bg-white/10 text-xs sm:text-sm"
                onClick={() => signOut()}
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">🚪</span>
              </Button>
              
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-700">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-purple-700 mt-2">
                <Link 
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-purple-200 hover:bg-white/10"
                >
                  <span className="text-lg">🏠</span>
                  Back to Dashboard
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 min-h-[calc(100vh-180px)]">
        {children}
      </main>

      {/* Footer */}
      <Footer variant="admin" />
    </div>
  );
}
