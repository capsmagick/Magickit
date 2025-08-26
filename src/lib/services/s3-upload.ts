import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectId } from 'mongodb';
import type { MediaFile, MediaVariant } from '$lib/db/models';

// S3 Configuration (would come from environment variables)
const S3_CONFIG = {
  region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || process.env.S3_BUCKET_NAME || 'your-media-bucket',
  accessKeyId: process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  endpoint: process.env.S3_ENDPOINT || undefined,
  cdnDomain: process.env.CDN_DOMAIN || process.env.S3_ENDPOINT || `https://${process.env.S3_BUCKET || process.env.S3_BUCKET_NAME}.s3.amazonaws.com`
};

/**
 * S3 Media Upload Service
 * Handles uploading, processing, and managing media files in S3
 */
export class S3MediaService {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnDomain: string;

  constructor() {
    const clientConfig: any = {
      region: S3_CONFIG.region,
      credentials: {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey
      }
    };

    // Add custom endpoint for Wasabi or other S3-compatible services
    if (S3_CONFIG.endpoint) {
      clientConfig.endpoint = S3_CONFIG.endpoint;
      clientConfig.forcePathStyle = true; // Required for some S3-compatible services
    }

    this.s3Client = new S3Client(clientConfig);
    this.bucketName = S3_CONFIG.bucket;
    this.cdnDomain = S3_CONFIG.cdnDomain;
  }

  /**
   * Upload a file buffer to S3
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata: Record<string, string> = {}
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year
        Metadata: metadata
      });

      await this.s3Client.send(command);
      return `${this.cdnDomain}/${key}`;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload processed media with all variants
   */
  async uploadProcessedMedia(
    originalFile: {
      buffer: Buffer;
      filename: string;
      mimeType: string;
      metadata?: Record<string, any>;
    },
    variants: Array<{
      name: string;
      buffer: Buffer;
      format: string;
      width: number;
      height: number;
      quality: number;
    }> = []
  ): Promise<{
    s3Key: string;
    s3Url: string;
    variants: MediaVariant[];
  }> {
    try {
      const baseKey = `media/${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const extension = originalFile.filename.split('.').pop() || 'bin';
      
      // Upload original file
      const originalKey = `${baseKey}/original.${extension}`;
      const originalUrl = await this.uploadFile(
        originalKey,
        originalFile.buffer,
        originalFile.mimeType,
        {
          'original-filename': originalFile.filename,
          'upload-timestamp': new Date().toISOString()
        }
      );

      // Upload variants
      const uploadedVariants: MediaVariant[] = [];
      
      for (const variant of variants) {
        const variantKey = `${baseKey}/${variant.name}.${variant.format}`;
        const variantUrl = await this.uploadFile(
          variantKey,
          variant.buffer,
          `image/${variant.format}`,
          {
            'variant-name': variant.name,
            'width': variant.width.toString(),
            'height': variant.height.toString(),
            'quality': variant.quality.toString()
          }
        );

        uploadedVariants.push({
          _id: new ObjectId(),
          name: variant.name,
          width: variant.width,
          height: variant.height,
          format: variant.format,
          quality: variant.quality,
          s3Key: variantKey,
          s3Url: variantUrl,
          size: variant.buffer.length
        });
      }

      return {
        s3Key: originalKey,
        s3Url: originalUrl,
        variants: uploadedVariants
      };
    } catch (error) {
      console.error('Error uploading processed media:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting from S3:', error);
      return false;
    }
  }

  /**
   * Delete media file and all its variants
   */
  async deleteMediaFile(mediaFile: MediaFile): Promise<boolean> {
    try {
      // Delete original file
      await this.deleteFile(mediaFile.s3Key);

      // Delete all variants
      for (const variant of mediaFile.variants) {
        await this.deleteFile(variant.s3Key);
      }

      return true;
    } catch (error) {
      console.error('Error deleting media file from S3:', error);
      return false;
    }
  }

  /**
   * Generate a presigned URL for direct upload (for large files)
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate a presigned URL for download (for private files)
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<Record<string, any> | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  /**
   * Check if S3 is properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list objects in the bucket (just to test connection)
      const testKey = `test/${Date.now()}.txt`;
      const testBuffer = Buffer.from('test');
      
      await this.uploadFile(testKey, testBuffer, 'text/plain');
      await this.deleteFile(testKey);
      
      return true;
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    lastModified: Date | null;
  }> {
    // This would require additional S3 API calls to list all objects
    // For now, return placeholder data
    return {
      totalFiles: 0,
      totalSize: 0,
      lastModified: null
    };
  }
}

// Export singleton instance
export const s3MediaService = new S3MediaService();

// Helper function to check if S3 is configured
export function isS3Configured(): boolean {
  const configured = !!(
    S3_CONFIG.accessKeyId &&
    S3_CONFIG.secretAccessKey &&
    S3_CONFIG.bucket
  );
  
  console.log('S3 Configuration check:', {
    hasAccessKey: !!S3_CONFIG.accessKeyId,
    hasSecretKey: !!S3_CONFIG.secretAccessKey,
    hasBucket: !!S3_CONFIG.bucket,
    hasEndpoint: !!S3_CONFIG.endpoint,
    configured
  });
  
  return configured;
}

// Helper function to get S3 configuration status
export function getS3ConfigStatus(): {
  configured: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  if (!S3_CONFIG.accessKeyId) missing.push('S3_ACCESS_KEY or AWS_ACCESS_KEY_ID');
  if (!S3_CONFIG.secretAccessKey) missing.push('S3_SECRET_KEY or AWS_SECRET_ACCESS_KEY');
  if (!S3_CONFIG.bucket) missing.push('S3_BUCKET or S3_BUCKET_NAME');
  if (!S3_CONFIG.region) missing.push('S3_REGION or AWS_REGION');

  return {
    configured: missing.length === 0,
    missing
  };
}