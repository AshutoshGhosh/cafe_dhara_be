/**
 * Upload constraints. Images only, capped size. Kept here so the multer config
 * (service) and any future callers share one source of truth.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME = /^image\//;
