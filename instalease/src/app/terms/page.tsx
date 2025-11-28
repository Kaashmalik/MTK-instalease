'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: November 2025</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing or using InstalEase (&quot;the Service&quot;), a product of MTK Codex, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
              <p className="text-gray-600">
                These terms apply to all users, including shop owners, staff members, and customers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                InstalEase is a SaaS platform that provides:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Installment plan management for retail businesses</li>
                <li>Customer and contract management</li>
                <li>Payment tracking and reminders</li>
                <li>Analytics and reporting tools</li>
                <li>Multi-tenant shop management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Registration</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 18 years old to use the Service</li>
                <li>One person may not maintain multiple accounts</li>
              </ul>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Responsibilities</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Keep your password confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Subscription Plans</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Available Plans</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li><strong>Basic:</strong> PKR 2,999/month - Up to 50 contracts</li>
                <li><strong>Professional:</strong> PKR 5,999/month - Up to 200 contracts</li>
                <li><strong>Enterprise:</strong> PKR 9,999/month - Unlimited contracts</li>
              </ul>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Terms</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Subscriptions are billed monthly in advance</li>
                <li>Payment must be made via approved methods</li>
                <li>Failure to pay may result in service suspension</li>
                <li>Refunds are provided as per our refund policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-600 mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malware or harmful code</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Interfere with the Service&apos;s operation</li>
                <li>Use the Service to harass or harm others</li>
                <li>Resell or redistribute the Service without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Data and Privacy</h2>
              <p className="text-gray-600 mb-4">
                Your use of the Service is also governed by our{' '}
                <Link href="/privacy" className="text-purple-600 hover:underline">
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your data.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>You retain ownership of your data</li>
                <li>We implement security measures to protect your data</li>
                <li>You can export or delete your data upon request</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600">
                The Service, including its design, features, and content, is owned by MTK Codex and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>The Service is provided &quot;as is&quot; without warranties</li>
                <li>We are not liable for indirect or consequential damages</li>
                <li>Our total liability is limited to fees paid in the last 12 months</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-600 mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Violate these Terms of Service</li>
                <li>Fail to pay subscription fees</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Abuse the Service or other users</li>
              </ul>
              <p className="text-gray-600 mt-4">
                You may terminate your account at any time by contacting support.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-600">
                These terms are governed by the laws of Pakistan. Any disputes shall be resolved in the courts of Pakistan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                For questions about these Terms of Service, contact us:
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Company:</strong> MTK Codex</p>
                <p className="text-gray-700"><strong>Developer:</strong> Malik Kashif</p>
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
