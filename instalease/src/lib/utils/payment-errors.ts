/**
 * Payment Error Handling Utilities
 *
 * Handles network failures, retries, and error recovery for payment operations.
 *
 * @module lib/utils/payment-errors
 */

/**
 * Payment error types
 */
export enum PaymentErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Payment error class
 */
export class PaymentError extends Error {
  constructor(
    public type: PaymentErrorType,
    message: string,
    public originalError?: any, // Keep original error for context
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Check if an error is a network-related error.
 *
 * @param {any} error - The error to check.
 * @returns {boolean} True if it is a network error.
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const errorCode = error.code || '';
  const errorMessage = error.message || '';

  const networkErrorCodes = ['ECONNRESET', 'ENOTFOUND', 'ESOCKETTIMEDOUT', 'ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH'];
  if (networkErrorCodes.includes(errorCode)) {
    return true;
  }

  const networkErrorMessages = ['network', 'fetch', 'timeout'];
  return networkErrorMessages.some(msg => errorMessage.toLowerCase().includes(msg));
}

/**
 * Check if an error is retryable.
 *
 * @param {any} error - The error to check.
 * @returns {boolean} True if the error is retryable.
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof PaymentError) {
    return error.retryable;
  }
  return isNetworkError(error);
}

/**
 * Retry a function with exponential backoff.
 *
 * @param {Function} fn - The async function to retry.
 * @param {number} maxRetries - Maximum number of retries.
 * @param {number} initialDelay - Initial delay in milliseconds.
 * @returns {Promise<T>} The result of the function if successful.
 * @throws {PaymentError} If all retries fail.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        throw handlePaymentError(error);
      }

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw handlePaymentError(lastError);
}


type GatewayErrorIdentifier = {
  keyword: string;
  type: PaymentErrorType;
  retryable: boolean;
};

const gatewayErrorIdentifiers: GatewayErrorIdentifier[] = [
  { keyword: 'jazzcash', type: PaymentErrorType.GATEWAY_ERROR, retryable: false },
  { keyword: 'easypaisa', type: PaymentErrorType.GATEWAY_ERROR, retryable: false },
  { keyword: 'raast', type: PaymentErrorType.GATEWAY_ERROR, retryable: false },
  { keyword: 'timeout', type: PaymentErrorType.TIMEOUT, retryable: true },
];

/**
 * Handle payment API errors with proper error types.
 *
 * @param {any} error - The error to handle.
 * @returns {PaymentError} A formatted payment error.
 */
export function handlePaymentError(error: any): PaymentError {
  if (error instanceof PaymentError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new PaymentError(
      PaymentErrorType.NETWORK_ERROR,
      'Network error occurred. Please check your connection and try again.',
      error,
      true
    );
  }

  const errorMessage = (error?.message || '').toLowerCase();
  for (const identifier of gatewayErrorIdentifiers) {
    if (errorMessage.includes(identifier.keyword)) {
      return new PaymentError(identifier.type, `Payment gateway error: ${error.message}`, error, identifier.retryable);
    }
  }

  return new PaymentError(
    PaymentErrorType.UNKNOWN,
    'An unexpected error occurred. Please try again later.',
    error,
    false
  );
}


/**
 * Get a user-friendly error message from a PaymentError.
 *
 * @param {PaymentError} error - The payment error.
 * @returns {string} A user-friendly error message.
 */
export function getErrorMessage(error: PaymentError): string {
  switch (error.type) {
    case PaymentErrorType.NETWORK_ERROR:
      return 'Unable to connect to payment service. Please check your internet connection.';
    case PaymentErrorType.TIMEOUT:
      return 'The payment request took too long to process. Please try again.';
    case PaymentErrorType.GATEWAY_ERROR:
      return 'There was an issue with the payment gateway. Please try again in a few moments.';
    case PaymentErrorType.PAYMENT_FAILED:
      return 'The payment could not be processed. Please check your payment details.';
    case PaymentErrorType.UNKNOWN:
    default:
      return 'An unexpected error occurred during payment. Please try again later.';
  }
}

