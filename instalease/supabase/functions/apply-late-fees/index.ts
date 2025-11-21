/**
 * Apply Late Fees Edge Function
 * 
 * Supabase Edge Function to apply late fees to overdue installments.
 * Should be scheduled to run daily via cron.
 * 
 * @module supabase/functions/apply-late-fees
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const today = new Date().toISOString().split('T')[0];

    // Get overdue installments
    const { data: overdueInstallments, error: fetchError } = await supabaseClient
      .from('installments')
      .select('*')
      .eq('payment_status', 'pending')
      .lt('due_date', today);

    if (fetchError) {
      throw fetchError;
    }

    const lateFees = [];

    for (const installment of overdueInstallments || []) {
      const dueDate = new Date(installment.due_date);
      const daysOverdue = Math.floor(
        (new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue > 0) {
        // Calculate late fee (0.5% per day, max 10% of installment amount)
        const dailyLateFeeRate = 0.5;
        const lateFeeAmount = Math.min(
          (installment.amount_due * dailyLateFeeRate * daysOverdue) / 100,
          installment.amount_due * 0.1 // Max 10%
        );

        // Check if late fee already applied for this installment
        const { data: existingLateFee } = await supabaseClient
          .from('late_fees')
          .select('*')
          .eq('installment_id', installment.installment_id)
          .eq('days_overdue', daysOverdue)
          .single();

        if (!existingLateFee && lateFeeAmount > 0) {
          // Insert late fee record
          await supabaseClient.from('late_fees').insert({
            installment_id: installment.installment_id,
            shop_id: installment.shop_id,
            fee_amount: lateFeeAmount,
            days_overdue: daysOverdue,
          });

          // Update installment with late fee
          await supabaseClient
            .from('installments')
            .update({
              late_fee: lateFeeAmount,
              payment_status: 'overdue',
            })
            .eq('installment_id', installment.installment_id);

          lateFees.push({
            installment_id: installment.installment_id,
            fee_amount: lateFeeAmount,
            days_overdue: daysOverdue,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lateFeesApplied: lateFees.length,
        lateFees,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

