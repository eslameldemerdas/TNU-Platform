export const MAGIC_BYTES: Record<string, { bytes: number[]; mime: string; extensions: string[] }> =
  {
    pdf: {
      bytes: [0x25, 0x50, 0x44, 0x46],
      mime: "application/pdf",
      extensions: ["pdf"],
    },
    docx: {
      bytes: [0x50, 0x4b, 0x03, 0x04],
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extensions: ["docx"],
    },
    pptx: {
      bytes: [0x50, 0x4b, 0x03, 0x04],
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      extensions: ["pptx"],
    },
    zip: {
      bytes: [0x50, 0x4b, 0x03, 0x04],
      mime: "application/zip",
      extensions: ["zip"],
    },
    png: {
      bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      mime: "image/png",
      extensions: ["png"],
    },
    jpg: {
      bytes: [0xff, 0xd8, 0xff],
      mime: "image/jpeg",
      extensions: ["jpg", "jpeg"],
    },
    gif: {
      bytes: [0x47, 0x49, 0x46, 0x38],
      mime: "image/gif",
      extensions: ["gif"],
    },
  };

export interface FileValidationResult {
  valid: boolean;
  detectedType?: string;
  mimeType?: string;
  error?: string;
}

export function validateFileMagicBytes(
  buffer: Buffer,
  declaredExtension: string,
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty file buffer" };
  }

  const ext = declaredExtension.replace(".", "").toLowerCase();
  const signature = MAGIC_BYTES[ext];

  if (!signature) {
    return { valid: false, error: `Unsupported file extension: ${ext}` };
  }

  const header = buffer.slice(0, signature.bytes.length);
  const matches = signature.bytes.every((byte, index) => header[index] === byte);

  if (!matches) {
    return {
      valid: false,
      detectedType: undefined,
      mimeType: undefined,
      error: `File header does not match ${ext.toUpperCase()} magic bytes. Possible file type mismatch or corrupted upload.`,
    };
  }

  return {
    valid: true,
    detectedType: ext,
    mimeType: signature.mime,
  };
}

export function getAllowedFileTypes(): string[] {
  return Object.keys(MAGIC_BYTES);
}

export function getMaxFileSizeBytes(): number {
  return 30 * 1024 * 1024; // 30 MB
}
