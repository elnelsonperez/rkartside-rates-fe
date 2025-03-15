// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase_functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

interface RequestPayload {
  store_id: string;
  client_name: string;
  number_of_spaces: number;
  sale_amount?: number;
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
    if (!payload.store_id || !payload.client_name || !payload.number_of_spaces) {
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

    // Fetch the store to get rate_factor and if it requires sale amount
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('rate_factor, requires_sale_amount, fixed_rate')
      .eq('id', payload.store_id)
      .single();

    if (storeError) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check if the store requires sale amount
    const requiresSaleAmount = !!store.requires_sale_amount;
    const rateFactor = 1 + store.rate_factor;

    let rateAmount: number;


    if (requiresSaleAmount) {
      if (!payload.sale_amount) {
        return new Response(
            JSON.stringify({ error: 'Sale amount is required for this store' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      rateAmount = 2000 // placeholder
    } else {
      rateAmount = 1000 // placeholder
    }


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