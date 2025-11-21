/**
 * PDF Generator Utilities
 * 
 * Functions for generating contract PDFs using pdf-lib.
 * 
 * @module lib/utils/pdf-generator
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Contract } from '@/hooks/use-contracts';
import type { Customer } from '@/hooks/use-customers';
import type { Guarantor } from '@/hooks/use-guarantors';

/**
 * Generate a contract PDF document
 * 
 * @param {Contract} contract - Contract data
 * @param {Customer} customer - Customer data
 * @param {Guarantor | null} guarantor - Guarantor data (optional)
 * @returns {Promise<Uint8Array>} PDF document as bytes
 */
export async function generateContractPDF(
  contract: Contract,
  customer: Customer,
  guarantor: Guarantor | null
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;

  // Title
  page.drawText('INSTALLMENT CONTRACT AGREEMENT', {
    x: margin,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 40;

  // Contract Details
  page.drawText('Contract Details:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 25;

  const contractDetails = [
    [`Contract ID:`, contract.contract_id],
    [`Product Name:`, contract.product_name],
    [`Product Price:`, `PKR ${contract.product_price.toLocaleString()}`],
    [`Down Payment:`, `PKR ${contract.down_payment.toLocaleString()}`],
    [`Interest Rate:`, `${contract.interest_rate}% per annum`],
    [`Monthly Installment:`, `PKR ${contract.monthly_installment.toLocaleString()}`],
    [`Total Months:`, `${contract.total_months} months`],
    [`Total Amount:`, `PKR ${(contract.down_payment + contract.monthly_installment * contract.total_months).toLocaleString()}`],
    [`Contract Status:`, contract.contract_status.toUpperCase()],
  ];

  contractDetails.forEach(([label, value]) => {
    page.drawText(`${label}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: margin + 150,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  });

  yPosition -= 20;

  // Customer Details
  page.drawText('Customer Details:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 25;

  const customerDetails = [
    [`Name:`, customer.full_name],
    [`CNIC:`, customer.cnic_number],
    [`Phone:`, customer.phone],
    [`Email:`, customer.email || 'N/A'],
    [`Address:`, customer.address || 'N/A'],
    [`Monthly Income:`, customer.monthly_income ? `PKR ${customer.monthly_income.toLocaleString()}` : 'N/A'],
  ];

  customerDetails.forEach(([label, value]) => {
    page.drawText(`${label}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: margin + 150,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  });

  // Guarantor Details (if exists)
  if (guarantor) {
    yPosition -= 20;
    page.drawText('Guarantor Details:', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 25;

    const guarantorDetails = [
      [`Name:`, guarantor.full_name],
      [`CNIC:`, guarantor.cnic_number],
      [`Phone:`, guarantor.phone],
      [`Relationship:`, guarantor.relationship_to_customer || 'N/A'],
    ];

    guarantorDetails.forEach(([label, value]) => {
      page.drawText(`${label}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(value, {
        x: margin + 150,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    });
  }

  yPosition -= 30;

  // Terms and Conditions
  page.drawText('Terms and Conditions:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 25;

  const terms = [
    '1. The customer agrees to pay the monthly installments on or before the due date.',
    '2. Late payment fees will be applied as per the agreed terms.',
    '3. The guarantor is responsible for payment if the customer defaults.',
    '4. Early settlement is allowed with applicable discounts.',
    '5. This contract is subject to the laws of Pakistan.',
  ];

  terms.forEach((term) => {
    if (yPosition < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - margin;
    }
    page.drawText(term, {
      x: margin,
      y: yPosition,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 18;
  });

  yPosition -= 30;

  // Signature Section
  page.drawText('Signatures:', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 40;

  page.drawText('Customer Signature:', {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('Date: _______________', {
    x: width - margin - 150,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  if (guarantor) {
    yPosition -= 40;
    page.drawText('Guarantor Signature:', {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Footer
  page.drawText(
    `Generated on ${new Date().toLocaleDateString()} by InstalEase`,
    {
      x: margin,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  return await pdfDoc.save();
}

