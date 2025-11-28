/**
 * Email Verification Page
 * 
 * Handles email verification after signup.
 * Shows verification status and allows resending verification emails.
 * 
 * @module app/auth/verify-email/page
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/ui/footer';

/**
 * Email verification page component
 * 
 * @returns {JSX.Element} Email verification page
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const { initialize, refreshProfile, initialized } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  /**
   * Check authentication status - Supabase auto-verifies when user clicks email link
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      // First, ensure auth store is initialized
      if (!initialized) {
        await initialize();
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        return;
      }

      if (session?.user) {
        // User is authenticated (email was verified)
        // Update auth store with the new session
        await initialize(); // This will refresh the session and profile
        await refreshProfile(); // Ensure profile is loaded
        
        setVerified(true);
        setMessage('Email verified successfully! Redirecting to dashboard...');

        // Wait a moment for auth store to update, then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
  }, [router, initialize, refreshProfile, initialized]);

  // Check if user is already verified (from email link click)
  useEffect(() => {
    checkAuthStatus();

    // Listen for auth state changes (e.g., when user clicks email link)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User just signed in (email verified)
        await initialize();
        await refreshProfile();
        setVerified(true);
        setMessage('Email verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthStatus, initialize, refreshProfile, router]);

  /**
   * Resend verification email
   */
  const resendVerification = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email) {
        throw new Error('No user email found. Please sign up again.');
      }

      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/verify-email`
        : '/auth/verify-email';

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (resendError) {
        throw resendError;
      }

      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: unknown) {
      console.error('Resend error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            {verified
              ? 'Your email has been verified!'
              : 'Please verify your email address to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                ✅ {message || 'Email verified successfully!'}
              </div>
              <p className="text-sm text-gray-600">
                You will be redirected to the dashboard shortly...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  We&apos;ve sent a verification email to your inbox. Please click the link in the email to verify your account.
                </p>

                <div className="space-y-2">
                  <Button
                    onClick={resendVerification}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Resend Verification Email'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push('/auth/login')}
                    className="w-full"
                    disabled={loading}
                  >
                    Back to Login
                  </Button>
                </div>

                <div className="text-center text-xs text-gray-500">
                  <p>Didn&apos;t receive the email?</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes and try resending</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <Footer variant="auth" />
    </div>
  );
}
