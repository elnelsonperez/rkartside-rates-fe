import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type Store = Database['public']['Tables']['stores']['Row'];
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type InsertQuote = Database['public']['Tables']['quotes']['Insert'];
export type UpdateQuote = Database['public']['Tables']['quotes']['Update'];
export type UserMetadata = Database['public']['Tables']['user_metadata']['Row'];

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
  const { data, error } = await supabase.from('user_metadata').select('*').eq('user_id', userId).single();

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
      sale_amount: saleAmount
    }
  });

  if (error) {
    console.error('Error calculating rate:', error);
    throw error;
  }

  return data.rate_amount;
}
