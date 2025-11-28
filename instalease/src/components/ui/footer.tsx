'use client';

import Link from 'next/link';

interface FooterProps {
  variant?: 'default' | 'minimal' | 'auth' | 'dashboard' | 'admin';
  className?: string;
}

/**
 * Reusable Footer Component
 * © 2026 MTK Codex. All rights reserved.
 * 
 * Variants:
 * - minimal: Simple one-line copyright
 * - auth: For login/signup pages
 * - dashboard: For main app pages
 * - admin: For admin panels
 * - default: Full footer with links
 */
export function Footer({ variant = 'default', className = '' }: FooterProps) {
  
  // Minimal - Simple one-line
  if (variant === 'minimal') {
    return (
      <footer className={`py-4 text-center ${className}`}>
        <p className="text-xs text-gray-500">
          © 2026{' '}
          <Link 
            href="https://mtkcodex.site" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium hover:text-purple-600 transition-colors"
          >
            MTK Codex
          </Link>
          . All rights reserved.
        </p>
      </footer>
    );
  }

  // Auth - For login/signup pages
  if (variant === 'auth') {
    return (
      <footer className={`py-6 text-center ${className}`}>
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <Link 
              href="https://mtkcodex.site" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              MALIK TECH
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            © 2026 MTK Codex. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  // Dashboard - For main app pages
  if (variant === 'dashboard') {
    return (
      <footer className={`bg-white border-t border-gray-200 mt-auto ${className}`}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  InstalEase
                </span>
              </div>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <span className="text-xs text-gray-500 hidden sm:inline">v2.0</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-4">
              <Link 
                href="/support"
                className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
              >
                Support
              </Link>
              <Link 
                href="/privacy"
                className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms"
                className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
              >
                Terms
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-500">
              © 2026{' '}
              <Link 
                href="https://mtkcodex.site" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:text-purple-600 transition-colors"
              >
                MTK Codex
              </Link>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Admin - For admin panels
  if (variant === 'admin') {
    return (
      <footer className={`bg-gray-100 border-t border-gray-200 ${className}`}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>🔐</span>
              <span>Admin Panel</span>
              <span className="text-gray-300">|</span>
              <span>InstalEase v2.0</span>
            </div>
            <p className="text-xs text-gray-500">
              © 2026{' '}
              <Link 
                href="https://mtkcodex.site" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:text-purple-600 transition-colors"
              >
                MTK Codex
              </Link>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Default - Full footer with all sections
  return (
    <footer className={`bg-gray-900 text-white ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="text-xl font-bold">InstalEase</span>
            </div>
            <p className="text-sm text-gray-400">
              Streamline your installment business with our comprehensive SaaS platform.
            </p>
            <p className="text-xs text-gray-500">
              Developed by{' '}
              <Link 
                href="https://mtkcodex.site" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                MALIK TECH
              </Link>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/customers" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Customers
                </Link>
              </li>
              <li>
                <Link href="/applications" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Applications
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="https://mtkcodex.site" target="_blank" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="mailto:contact@mtkcodex.site" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="https://mtkcodex.site" target="_blank" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="https://mtkcodex.site" target="_blank" className="text-sm text-gray-300 hover:text-white transition-colors">
                  About MTK Codex
                </Link>
              </li>
              <li>
                <Link href="https://mtkcodex.site" target="_blank" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="https://mtkcodex.site" target="_blank" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="https://github.com/Kaashmalik" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link 
                href="https://mtkcodex.site" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Website"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              © 2026{' '}
              <Link 
                href="https://mtkcodex.site" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                MTK Codex
              </Link>
              . All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Compact copyright for inline use
export function Copyright({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      © 2026{' '}
      <Link 
        href="https://mtkcodex.site" 
        target="_blank" 
        rel="noopener noreferrer"
        className="font-medium hover:text-purple-600 transition-colors"
      >
        MTK Codex
      </Link>
      . All rights reserved.
    </p>
  );
}
