import { ReactNode, useEffect } from 'react';
import { useUserMetadata } from '../hooks/useUserMetadata';
import { useAuthStore } from '../lib/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface UserMetadataProviderProps {
  children: ReactNode;
}

export function UserMetadataProvider({ children }: UserMetadataProviderProps) {
  const { user, setIsAdmin } = useAuthStore();

  // Use existing hook to fetch user metadata
  const { data: metadata, isLoading, isFetching } = useUserMetadata();

  // Update isAdmin in auth store when metadata changes
  useEffect(() => {
    if (metadata) {
      setIsAdmin(!!metadata.is_admin);
    }
  }, [metadata, setIsAdmin]);

  // Show loading while metadata is being fetched for authenticated users
  if (user && (isLoading || isFetching)) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
