'use client';

import { useAuth } from '../../contexts/AuthContext';

// Shared gate for auth-required TanStack Query hooks. AND this into the
// query's `enabled` so we don't fire authenticated endpoints on /login,
// /register, or during the initial auth-loading window. See
// docs/auth_query_gating_plan.md.
export function useAuthGate(enabled: boolean = true): boolean {
  const { isAuthenticated, isLoading } = useAuth();
  return enabled && isAuthenticated && !isLoading;
}
