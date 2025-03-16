import { 
  createRootRoute, 
  createRoute, 
  createRouter,
  Outlet
} from '@tanstack/react-router';
import { QuoteForm } from './components/QuoteForm';
import { QuoteList } from './components/QuoteList';
import { RootLayout } from './components/RootLayout';
import { Login } from './components/Login';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';

// Create the root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Create authenticated layout route
const authenticatedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: () => {
    const { user, loading } = useAuth();
    
    // Show loading spinner while checking auth
    if (loading) {
      return <LoadingSpinner />;
    }
    
    // If no user, return Login component
    if (!user) {
      return <Login />;
    }
    
    // If authenticated, render the layout with outlet
    return <RootLayout />;
  },
  beforeLoad: async () => {
    // We could also do server-side auth checking here if needed
    // For example, check if a token is valid via API
    // For now, this is handled in the component itself

    // Alternatively, we could use router.navigate to redirect
    // if no auth, but we choose to render Login in the component
  },
});

// Create the index route (QuoteForm)
const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/',
  component: QuoteForm,
});

// Create the quotes list route
const quotesRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/quotes',
  component: QuoteList,
});

// Create and export the router
const routeTree = rootRoute.addChildren([
  authenticatedLayout.addChildren([
    indexRoute,
    quotesRoute,
  ]),
]);

export const router = createRouter({ routeTree });

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}