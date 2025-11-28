/**
 * Next.js Proxy (formerly Middleware)
 * 
 * Handles route protection and authentication checks.
 * Redirects unauthenticated users to login page.
 * Supports role-based access control (RBAC).
 * 
 * @module proxy
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 */
const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'];

/**
 * Super admin routes (only super_admin can access)
 */
const superAdminRoutes = ['/super-admin'];

/**
 * Admin routes (admin and super_admin can access)
 */
const adminRoutes = ['/admin'];

/**
 * Shop owner routes (requires shop_owner or admin role)
 */
const shopOwnerRoutes = ['/shop/settings'];

/**
 * Customer portal routes (requires customer role)
 */
const customerRoutes = ['/portal/customer'];

/**
 * Staff routes (requires sales_rep, credit_manager, or higher role)
 */
const staffRoutes = ['/applications/staff'];

/**
 * Proxy function to handle authentication and authorization
 * 
 * @param {NextRequest} request - The incoming request
 * @returns {NextResponse} Response with appropriate redirects or continuation
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If session exists and trying to access auth pages, redirect to dashboard
  if (session && isPublicRoute && pathname !== '/auth/verify-email') {
    // Only redirect auth pages, not the root
    if (pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Redirect root to dashboard for logged-in users
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If session exists, check role-based access
  if (session) {
    // Fetch user profile to check role (profile may be missing for new users)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user role in proxy:', {
        message: profileError.message,
        code: profileError.code,
      });
    }

    const userRole = profile?.role || 'customer';

    // Check super admin routes (only super_admin)
    if (superAdminRoutes.some((route) => pathname.startsWith(route))) {
      if (userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check admin routes (admin and super_admin)
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (!['admin', 'super_admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check shop owner routes (shop_owner, admin, super_admin)
    if (shopOwnerRoutes.some((route) => pathname.startsWith(route))) {
      if (!['shop_owner', 'admin', 'super_admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check customer portal routes
    if (customerRoutes.some((route) => pathname.startsWith(route))) {
      if (userRole !== 'customer') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check staff routes (sales_rep, credit_manager, shop_owner, admin, super_admin)
    if (staffRoutes.some((route) => pathname.startsWith(route))) {
      if (!['sales_rep', 'credit_manager', 'shop_owner', 'admin', 'super_admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response;
}

/**
 * Matcher configuration for middleware
 * Excludes static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

