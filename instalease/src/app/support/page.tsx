'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';

export default function SupportPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600">We&apos;re here to help you succeed</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Card */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📧</span> Email Support
              </CardTitle>
              <CardDescription>Get help via email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                For any questions, issues, or feedback, reach out to our support team.
              </p>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Email us at:</p>
                <a 
                  href="mailto:mtkcodex@gmail.com" 
                  className="text-lg font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  mtkcodex@gmail.com
                </a>
              </div>
              <Button asChild className="w-full">
                <a href="mailto:mtkcodex@gmail.com">Send Email</a>
              </Button>
            </CardContent>
          </Card>

          {/* Website Card */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🌐</span> Website
              </CardTitle>
              <CardDescription>Visit our main website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Find more information, updates, and resources on our website.
              </p>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Visit us at:</p>
                <a 
                  href="https://mtkcodex.site" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  mtkcodex.site
                </a>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="https://mtkcodex.site" target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* FAQ Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">❓</span> FAQs
              </CardTitle>
              <CardDescription>Frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">How do I apply for a shop?</h4>
                <p className="text-sm text-gray-600">
                  Go to Dashboard → Apply for Shop, fill in your business details, select a plan, and upload payment proof.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">How long does approval take?</h4>
                <p className="text-sm text-gray-600">
                  Shop applications are typically reviewed within 24-48 hours after payment verification.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Can I upgrade my plan?</h4>
                <p className="text-sm text-gray-600">
                  Yes! Contact support to upgrade your subscription plan at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🕐</span> Business Hours
              </CardTitle>
              <CardDescription>When we&apos;re available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium text-gray-400">Closed</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * Times shown in Pakistan Standard Time (PKT)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Company Info */}
        <Card className="mt-8 bg-gradient-to-r from-purple-900 to-purple-800 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1">MTK Codex</h3>
                <p className="text-purple-200">Developed by Malik Kashif</p>
              </div>
              <div className="flex gap-4">
                <a 
                  href="mailto:mtkcodex@gmail.com"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <span>📧</span> Email
                </a>
                <a 
                  href="https://mtkcodex.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <span>🌐</span> Website
                </a>
                <a 
                  href="https://github.com/Kaashmalik"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <span>🐙</span> GitHub
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
