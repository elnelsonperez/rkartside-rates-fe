import { useQuery } from '@tanstack/react-query';
import { getStores, getStoreById, getStoreByUserId } from './api';

// Query keys for React Query
export const queryKeys = {
  stores: ['stores'] as const,
  store: (id: string) => ['store', id] as const,
  userStore: (userId: string) => ['store', 'user', userId] as const,
};

/**
 * Hook to fetch all stores
 */
export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores,
    queryFn: getStores,
  });
}

/**
 * Hook to fetch a specific store by ID
 */
export function useStore(id: string) {
  return useQuery({
    queryKey: queryKeys.store(id),
    queryFn: () => getStoreById(id),
    enabled: !!id, // Only run the query if an ID is provided
  });
}

/**
 * Hook to fetch a store by user ID
 * Since there's only one store per user, this returns a single store or null
 */
export function useUserStore(userId: string) {
  return useQuery({
    queryKey: queryKeys.userStore(userId),
    queryFn: () => getStoreByUserId(userId),
    enabled: !!userId, // Only run the query if a user ID is provided
  });
}