import { supabase } from './supabase';
import type { Database } from '../types/supabase';


export type Store = Database['public']['Tables']['stores']['Row'];

export async function getStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }

  return data;
}

export async function getStoreById(id: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching store with ID ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Fetch a single store by user ID
 * Since there's only one store per user, we use single() to get just that store
 */
export async function getStoreByUserId(userId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .single();

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

