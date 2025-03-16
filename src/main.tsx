import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import './index.css';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserProvider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Enable the router
const enableRouter = () => {
  // Register your router instance for type safety
  router.subscribe('onBeforeLoad', () => {
    console.info('Router before load');
  });
};

// Call enableRouter immediately
enableRouter();

// Type assertion for document.getElementById
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
