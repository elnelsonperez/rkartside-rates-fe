import { ReactNode, useEffect } from 'react';
import { useStores } from '../hooks/useStores';
import { useAuthStore } from '../lib/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface StoresProviderProps {
  children: ReactNode;
}

export function StoresProvider({ children }: StoresProviderProps) {
  const { user, currentStore, setCurrentStore } = useAuthStore();
  
  // Use existing hook to fetch stores
  const { stores, isLoading: isLoadingStores } = useStores();
  
  // Set default store if needed
  useEffect(() => {
    if (stores.length > 0 && !currentStore) {
      console.log(`Auto-selecting store: "${stores[0].name}" (ID: ${stores[0].id})`);
      setCurrentStore(stores[0]);
    }
  }, [stores, currentStore, setCurrentStore]);
  
  // Show loading while stores are being fetched and user is authenticated
  if (user && isLoadingStores) {
    return <LoadingSpinner />;
  }
  
  // Don't render children until a store is selected (if stores are available)
  if (user && stores.length > 0 && !currentStore) {
    return <LoadingSpinner />;
  }
  
  return <>{children}</>;
}