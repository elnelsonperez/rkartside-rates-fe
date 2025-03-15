import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { 
  Store, 
  createQuote, 
  confirmQuote, 
  calculateRate,
  InsertQuote, 
  Quote 
} from './lib/api.ts';

// Function to convert text to title case
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function QuoteForm({ store }: { store: Store }) {
  const [clientName, setClientName] = useState<string>('');
  const [numberOfSpaces, setNumberOfSpaces] = useState<number>(1);
  const [saleAmount, setSaleAmount] = useState<string>('');
  const [savedQuote, setSavedQuote] = useState<Quote | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const { signOut, user } = useAuth();
  const requiresSaleAmount = store.requires_sale_amount


  // References for input fields focusing
  const clientNameInputRef = useRef<HTMLInputElement>(null);
  const saleAmountInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = store.image_url || 'https://placehold.co/600x400';

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Parse the formatted saleAmount by removing all non-numeric characters
      // Default to 0 if not required or not provided
      const saleAmountNum = requiresSaleAmount 
        ? Number(saleAmount.replace(/[^0-9]/g, ''))
        : 0;

      // Only validate sale amount if it's required
      if (requiresSaleAmount && (isNaN(saleAmountNum) || saleAmountNum <= 0)) {
        throw new Error('El monto de venta debe ser un número positivo');
      }

      // Format client name to title case
      const formattedClientName = toTitleCase(clientName.trim());

      // Ensure user exists
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      // Calculate the rate using the server-side Edge Function
      const rateAmount = await calculateRate(
        store.id,
        formattedClientName,
        numberOfSpaces,
        saleAmountNum
      );

      // Create a new quote in Supabase
      const quoteData: InsertQuote = {
        store_id: store.id,
        client_name: formattedClientName,
        number_of_spaces: numberOfSpaces,
        sale_amount: saleAmountNum,
        rate_amount: rateAmount,
        is_confirmed: false,
        created_by: user.id,
      };

      // Save the quote to Supabase
      const newQuote = await createQuote(quoteData);

      // Update state with the results
      setSavedQuote(newQuote);
      setIsConfirmed(false);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Error al obtener la cotización. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    // Remove non-numeric characters
    const rawValue = e.target.value.replace(/[^0-9]/g, '');

    if (rawValue) {
      // Convert to number and format with thousand separators
      const numericValue = parseInt(rawValue, 10);
      // Format with thousand separators but no currency symbol or decimal places
      const formattedValue = new Intl.NumberFormat('es-DO', {
        useGrouping: true,
        maximumFractionDigits: 0,
      }).format(numericValue);

      setSaleAmount(formattedValue);
    } else {
      setSaleAmount('');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleConfirmQuote = async () => {
    if (!savedQuote) return;

    setConfirmLoading(true);
    try {
      await confirmQuote(String(savedQuote.id));
      setIsConfirmed(true);
    } catch (err) {
      console.error('Error confirming quote:', err);
      setError('Error al confirmar la cotización. Por favor, intente de nuevo.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Check if the form is valid to enable/disable the submit button
  const isFormInvalid = !clientName.trim() || (requiresSaleAmount && !saleAmount) || numberOfSpaces <= 0 || loading;
  
  // Check if any form field has a value to show the clear button
  const hasFormValues = clientName.trim() !== '' || saleAmount !== '' || numberOfSpaces !== 1 || !!savedQuote;

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

        <div className="text-center  mb-6 ">
          <h1 className="text-2xl font-bold text-gray-800">{store.name}</h1>

          <p>Cotizador de servicios RKArtSide</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
              { store.custom_client_name_text || "Nombre del Cliente"}
            </label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              required
              ref={clientNameInputRef}
              disabled={isConfirmed}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
          </div>

          <div>
            <fieldset className=" rounded-md">
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Número de espacios a decorar
              </legend>
              <div className="focus-within:outline-none focus-within:ring-1 focus-within:ring-blue-500 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <div key={num} className="relative">
                    <input
                      type="radio"
                      id={`spaces-${num}`}
                      name="numberOfSpaces"
                      value={num}
                      checked={numberOfSpaces === num}
                      onChange={() => {
                        setNumberOfSpaces(num);
                        // Focus the sale amount input after selection only if it's required
                        if (requiresSaleAmount) {
                          setTimeout(() => {
                            saleAmountInputRef.current?.focus();
                          }, 0);
                        }
                      }}
                      className="absolute opacity-0 h-0 w-0" // Hidden visually but still focusable
                    />
                    <label
                      htmlFor={`spaces-${num}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-md border cursor-pointer transition-colors ${
                        numberOfSpaces === num
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}
                    >
                      {num}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          {requiresSaleAmount && (
            <div>
              <label htmlFor="saleAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto total de venta (DOP)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  RD$
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  id="saleAmount"
                  value={saleAmount}
                  onChange={handleSaleAmountChange}
                  placeholder="0"
                  required={requiresSaleAmount}
                  ref={saleAmountInputRef}
                  className="w-full pl-11 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required={requiresSaleAmount ? "true" : "false"}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isFormInvalid}
              className={`${hasFormValues ? 'flex-grow' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50`}
            >
              {loading ? 'Procesando...' : 'Cotizar'}
            </button>
            {hasFormValues && (
              <button
                type="button"
                onClick={() => {
                  setClientName('');
                  setNumberOfSpaces(1);
                  setSaleAmount('');
                  setSavedQuote(null);
                  setIsConfirmed(false);
                  setError('');
                  
                  // Focus the client name input field
                  setTimeout(() => {
                    clientNameInputRef.current?.focus();
                  }, 0);
                }}
                className="w-28 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-md transition duration-200 ease-in-out"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>

        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        {!!savedQuote?.rate_amount && (
          <div className="mt-6 p-4 border border-green-200 rounded-md bg-green-50">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Resultado de la Cotización</h2>
            <p className="text-gray-700 mb-2">
              <strong>Cliente:</strong> {toTitleCase(clientName.trim())}
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Tarifa calculada:</strong>{' '}
              <span className="font-bold">{formatCurrency(savedQuote.rate_amount)}</span>
            </p>

            {!isConfirmed ? (
              <button
                type="button"
                onClick={handleConfirmQuote}
                disabled={confirmLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50"
              >
                {confirmLoading ? 'Confirmando...' : 'Confirmar Cotización'}
              </button>
            ) : (
              <div className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-2 rounded-md text-center">
                ✅ Cotización confirmada exitosamente
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const { user, loading, store } = useAuth();

  if (loading || (user && !store)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user && store ? <QuoteForm store={store} /> : <Login />;
}

export default App;
