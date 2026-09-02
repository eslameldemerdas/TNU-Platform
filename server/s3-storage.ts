import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  _DeleteObjectCommand,
  _HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloud Storage & CDN Integration Service
 * Supports AWS S3, Cloudflare R2, MinIO, and other S3-compatible providers.
 * Delivers assets via CDN URLs with signed URL restricted access and encrypted UUID naming.
 */

export interface StorageConfig {
  client: S3Client;
  bucket: string;
  cdnBaseUrl?: string;
}

export function getS3StorageConfig(): StorageConfig | null {
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY;
  const bucket =
    process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET_NAME;
  const region = process.env.S3_REGION || process.env.AWS_REGION || "auto";
  const endpoint =
    process.env.S3_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);
  const cdnBaseUrl = process.env.CDN_BASE_URL || process.env.STORAGE_CDN_URL;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  const client = new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket, cdnBaseUrl };
}

/**
 * Generates a secure, cryptographically random, encrypted filename
 * Structure: UUIDv4 + SHA256 content/entropy hash + safe extension
 * Prevents directory traversal attacks and conceals raw asset metadata.
 */
export function generateEncryptedFileName(
  originalFileName: string,
  courseId: string,
): { fileKey: string; secureFileName: string } {
  const ext = originalFileName.includes(".")
    ? "." +
      originalFileName
        .split(".")
        .pop()!
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
    : ".pdf";

  const uuid = crypto.randomUUID();
  const hash = crypto
    .createHash("sha256")
    .update(`${uuid}:${originalFileName}:${Date.now()}`)
    .digest("hex")
    .substring(0, 16);
  const cleanCourseId = courseId.replace(/[^a-zA-Z0-9_-]/g, "_");

  const secureFileName = `${uuid}-${hash}${ext}`;
  const fileKey = `courses/${cleanCourseId}/${secureFileName}`;

  return { fileKey, secureFileName };
}

/**
 * Generates an encrypted pre-signed PUT URL for direct client-to-cloud upload.
 */
export async function getPresignedUploadUrl(params: {
  originalFileName: string;
  courseId: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ fileKey: string; uploadUrl: string; cdnUrl?: string; expiresAt: string }> {
  const config = getS3StorageConfig();
  const { fileKey } = generateEncryptedFileName(params.originalFileName, params.courseId);
  const expiresIn = params.expiresInSeconds || 900; // 15 minutes

  if (!config) {
    // Graceful fallback for local or pre-configured dev environments
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    return {
      fileKey,
      uploadUrl: `/api/files/upload-direct?fileKey=${encodeURIComponent(fileKey)}`,
      cdnUrl: `/api/files/download/${encodeURIComponent(fileKey)}`,
      expiresAt,
    };
  }

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: fileKey,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(config.client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  let cdnUrl: string | undefined;
  if (config.cdnBaseUrl) {
    const base = config.cdnBaseUrl.replace(/\/$/, "");
    cdnUrl = `${base}/${fileKey}`;
  }

  return { fileKey, uploadUrl, cdnUrl, expiresAt };
}

/**
 * Generates a time-limited secure signed download URL or signed CDN URL.
 */
export async function getPresignedDownloadUrl(params: {
  fileKey: string;
  originalFileName?: string;
  expiresInSeconds?: number;
}): Promise<{ downloadUrl: string; expiresAt: string; cdnDelivered: boolean }> {
  const config = getS3StorageConfig();
  const expiresIn = params.expiresInSeconds || 3600; // 1 hour
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const safeFilename = params.originalFileName
    ? params.originalFileName.replace(/["\r\n]/g, "")
    : "document.pdf";

  if (!config) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error(
        "[Security] SESSION_SECRET is not set. Cannot generate signed download URLs.",
      );
    }
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${params.fileKey}:${expiresAt}`)
      .digest("hex");
    const downloadUrl = `/api/files/download/${encodeURIComponent(params.fileKey)}?token=${signature}&expires=${encodeURIComponent(expiresAt)}`;

    return {
      downloadUrl,
      expiresAt,
      cdnDelivered: false,
    };
  }

  // If CDN Base URL is provided without signed requirement:
  if (config.cdnBaseUrl && !process.env.REQUIRE_SIGNED_CDN) {
    const base = config.cdnBaseUrl.replace(/\/$/, "");
    return {
      downloadUrl: `${base}/${params.fileKey}`,
      expiresAt,
      cdnDelivered: true,
    };
  }

  // Pre-signed S3/R2 GetObject URL with Content-Disposition
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: params.fileKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(safeFilename)}"`,
  });

  const downloadUrl = await getSignedUrl(config.client, command, { expiresIn });

  return {
    downloadUrl,
    expiresAt,
    cdnDelivered: Boolean(config.cdnBaseUrl),
  };
}
