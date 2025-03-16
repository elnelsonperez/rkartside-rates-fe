import { useQuery } from '@tanstack/react-query';
import { getUserMetadata } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function useUserMetadata() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['user-metadata', user],
    queryFn: async () => getUserMetadata(userId!),
    enabled: !!userId,
  });
}
