/**
 * JazzCash Payment API Route
 * 
 * Handles JazzCash payment initiation and webhook callbacks.
 * 
 * @module app/api/payment/jazzcash/route
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Generate secure hash for JazzCash authentication
 * 
 * @param {Record<string, string>} params - Payment parameters
 * @param {string} integritySalt - Integrity salt from JazzCash
 * @returns {string} Secure hash
 */
function generateJazzCashHash(params: Record<string, string>, integritySalt: string): string {
  const sortedKeys = Object.keys(params).sort();
  const hashString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const hashWithSalt = hashString + integritySalt;
  return crypto.createHash('sha256').update(hashWithSalt).digest('hex');
}

/**
 * POST /api/payment/jazzcash
 * Initiate JazzCash payment
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
      .select('*, customers(*)')
      .eq('contract_id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // JazzCash payment parameters
    const merchantId = process.env.JAZZCASH_MERCHANT_ID;
    const password = process.env.JAZZCASH_PASSWORD;
    const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
    const sandboxUrl = 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';

    if (!merchantId || !password || !integritySalt) {
      return NextResponse.json(
        { error: 'JazzCash configuration missing' },
        { status: 500 }
      );
    }

    const ppAmount = (parseFloat(amount) * 100).toString(); // Convert to paisas
    const ppBillReference = `INST-${contractId.substring(0, 8)}`;
    const ppDescription = `Installment payment for ${contract.product_name}`;
    const ppTxnDateTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const ppTxnExpiryDateTime = new Date(Date.now() + 30 * 60 * 1000)
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0];

    const params: Record<string, string> = {
      pp_Amount: ppAmount,
      pp_BillReference: ppBillReference,
      pp_Description: ppDescription,
      pp_IsRegisteredCustomer: 'No',
      pp_Language: 'EN',
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_ReturnURL: returnUrl || `${request.nextUrl.origin}/api/payment/jazzcash/callback`,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: ppTxnDateTime,
      pp_TxnExpiryDateTime: ppTxnExpiryDateTime,
      pp_TxnRefNo: `TXN${Date.now()}`,
      pp_Version: '1.1',
    };

    // Generate secure hash
    const ppSecureHash = generateJazzCashHash(params, integritySalt);
    params.pp_SecureHash = ppSecureHash;

    // In production, you would redirect to JazzCash payment page
    // For now, return the payment URL and parameters
    return NextResponse.json({
      paymentUrl: sandboxUrl,
      params,
      message: 'Payment initiated. Redirect user to payment URL with params.',
    });
  } catch (error) {
    console.error('JazzCash payment error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

