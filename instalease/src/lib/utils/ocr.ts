/**
 * OCR Utilities
 * 
 * Client-side OCR processing using Tesseract.js for CNIC text extraction.
 * 
 * @module lib/utils/ocr
 */

import Tesseract from 'tesseract.js';

/**
 * Extract text from CNIC image using OCR
 * 
 * @param {File} imageFile - The CNIC image file
 * @returns {Promise<string>} Extracted text from the image
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const { data } = await Tesseract.recognize(imageFile, 'eng', {
      logger: (m) => {
        // Optional: log progress
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return data.text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Validate CNIC number from extracted text
 * 
 * @param {string} extractedText - Text extracted from CNIC image
 * @returns {string | null} Valid CNIC number (13 digits) or null if not found
 */
export function validateCNICFromText(extractedText: string): string | null {
  // Remove all whitespace and special characters
  const cleaned = extractedText.replace(/\s+/g, '').replace(/[^\d]/g, '');

  // Look for 13 consecutive digits (CNIC format)
  const cnicMatch = cleaned.match(/\d{13}/);

  if (cnicMatch) {
    return cnicMatch[0];
  }

  // Also try to find CNIC in format like 12345-1234567-1
  const formattedMatch = extractedText.match(/(\d{5})-?(\d{7})-?(\d{1})/);
  if (formattedMatch) {
    return formattedMatch[1] + formattedMatch[2] + formattedMatch[3];
  }

  return null;
}

/**
 * Process CNIC image and extract/validate CNIC number
 * 
 * @param {File} imageFile - The CNIC image file
 * @returns {Promise<string | null>} Valid CNIC number or null if not found
 */
export async function processCNICImage(imageFile: File): Promise<string | null> {
  try {
    const extractedText = await extractTextFromImage(imageFile);
    return validateCNICFromText(extractedText);
  } catch (error) {
    console.error('CNIC Processing Error:', error);
    return null;
  }
}

