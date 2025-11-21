/**
 * Authentication Utilities Tests
 * 
 * Unit tests for authentication-related utilities and store.
 * 
 * @module __tests__/auth-utils.test
 */

import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Mock Supabase client
 */
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    })),
  },
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setUser(null);
      result.current.setSession(null);
      result.current.setProfile(null);
      result.current.setLoading(false);
      result.current.initialized = false;
    });
  });

  it('should initialize with null user and session', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should set user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should set profile correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockProfile = {
      user_id: '123',
      shop_id: 'shop-1',
      username: 'testuser',
      role: 'shop_owner' as const,
      last_login: null,
    };

    act(() => {
      result.current.setProfile(mockProfile);
    });

    expect(result.current.profile).toEqual(mockProfile);
  });
});

