// Centralized route paths. Add a constant here instead of inlining a path
// literal in a component. Dynamic routes are expressed as functions so call
// sites get a compile-time signature for required params.

export const ROUTES = {
  home: '/',

  // Public
  wiki: '/wiki',
  register: '/register',
  login: '/login',

  // Authenticated
  dashboard: '/dashboard',
  charactersDashboard: '/charactersDashboard',
  skills: '/skills',
  map: '/map',
  logs: '/logs',
  sessions: '/sessions',
  protected: '/protected',

  // Admin
  adminDashboard: '/admin/dashboard',

  // Dynamic
  chat: (locationId: string | number) => `/chat/${locationId}`,
} as const;
