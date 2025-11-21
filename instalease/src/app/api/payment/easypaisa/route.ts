/**
 * EasyPaisa Payment API Route
 * 
 * Handles EasyPaisa payment initiation.
 * 
 * @module app/api/payment/easypaisa/route
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Generate EasyPaisa hash
 */
function generateEasyPaisaHash(params: Record<string, string>, hashKey: string): string {
  const sortedKeys = Object.keys(params).sort();
  const hashString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', hashKey).update(hashString).digest('hex');
}

/**
 * POST /api/payment/easypaisa
 * Initiate EasyPaisa payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, amount, returnUrl } = body;

    if (!contractId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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
      .select('*')
      .eq('contract_id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const storeId = process.env.EASYPAISA_STORE_ID;
    const hashKey = process.env.EASYPAISA_HASH_KEY;
    const sandboxUrl = 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';

    if (!storeId || !hashKey) {
      return NextResponse.json(
        { error: 'EasyPaisa configuration missing' },
        { status: 500 }
      );
    }

    const orderId = `EP-${contractId.substring(0, 8)}-${Date.now()}`;
    const amountStr = amount.toString();

    const params: Record<string, string> = {
      storeId,
      orderId,
      transactionAmount: amountStr,
      transactionType: 'MA',
      postBackURL: returnUrl || `${request.nextUrl.origin}/api/payment/easypaisa/callback`,
    };

    // Generate hash
    const hashRequest = generateEasyPaisaHash(params, hashKey);
    params.hashRequest = hashRequest;

    return NextResponse.json({
      paymentUrl: sandboxUrl,
      params,
      message: 'Payment initiated. Redirect user to payment URL with params.',
    });
  } catch (error) {
    console.error('EasyPaisa payment error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

