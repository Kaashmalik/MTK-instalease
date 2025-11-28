/**
 * PDF Generator Utilities
 *
 * Functions for generating contract PDFs using pdf-lib.
 *
 * @module lib/utils/pdf-generator
 */

import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import type { Contract } from '@/hooks/use-contracts';
import type { Customer } from '@/hooks/use-customers';
import type { Guarantor } from '@/hooks/use-guarantors';

class PdfGenerator {
  private pdfDoc: PDFDocument;
  private page: PDFPage;
  private font: PDFFont;
  private boldFont: PDFFont;
  private yPosition: number;
  private readonly margin = 50;
  private readonly pageWidth: number;
  private readonly pageHeight: number;

  private constructor(pdfDoc: PDFDocument, page: PDFPage, font: PDFFont, boldFont: PDFFont) {
    this.pdfDoc = pdfDoc;
    this.page = page;
    this.font = font;
    this.boldFont = boldFont;
    const { width, height } = page.getSize();
    this.pageWidth = width;
    this.pageHeight = height;
    this.yPosition = height - this.margin;
  }

  static async create(): Promise<PdfGenerator> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    return new PdfGenerator(pdfDoc, page, font, boldFont);
  }

  drawTitle(title: string) {
    this.page.drawText(title, {
      x: this.margin,
      y: this.yPosition,
      size: 18,
      font: this.boldFont,
      color: rgb(0, 0, 0),
    });
    this.yPosition -= 40;
  }

  drawSectionTitle(title: string) {
    this.page.drawText(title, {
      x: this.margin,
      y: this.yPosition,
      size: 14,
      font: this.boldFont,
      color: rgb(0, 0, 0),
    });
    this.yPosition -= 25;
  }

  drawKeyValuePair(label: string, value: string) {
    this.page.drawText(label, {
      x: this.margin,
      y: this.yPosition,
      size: 10,
      font: this.boldFont,
    });
    this.page.drawText(value, {
      x: this.margin + 150,
      y: this.yPosition,
      size: 10,
      font: this.font,
    });
    this.yPosition -= 20;
  }
  
  drawTerms(terms: string[]) {
    this.yPosition -= 30;
    this.drawSectionTitle('Terms and Conditions:');
    
    terms.forEach((term) => {
      if (this.yPosition < 100) {
        this.page = this.pdfDoc.addPage([595, 842]);
        this.yPosition = this.pageHeight - this.margin;
      }
      this.page.drawText(term, {
        x: this.margin,
        y: this.yPosition,
        size: 9,
        font: this.font,
        color: rgb(0, 0, 0),
      });
      this.yPosition -= 18;
    });
  }

  drawSignatureSection(hasGuarantor: boolean) {
    this.yPosition -= 30;
    this.drawSectionTitle('Signatures:');
    this.yPosition -= 40;

    this.page.drawText('Customer Signature:', { x: this.margin, y: this.yPosition, size: 10, font: this.font });
    this.page.drawText('Date: _______________', { x: this.pageWidth - this.margin - 150, y: this.yPosition, size: 10, font: this.font });

    if (hasGuarantor) {
      this.yPosition -= 40;
      this.page.drawText('Guarantor Signature:', { x: this.margin, y: this.yPosition, size: 10, font: this.font });
    }
  }
  
  drawFooter() {
    this.page.drawText(`Generated on ${new Date().toLocaleDateString()} by InstalEase`, {
      x: this.margin,
      y: 30,
      size: 8,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  async save(): Promise<Uint8Array> {
    return this.pdfDoc.save();
  }
}

export async function generateContractPDF(
  contract: Contract,
  customer: Customer,
  guarantor: Guarantor | null
): Promise<Uint8Array> {
  const pdf = await PdfGenerator.create();
  
  pdf.drawTitle('INSTALLMENT CONTRACT AGREEMENT');
  
  pdf.drawSectionTitle('Contract Details:');
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
  contractDetails.forEach(([label, value]) => pdf.drawKeyValuePair(label, value));

  pdf.yPosition -= 20;

  pdf.drawSectionTitle('Customer Details:');
  const customerDetails = [
    [`Name:`, customer.full_name],
    [`CNIC:`, customer.cnic_number],
    [`Phone:`, customer.phone],
    [`Email:`, customer.email || 'N/A'],
    [`Address:`, customer.address || 'N/A'],
    [`Monthly Income:`, customer.monthly_income ? `PKR ${customer.monthly_income.toLocaleString()}` : 'N/A'],
  ];
  customerDetails.forEach(([label, value]) => pdf.drawKeyValuePair(label, value));

  if (guarantor) {
    pdf.yPosition -= 20;
    pdf.drawSectionTitle('Guarantor Details:');
    const guarantorDetails = [
      [`Name:`, guarantor.full_name],
      [`CNIC:`, guarantor.cnic_number],
      [`Phone:`, guarantor.phone],
      [`Relationship:`, guarantor.relationship_to_customer || 'N/A'],
    ];
    guarantorDetails.forEach(([label, value]) => pdf.drawKeyValuePair(label, value));
  }

  const terms = [
    '1. The customer agrees to pay the monthly installments on or before the due date.',
    '2. Late payment fees will be applied as per the agreed terms.',
    '3. The guarantor is responsible for payment if the customer defaults.',
    '4. Early settlement is allowed with applicable discounts.',
    '5. This contract is subject to the laws of Pakistan.',
  ];
  pdf.drawTerms(terms);
  
  pdf.drawSignatureSection(!!guarantor);
  
  pdf.drawFooter();

  return pdf.save();
}

