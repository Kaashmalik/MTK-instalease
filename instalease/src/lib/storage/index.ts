/**
 * Unified Storage Interface
 * 
 * Provides a single interface for multi-provider storage.
 * Automatically routes files to optimal provider based on type and size.
 * 
 * @module lib/storage
 */

import { uploadToCloudinary, uploadCNICImage, isCloudinaryConfigured } from './cloudinary';
import { uploadToBackblaze, uploadContractPDF, uploadDocument, isBackblazeConfigured } from './backblaze';
import { uploadFile as uploadToSupabase, uploadCustomerCNIC, uploadGuarantorSignature, uploadContractPDF as uploadContractToSupabase } from '../supabase/storage';
import { getStorageProvider, validateFile, StorageProvider, generateFilePath } from './router';

/**
 * Unified upload result
 */
export interface UploadResult {
  url: string;
  provider: StorageProvider;
  path: string;
  size: number;
  extractedText?: string; // For OCR results
}

/**
 * Upload file using optimal storage provider
 * 
 * Automatically selects the best provider based on file type and size.
 * 
 * @param {File} file - File to upload
 * @param {string} fileType - Type of file (e.g., 'cnic', 'contract', 'profile')
 * @param {object} metadata - Optional metadata
 * @returns {Promise<UploadResult>} Upload result
 * @throws {Error} If upload fails or file validation fails
 * 
 * @example
 * ```ts
 * const result = await uploadFile(file, 'cnic', { customerId: '123' });
 * console.log(result.url);
 * console.log(result.provider); // 'cloudinary'
 * ```
 */
export async function uploadFile(
  file: File,
  fileType: string,
  metadata?: {
    customerId?: string;
    contractId?: string;
    guarantorId?: string;
    folder?: string;
  }
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file, fileType);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Determine optimal provider
  const provider = getStorageProvider(fileType, file.size, file.type);

  // Route to appropriate provider
  switch (provider) {
    case StorageProvider.CLOUDINARY:
      return uploadToCloudinaryProvider(file, fileType, metadata);
    
    case StorageProvider.BACKBLAZE:
      return uploadToBackblazeProvider(file, fileType, metadata);
    
    case StorageProvider.SUPABASE:
    default:
      return uploadToSupabaseProvider(file, fileType, metadata);
  }
}

/**
 * Upload to Cloudinary provider
 */
async function uploadToCloudinaryProvider(
  file: File,
  fileType: string,
  metadata?: { customerId?: string }
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary not configured, falling back to Supabase');
    return uploadToSupabaseProvider(file, fileType, metadata);
  }

  try {
    // Special handling for CNIC images (with OCR)
    if (fileType.includes('cnic') && metadata?.customerId) {
      const side = fileType.includes('front') ? 'front' : 'back';
      const result = await uploadCNICImage(file, metadata.customerId, side);
      
      return {
        url: result.url,
        provider: StorageProvider.CLOUDINARY,
        path: result.url,
        size: file.size,
        extractedText: result.extractedText,
      };
    }

    // Standard Cloudinary upload
    const result = await uploadToCloudinary(file, {
      folder: `instalease/${fileType}`,
      tags: [fileType, metadata?.customerId || 'unknown'],
    });

    return {
      url: result.secureUrl,
      provider: StorageProvider.CLOUDINARY,
      path: result.publicId,
      size: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload failed, falling back to Supabase:', error);
    return uploadToSupabaseProvider(file, fileType, metadata);
  }
}

/**
 * Upload to Backblaze provider
 */
async function uploadToBackblazeProvider(
  file: File,
  fileType: string,
  metadata?: { customerId?: string; contractId?: string; folder?: string }
): Promise<UploadResult> {
  if (!isBackblazeConfigured()) {
    console.warn('Backblaze not configured, falling back to Supabase');
    return uploadToSupabaseProvider(file, fileType, metadata);
  }

  try {
    // Special handling for contracts
    if (fileType.includes('contract') && metadata?.contractId) {
      const result = await uploadContractPDF(file, metadata.contractId);
      
      return {
        url: result.url,
        provider: StorageProvider.BACKBLAZE,
        path: result.key,
        size: result.size,
      };
    }

    // Standard document upload
    const folder = metadata?.folder || fileType;
    const result = await uploadDocument(file, folder, metadata?.customerId);

    return {
      url: result.url,
      provider: StorageProvider.BACKBLAZE,
      path: result.key,
      size: result.size,
    };
  } catch (error) {
    console.error('Backblaze upload failed, falling back to Supabase:', error);
    return uploadToSupabaseProvider(file, fileType, metadata);
  }
}

/**
 * Upload to Supabase provider (fallback)
 */
async function uploadToSupabaseProvider(
  file: File,
  fileType: string,
  metadata?: { customerId?: string; contractId?: string; guarantorId?: string }
): Promise<UploadResult> {
  try {
    // Special handling for CNIC
    if (fileType.includes('cnic')) {
      const side = fileType.includes('front') ? 'front' : 'back';
      const result = await uploadCustomerCNIC(file, side, metadata?.customerId);
      
      return {
        url: result.signedUrl || result.publicUrl,
        provider: StorageProvider.SUPABASE,
        path: result.path,
        size: file.size,
      };
    }

    // Special handling for signatures
    if (fileType.includes('signature') && metadata?.guarantorId) {
      const blob = await file.arrayBuffer().then(ab => new Blob([ab]));
      const result = await uploadGuarantorSignature(blob, metadata.guarantorId);
      
      return {
        url: result.signedUrl || result.publicUrl,
        provider: StorageProvider.SUPABASE,
        path: result.path,
        size: file.size,
      };
    }

    // Special handling for contracts
    if (fileType.includes('contract') && metadata?.contractId) {
      const blob = await file.arrayBuffer().then(ab => new Blob([ab]));
      const result = await uploadContractToSupabase(blob, metadata.contractId);
      
      return {
        url: result.signedUrl || result.publicUrl,
        provider: StorageProvider.SUPABASE,
        path: result.path,
        size: file.size,
      };
    }

    // Standard Supabase upload
    const bucket = 'customer-documents';
    const filePath = generateFilePath(fileType, file.name);
    const result = await uploadToSupabase(bucket, filePath, file);

    return {
      url: result.signedUrl || result.publicUrl,
      provider: StorageProvider.SUPABASE,
      path: result.path,
      size: file.size,
    };
  } catch (error) {
    throw new Error(`All storage providers failed: ${error}`);
  }
}

/**
 * Upload customer CNIC with automatic provider selection
 * 
 * @param {File} file - CNIC image file
 * @param {'front' | 'back'} side - CNIC side
 * @param {string} customerId - Customer ID
 * @returns {Promise<UploadResult>} Upload result with optional OCR text
 */
export async function uploadCNIC(
  file: File,
  side: 'front' | 'back',
  customerId: string
): Promise<UploadResult> {
  return uploadFile(file, `cnic_${side}`, { customerId });
}

/**
 * Upload contract PDF with automatic provider selection
 * 
 * @param {File | Blob} file - Contract PDF
 * @param {string} contractId - Contract ID
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadContract(
  file: File | Blob,
  contractId: string
): Promise<UploadResult> {
  const fileObj = file instanceof File ? file : new File([file], `contract-${contractId}.pdf`, { type: 'application/pdf' });
  return uploadFile(fileObj, 'contract', { contractId });
}

/**
 * Upload guarantor signature with automatic provider selection
 * 
 * @param {Blob} signatureBlob - Signature image blob
 * @param {string} guarantorId - Guarantor ID
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadSignature(
  signatureBlob: Blob,
  guarantorId: string
): Promise<UploadResult> {
  const file = new File([signatureBlob], `signature-${guarantorId}.png`, { type: 'image/png' });
  return uploadFile(file, 'signature', { guarantorId });
}

/**
 * Upload profile picture with automatic provider selection
 * 
 * @param {File} file - Profile picture file
 * @param {string} userId - User ID
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<UploadResult> {
  return uploadFile(file, 'profile', { customerId: userId });
}

// Re-export storage utilities
export { StorageProvider, validateFile, getStorageProvider } from './router';
export { isCloudinaryConfigured } from './cloudinary';
export { isBackblazeConfigured } from './backblaze';
