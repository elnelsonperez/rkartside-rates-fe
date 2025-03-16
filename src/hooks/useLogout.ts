import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext.tsx';
import { useCallback } from 'react';

export function useLogout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return useCallback(async () => {
    try {
      await signOut();
      await navigate({ to: '/login' });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }, [navigate, signOut]);
}
