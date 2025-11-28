/**
 * OCR Utilities
 *
 * Client-side OCR processing using Tesseract.js for CNIC text extraction.
 * This module uses a singleton pattern for the Tesseract worker to improve performance.
 *
 * @module lib/utils/ocr
 */

import Tesseract, { Scheduler, Worker } from 'tesseract.js';

let scheduler: Scheduler | null = null;
let worker: Worker | null = null;

const getScheduler = async () => {
  if (!scheduler) {
    scheduler = Tesseract.createScheduler();
  }
  if (!worker) {
    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        // Optional: log progress
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    scheduler.addWorker(worker);
  }
  return scheduler;
};

/**
 * Terminate the OCR worker to free up resources.
 * Call this when the OCR functionality is no longer needed (e.g., when the component unmounts).
 */
export const terminateOcrWorker = async () => {
    if (scheduler) {
        await scheduler.terminate();
        scheduler = null;
        worker = null;
    }
}

/**
 * Extract text from an image using OCR.
 *
 * @param {File} imageFile - The CNIC image file.
 * @returns {Promise<string>} Extracted text from the image.
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const ocrScheduler = await getScheduler();
    const { data } = await ocrScheduler.addJob('recognize', imageFile);
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
  // Remove all non-digit characters
  const cleaned = extractedText.replace(/[^\d]/g, '');

  // Look for 13 consecutive digits (CNIC format)
  const cnicMatch = cleaned.match(/\d{13}/);

  if (cnicMatch) {
    return cnicMatch[0];
  }

  // Also try to find CNIC in format like 12345-1234567-1 from original text
  const formattedMatch = extractedText.match(/(\d{5})-?(\d{7})-?(\d{1})/);
  if (formattedMatch) {
    return formattedMatch.slice(1).join('');
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

