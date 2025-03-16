import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type Store = Database['public']['Tables']['stores']['Row'];
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type InsertQuote = Database['public']['Tables']['quotes']['Insert'];
export type UpdateQuote = Database['public']['Tables']['quotes']['Update'];
export type UserMetadata = Database['public']['Tables']['user_metadata']['Row'];

// Type for quote list filter parameters
export interface QuoteFilters {
  clientName?: string;
  dateFrom?: string;
  dateTo?: string;
  isConfirmed?: boolean | null;
  storeId?: string;
  showAllStores?: boolean;
  sortBy?: string;
  sortDesc?: boolean;
}

// Type for paginated response
export interface PaginatedResponse<T> {
  data: T[];
  nextPage?: number;
  totalCount?: number;
}

/**
 * Fetch a single store by user ID
 * Since there's only one store per user, we use single() to get just that store
 */
export async function getStoreByUserId(userId: string): Promise<Store | null> {
  const { data, error } = await supabase.from('stores').select('*').eq('user_id', userId).single();

  if (error) {
    // If no store is found, don't throw an error, just return null
    if (error.code === 'PGRST116') {
      console.log(`No store found for user ${userId}`);
      return null;
    }
    console.error(`Error fetching store for user ${userId}:`, error);
    throw error;
  }

  return data;
}

/**
 * Fetch all stores from the database
 * For admin users only
 */
export async function getAllStores(): Promise<Store[]> {
  const { data, error } = await supabase.from('stores').select('*').order('name');

  if (error) {
    console.error('Error fetching all stores:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch user metadata to check if user is an admin
 */
export async function getUserMetadata(userId: string): Promise<UserMetadata | null> {
  const { data, error } = await supabase
    .from('user_metadata')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no metadata is found, don't throw an error, just return null
    if (error.code === 'PGRST116') {
      console.log(`No metadata found for user ${userId}`);
      return null;
    }
    console.error(`Error fetching metadata for user ${userId}:`, error);
    throw error;
  }

  return data;
}

/**
 * Create a new quote in the database (unconfirmed by default)
 */
export async function createQuote(quoteData: InsertQuote): Promise<Quote> {
  // Set is_confirmed to false by default
  const dataWithConfirmation = {
    ...quoteData,
    is_confirmed: false,
  };

  const { data, error } = await supabase
    .from('quotes')
    .insert(dataWithConfirmation)
    .select()
    .single();

  if (error) {
    console.error('Error creating quote:', error);
    throw error;
  }

  return data;
}

/**
 * Update a quote to mark it as confirmed
 */
export async function confirmQuote(quoteId: string): Promise<Quote> {
  const { data, error } = await supabase
    .from('quotes')
    .update({ is_confirmed: true })
    .eq('id', parseInt(quoteId, 10))
    .select()
    .single();

  if (error) {
    console.error(`Error confirming quote with ID ${quoteId}:`, error);
    throw error;
  }

  return data;
}

/**
 * Calculate rate amount using the Supabase Edge Function
 */
export async function calculateRate(
  storeId: string,
  clientName: string,
  numberOfSpaces: number,
  saleAmount: number
): Promise<number> {
  const { data, error } = await supabase.functions.invoke('calculate-rate', {
    body: {
      store_id: storeId,
      client_name: clientName,
      number_of_spaces: numberOfSpaces,
      sale_amount: saleAmount,
    },
  });

  if (error) {
    console.error('Error calculating rate:', error);
    throw error;
  }

  return data.rate_amount;
}

/**
 * Fetch quotes with pagination and filtering
 * For React Query's infinite scrolling with proper page-based pagination
 *
 * @param pageParam The page number (0-based, used to calculate the starting offset)
 * @param filters Filtering criteria for the quotes
 * @param pageSize Number of items per page
 */
export async function getQuotes(
  pageParam = 0,
  filters: QuoteFilters,
  pageSize = 10
): Promise<PaginatedResponse<Quote>> {
  // Calculate the starting index based on page number
  const startRange = pageParam * pageSize;
  const endRange = startRange + pageSize - 1;

  // Start building the query
  let query = supabase.from('quotes').select('*', { count: 'exact' });

  // Apply sorting if provided, otherwise default to created_at desc
  if (filters.sortBy) {
    query = query.order(filters.sortBy, { ascending: !filters.sortDesc });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(startRange, endRange);

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

  if (filters.isConfirmed !== undefined && filters.isConfirmed !== null) {
    query = query.eq('is_confirmed', filters.isConfirmed);
  }

  // Filter by store unless showAllStores is true
  if (!filters.showAllStores && filters.storeId) {
    query = query.eq('store_id', filters.storeId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }

  // Check if we have more pages by seeing if we got a full page of results
  // and if there are more total items beyond what we've fetched so far
  const totalFetched = (pageParam + 1) * pageSize;
  const hasMorePages = data.length === pageSize && count !== null && totalFetched < count;

  return {
    data: data || [],
    nextPage: hasMorePages ? pageParam + 1 : undefined,
    totalCount: count || 0,
  };
}

/**
 * Delete multiple quotes by their IDs
 */
export async function deleteQuotes(ids: number[]): Promise<void> {
  const { error } = await supabase.from('quotes').delete().in('id', ids);

  if (error) {
    console.error('Error deleting quotes:', error);
    throw error;
  }
}

/**
 * Update the status of multiple quotes
 */
export async function updateQuotesStatus(ids: number[], status: string): Promise<void> {
  const { error } = await supabase.from('quotes').update({ status }).in('id', ids);

  if (error) {
    console.error('Error updating quotes status:', error);
    throw error;
  }
}
