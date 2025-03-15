import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type Store = Database['public']['Tables']['stores']['Row'];
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type InsertQuote = Database['public']['Tables']['quotes']['Insert'];
export type UpdateQuote = Database['public']['Tables']['quotes']['Update'];

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
