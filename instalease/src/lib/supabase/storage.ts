/**
 * Supabase Storage Utilities
 * 
 * Provides secure file upload and access using signed URLs for document management.
 * Supports customer documents, guarantor signatures, and contract PDFs.
 * 
 * @module lib/supabase/storage
 */

import { supabase } from './client';

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  CUSTOMER_DOCUMENTS: 'customer-documents',
  GUARANTOR_SIGNATURES: 'guarantor-signatures',
  CONTRACT_PDFS: 'contract-pdfs',
} as const;

/**
 * File upload options
 */
export interface UploadOptions {
  /** Cache control header (in seconds) */
  cacheControl?: string;
  /** Whether to overwrite existing files */
  upsert?: boolean;
  /** Content type of the file */
  contentType?: string;
}

/**
 * Upload result with file path and URL
 */
export interface UploadResult {
  path: string;
  publicUrl: string;
  signedUrl?: string;
}

/**
 * Upload a file to Supabase Storage
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path within the bucket (e.g., 'customers/cnic/image.jpg')
 * @param {File | Blob} file - File to upload
 * @param {UploadOptions} options - Upload options
 * @returns {Promise<UploadResult>} Upload result with path and URLs
 * @throws {Error} If upload fails
 * 
 * @example
 * ```ts
 * const file = event.target.files[0];
 * const result = await uploadFile(
 *   STORAGE_BUCKETS.CUSTOMER_DOCUMENTS,
 *   `customers/cnic/${Date.now()}_front.jpg`,
 *   file
 * );
 * console.log(result.publicUrl);
 * ```
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File | Blob,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    cacheControl = '3600',
    upsert = false,
    contentType,
  } = options;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl,
      upsert,
      contentType,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Get public URL (if bucket is public)
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  // Generate signed URL for secure access (expires in 1 hour)
  const { data: signedUrlData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  return {
    path: filePath,
    publicUrl,
    signedUrl: signedUrlData?.signedUrl || undefined,
  };
}

/**
 * Generate a signed URL for secure file access
 * 
 * Signed URLs are time-limited and provide secure access to private files
 * without exposing the storage bucket publicly.
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to the file within the bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Signed URL
 * @throws {Error} If URL generation fails
 * 
 * @example
 * ```ts
 * const url = await getSignedUrl(
 *   STORAGE_BUCKETS.CONTRACT_PDFS,
 *   'contracts/contract-123.pdf',
 *   7200 // 2 hours
 * );
 * ```
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('Signed URL generation returned no data');
  }

  return data.signedUrl;
}

/**
 * Generate multiple signed URLs at once
 * 
 * Useful for batch operations like displaying multiple contract PDFs.
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string[]} filePaths - Array of file paths
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<Map<string, string>>} Map of file paths to signed URLs
 * 
 * @example
 * ```ts
 * const urls = await getSignedUrls(
 *   STORAGE_BUCKETS.CONTRACT_PDFS,
 *   ['contracts/contract-1.pdf', 'contracts/contract-2.pdf']
 * );
 * ```
 */
export async function getSignedUrls(
  bucket: string,
  filePaths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  // Generate URLs in parallel
  const promises = filePaths.map(async (filePath) => {
    try {
      const url = await getSignedUrl(bucket, filePath, expiresIn);
      urlMap.set(filePath, url);
    } catch (error) {
      console.error(`Failed to generate signed URL for ${filePath}:`, error);
      // Continue with other files even if one fails
    }
  });

  await Promise.allSettled(promises);

  return urlMap;
}

/**
 * Delete a file from storage
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 * 
 * @example
 * ```ts
 * await deleteFile(
 *   STORAGE_BUCKETS.CUSTOMER_DOCUMENTS,
 *   'customers/cnic/old-image.jpg'
 * );
 * ```
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Check if a file exists in storage
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if file exists
 * 
 * @example
 * ```ts
 * const exists = await fileExists(
 *   STORAGE_BUCKETS.CONTRACT_PDFS,
 *   'contracts/contract-123.pdf'
 * );
 * ```
 */
export async function fileExists(
  bucket: string,
  filePath: string
): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(filePath.split('/').slice(0, -1).join('/') || '', {
      search: filePath.split('/').pop() || '',
    });

  if (error) {
    return false;
  }

  return data?.some((file) => file.name === filePath.split('/').pop()) || false;
}

/**
 * Get file metadata
 * 
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to the file
 * @returns {Promise<{ size: number; lastModified: string; contentType?: string } | null>} File metadata or null if not found
 * 
 * @example
 * ```ts
 * const metadata = await getFileMetadata(
 *   STORAGE_BUCKETS.CONTRACT_PDFS,
 *   'contracts/contract-123.pdf'
 * );
 * if (metadata) {
 *   console.log(`File size: ${metadata.size} bytes`);
 * }
 * ```
 */
export async function getFileMetadata(
  bucket: string,
  filePath: string
): Promise<{ size: number; lastModified: string; contentType?: string } | null> {
  const folderPath = filePath.split('/').slice(0, -1).join('/') || '';
  const fileName = filePath.split('/').pop() || '';

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folderPath, {
      search: fileName,
    });

  if (error || !data || data.length === 0) {
    return null;
  }

  const file = data.find((f) => f.name === fileName);
  if (!file) {
    return null;
  }

  return {
    size: file.metadata?.size || 0,
    lastModified: file.updated_at || file.created_at || '',
    contentType: file.metadata?.mimetype,
  };
}

/**
 * Upload customer CNIC image with automatic path generation
 * 
 * @param {File} file - CNIC image file
 * @param {'front' | 'back'} type - Image type
 * @param {string} customerId - Customer ID for path organization
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadCustomerCNIC(
  file: File,
  type: 'front' | 'back',
  customerId?: string
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const folder = customerId ? `customers/${customerId}` : 'customers';
  const filePath = `${folder}/cnic/${timestamp}_${type}.${fileExt}`;

  return uploadFile(STORAGE_BUCKETS.CUSTOMER_DOCUMENTS, filePath, file, {
    contentType: file.type || 'image/jpeg',
  });
}

/**
 * Upload guarantor signature
 * 
 * @param {Blob} signatureBlob - Signature image blob
 * @param {string} guarantorId - Guarantor ID
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadGuarantorSignature(
  signatureBlob: Blob,
  guarantorId: string
): Promise<UploadResult> {
  const filePath = `signatures/${guarantorId}_${Date.now()}.png`;

  return uploadFile(STORAGE_BUCKETS.GUARANTOR_SIGNATURES, filePath, signatureBlob, {
    contentType: 'image/png',
  });
}

/**
 * Upload contract PDF
 * 
 * @param {Blob} pdfBlob - Contract PDF blob
 * @param {string} contractId - Contract ID
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadContractPDF(
  pdfBlob: Blob,
  contractId: string
): Promise<UploadResult> {
  const filePath = `contracts/${contractId}_${Date.now()}.pdf`;

  return uploadFile(STORAGE_BUCKETS.CONTRACT_PDFS, filePath, pdfBlob, {
    contentType: 'application/pdf',
  });
}

