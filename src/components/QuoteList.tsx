import { useAuth } from '../context/AuthContext';

export function QuoteList() {
  const { currentStore } = useAuth();
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Cotizaciones</h1>
        {currentStore ? (
          <p className="text-gray-600">
            Mostrando cotizaciones para {currentStore.name}
          </p>
        ) : (
          <p className="text-gray-600">
            Seleccione una tienda para ver sus cotizaciones
          </p>
        )}
        {/* Quote list will be implemented later */}
      </div>
    </div>
  );
}