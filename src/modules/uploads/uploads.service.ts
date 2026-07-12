import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import type { Request } from 'express';
import { AppError } from '../../common/AppError';
import { MAX_UPLOAD_BYTES, ALLOWED_IMAGE_MIME } from './uploads.validation';

/** Absolute path to the repo-root uploads directory. */
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/** Ensure the uploads directory exists (created lazily at runtime). */
function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

const ALLOWED_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureUploadsDir();
      cb(null, UPLOADS_DIR);
    } catch (err) {
      cb(err as Error, UPLOADS_DIR);
    }
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_EXT[file.mimetype] ?? path.extname(file.originalname).toLowerCase() ?? '';
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (!ALLOWED_IMAGE_MIME.test(file.mimetype)) {
    cb(AppError.badRequest('Only image uploads are allowed', 'INVALID_FILE_TYPE'));
    return;
  }
  cb(null, true);
}

/** Configured multer instance: single image field named `image`. */
export const imageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

/** Build the public URL served from the static /uploads mount. */
export function publicUrlForFile(filename: string): string {
  return `/uploads/${filename}`;
}
