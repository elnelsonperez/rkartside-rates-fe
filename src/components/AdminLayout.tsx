import { Outlet } from '@tanstack/react-router';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <Outlet />
    </div>
  );
}
