import { useQuery } from '@tanstack/react-query';
import { getUserMetadata } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function useUserMetadata() {
  const { user, updateUserIsAdmin } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['user-metadata', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const metadata = await getUserMetadata(userId);
      const isAdmin = metadata?.is_admin || false;
      
      // Update the user context with the admin status
      if (updateUserIsAdmin) {
        updateUserIsAdmin(isAdmin);
      }
      
      return { metadata, isAdmin };
    },
    enabled: !!userId,
    // Only fetch once per session
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}