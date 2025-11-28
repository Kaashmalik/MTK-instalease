/**
 * Cloudinary Storage Provider
 * 
 * Handles image uploads with automatic optimization and transformation.
 * Free tier: 25GB bandwidth/month, perfect for CNIC images.
 * 
 * @module lib/storage/cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload options for Cloudinary
 */
export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any[];
  tags?: string[];
  context?: Record<string, string>;
}

/**
 * Upload result from Cloudinary
 */
export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload file to Cloudinary with automatic optimization
 * 
 * @param {File} file - File to upload
 * @param {CloudinaryUploadOptions} options - Upload options
 * @returns {Promise<CloudinaryUploadResult>} Upload result with URLs
 * @throws {Error} If upload fails or Cloudinary not configured
 * 
 * @example
 * ```ts
 * const result = await uploadToCloudinary(file, {
 *   folder: 'instalease/cnic',
 *   tags: ['cnic', 'customer-123'],
 * });
 * console.log(result.secureUrl);
 * ```
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME environment variable.');
  }

  const {
    folder = 'instalease',
    transformation = [
      { width: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    tags = [],
    context,
  } = options;

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation,
        tags,
        context,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Cloudinary upload returned no result'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload CNIC image with OCR extraction
 * 
 * @param {File} file - CNIC image file
 * @param {string} customerId - Customer ID for organization
 * @param {'front' | 'back'} side - CNIC side
 * @returns {Promise<{ url: string; extractedText?: string }>} Upload result with OCR text
 * 
 * @example
 * ```ts
 * const result = await uploadCNICImage(file, 'customer-123', 'front');
 * console.log(result.url);
 * console.log(result.extractedText); // Extracted CNIC number, name, etc.
 * ```
 */
export async function uploadCNICImage(
  file: File,
  customerId: string,
  side: 'front' | 'back'
): Promise<{ url: string; extractedText?: string }> {
  // Upload with CNIC-specific transformations
  const result = await uploadToCloudinary(file, {
    folder: `instalease/cnic/${customerId}`,
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto:best' }, // Higher quality for OCR
      { fetch_format: 'auto' },
      { effect: 'sharpen:100' }, // Sharpen for better OCR
    ],
    tags: ['cnic', side, customerId],
    context: {
      customer_id: customerId,
      side,
      uploaded_at: new Date().toISOString(),
    },
  });

  // Extract text using Cloudinary OCR (if available)
  let extractedText: string | undefined;
  try {
    extractedText = await extractTextFromImage(result.publicId);
  } catch (error) {
    console.warn('OCR extraction failed:', error);
    // Continue without OCR - not critical
  }

  return {
    url: result.secureUrl,
    extractedText,
  };
}

/**
 * Extract text from image using Cloudinary OCR
 * 
 * Note: OCR is an add-on feature in Cloudinary. If not available,
 * this will fail gracefully and return undefined.
 * 
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<string | undefined>} Extracted text
 */
export async function extractTextFromImage(
  publicId: string
): Promise<string | undefined> {
  try {
    // Use Cloudinary's OCR add-on
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      ocr: 'adv_ocr',
    });

    // Extract text from OCR result
    const ocrData = result.info?.ocr?.adv_ocr?.data;
    if (ocrData && ocrData.length > 0) {
      return ocrData[0]?.textAnnotations?.[0]?.description || undefined;
    }

    return undefined;
  } catch (error) {
    console.error('OCR extraction error:', error);
    return undefined;
  }
}

/**
 * Delete file from Cloudinary
 * 
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 * 
 * @example
 * ```ts
 * await deleteFromCloudinary('instalease/cnic/customer-123/1234567890_front');
 * ```
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
}

/**
 * Get Cloudinary usage statistics
 * 
 * @returns {Promise<{ bandwidth: number; storage: number; transformations: number }>} Usage stats
 */
export async function getCloudinaryUsage(): Promise<{
  bandwidth: number;
  storage: number;
  transformations: number;
}> {
  try {
    const result = await cloudinary.api.usage();
    
    return {
      bandwidth: result.bandwidth?.usage || 0,
      storage: result.storage?.usage || 0,
      transformations: result.transformations?.usage || 0,
    };
  } catch (error) {
    console.error('Failed to get Cloudinary usage:', error);
    return { bandwidth: 0, storage: 0, transformations: 0 };
  }
}

/**
 * Generate optimized image URL with transformations
 * 
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} Optimized image URL
 * 
 * @example
 * ```ts
 * const url = getOptimizedImageUrl('instalease/cnic/image.jpg', {
 *   width: 800,
 *   height: 600,
 *   crop: 'fill',
 *   quality: 'auto',
 * });
 * ```
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string {
  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto',
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
    secure: true,
  });
}

/**
 * Check if Cloudinary is configured
 * 
 * @returns {boolean} True if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
