/**
 * JazzCash Payment Callback Handler
 * 
 * Handles JazzCash payment webhook callbacks and verifies signatures.
 * 
 * @module app/api/payment/jazzcash/callback/route
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { handlePaymentError, retryWithBackoff, PaymentError, PaymentErrorType } from '@/lib/utils/payment-errors';

/**
 * Verify JazzCash callback signature
 */
function verifyJazzCashSignature(params: Record<string, string>, integritySalt: string): boolean {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== 'pp_SecureHash')
    .sort();
  const hashString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
  const hashWithSalt = hashString + integritySalt;
  const calculatedHash = crypto.createHash('sha256').update(hashWithSalt).digest('hex');
  return calculatedHash === params.pp_SecureHash;
}

/**
 * POST /api/payment/jazzcash/callback
 * Handle JazzCash payment callback
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
    if (!integritySalt) {
      return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
    }

    // Verify signature
    if (!verifyJazzCashSignature(params, integritySalt)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Extract payment details
    const ppResponseCode = params.pp_ResponseCode;
    const ppTxnRefNo = params.pp_TxnRefNo;
    const ppAmount = params.pp_Amount;
    const ppBillReference = params.pp_BillReference;

    // Extract contract ID from bill reference
    const contractIdMatch = ppBillReference.match(/INST-(.+)/);
    if (!contractIdMatch) {
      return NextResponse.json({ error: 'Invalid bill reference' }, { status: 400 });
    }

    // Find contract by partial ID (first 8 chars)
    const { data: contracts } = await supabase
      .from('contracts')
      .select('contract_id, shop_id')
      .like('contract_id', `${contractIdMatch[1]}%`)
      .limit(1);

    if (!contracts || contracts.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contracts[0];

    if (ppResponseCode === '000') {
      // Payment successful
      const amount = parseFloat(ppAmount) / 100; // Convert from paisas

      // Record payment with retry logic for network failures
      try {
        await retryWithBackoff(async () => {
          const { error: paymentError } = await supabase.from('payments').insert({
            contract_id: contract.contract_id,
            shop_id: contract.shop_id,
            amount,
            payment_date: new Date().toISOString(),
            paid_by_type: 'customer',
            gateway: 'jazzcash',
            transaction_id: ppTxnRefNo,
          });

          if (paymentError) {
            throw new PaymentError(
              PaymentErrorType.PAYMENT_FAILED,
              `Failed to record payment: ${paymentError.message}`,
              paymentError,
              false
            );
          }
        }, 3, 1000); // 3 retries with 1s initial delay
      } catch (error) {
        console.error('Error recording payment after retries:', error);
        // Log to audit or error tracking service
        // Still redirect to success as payment was processed by gateway
        // Payment can be reconciled later
      }

      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/payments/success?txn=${ppTxnRefNo}`, request.url)
      );
    } else {
      // Payment failed
      return NextResponse.redirect(
        new URL(`/payments/failed?code=${ppResponseCode}`, request.url)
      );
    }
  } catch (error) {
    const paymentError = handlePaymentError(error);
    console.error('JazzCash callback error:', paymentError);

    // Return appropriate error response
    return NextResponse.json(
      {
        error: paymentError.message,
        type: paymentError.type,
        retryable: paymentError.retryable,
      },
      { status: paymentError.retryable ? 503 : 500 }
    );
  }
}

