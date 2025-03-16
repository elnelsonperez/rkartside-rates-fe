import { useQuery } from '@tanstack/react-query';
import { getAllStores, getStoreByUserId } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function useStores() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const userId = user?.id;

  // For admin users, fetch all stores
  const allStoresQuery = useQuery({
    queryKey: ['stores', 'all'],
    queryFn: getAllStores,
    enabled: !!isAdmin && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // For regular users, fetch only their store
  const userStoreQuery = useQuery({
    queryKey: ['stores', 'user', userId],
    queryFn: () => getStoreByUserId(userId!),
    enabled: !!userId && isAdmin === false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Determine which query to use based on admin status
  const activeQuery = isAdmin ? allStoresQuery : userStoreQuery;

  return {
    stores: isAdmin ? allStoresQuery.data || [] : userStoreQuery.data ? [userStoreQuery.data] : [],
    isLoading: activeQuery.isLoading,
    isFetching: activeQuery.isFetching,
    error: activeQuery.error,
  };
}
