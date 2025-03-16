import { Outlet } from '@tanstack/react-router';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';

export function RootLayout() {
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