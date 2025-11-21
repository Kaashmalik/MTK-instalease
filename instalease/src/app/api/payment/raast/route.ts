/**
 * Raast Payment API Route
 * 
 * Handles Raast payment initiation via bank partner API.
 * 
 * @module app/api/payment/raast/route
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/payment/raast
 * Initiate Raast payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, amount, raastId, returnUrl } = body;

    if (!contractId || !amount || !raastId) {
      return NextResponse.json(
        { error: 'Missing required parameters (contractId, amount, raastId)' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*, customers(*)')
      .eq('contract_id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const apiKey = process.env.RAAST_API_KEY;
    const apiSecret = process.env.RAAST_API_SECRET;
    const raastApiUrl = process.env.RAAST_API_URL || 'https://api.raast.bank.com/v1/payments';

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Raast configuration missing' },
        { status: 500 }
      );
    }

    // Generate transaction reference
    const transactionRef = `RAAST-${contractId.substring(0, 8)}-${Date.now()}`;

    // Prepare Raast payment request (ISO 20022 format)
    const paymentRequest = {
      msgId: transactionRef,
      creDtTm: new Date().toISOString(),
      instgAgt: {
        finInstnId: {
          bicfi: 'RASTPKKA', // Example BIC
        },
      },
      instrId: transactionRef,
      endToEndId: transactionRef,
      amt: {
        instdAmt: {
          value: amount.toString(),
          ccy: 'PKR',
        },
      },
      cdtr: {
        nm: contract.customers?.full_name || 'Customer',
        id: {
          prvtId: {
            othr: {
              id: raastId,
              schmeNm: {
                prtry: 'RAST',
              },
            },
          },
        },
      },
      rmtInf: {
        ustrd: `Installment payment for ${contract.product_name}`,
      },
    };

    try {
      // Call Raast API (example - adjust based on actual bank partner API)
      const response = await axios.post(raastApiUrl, paymentRequest, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Secret': apiSecret,
          'Content-Type': 'application/json',
        },
      });

      // Store payment initiation
      await supabase.from('payments').insert({
        contract_id: contractId,
        shop_id: contract.shop_id,
        amount: parseFloat(amount),
        payment_date: new Date().toISOString(),
        paid_by_type: 'customer',
        gateway: 'raast',
        transaction_id: transactionRef,
      });

      return NextResponse.json({
        success: true,
        transactionRef,
        paymentStatus: response.data.status,
        message: 'Raast payment initiated',
      });
    } catch (error: any) {
      console.error('Raast API error:', error);
      return NextResponse.json(
        {
          error: 'Failed to initiate Raast payment',
          details: error.response?.data || error.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Raast payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    );
  }
}

