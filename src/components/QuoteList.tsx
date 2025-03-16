import { useAuth } from '../context/AuthContext';
import { useStores } from '../hooks/useStores';

export function QuoteList() {
  const { currentStore } = useAuth();
  const { stores } = useStores();
  
  // Due to the UserProvider's logic, we should already have a current store set
  // But we'll keep these checks for safety
  
  // Early return if no store is available
  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No store selected</h2>
          <p className="text-gray-600">
            {stores.length > 0 
              ? "Please select a store from the navigation menu" 
              : "No stores are assigned to your account"
            }
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Cotizaciones</h1>
        <p className="text-gray-600">
          Mostrando cotizaciones para {currentStore.name}
        </p>
        {/* Quote list will be implemented later */}
      </div>
    </div>
  );
}