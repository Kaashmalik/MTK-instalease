/**
 * EasyPaisa Payment Callback Handler
 * 
 * @module app/api/payment/easypaisa/callback/route
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

function verifyEasyPaisaSignature(params: Record<string, string>, hashKey: string): boolean {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== 'hashRequest')
    .sort();
  const hashString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
  const calculatedHash = crypto.createHmac('sha256', hashKey).update(hashString).digest('hex');
  return calculatedHash === params.hashRequest;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const hashKey = process.env.EASYPAISA_HASH_KEY;
    if (!hashKey) {
      return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
    }

    if (!verifyEasyPaisaSignature(params, hashKey)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const orderId = params.orderId;
    const transactionStatus = params.transactionStatus;
    const amount = parseFloat(params.transactionAmount);

    // Extract contract ID from order ID
    const contractIdMatch = orderId.match(/EP-(.+)-/);
    if (!contractIdMatch) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const { data: contracts } = await supabase
      .from('contracts')
      .select('contract_id, shop_id')
      .like('contract_id', `${contractIdMatch[1]}%`)
      .limit(1);

    if (!contracts || contracts.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contracts[0];

    if (transactionStatus === 'Success') {
      await supabase.from('payments').insert({
        contract_id: contract.contract_id,
        shop_id: contract.shop_id,
        amount,
        payment_date: new Date().toISOString(),
        paid_by_type: 'customer',
        gateway: 'easypaisa',
        transaction_id: orderId,
      });

      return NextResponse.redirect(
        new URL(`/payments/success?txn=${orderId}`, request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL(`/payments/failed?code=${transactionStatus}`, request.url)
      );
    }
  } catch (error) {
    console.error('EasyPaisa callback error:', error);
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 });
  }
}

