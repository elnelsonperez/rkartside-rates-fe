import { useState, useMemo, useEffect } from 'react';
import {
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '../context/AuthContext';
import { useStores } from '../hooks/useStores';
import { supabase } from '../lib/supabase';
import type { Quote } from '../lib/api';
import { LoadingSpinner } from './LoadingSpinner';
import { format } from 'date-fns';

export function QuoteList() {
  const { currentStore, user: {isAdmin} } = useAuth();
  const { stores } = useStores();
  
  // Setup for intersection observer (infinite scroll)
  const { ref, inView } = useInView();
  
  // Sorting state for the table
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  
  // State to control filters visibility
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtering state
  const [filters, setFilters] = useState({
    clientName: '',
    dateFrom: '',
    dateTo: '',
    isConfirmed: true,
    showAllStores: false,
  });

  // Function to fetch quotes
  const fetchQuotes = async ({ pageParam = 0 }) => {
    // Start building the query
    let query = supabase
      .from('quotes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pageParam, pageParam + 19); // Fetch 20 rows at a time

    // Apply filters
    if (filters.clientName) {
      query = query.ilike('client_name', `%${filters.clientName}%`);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      // Add one day to include the end date
      const endDate = new Date(filters.dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }

    if (filters.isConfirmed !== null) {
      query = query.eq('is_confirmed', filters.isConfirmed);
    }

    // Filter by store unless showAllStores is true (and user is admin)
    if (!filters.showAllStores && currentStore) {
      query = query.eq('store_id', currentStore.id);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Check if we have more pages
    const hasNextPage = data.length === 20;

    return {
      data,
      nextPage: hasNextPage ? pageParam + 20 : undefined,
      totalCount: count,
    };
  };

  // Use infinite query to fetch quotes with pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['quotes', filters],
    queryFn: fetchQuotes,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Trigger next page fetch when last item is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages of quotes
  const quotes = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Function to reset filters
  const resetFilters = () => {
    setFilters({
      clientName: '',
      dateFrom: '',
      dateTo: '',
      isConfirmed: true,
      showAllStores: false,
    });
    setShowFilters(false);
  };
  
  // Toggle show all stores
  const toggleShowAllStores = () => {
    setFilters(prev => ({ ...prev, showAllStores: !prev.showAllStores }));
  };

  // Column definitions for the table
  const columnHelper = createColumnHelper<Quote>();
  
  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor('client_name', {
        header: 'Nombre de Cliente',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('created_at', {
        header: 'Fecha',
        cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm'),
        sortingFn: 'datetime',
      }),
      columnHelper.accessor('is_confirmed', {
        header: 'Confirmado',
        cell: info => info.getValue() ? (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Sí
          </span>
        ) : (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            No
          </span>
        ),
      }),
    ];
    
    // Add store column if showing all stores
    if (filters.showAllStores) {
      return [
        ...baseColumns,
        columnHelper.accessor('store_id', {
          header: 'Tienda',
          cell: info => {
            const storeId = info.getValue();
            const storeName = stores.find(store => store.id === storeId)?.name || 'Desconocida';
            return storeName;
          },
        }),
      ];
    }
    
    return baseColumns;
  }, [columnHelper, filters.showAllStores, stores]);

  // Initialize the table
  const table = useReactTable({
    data: quotes,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualFiltering: true,
  });

  // Early return if no store is available and not showing all stores
  if (!currentStore && !filters.showAllStores) {
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
            
            {isAdmin && (
              <button
                onClick={toggleShowAllStores}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filters.showAllStores 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                } transition-colors`}
              >
                {filters.showAllStores ? 'Ver tienda actual' : 'Ver todas las tiendas'}
              </button>
            )}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isConfirmed"
                checked={filters.isConfirmed}
                onChange={(e) => setFilters(prev => ({ ...prev, isConfirmed: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isConfirmed" className="ml-2 text-sm text-gray-700">
                Solo confirmadas
              </label>
            </div>
          </div>
        </div>
        
        {/* Store information */}
        <p className="text-gray-600 mb-6">
          {filters.showAllStores 
            ? 'Mostrando cotizaciones de todas las tiendas' 
            : `Mostrando cotizaciones para ${currentStore?.name}`
          }
        </p>

        {/* Collapsible Filters */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out mb-6 ${
            showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Cliente
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={filters.clientName}
                  onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar por nombre..."
                />
              </div>
              
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  id="dateTo"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {status === 'pending' && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="text-center text-red-600 p-4">
            Ocurrió un error al cargar las cotizaciones. Por favor, intenta de nuevo.
          </div>
        )}

        {/* Empty state */}
        {status === 'success' && quotes.length === 0 && (
          <div className="text-center text-gray-500 p-12 border border-dashed border-gray-300 rounded-lg">
            No se encontraron cotizaciones con los filtros seleccionados.
          </div>
        )}

        {/* Tanstack Table */}
        {status === 'success' && quotes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <span className="ml-1">
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row, index) => {
                  // Add ref to the last item for infinite scroll
                  const isLastItem = index === quotes.length - 1;
                  
                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-gray-50"
                      ref={isLastItem ? ref : undefined}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Loading indicator for fetching more */}
        {(isFetchingNextPage || (isFetching && !isFetchingNextPage)) && (
          <div className="py-4 text-center">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
}