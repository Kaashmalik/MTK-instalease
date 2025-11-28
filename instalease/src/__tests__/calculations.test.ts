/**
 * Financial Calculations Tests
 * 
 * Unit tests for calculation utilities.
 * 
 * @module __tests__/calculations.test
 */

import { FinancialCalculator } from '@/lib/utils/calculations';

describe('Financial Calculations', () => {
  describe('calculateMonthlyInstallment', () => {
    it('should calculate monthly installment with interest', () => {
      const principal = 100000;
      const annualInterestRate = 12; // 12%
      const months = 12;

      const result = FinancialCalculator.calculateMonthlyInstallment(principal, annualInterestRate, months);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(principal / months * 1.2); // Should be reasonable
    });

    it('should calculate monthly installment without interest', () => {
      const principal = 100000;
      const annualInterestRate = 0;
      const months = 12;

      const result = FinancialCalculator.calculateMonthlyInstallment(principal, annualInterestRate, months);
      expect(result).toBe(principal / months);
    });

    it('should return 0 for zero principal', () => {
      const result = FinancialCalculator.calculateMonthlyInstallment(0, 12, 12);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalAmount', () => {
    it('should calculate total amount correctly', () => {
      const downPayment = 30000;
      const monthlyInstallment = 10000;
      const months = 12;

      const result = FinancialCalculator.calculateTotalAmount(downPayment, monthlyInstallment, months);
      expect(result).toBe(150000);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest correctly', () => {
      const productPrice = 150000;
      const downPayment = 30000;
      const totalAmount = 150000;

      const result = FinancialCalculator.calculateTotalInterest(productPrice, downPayment, totalAmount);
      expect(result).toBe(30000); // 150000 - (150000 - 30000) - 30000
    });
  });

  describe('calculateDebtToIncomeRatio', () => {
    it('should calculate debt-to-income ratio correctly', () => {
      const monthlyInstallment = 10000;
      const monthlyIncome = 50000;

      const result = FinancialCalculator.calculateDebtToIncomeRatio(monthlyInstallment, monthlyIncome);
      expect(result).toBe(20); // 20%
    });

    it('should return 0 for zero income', () => {
      const result = FinancialCalculator.calculateDebtToIncomeRatio(10000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateEarlySettlementDiscount', () => {
    it('should calculate early settlement discount with default 5%', () => {
      const remainingAmount = 100000;
      const result = FinancialCalculator.calculateEarlySettlementDiscount(remainingAmount);
      expect(result).toBe(5000); // 5%
    });

    it('should calculate early settlement discount with custom percentage', () => {
      const remainingAmount = 100000;
      const result = FinancialCalculator.calculateEarlySettlementDiscount(remainingAmount, 10);
      expect(result).toBe(10000); // 10%
    });
  });

  describe('calculateLateFee', () => {
    it('should calculate late fee correctly', () => {
      const overdueAmount = 10000;
      const daysOverdue = 5;
      const dailyLateFeeRate = 0.5; // 0.5% per day

      const result = FinancialCalculator.calculateLateFee(overdueAmount, daysOverdue, dailyLateFeeRate);
      expect(result).toBe(250); // 10000 * 0.5% * 5
    });

    it('should return 0 for no days overdue', () => {
      const result = FinancialCalculator.calculateLateFee(10000, 0);
      expect(result).toBe(0);
    });
  });

  describe('generateInstallmentSchedule', () => {
    it('should generate installment schedule correctly', () => {
      const principal = 100000;
      const monthlyInstallment = 10000;
      const annualInterestRate = 12;
      const months = 12;
      const startDate = new Date('2024-01-01');

      const schedule = FinancialCalculator.generateInstallmentSchedule(
        principal,
        monthlyInstallment,
        annualInterestRate,
        months,
        startDate
      );

      expect(schedule).toHaveLength(12);
      expect(schedule[0].installmentNumber).toBe(1);
      expect(schedule[0].amountDue).toBe(monthlyInstallment);
      expect(schedule[11].installmentNumber).toBe(12);
    });

    it('should have decreasing remaining balance', () => {
      const schedule = FinancialCalculator.generateInstallmentSchedule(100000, 10000, 12, 12);
      
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].remainingBalance).toBeLessThanOrEqual(
          schedule[i - 1].remainingBalance
        );
      }
    });
  });
});

