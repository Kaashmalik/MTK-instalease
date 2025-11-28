/**
 * Backblaze B2 Storage Provider
 * 
 * Handles long-term document storage (contracts, PDFs).
 * Free tier: 10GB storage, cost-effective for large files.
 * 
 * @module lib/storage/backblaze
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Initialize S3 client for Backblaze B2
 */
function getS3Client(): S3Client {
  if (!process.env.BACKBLAZE_ENDPOINT || !process.env.BACKBLAZE_KEY_ID || !process.env.BACKBLAZE_APP_KEY) {
    throw new Error('Backblaze B2 not configured. Please set BACKBLAZE_* environment variables.');
  }

  return new S3Client({
    endpoint: process.env.BACKBLAZE_ENDPOINT,
    region: process.env.BACKBLAZE_REGION || 'us-west-000',
    credentials: {
      accessKeyId: process.env.BACKBLAZE_KEY_ID,
      secretAccessKey: process.env.BACKBLAZE_APP_KEY,
    },
  });
}

/**
 * Upload result from Backblaze
 */
export interface BackblazeUploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
}

/**
 * Upload file to Backblaze B2
 * 
 * @param {File} file - File to upload
 * @param {string} key - Object key (path) in bucket
 * @param {string} bucket - Bucket name (default from env)
 * @returns {Promise<BackblazeUploadResult>} Upload result
 * @throws {Error} If upload fails or Backblaze not configured
 * 
 * @example
 * ```ts
 * const result = await uploadToBackblaze(
 *   file,
 *   'contracts/contract-123.pdf',
 *   'instalease-contracts'
 * );
 * console.log(result.url);
 * ```
 */
export async function uploadToBackblaze(
  file: File,
  key: string,
  bucket?: string
): Promise<BackblazeUploadResult> {
  const s3Client = getS3Client();
  const bucketName = bucket || process.env.BACKBLAZE_BUCKET || 'instalease-contracts';

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Backblaze B2
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'original-name': file.name,
        'uploaded-at': new Date().toISOString(),
      },
    })
  );

  // Construct public URL
  const endpoint = process.env.BACKBLAZE_ENDPOINT || '';
  const url = `${endpoint}/${bucketName}/${key}`;

  return {
    url,
    key,
    bucket: bucketName,
    size: file.size,
  };
}

/**
 * Upload contract PDF to Backblaze
 * 
 * @param {Blob} pdfBlob - Contract PDF blob
 * @param {string} contractId - Contract ID
 * @returns {Promise<BackblazeUploadResult>} Upload result
 * 
 * @example
 * ```ts
 * const result = await uploadContractPDF(pdfBlob, 'contract-123');
 * console.log(result.url);
 * ```
 */
export async function uploadContractPDF(
  pdfBlob: Blob,
  contractId: string
): Promise<BackblazeUploadResult> {
  const timestamp = Date.now();
  const key = `contracts/${contractId}_${timestamp}.pdf`;
  
  // Convert Blob to File
  const file = new File([pdfBlob], `${contractId}.pdf`, { type: 'application/pdf' });
  
  return uploadToBackblaze(file, key);
}

/**
 * Upload document to Backblaze
 * 
 * @param {File} file - Document file
 * @param {string} folder - Folder name (e.g., 'documents', 'archives')
 * @param {string} customerId - Customer ID for organization
 * @returns {Promise<BackblazeUploadResult>} Upload result
 */
export async function uploadDocument(
  file: File,
  folder: string,
  customerId?: string
): Promise<BackblazeUploadResult> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_');
  const key = customerId
    ? `${folder}/${customerId}/${timestamp}_${sanitizedName}`
    : `${folder}/${timestamp}_${sanitizedName}`;
  
  return uploadToBackblaze(file, key);
}

/**
 * Generate signed URL for secure file access
 * 
 * @param {string} key - Object key in bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @param {string} bucket - Bucket name (default from env)
 * @returns {Promise<string>} Signed URL
 * @throws {Error} If URL generation fails
 * 
 * @example
 * ```ts
 * const url = await getSignedUrlForBackblaze('contracts/contract-123.pdf', 7200);
 * // URL expires in 2 hours
 * ```
 */
export async function getSignedUrlForBackblaze(
  key: string,
  expiresIn: number = 3600,
  bucket?: string
): Promise<string> {
  const s3Client = getS3Client();
  const bucketName = bucket || process.env.BACKBLAZE_BUCKET || 'instalease-contracts';

  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Delete file from Backblaze
 * 
 * @param {string} key - Object key in bucket
 * @param {string} bucket - Bucket name (default from env)
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 * 
 * @example
 * ```ts
 * await deleteFromBackblaze('contracts/old-contract.pdf');
 * ```
 */
export async function deleteFromBackblaze(
  key: string,
  bucket?: string
): Promise<void> {
  const s3Client = getS3Client();
  const bucketName = bucket || process.env.BACKBLAZE_BUCKET || 'instalease-contracts';

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

/**
 * Check if file exists in Backblaze
 * 
 * @param {string} key - Object key in bucket
 * @param {string} bucket - Bucket name (default from env)
 * @returns {Promise<boolean>} True if file exists
 * 
 * @example
 * ```ts
 * const exists = await fileExistsInBackblaze('contracts/contract-123.pdf');
 * ```
 */
export async function fileExistsInBackblaze(
  key: string,
  bucket?: string
): Promise<boolean> {
  const s3Client = getS3Client();
  const bucketName = bucket || process.env.BACKBLAZE_BUCKET || 'instalease-contracts';

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata from Backblaze
 * 
 * @param {string} key - Object key in bucket
 * @param {string} bucket - Bucket name (default from env)
 * @returns {Promise<{ size: number; lastModified: Date; contentType: string } | null>} File metadata
 * 
 * @example
 * ```ts
 * const metadata = await getBackblazeFileMetadata('contracts/contract-123.pdf');
 * if (metadata) {
 *   console.log(`Size: ${metadata.size} bytes`);
 * }
 * ```
 */
export async function getBackblazeFileMetadata(
  key: string,
  bucket?: string
): Promise<{ size: number; lastModified: Date; contentType: string } | null> {
  const s3Client = getS3Client();
  const bucketName = bucket || process.env.BACKBLAZE_BUCKET || 'instalease-contracts';

  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType || 'application/octet-stream',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get Backblaze B2 usage (approximate)
 * 
 * Note: Backblaze doesn't provide real-time usage via API.
 * This is an estimate based on uploaded files.
 * Check actual usage in Backblaze dashboard.
 * 
 * @returns {Promise<number>} Estimated storage usage in bytes
 */
export async function getBackblazeUsage(): Promise<number> {
  // This would require listing all objects and summing sizes
  // For now, return 0 and check actual usage in Backblaze dashboard
  console.warn('Backblaze usage tracking not implemented. Check Backblaze dashboard for actual usage.');
  return 0;
}

/**
 * Check if Backblaze is configured
 * 
 * @returns {boolean} True if Backblaze is configured
 */
export function isBackblazeConfigured(): boolean {
  return !!(
    process.env.BACKBLAZE_ENDPOINT &&
    process.env.BACKBLAZE_KEY_ID &&
    process.env.BACKBLAZE_APP_KEY
  );
}
