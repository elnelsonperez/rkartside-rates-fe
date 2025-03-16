import { 
  createRootRoute, 
  createRoute, 
  createRouter,
  Outlet,
  redirect
} from '@tanstack/react-router';
import { QuoteForm } from './components/QuoteForm';
import { QuoteList } from './components/QuoteList';
import { LoginPage } from './components/LoginPage';
import { ProtectedLayout } from './components/ProtectedLayout';
import { AdminLayout } from './components/AdminLayout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuthStore } from './lib/auth-store';

// Create the root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: async () => {
    const { user, isLoading } = useAuthStore.getState();
    
    // Wait for auth to initialize
    if (isLoading) {
      return <LoadingSpinner />;
    }
    
    // If already authenticated, redirect to home
    if (user) {
      throw redirect({
        to: '/'
      });
    }
  }
});

// Protected layout route (requires authentication)
const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
  beforeLoad: async ({ location }) => {
    const { user, isLoading } = useAuthStore.getState();
    
    // Wait for auth to initialize
    if (isLoading) {
      return <LoadingSpinner />;
    }
    
    // Redirect to login if not authenticated
    if (!user) {
      // Store the current path to redirect back after login
      const returnTo = location.pathname + location.search;
      throw redirect({
        to: '/login',
        search: { returnTo }
      });
    }
  }
});

// Admin layout route (requires admin permission)
const adminLayout = createRoute({
  getParentRoute: () => protectedLayout,
  id: 'admin',
  component: AdminLayout,
  beforeLoad: async () => {
    const { isAdmin } = useAuthStore.getState();
    
    // Redirect non-admins
    if (!isAdmin) {
      throw redirect({
        to: '/'
      });
    }
  }
});

// Create the index route (QuoteForm)
const indexRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/',
  component: QuoteForm,
});

// Create the quotes list route (admin only)
const quotesRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: '/quotes',
  component: QuoteList
});

// Create and export the router
const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedLayout.addChildren([
    indexRoute,
    adminLayout.addChildren([
      quotesRoute,
    ]),
  ]),
]);

export const router = createRouter({ routeTree });

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}