import { ReactNode, useEffect } from 'react';
import { useUserMetadata } from '../hooks/useUserMetadata';
import { useStores } from '../hooks/useStores';
import { useAuth } from './AuthContext';

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, loading, currentStore, setCurrentStore } = useAuth();
  
  // Fetch user metadata - this will automatically update the user's isAdmin status
  const metadataQuery = useUserMetadata();
  
  // Fetch stores based on the user's role
  const { stores, isLoading: isLoadingStores } = useStores();
  
  // Set the current store if we have stores and no current store
  useEffect(() => {
    if (stores.length > 0 && !currentStore) {
      // Select the first store
      setCurrentStore(stores[0]);
    }
  }, [stores, currentStore, setCurrentStore]);
  
  // Show loading if we're loading user, metadata, or stores
  if (loading || metadataQuery.isLoading || metadataQuery.isFetching || 
      (user && !metadataQuery.isError && isLoadingStores)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return <>{children}</>;
}