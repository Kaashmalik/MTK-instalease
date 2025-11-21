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
    public originalError?: Error,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Check if error is a network error
 * 
 * @param {unknown} error - Error to check
 * @returns {boolean} True if network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')
    );
  }
  return false;
}

/**
 * Check if error is retryable
 * 
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof PaymentError) {
    return error.retryable;
  }

  if (isNetworkError(error)) {
    return true;
  }

  // Timeout errors are retryable
  if (error instanceof Error && error.message.includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * Retry a function with exponential backoff
 * 
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<T>} Function result
 * @throws {PaymentError} If all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === maxRetries || !isRetryableError(error)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Convert error to PaymentError if needed
  if (lastError instanceof PaymentError) {
    throw lastError;
  }

  throw new PaymentError(
    isNetworkError(lastError) ? PaymentErrorType.NETWORK_ERROR : PaymentErrorType.UNKNOWN,
    `Failed after ${maxRetries} retries: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
    lastError instanceof Error ? lastError : undefined,
    false
  );
}

/**
 * Handle payment API errors with proper error types
 * 
 * @param {unknown} error - Error to handle
 * @returns {PaymentError} Formatted payment error
 */
export function handlePaymentError(error: unknown): PaymentError {
  if (error instanceof PaymentError) {
    return error;
  }

  if (isNetworkError(error)) {
    return new PaymentError(
      PaymentErrorType.NETWORK_ERROR,
      'Network error occurred. Please check your connection and try again.',
      error instanceof Error ? error : undefined,
      true
    );
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return new PaymentError(
        PaymentErrorType.TIMEOUT,
        'Request timed out. Please try again.',
        error,
        true
      );
    }

    // Check for gateway-specific errors
    if (error.message.includes('jazzcash') || error.message.includes('easypaisa') || error.message.includes('raast')) {
      return new PaymentError(
        PaymentErrorType.GATEWAY_ERROR,
        `Payment gateway error: ${error.message}`,
        error,
        false
      );
    }
  }

  return new PaymentError(
    PaymentErrorType.UNKNOWN,
    'An unexpected error occurred. Please try again later.',
    error instanceof Error ? error : undefined,
    false
  );
}

/**
 * Get user-friendly error message
 * 
 * @param {PaymentError} error - Payment error
 * @returns {string} User-friendly message
 */
export function getErrorMessage(error: PaymentError): string {
  switch (error.type) {
    case PaymentErrorType.NETWORK_ERROR:
      return 'Unable to connect to payment service. Please check your internet connection and try again.';
    case PaymentErrorType.TIMEOUT:
      return 'The request took too long. Please try again.';
    case PaymentErrorType.GATEWAY_ERROR:
      return 'Payment gateway is temporarily unavailable. Please try again in a few moments.';
    case PaymentErrorType.PAYMENT_FAILED:
      return 'Payment could not be processed. Please verify your payment details and try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again later.';
  }
}

