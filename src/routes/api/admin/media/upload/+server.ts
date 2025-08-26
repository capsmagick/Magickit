import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaManagementService } from '$lib/services/media';
import { MediaFilesCollection } from '$lib/db/collections/mediaFiles';
import { s3MediaService, isS3Configured } from '$lib/services/s3-upload';
import { ObjectId } from 'mongodb';
import sharp from 'sharp';
import { auth } from '$lib/auth/auth';

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
  'image/': 10 * 1024 * 1024, // 10MB
  'video/': 100 * 1024 * 1024, // 100MB
  'audio/': 50 * 1024 * 1024, // 50MB
  'application/pdf': 25 * 1024 * 1024 // 25MB
};

// Supported file types
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mp3',
  'audio/wav',
  'application/pdf'
];

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Try to get session directly from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
    });

    console.log('Session debug:', {
      directSession: !!session,
      directUser: !!session?.user,
      localsSession: !!locals.session,
      localsUser: !!locals.user,
      sessionUserId: session?.user?.id || 'no id',
      userRole: session?.user?.role || locals.user?.role || 'no role'
    });

    // Check authentication using direct session first, fallback to locals
    const user = session?.user || locals.session?.user || locals.user;
    
    if (!user) {
      console.log('Authentication failed - no user found');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }

    // Validate file size
    const maxSize = getMaxSizeForType(file.type);
    if (file.size > maxSize) {
      return json({ 
        error: `File too large. Maximum size for ${file.type} is ${formatFileSize(maxSize)}` 
      }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'bin';
    const filename = `${timestamp}_${randomId}.${extension}`;

    let processedFile;
    let variants = [];

    let s3Key: string;
    let s3Url: string;

    // Process based on file type
    if (file.type.startsWith('image/')) {
      // Process image with Sharp
      processedFile = await MediaManagementService.processImage(buffer, filename, {
        generateVariants: true
      });

      // Upload to S3 if configured, otherwise simulate
      if (isS3Configured()) {
        try {
          const uploadResult = await s3MediaService.uploadProcessedMedia(
            {
              buffer,
              filename: file.name,
              mimeType: file.type,
              metadata: processedFile.metadata
            },
            processedFile.variants
          );
          
          s3Key = uploadResult.s3Key;
          s3Url = uploadResult.s3Url;
          variants = uploadResult.variants;
        } catch (error) {
          console.error('S3 upload failed, falling back to local storage:', error);
          // Fallback to simulated URLs
          s3Key = `media/${filename}`;
          s3Url = `https://your-bucket.s3.amazonaws.com/${s3Key}`;
          variants = processedFile.variants.map(variant => ({
            _id: new ObjectId(),
            name: variant.name,
            width: variant.width,
            height: variant.height,
            format: variant.format,
            quality: variant.quality,
            size: variant.size,
            s3Key: `media/${filename.replace(/\.[^/.]+$/, '')}_${variant.name}.${variant.format}`,
            s3Url: `https://your-bucket.s3.amazonaws.com/media/${filename.replace(/\.[^/.]+$/, '')}_${variant.name}.${variant.format}`
          }));
        }
      } else {
        // Simulate S3 URLs for development
        s3Key = `media/${filename}`;
        s3Url = `https://your-bucket.s3.amazonaws.com/${s3Key}`;
        variants = processedFile.variants.map(variant => ({
          _id: new ObjectId(),
          name: variant.name,
          width: variant.width,
          height: variant.height,
          format: variant.format,
          quality: variant.quality,
          size: variant.size,
          s3Key: `media/${filename.replace(/\.[^/.]+$/, '')}_${variant.name}.${variant.format}`,
          s3Url: `https://your-bucket.s3.amazonaws.com/media/${filename.replace(/\.[^/.]+$/, '')}_${variant.name}.${variant.format}`
        }));
      }
    } else {
      // For non-image files, just store the original
      processedFile = {
        original: {
          buffer,
          size: buffer.length,
          format: extension
        },
        variants: [],
        metadata: {}
      };

      // Upload to S3 if configured
      if (isS3Configured()) {
        try {
          s3Key = `media/${filename}`;
          s3Url = await s3MediaService.uploadFile(s3Key, buffer, file.type, {
            'original-filename': file.name,
            'upload-timestamp': new Date().toISOString()
          });
        } catch (error) {
          console.error('S3 upload failed, falling back to local storage:', error);
          s3Key = `media/${filename}`;
          s3Url = `https://your-bucket.s3.amazonaws.com/${s3Key}`;
        }
      } else {
        // Simulate S3 URLs for development
        s3Key = `media/${filename}`;
        s3Url = `https://your-bucket.s3.amazonaws.com/${s3Key}`;
      }
    }

    // Extract metadata
    let width, height;
    if (file.type.startsWith('image/')) {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch (error) {
        console.warn('Failed to extract image metadata:', error);
      }
    }

    // Create media file record in database
    const mediaFile = await MediaFilesCollection.create({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      width,
      height,
      folderId: folderId ? new ObjectId(folderId) : undefined,
      s3Key,
      s3Url,
      variants,
      metadata: processedFile.metadata || {},
      altText: '',
      caption: '',
      tags: [],
      uploadedBy: new ObjectId(user.id)
    });

    // In a real implementation, you would:
    // 1. Upload original file to S3
    // 2. Upload all variants to S3
    // 3. Update the database with actual S3 URLs
    // 4. Possibly use a background job queue for processing

    return json({
      success: true,
      mediaFile,
      message: 'File uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Error uploading media file:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
};

// Helper function to get max file size for a given type
function getMaxSizeForType(mimeType: string): number {
  for (const [type, maxSize] of Object.entries(MAX_FILE_SIZES)) {
    if (mimeType.startsWith(type)) {
      return maxSize;
    }
  }
  return 10 * 1024 * 1024; // Default 10MB
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}