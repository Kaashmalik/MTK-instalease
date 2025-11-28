/**
 * Multi-Provider Storage Router
 * 
 * Routes files to optimal storage provider based on type and size.
 * Implements cost-effective storage strategy across Supabase, Cloudinary, and Backblaze.
 * 
 * @module lib/storage/router
 */

export enum StorageProvider {
  SUPABASE = 'supabase',
  CLOUDINARY = 'cloudinary',
  BACKBLAZE = 'backblaze',
}

export interface StorageConfig {
  provider: StorageProvider;
  maxSize: number; // bytes
  allowedTypes: string[];
  description: string;
}

/**
 * Storage routing rules based on file type and size
 * 
 * Strategy:
 * - Supabase (1GB free): Profile pictures, small documents
 * - Cloudinary (25GB/month free): CNIC images with optimization
 * - Backblaze (10GB free): Contracts, PDFs, large documents
 */
export const STORAGE_RULES: Record<string, StorageConfig> = {
  profilePictures: {
    provider: StorageProvider.SUPABASE,
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'User profile pictures and avatars',
  },
  cnicImages: {
    provider: StorageProvider.CLOUDINARY,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
    description: 'CNIC images with automatic optimization',
  },
  contracts: {
    provider: StorageProvider.BACKBLAZE,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    description: 'Contract PDFs for long-term storage',
  },
  documents: {
    provider: StorageProvider.BACKBLAZE,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'General documents and files',
  },
  signatures: {
    provider: StorageProvider.SUPABASE,
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/png', 'image/jpeg'],
    description: 'Guarantor signatures',
  },
};

/**
 * Determine optimal storage provider based on file characteristics
 * 
 * @param {string} fileType - Type of file (e.g., 'cnic', 'contract', 'profile')
 * @param {number} fileSize - File size in bytes
 * @param {string} mimeType - MIME type of the file
 * @returns {StorageProvider} Optimal storage provider
 * 
 * @example
 * ```ts
 * const provider = getStorageProvider('cnic', 2048000, 'image/jpeg');
 * // Returns: StorageProvider.CLOUDINARY
 * ```
 */
export function getStorageProvider(
  fileType: string,
  fileSize: number,
  mimeType?: string
): StorageProvider {
  // Profile pictures → Supabase (small, frequently accessed)
  if (fileType.includes('profile') || fileType.includes('avatar')) {
    return StorageProvider.SUPABASE;
  }
  
  // CNIC images → Cloudinary (needs optimization + OCR)
  if (fileType.includes('cnic') || fileType.includes('id_card')) {
    return StorageProvider.CLOUDINARY;
  }
  
  // Signatures → Supabase (small files)
  if (fileType.includes('signature')) {
    return StorageProvider.SUPABASE;
  }
  
  // Large files or PDFs → Backblaze (cost-effective for large storage)
  if (fileSize > 500 * 1024 || mimeType === 'application/pdf' || fileType.includes('contract')) {
    return StorageProvider.BACKBLAZE;
  }
  
  // Default to Supabase for small files
  if (fileSize < 500 * 1024) {
    return StorageProvider.SUPABASE;
  }
  
  // Fallback to Backblaze for everything else
  return StorageProvider.BACKBLAZE;
}

/**
 * Validate file against storage rules
 * 
 * @param {File} file - File to validate
 * @param {string} fileType - Type of file
 * @returns {{ valid: boolean; error?: string }} Validation result
 * 
 * @example
 * ```ts
 * const result = validateFile(file, 'cnic');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateFile(
  file: File,
  fileType: string
): { valid: boolean; error?: string } {
  const rule = STORAGE_RULES[fileType];
  
  if (!rule) {
    return { valid: true }; // No specific rule, allow
  }
  
  // Check file size
  if (file.size > rule.maxSize) {
    const maxSizeMB = (rule.maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSizeMB}MB`,
    };
  }
  
  // Check file type
  if (rule.allowedTypes.length > 0 && !rule.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${rule.allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Get storage provider limits
 * 
 * @returns {Record<StorageProvider, { total: number; used: number }>} Storage limits
 */
export function getStorageLimits() {
  return {
    [StorageProvider.SUPABASE]: {
      total: 1024 * 1024 * 1024, // 1GB
      description: 'Free tier: 1GB total storage',
    },
    [StorageProvider.CLOUDINARY]: {
      total: 25 * 1024 * 1024 * 1024, // 25GB/month bandwidth
      description: 'Free tier: 25GB bandwidth/month',
    },
    [StorageProvider.BACKBLAZE]: {
      total: 10 * 1024 * 1024 * 1024, // 10GB
      description: 'Free tier: 10GB storage',
    },
  };
}

/**
 * Generate file path with timestamp and sanitization
 * 
 * @param {string} folder - Folder name
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file path
 * 
 * @example
 * ```ts
 * const path = generateFilePath('customers', 'my file.jpg');
 * // Returns: 'customers/1234567890_my_file.jpg'
 * ```
 */
export function generateFilePath(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_+/g, '_');
  
  return `${folder}/${timestamp}_${sanitized}`;
}
