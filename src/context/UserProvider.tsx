import { ReactNode, useEffect } from 'react';
import { useUserMetadata } from '../hooks/useUserMetadata';
import { useStores } from '../hooks/useStores';
import { useAuth } from './AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, loading, currentStore, setCurrentStore, updateUserIsAdmin } = useAuth();


  // Fetch user metadata - this will automatically update the user's isAdmin status
  const metadataQuery = useUserMetadata();
  
  // Fetch stores based on the user's role
  const { stores, isLoading: isLoadingStores } = useStores();

  // Set the current store if we have stores and no current store
  useEffect(() => {
    if (stores.length > 0 && !currentStore) {
      console.log(
        `Auto-selecting store: "${stores[0].name}" (ID: ${stores[0].id}) ` +
        `for ${user?.isAdmin ? 'admin' : 'regular'} user`
      );
      // Select the first store
      setCurrentStore(stores[0]);
    }
  }, [stores, currentStore, setCurrentStore, user?.isAdmin]);


  useEffect(() => {
    if (metadataQuery.data) {
      const { is_admin: isAdmin } = metadataQuery.data;
      updateUserIsAdmin(isAdmin);
    }
  }, [metadataQuery.data]);

  // Track if we're waiting for initial data
  const isLoadingUserData = loading || metadataQuery.isLoading || metadataQuery.isFetching;
  const isLoadingStoreData = user && !metadataQuery.isError && isLoadingStores;
  const needsStoreSelection = user?.isAdmin && stores.length > 0 && !currentStore;
  
  const isInitializing = isLoadingUserData || isLoadingStoreData || needsStoreSelection;
  
  // Show loading if we're loading user, metadata, or stores
  if (isInitializing) {
    // Add debug logs to help diagnose any issues
    if (process.env.NODE_ENV !== 'production') {
      const reason = isLoadingUserData 
        ? 'Loading user data' 
        : isLoadingStoreData 
          ? 'Loading store data' 
          : 'Waiting for store selection';
      console.log(`UserProvider is showing loading spinner: ${reason}`);
    }
    return <LoadingSpinner />;
  }
  
  return <>{children}</>;
}