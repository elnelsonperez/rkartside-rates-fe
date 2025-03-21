import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { useStores } from '../hooks/useStores';
import { Store } from '../lib/api';
import { useLogout } from '../hooks/useLogout.ts';

export function Navbar() {
  const { user, currentStore, setCurrentStore } = useAuth();
  const { stores } = useStores();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = useLogout();

  // Close the dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) setIsOpen(false);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, mobileMenuOpen]);

  // Don't render anything if there's no user or the user isn't an admin
  if (!user || !user.isAdmin) return null;

  const handleStoreChange = (selectedStore: Store) => {
    setCurrentStore(selectedStore);
    setIsOpen(false);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="bg-gray-800 text-white p-3 shadow-md">
      <div className="container mx-auto">
        {/* Desktop View */}
        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="font-bold text-lg">RKArtSide</span>

            {/* Store selector dropdown */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
              >
                <span className="mr-2">{currentStore?.name || 'Select Store'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {isOpen && (
                <div className="absolute mt-1 w-56 bg-white text-gray-800 rounded shadow-lg z-10">
                  {stores.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleStoreChange(s)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                        currentStore?.id === s.id ? 'bg-gray-200 font-medium' : ''
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                activeProps={{ className: 'text-white font-medium' }}
                inactiveProps={{ className: 'text-gray-300 hover:text-white' }}
                className="transition duration-150 ease-in-out"
              >
                Cotizar
              </Link>
              <Link
                to="/quotes"
                activeProps={{ className: 'text-white font-medium' }}
                inactiveProps={{ className: 'text-gray-300 hover:text-white' }}
                className="transition duration-150 ease-in-out"
              >
                Cotizaciones
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={e => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="text-white focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    mobileMenuOpen
                      ? 'M6 18L18 6M6 6l12 12' // X icon when menu is open
                      : 'M4 6h16M4 12h16M4 18h16' // Hamburger icon when menu is closed
                  }
                />
              </svg>
            </button>
            <span className="font-bold text-lg ml-3">RKArtSide</span>
          </div>

          <div className="text-sm truncate max-w-[150px]">
            {currentStore?.name || 'Select Store'}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 py-2 border-t border-gray-700">
            <div className="mb-3 text-sm text-gray-300">{user.email}</div>

            {/* Mobile Navigation Links */}
            <nav className="mb-3 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-gray-700 transition"
              >
                Cotizar
              </Link>
              <Link
                to="/quotes"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-gray-700 transition"
              >
                Cotizaciones
              </Link>
            </nav>

            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Select Store:</div>
              <div className="max-h-60 overflow-y-auto">
                {stores.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleStoreChange(s)}
                    className={`w-full text-left px-3 py-2 mb-1 rounded ${
                      currentStore?.id === s.id ? 'bg-gray-700 font-medium' : 'hover:bg-gray-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full text-left text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
