import { useState, useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '../context/AuthContext';
import { useStores } from '../hooks/useStores';
import { Quote, QuoteFilters, getQuotes, deleteQuotes, updateQuotesStatus } from '../lib/api';
import { LoadingSpinner } from './LoadingSpinner';
import { format } from 'date-fns';

export function QuoteList() {
  const { currentStore, user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const { stores } = useStores();
  const queryClient = useQueryClient();

  // Setup for intersection observer (infinite scroll)
  const { ref, inView } = useInView();

  // Sorting state for the table
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);

  // Create a derived effect to update filters when sorting changes
  useEffect(() => {
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      setFilters(prev => ({
        ...prev,
        sortBy: id,
        sortDesc: desc,
      }));
    }
  }, [sorting]);

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Status update dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // State to control filters visibility
  const [showFilters, setShowFilters] = useState(false);

  // Filtering state
  const [filters, setFilters] = useState<QuoteFilters>({
    clientName: '',
    dateFrom: '',
    dateTo: '',
    isConfirmed: true,
    showAllStores: false,
    sortBy: 'created_at',
    sortDesc: true,
  });

  // Function to fetch quotes
  const fetchQuotes = async ({ pageParam = 0 }) => {
    // Prepare filters with currentStore info
    const apiFilters: QuoteFilters = {
      ...filters,
      storeId: currentStore?.id,
    };

    return getQuotes(pageParam, apiFilters);
  };

  // Use infinite query to fetch quotes with pagination
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ['quotes', filters, currentStore?.id],
      queryFn: fetchQuotes,
      getNextPageParam: lastPage => lastPage.nextPage,
      initialPageParam: 0,
    });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteQuotes,
    onSuccess: () => {
      // Invalidate and refetch the quotes query
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      // Clear selection
      setRowSelection({});
      // Close confirmation dialog
      setShowConfirmDialog(false);
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
      updateQuotesStatus(ids, status),
    onSuccess: () => {
      // Invalidate and refetch the quotes query
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      // Clear selection
      setRowSelection({});
      // Close status dialog
      setShowStatusDialog(false);
      // Reset selected status
      setSelectedStatus('');
    },
  });

  // Single quote status update mutation
  const singleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      console.log(`Mutation called for quote ${id} to status ${status}`);
      return updateQuotesStatus([id], status);
    },
    onSuccess: () => {
      // Just invalidate and refetch the quotes query
      console.log('Status update successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: error => {
      console.error('Status update failed:', error);
    },
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
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    const selectedIds = Object.keys(rowSelection)
      .map(idx => quotes[parseInt(idx)]?.id)
      .filter(Boolean) as number[];

    if (selectedIds.length > 0) {
      deleteMutation.mutate(selectedIds);
    }
  };

  // Handle status update confirmation
  const handleStatusUpdate = () => {
    const selectedIds = Object.keys(rowSelection)
      .map(idx => quotes[parseInt(idx)]?.id)
      .filter(Boolean) as number[];

    if (selectedIds.length > 0 && selectedStatus) {
      statusMutation.mutate({ ids: selectedIds, status: selectedStatus });
    }
  };

  // Function to reset filters
  const resetFilters = () => {
    // Preserve sorting when resetting other filters
    const { sortBy, sortDesc } = filters;

    setFilters({
      clientName: '',
      dateFrom: '',
      dateTo: '',
      isConfirmed: true,
      showAllStores: false,
      sortBy,
      sortDesc,
    });
    setShowFilters(false);
  };

  // Toggle show all stores
  const toggleShowAllStores = () => {
    setFilters(prev => ({ ...prev, showAllStores: !prev.showAllStores }));
  };

  // Format currency for sale_amount
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Status configuration
  const statusConfig = {
    pending: {
      label: 'PENDIENTE',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      hoverBg: 'hover:bg-gray-200',
    },
    in_progress: {
      label: 'EN PROCESO',
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      hoverBg: 'hover:bg-yellow-200',
    },
    ignored: {
      label: 'IGNORADO',
      bg: 'bg-red-100',
      text: 'text-red-800',
      hoverBg: 'hover:bg-red-200',
    },
    completed: {
      label: 'COMPLETADO',
      bg: 'bg-green-100',
      text: 'text-green-800',
      hoverBg: 'hover:bg-green-200',
    },
  };

  // Status dropdown state - track which row has open dropdown
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is inside a dropdown button
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown-button') && !target.closest('.status-dropdown-menu')) {
        setOpenStatusDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get status badge based on status
  const getStatusBadge = (status: string | null) => {
    const config = status
      ? statusConfig[status as keyof typeof statusConfig]
      : statusConfig.pending;

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  // Render status cell with dropdown
  const StatusCell = ({ value, row }: { value: string | null; row: any }) => {
    const quoteId = row.original.id;
    const currentStatus = value || 'pending';
    const isOpen = openStatusDropdown === quoteId;

    const handleStatusClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenStatusDropdown(isOpen ? null : quoteId);
    };

    // Track if this component is mounted
    const isMounted = useRef(true);
    useEffect(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    const updateStatus = (status: string) => {
      if (status !== currentStatus) {
        console.log(`Updating quote ${quoteId} status from "${currentStatus}" to "${status}"`);
        singleStatusMutation.mutate(
          { id: quoteId, status },
          {
            onSuccess: () => {
              if (isMounted.current) {
                console.log(`Successfully updated quote ${quoteId} status to "${status}"`);
              }
            },
            onError: error => {
              console.error(`Error updating quote ${quoteId} status:`, error);
            },
          }
        );
      }
      setOpenStatusDropdown(null);
    };

    return (
      <div className="relative">
        <button
          onClick={handleStatusClick}
          className="focus:outline-none status-dropdown-button"
          title="Cambiar estado"
          data-quote-id={quoteId}
        >
          <div className="flex items-center cursor-pointer group">
            {getStatusBadge(currentStatus)}
            <svg
              className={`ml-1 w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div
            className="status-dropdown-menu fixed z-50 mt-1 w-44 bg-white rounded-md shadow-lg py-1"
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
            data-quote-id={quoteId}
          >
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={e => {
                  e.stopPropagation(); // Prevent row selection when clicking buttons
                  updateStatus(key);
                }}
                className={`w-full text-left px-3 py-2 text-sm ${config.hoverBg} transition-colors flex items-center justify-between ${
                  currentStatus === key ? 'bg-gray-100' : ''
                }`}
              >
                <span>{config.label}</span>
                {currentStatus === key && (
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {singleStatusMutation.isPending && singleStatusMutation.variables?.id === quoteId && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  };

  // Get number of selected rows
  const selectedCount = Object.keys(rowSelection).length;

  // Column definitions for the table
  const columnHelper = createColumnHelper<Quote>();

  const columns = useMemo(() => {
    const selectColumn = [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <div className="px-1">
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        ),
      }),
    ];

    const dataColumns = [
      columnHelper.accessor('created_at', {
        header: 'Fecha',
        cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy hh:mma'),
        sortingFn: 'datetime',
      }),
      columnHelper.accessor('client_name', {
        header: 'Nombre',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: info => <StatusCell value={info.getValue()} row={info.row} />,
      }),
      columnHelper.accessor('is_confirmed', {
        header: 'Confirmado',
        cell: info =>
          info.getValue() ? (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              Sí
            </span>
          ) : (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
              No
            </span>
          ),
      }),
      columnHelper.accessor('sale_amount', {
        header: 'Monto',
        cell: info => formatCurrency(info.getValue()),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('number_of_spaces', {
        header: 'Espacios',
        cell: info => info.getValue(),
        sortingFn: 'basic',
      }),
    ];

    // Add store column if showing all stores
    if (filters.showAllStores) {
      return [
        ...selectColumn,
        columnHelper.accessor('store_id', {
          header: 'Tienda',
          cell: info => {
            const storeId = info.getValue();
            const storeName = stores.find(store => store.id === storeId)?.name || 'Desconocida';
            return storeName;
          },
        }),
        ...dataColumns,
      ];
    }

    return [...selectColumn, ...dataColumns];
  }, [columnHelper, filters.showAllStores, stores]);

  // Initialize the table
  const table = useReactTable({
    data: quotes,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
              ? 'Please select a store from the navigation menu'
              : 'No stores are assigned to your account'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 relative">
        {/* Header with title and filters */}
        <div className="flex flex-col gap-4 mb-3">
          <div className="flex flex-wrap justify-between items-center mb-1">
            <h1 className="text-2xl font-bold">Cotizaciones</h1>

            {/* Filter actions - always visible */}
            <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 sm:px-3 sm:py-1 rounded-md text-sm font-medium transition-colors flex items-center"
                title={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </span>
              </button>

              {isAdmin && (
                <button
                  onClick={toggleShowAllStores}
                  title={filters.showAllStores ? 'Ver tienda actual' : 'Ver todas las tiendas'}
                  className={`p-2 sm:px-3 sm:py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                    filters.showAllStores
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {filters.showAllStores ? 'Ver tienda actual' : 'Ver todas'}
                  </span>
                </button>
              )}

              <div className="flex items-center bg-gray-100 p-1 px-2 rounded-md">
                <input
                  type="checkbox"
                  id="isConfirmed"
                  checked={!!filters.isConfirmed}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, isConfirmed: e.target.checked ? true : null }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isConfirmed" className="ml-2 text-xs sm:text-sm text-gray-700">
                  Confirmadas
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Selection actions bar - separate and prominent */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center justify-between bg-blue-50 p-3 rounded-md border border-blue-100 mb-1">
            <span className="text-sm font-medium text-blue-800">
              {selectedCount}{' '}
              {selectedCount === 1 ? 'cotización seleccionada' : 'cotizaciones seleccionadas'}
            </span>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => setShowStatusDialog(true)}
                className="bg-white hover:bg-blue-50 text-blue-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
                <span className="hidden xs:inline">Cambiar estado</span>
                <span className="xs:hidden">Estado</span>
              </button>
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="bg-white hover:bg-red-50 text-red-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="hidden xs:inline">Eliminar</span>
                <span className="xs:hidden">Eliminar</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Filters */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out mb-6 ${
            showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre de Cliente
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={filters.clientName}
                  onChange={e => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
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
                  onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
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
                  onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
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

        {/* Tanstack Table with loading overlay */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {/* Loading overlay */}
          {status === 'pending' && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-40">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <LoadingSpinner fullScreen={false} size="large" />
                <p className="text-gray-600 mt-2 text-center">Cargando cotizaciones...</p>
              </div>
            </div>
          )}

          {/* Only show table if we have data */}
          {status === 'success' && quotes.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className={`px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.id !== 'select' ? 'cursor-pointer' : ''}`}
                        onClick={
                          header.id !== 'select'
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        <div className="flex items-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.id !== 'select' && (
                            <span className="ml-1">
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                          )}
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
                      className={`hover:bg-gray-50 ${row.getIsSelected() ? 'bg-blue-50' : ''} cursor-pointer`}
                      ref={isLastItem ? ref : undefined}
                      onClick={() => row.toggleSelected(!row.getIsSelected())}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className="px-2 py-4 whitespace-nowrap"
                          onClick={
                            cell.column.id === 'status' ? e => e.stopPropagation() : undefined
                          }
                        >
                          <div className="text-sm text-gray-900">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Loading indicator for fetching more - as overlay */}
          {(isFetchingNextPage || (isFetching && !isFetchingNextPage && status !== 'pending')) && (
            <div className="absolute inset-0 bg-white bg-opacity-60 flex justify-center items-center z-40">
              <div className="bg-white rounded-lg p-3 shadow-md">
                <LoadingSpinner fullScreen={false} size="medium" />
                <p className="text-gray-600 mt-2 text-sm text-center">Actualizando datos...</p>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea eliminar {selectedCount}{' '}
                {selectedCount === 1 ? 'cotización' : 'cotizaciones'}? Esta acción no se puede
                deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Change Dialog */}
        {showStatusDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar estado</h3>
              <p className="text-gray-600 mb-4">
                Seleccione el nuevo estado para {selectedCount}{' '}
                {selectedCount === 1 ? 'cotización' : 'cotizaciones'}.
              </p>

              <div className="grid grid-cols-1 gap-3 mb-6">
                <button
                  onClick={() => setSelectedStatus('pending')}
                  className={`flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 ${
                    selectedStatus === 'pending'
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="font-medium">Pendiente</span>
                  {getStatusBadge('pending')}
                </button>

                <button
                  onClick={() => setSelectedStatus('in_progress')}
                  className={`flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 ${
                    selectedStatus === 'in_progress'
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="font-medium">En proceso</span>
                  {getStatusBadge('in_progress')}
                </button>

                <button
                  onClick={() => setSelectedStatus('ignored')}
                  className={`flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 ${
                    selectedStatus === 'ignored'
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="font-medium">Ignorado</span>
                  {getStatusBadge('ignored')}
                </button>

                <button
                  onClick={() => setSelectedStatus('completed')}
                  className={`flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 ${
                    selectedStatus === 'completed'
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="font-medium">Completado</span>
                  {getStatusBadge('completed')}
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowStatusDialog(false);
                    setSelectedStatus('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || statusMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {statusMutation.isPending ? 'Actualizando...' : 'Actualizar estado'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
