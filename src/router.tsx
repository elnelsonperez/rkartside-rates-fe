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
import App from './App';

// Create the root route with auth checking
const rootRoute = createRootRoute({
  component: () => (
    <>
      <App />
      <Outlet />
    </>
  ),
});

// Create authenticated layout route
const authenticatedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: RootLayout,
  beforeLoad: async () => {
    // When implementing proper auth check, this would validate the user is logged in
    // For now we just render the App component which handles auth
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

// Create the login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

// Create and export the router
const routeTree = rootRoute.addChildren([
  authenticatedLayout.addChildren([
    indexRoute,
    quotesRoute,
  ]),
  loginRoute,
]);

export const router = createRouter({ routeTree });

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}