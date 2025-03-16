import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStores } from '../hooks/useStores';
import { Store } from '../lib/api';

export function Navbar() {
  const { user, currentStore, setCurrentStore, signOut } = useAuth();
  const { stores } = useStores();
  const [isOpen, setIsOpen] = useState(false);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Don't render anything if there's no user or the user isn't an admin
  if (!user || !user.isAdmin) return null;

  const handleStoreChange = (selectedStore: Store) => {
    setCurrentStore(selectedStore);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="bg-blue-800 text-white p-3 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-bold text-lg mr-4">Admin Dashboard</span>
          
          {/* Store selector dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-white transition"
            >
              <span className="mr-2">{currentStore?.name || 'Select Store'}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {isOpen && (
              <div className="absolute mt-1 w-56 bg-white text-gray-800 rounded shadow-lg z-10">
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleStoreChange(s)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                      currentStore?.id === s.id ? 'bg-blue-50 font-medium' : ''
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}