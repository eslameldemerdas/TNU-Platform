import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Product Identifier
export const PRODUCT_NAME = 'EngHub';

/**
 * Strict Environment Variable Validation Helper
 * Throws a clear runtime error if required storage configuration is missing.
 */
function getRequiredEnvVar(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(
      `[${PRODUCT_NAME} Storage Error] Missing required environment variable: ${name}. Please define ${name} in your environment configuration.`
    );
  }
  return val;
}

/**
 * Helper to dynamically initialize and return S3 Client & Bucket Name with strict env checks
 */
export function getStorageConfig() {
  const accountId = getRequiredEnvVar('R2_ACCOUNT_ID');
  const accessKeyId = getRequiredEnvVar('R2_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnvVar('R2_SECRET_ACCESS_KEY');
  const bucket = getRequiredEnvVar('R2_BUCKET_NAME');
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket };
}

// Presigned URL Expiry Window (Strict 15 Minutes / 900 Seconds)
export const SIGNED_URL_EXPIRY_SECONDS = 900;

// Allowed MIME types & File Extensions Allowlist
export const ALLOWED_FILE_TYPES: Record<string, { mimeTypes: string[]; maxSizeBytes: number }> = {
  pdf: {
    mimeTypes: ['application/pdf'],
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
  },
  docx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
    maxSizeBytes: 30 * 1024 * 1024, // 30MB
  },
  pptx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ],
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
  },
  zip: {
    mimeTypes: ['application/zip', 'application/x-zip-compressed'],
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
  },
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
  },
};

/**
 * Known Magic-Byte Signatures for Content-Type Verification
 * OOXML formats (docx, pptx) are ZIP archives and check against [0x50, 0x4B, 0x03, 0x04].
 * Legacy binary formats (doc, ppt) check against OLE Compound File header [0xD0, 0xCF, 0x11, 0xE0].
 */
export const MAGIC_BYTES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/zip': [0x50, 0x4b, 0x03, 0x04], // PK..
  'application/x-zip-compressed': [0x50, 0x4b, 0x03, 0x04], // PK..
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4b, 0x03, 0x04], // docx (PK)
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [0x50, 0x4b, 0x03, 0x04], // pptx (PK)
  'application/msword': [0xd0, 0xcf, 0x11, 0xe0], // doc (OLE)
  'application/vnd.ms-powerpoint': [0xd0, 0xcf, 0x11, 0xe0], // ppt (OLE)
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF (bytes 0-3) + WEBP (bytes 8-11) verified in verifyMagicBytes
};

/**
 * Verify Magic Bytes of a file buffer against expected mimeType
 */
export function verifyMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  // Special handling for WebP format: RIFF header (bytes 0-3) + WEBP identifier (bytes 8-11)
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // 'RIFF'
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50; // 'WEBP'
    return isRiff && isWebp;
  }

  const expectedBytes = MAGIC_BYTES[mimeType];
  if (!expectedBytes) return true; // Skip if signature not in dictionary
  if (buffer.length < expectedBytes.length) return false;

  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) return false;
  }
  return true;
}

export interface InitiateUploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  courseId: string;
  uploaderId: string;
  resourceCategory: 'pdf' | 'docx' | 'pptx' | 'zip' | 'image';
}

export interface InitiateUploadResponse {
  fileKey: string;
  uploadUrl: string;
  expiresAt: string;
}

/**
 * 1. Initiate Upload: Validates file type, size, category allowlist, and generates a pre-signed PUT URL.
 * Requires R2 environment variables to be explicitly defined.
 */
export async function initiateUpload(req: InitiateUploadRequest): Promise<InitiateUploadResponse> {
  const { client, bucket } = getStorageConfig();

  const categoryConfig = ALLOWED_FILE_TYPES[req.resourceCategory];
  if (!categoryConfig) {
    throw new Error(`Invalid resource category: ${req.resourceCategory}`);
  }

  // 1. File size check
  if (req.fileSize > categoryConfig.maxSizeBytes) {
    throw new Error(
      `File size (${(req.fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds limit of ${categoryConfig.maxSizeBytes / (1024 * 1024)}MB for ${req.resourceCategory}`
    );
  }

  // 2. MIME Type allowlist check
  if (!categoryConfig.mimeTypes.includes(req.fileType)) {
    throw new Error(`MIME type '${req.fileType}' is not allowed for category '${req.resourceCategory}'`);
  }

  // 3. Generate unique key
  const sanitizedName = req.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const fileKey = `resources/${req.courseId}/${timestamp}_${sanitizedName}`;

  // 4. Generate pre-signed PUT URL (15-minute expiry)
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: req.fileType,
    ContentLength: req.fileSize,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: SIGNED_URL_EXPIRY_SECONDS,
  });

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString();

  return { fileKey, uploadUrl, expiresAt };
}

/**
 * 2. Post-Upload Verification: Fetches the first 16 bytes of the object directly from R2/S3
 * via a ranged GET ('bytes=0-15') and verifies the magic bytes signature before making the Resource visible.
 * If magic-byte verification fails, immediately deletes the uploaded object from storage and throws an error.
 */
export async function verifyUploadedObjectHeader(
  fileKey: string,
  expectedMimeType: string
): Promise<boolean> {
  const { client, bucket } = getStorageConfig();

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Range: 'bytes=0-15',
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error('Received empty response body from storage provider');
    }

    const byteArray = await response.Body.transformToByteArray();
    const isValid = verifyMagicBytes(byteArray, expectedMimeType);

    if (!isValid) {
      // Purge invalid file immediately from storage
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        })
      );
      throw new Error(
        `Magic-byte verification failed for uploaded object (${fileKey}). File header does not match expected MIME type '${expectedMimeType}'. Object has been purged from storage.`
      );
    }

    return true;
  } catch (error: any) {
    if (error.message?.includes('Magic-byte verification failed')) {
      throw error;
    }
    throw new Error(`Failed to perform post-upload verification on object (${fileKey}): ${error.message}`);
  }
}

/**
 * 3. Get Signed Download URL: Generates time-limited pre-signed URL with Content-Disposition: attachment
 */
export async function getSignedDownloadUrl(fileKey: string, fileName?: string): Promise<string> {
  const { client, bucket } = getStorageConfig();
  const safeName = fileName ? fileName.replace(/"/g, '') : 'download';

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  });

  return getSignedUrl(client, command, {
    expiresIn: SIGNED_URL_EXPIRY_SECONDS,
  });
}

/**
 * 4. Get Signed Preview URL: Generates time-limited pre-signed URL for in-browser inline preview
 */
export async function getSignedPreviewUrl(fileKey: string): Promise<string> {
  const { client, bucket } = getStorageConfig();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ResponseContentDisposition: 'inline',
  });

  return getSignedUrl(client, command, {
    expiresIn: SIGNED_URL_EXPIRY_SECONDS,
  });
}

/**
 * Confirm Upload Transaction Input
 */
export interface ConfirmUploadInput {
  title: string;
  description?: string;
  resourceType: 'lecture' | 'section' | 'lab' | 'assignment' | 'previousExam' | 'summary' | 'importantQuestion';
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploaderId: string;
  courseId: string;
  universityId: string;
  facultyId: string;
  departmentId: string;
}

export interface ModerationReversalInput {
  moderatorId: string;
  resourceId: string;
  uploaderId: string;
  reason: string;
  action: 'remove' | 'flag';
}

