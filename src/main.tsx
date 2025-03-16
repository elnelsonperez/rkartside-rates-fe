import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import './index.css';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { StoresProvider } from './context/StoresProvider';
import { UserMetadataProvider } from './context/UserMetadataProvider';
import { useAuthStore } from './lib/auth-store';
import { LoadingSpinner } from './components/LoadingSpinner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// App component that initializes auth and provides the router
function App() {
  const { initialize, isLoading } = useAuthStore();

  // Initialize auth when the app starts
  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Show a loading spinner while auth is initializing
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AuthProvider>
      <UserMetadataProvider>
        <StoresProvider>
          <RouterProvider router={router} />
        </StoresProvider>
      </UserMetadataProvider>
    </AuthProvider>
  );
}

// Initialize router
router.subscribe('onBeforeLoad', () => {
  console.info('Router loading started');
});

// Type assertion for document.getElementById
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Render the app
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
