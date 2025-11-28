/**
 * Login Component
 * 
 * Handles user authentication via email/password or phone using Supabase Auth.
 * Supports responsive design and displays loading/error states.
 * 
 * @module components/auth/Login
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Login form component
 * 
 * @returns {JSX.Element} Login form UI
 */
export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setSession, refreshProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check for error parameters in URL (from email verification redirect)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      if (errorParam === 'access_denied' || errorDescription?.includes('Email')) {
        setError('Email not confirmed. Please verify your email address to continue.');
      } else if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
      }
    }
  }, [searchParams]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const identifier = usePhone ? phone : email;
      
      if (!identifier || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      let authResponse;

      if (usePhone) {
        // Phone authentication
        authResponse = await supabase.auth.signInWithPassword({
          phone: identifier,
          password,
        });
      } else {
        // Email authentication
        authResponse = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
      }

      if (authResponse.error) {
        // Check for email confirmation error
        if (authResponse.error.message?.includes('email') && authResponse.error.message?.includes('confirm')) {
          setError('Email not confirmed. Please verify your email address.');
          return;
        }
        throw authResponse.error;
      }

      if (authResponse.data.user && authResponse.data.session) {
        console.log('Login successful! User:', authResponse.data.user.email);
        setUser(authResponse.data.user);
        setSession(authResponse.data.session);
        
        try {
          await refreshProfile();
        } catch (profileError) {
          console.log('Profile refresh error (non-blocking):', profileError);
        }
        
        // Get redirect URL from query params or default to dashboard
        // Decode the URL and ensure it's a valid path
        let redirectTo = searchParams.get('redirect') || '/dashboard';
        
        // Handle encoded URLs and invalid paths
        try {
          redirectTo = decodeURIComponent(redirectTo);
        } catch {
          redirectTo = '/dashboard';
        }
        
        // Ensure redirect is to a valid app path (not external or root)
        if (!redirectTo.startsWith('/') || redirectTo === '/' || redirectTo.includes('.well-known')) {
          redirectTo = '/dashboard';
        }
        
        console.log('Redirecting to:', redirectTo);
        
        // Use window.location for hard redirect to ensure auth cookies are properly set
        window.location.href = redirectTo;
      } else if (authResponse.data.user && !authResponse.data.session) {
        // User exists but email not confirmed
        setError('Email not confirmed. Please check your inbox and verify your email address.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend verification email
   */
  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/verify-email`
            : '/auth/verify-email',
        },
      });

      if (resendError) {
        throw resendError;
      }

      setMessage('Verification email sent! Please check your inbox and click the link to verify your account.');
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to InstalEase</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 space-y-2">
                <p>{error}</p>
                {error.includes('Email not confirmed') && !usePhone && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="mt-2 w-full"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                )}
              </div>
            )}

            {message && (
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                {message}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant={!usePhone ? 'default' : 'outline'}
                onClick={() => setUsePhone(false)}
                className="flex-1"
              >
                Email
              </Button>
              <Button
                type="button"
                variant={usePhone ? 'default' : 'outline'}
                onClick={() => setUsePhone(true)}
                className="flex-1"
              >
                Phone
              </Button>
            </div>

            {usePhone ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <a
                href="/auth/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot your password?
              </a>
            </div>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <a href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

