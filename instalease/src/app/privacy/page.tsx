'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                InstalEase
              </span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: November 2025</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Welcome to InstalEase, a product of MTK Codex (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our installment management platform.
              </p>
              <p className="text-gray-600">
                By using InstalEase, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Name and contact information (email, phone number)</li>
                <li>Business information (shop name, address, registration details)</li>
                <li>CNIC/National ID for verification purposes</li>
                <li>Payment information and transaction history</li>
                <li>Profile photos and uploaded documents</li>
              </ul>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Usage Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information</li>
                <li>Usage patterns and preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>To provide and maintain our services</li>
                <li>To process transactions and manage installment plans</li>
                <li>To verify identity and prevent fraud</li>
                <li>To send notifications about payments and updates</li>
                <li>To improve our platform and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>End-to-end encryption for sensitive data</li>
                <li>Row Level Security (RLS) for data isolation</li>
                <li>Regular security audits and updates</li>
                <li>Secure authentication with session management</li>
                <li>Access controls and role-based permissions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Data Sharing</h2>
              <p className="text-gray-600 mb-4">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Shop owners (for customers of their shops)</li>
                <li>Payment processors (for transaction processing)</li>
                <li>Legal authorities (when required by law)</li>
                <li>Service providers (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-600">
                We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                For privacy-related inquiries, please contact us:
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong>{' '}
                  <a href="mailto:mtkcodex@gmail.com" className="text-purple-600 hover:underline">
                    mtkcodex@gmail.com
                  </a>
                </p>
                <p className="text-gray-700"><strong>Website:</strong>{' '}
                  <a href="https://mtkcodex.site" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    mtkcodex.site
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            © 2026 MTK Codex. All rights reserved.
          </p>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
