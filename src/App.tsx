import { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { QuoteRequest, QuoteResponse } from './types';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import {Store} from "./lib/api.ts";

function QuoteForm({store}: {store: Store}) {

  const [numberOfSpaces, setNumberOfSpaces] = useState<number>(1);
  const [saleAmount, setSaleAmount] = useState<string>('');
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { signOut, user } = useAuth();

  const logoUrl = store.image_url || 'https://placehold.co/600x400';
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.example.com';

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setQuoteResult(null);
    setLoading(true);

    try {
      // Convert saleAmount to a number and validate
      const saleAmountNum = Number(saleAmount.replace(/[^0-9.-]+/g, ''));

      if (isNaN(saleAmountNum) || saleAmountNum <= 0) {
        throw new Error('El monto de venta debe ser un número positivo');
      }

      const quoteRequest: QuoteRequest = {
        store_id: store.id,
        number_of_spaces: numberOfSpaces,
        sale_amount: saleAmountNum,
      };

      const response = await axios.post<QuoteResponse>(`${apiUrl}/quote`, quoteRequest);
      setQuoteResult(response.data);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Error al obtener la cotización. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    // Allow only numbers and format as currency
    const value = e.target.value.replace(/[^0-9]/g, '');
    setSaleAmount(value ? value : '');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
          <div className="flex flex-col items-end">
            {user?.email && <span className="text-sm text-gray-600 mb-1">{user.email}</span>}
            <button onClick={handleSignOut} className="text-sm text-blue-600 hover:text-blue-800">
              Cerrar Sesión
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          RKArtSide - Cotizador de Servicios
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="numberOfSpaces"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Número de espacios a decorar
            </label>
            <input
              type="number"
              id="numberOfSpaces"
              value={numberOfSpaces}
              onChange={e => setNumberOfSpaces(Number(e.target.value))}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="saleAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto total de venta (DOP)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                RD$
              </span>
              <input
                type="text"
                id="saleAmount"
                value={saleAmount}
                onChange={handleSaleAmountChange}
                placeholder="0"
                required
                className="w-full pl-11 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Cotizar'}
          </button>
        </form>

        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        {quoteResult && (
          <div className="mt-6 p-4 border border-green-200 rounded-md bg-green-50">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Resultado de la Cotización</h2>
            <p className="text-gray-700">
              Tarifa calculada:{' '}
              <span className="font-bold">{formatCurrency(quoteResult.rate)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const { user, loading, store } = useAuth();

  if (loading || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? <QuoteForm store={store} /> : <Login />;
}

export default App;
