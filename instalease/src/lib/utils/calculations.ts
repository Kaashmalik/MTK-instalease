/**
 * Financial Calculations
 *
 * Utility class for calculating installment plans, totals, and discounts.
 *
 * @module lib/utils/calculations
 */

export type Installment = {
  installmentNumber: number;
  dueDate: Date;
  amountDue: number;
  principal: number;
  interest: number;
  remainingBalance: number;
};

export class FinancialCalculator {
  /**
   * Calculate monthly installment amount
   *
   * Uses the formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
   * Where:
   * - M = Monthly payment
   * - P = Principal (product_price - down_payment)
   * - r = Monthly interest rate (interest_rate / 100 / 12)
   * - n = Number of months
   *
   * @param {number} principal - Principal amount (product price - down payment)
   * @param {number} annualInterestRate - Annual interest rate as percentage (e.g., 12 for 12%)
   * @param {number} months - Number of months
   * @returns {number} Monthly installment amount
   */
  static calculateMonthlyInstallment(
    principal: number,
    annualInterestRate: number,
    months: number
  ): number {
    if (principal <= 0 || months <= 0) {
      return 0;
    }

    if (annualInterestRate === 0) {
      // No interest - simple division
      return principal / months;
    }

    const monthlyRate = annualInterestRate / 100 / 12;
    const numerator =
      principal * monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;

    return numerator / denominator;
  }

  /**
   * Calculate total amount to be paid
   *
   * @param {number} downPayment - Down payment amount
   * @param {number} monthlyInstallment - Monthly installment amount
   * @param {number} months - Number of months
   * @returns {number} Total amount
   */
  static calculateTotalAmount(
    downPayment: number,
    monthlyInstallment: number,
    months: number
  ): number {
    return downPayment + monthlyInstallment * months;
  }

  /**
   * Calculate total interest
   *
   * @param {number} productPrice - Product price
   * @param {number} downPayment - Down payment
   * @param {number} totalAmount - Total amount to be paid
   * @returns {number} Total interest
   */
  static calculateTotalInterest(
    productPrice: number,
    downPayment: number,
    totalAmount: number
  ): number {
    return totalAmount - (productPrice - downPayment) - downPayment;
  }

  /**
   * Calculate debt-to-income ratio
   *
   * @param {number} monthlyInstallment - Monthly installment amount
   * @param {number} monthlyIncome - Customer's monthly income
   * @returns {number} Debt-to-income ratio as percentage
   */
  static calculateDebtToIncomeRatio(
    monthlyInstallment: number,
    monthlyIncome: number
  ): number {
    if (monthlyIncome <= 0) {
      return 0;
    }
    return (monthlyInstallment / monthlyIncome) * 100;
  }

  /**
   * Calculate early settlement discount
   *
   * @param {number} remainingAmount - Remaining amount to be paid
   * @param {number} discountPercentage - Discount percentage (e.g., 5 for 5%)
   * @returns {number} Discount amount
   */
  static calculateEarlySettlementDiscount(
    remainingAmount: number,
    discountPercentage: number = 5
  ): number {
    return (remainingAmount * discountPercentage) / 100;
  }

  /**
   * Calculate late fee
   *
   * @param {number} overdueAmount - Overdue amount
   * @param {number} daysOverdue - Number of days overdue
   * @param {number} dailyLateFeeRate - Daily late fee rate as percentage (e.g., 0.5 for 0.5% per day)
   * @returns {number} Late fee amount
   */
  static calculateLateFee(
    overdueAmount: number,
    daysOverdue: number,
    dailyLateFeeRate: number = 0.5
  ): number {
    if (daysOverdue <= 0) {
      return 0;
    }
    return (overdueAmount * dailyLateFeeRate * daysOverdue) / 100;
  }

  /**
   * Generate installment schedule
   *
   * @param {number} principal - Principal amount
   * @param {number} monthlyInstallment - Monthly installment amount
   * @param {number} annualInterestRate - Annual interest rate
   * @param {number} months - Number of months
   * @param {Date} startDate - Start date for first installment
   * @returns {Installment[]} Installment schedule
   */
  static generateInstallmentSchedule(
    principal: number,
    monthlyInstallment: number,
    annualInterestRate: number,
    months: number,
    startDate: Date = new Date()
  ): Installment[] {
    const schedule: Installment[] = [];

    let remainingBalance = principal;
    const monthlyRate = annualInterestRate / 100 / 12;

    for (let i = 1; i <= months; i++) {
      const interest = remainingBalance * monthlyRate;
      const principalPayment = monthlyInstallment - interest;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        installmentNumber: i,
        dueDate,
        amountDue: monthlyInstallment,
        principal: principalPayment,
        interest,
        remainingBalance,
      });
    }

    return schedule;
  }
}

