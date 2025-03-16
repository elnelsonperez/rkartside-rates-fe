import { Outlet } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';

export function ProtectedLayout() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {user?.isAdmin && <Navbar />}
      <div className="flex-grow">
        <Outlet />
      </div>
    </div>
  );
}