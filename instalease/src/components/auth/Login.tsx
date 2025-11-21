/**
 * Login Component
 * 
 * Handles user authentication via email/password or phone using Supabase Auth.
 * Supports responsive design and displays loading/error states.
 * 
 * @module components/auth/Login
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const { setUser, setSession, refreshProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw authResponse.error;
      }

      if (authResponse.data.user && authResponse.data.session) {
        setUser(authResponse.data.user);
        setSession(authResponse.data.session);
        await refreshProfile();
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
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
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
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
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
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

