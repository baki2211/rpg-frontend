// Centralized route paths. The `/pages/...` prefix is intentional — see
// docs/known_issues.md "Coupling & Foot-Guns" before changing it.
//
// Add a constant here instead of inlining a literal `/pages/...` string in a
// component. Dynamic routes are expressed as functions so call sites get a
// compile-time signature for required params.

export const ROUTES = {
  home: '/',

  // Public
  wiki: '/pages/wiki',
  register: '/pages/register',
  login: '/pages/login',

  // Authenticated
  dashboard: '/pages/dashboard',
  charactersDashboard: '/pages/charactersDashboard',
  skills: '/pages/skills',
  map: '/pages/map',
  logs: '/pages/logs',
  sessions: '/pages/sessions',
  protected: '/pages/protected',

  // Admin
  adminDashboard: '/pages/admin/dashboard',

  // Dynamic
  chat: (locationId: string | number) => `/pages/chat/${locationId}`,
} as const;
