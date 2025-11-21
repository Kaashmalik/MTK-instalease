/**
 * Jest Type Definitions
 * 
 * Type declarations for Jest and testing libraries.
 */

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

