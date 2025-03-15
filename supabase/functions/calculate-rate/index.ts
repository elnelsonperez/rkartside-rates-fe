// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase_functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

interface RequestPayload {
  store_id: string;
  client_name: string;
  number_of_spaces: number;
  sale_amount: number;
}

interface RateResponse {
  rate_amount: number;
}

serve(async (req) => {
  // CORS headers to allow requests from any origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const payload: RequestPayload = await req.json();
    
    // Basic validation
    if (!payload.store_id || !payload.client_name || !payload.number_of_spaces || !payload.sale_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a Supabase client with the Deno runtime Auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Fetch the store to get rate_factor
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('rate_factor')
      .eq('id', payload.store_id)
      .single();

    if (storeError) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Calculate the rate amount based on store rate_factor and input values
    // Formula: sale_amount * rate_factor * number_of_spaces / 100
    // The rate_factor is stored as a percentage (eg. 10 for 10%)
    const rateFactor = store.rate_factor || 10; // Default to 10% if not set
    const rateAmount = Math.round(payload.sale_amount * rateFactor * payload.number_of_spaces / 100);

    // Return the calculated rate
    const response: RateResponse = {
      rate_amount: rateAmount
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});