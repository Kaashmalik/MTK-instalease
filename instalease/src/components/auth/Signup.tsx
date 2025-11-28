/**
 * Signup Component
 * 
 * Handles new user registration with email/password or phone.
 * Creates user profile in the users table after successful auth.
 * 
 * @module components/auth/Signup
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Signup form component
 * 
 * @returns {JSX.Element} Signup form UI
 */
export default function Signup() {
  const router = useRouter();
  const { setUser, setSession, refreshProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (!username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      const identifier = usePhone ? phone : email;
      
      if (!identifier) {
        setError('Please provide email or phone number');
        setLoading(false);
        return;
      }

      // Sign up with Supabase Auth
      let authResponse;

      // Get the base URL for redirect
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/verify-email`
        : '/auth/verify-email';

      if (usePhone) {
        authResponse = await supabase.auth.signUp({
          phone: identifier,
          password,
          options: {
            data: {
              username,
            },
            emailRedirectTo: redirectUrl,
          },
        });
      } else {
        authResponse = await supabase.auth.signUp({
          email: identifier,
          password,
          options: {
            data: {
              username,
            },
            emailRedirectTo: redirectUrl,
          },
        });
      }

      if (authResponse.error) {
        throw authResponse.error;
      }

      if (authResponse.data.user) {
        // Create user profile in users table
        // Use RPC function to avoid RLS recursion issues
        // Note: This assumes shop_id will be set later by an admin
        const { data: profileData, error: profileError } = await supabase.rpc(
          'create_user_profile',
          {
            p_user_id: authResponse.data.user.id,
            p_username: username.trim(),
            p_role: 'customer', // Default role, can be changed by admin
          }
        );

        if (profileError) {
          // Log the full error object to see what's actually happening
          console.error('Error creating user profile - Full Error Object:', profileError);
          console.error('Error creating user profile - Stringified:', JSON.stringify(profileError, null, 2));
          console.error('Error creating user profile - Details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
          });
          
          // Check for specific error types
          if (profileError.code === '23505') {
            console.error('Duplicate username error - username already exists');
          } else if (profileError.code === '42501') {
            console.error('Permission denied - RLS policy blocking insert');
          } else if (profileError.code === '42P17') {
            console.error('Infinite recursion error - Run FIX_USER_SIGNUP_RECURSION.sql in Supabase');
          } else if (profileError.message?.includes('permission denied') || profileError.message?.includes('policy')) {
            console.error('RLS Policy Error - INSERT policy may be missing or incorrect');
          }
          
          // Don't throw - user is created in auth, profile can be fixed later
          // This might happen if RLS policies prevent insertion or other constraints
        } else if (profileData && profileData.length > 0) {
          console.log('User profile created successfully:', profileData[0]);
        } else {
          console.log('User profile creation completed (no data returned)');
        }

        if (authResponse.data.session) {
          setUser(authResponse.data.user);
          setSession(authResponse.data.session);
          await refreshProfile();
          // Use window.location for hard redirect
          window.location.href = '/dashboard';
        } else {
          // Email confirmation required
          window.location.href = '/auth/verify-email';
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Sign up to get started with InstalEase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <a href="/auth/login" className="text-primary hover:underline">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

