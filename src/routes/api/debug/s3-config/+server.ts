import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isS3Configured, getS3ConfigStatus } from '$lib/services/s3-upload';

export const GET: RequestHandler = async () => {
  const configStatus = getS3ConfigStatus();
  
  return json({
    isConfigured: isS3Configured(),
    configStatus,
    envVars: {
      S3_REGION: !!process.env.S3_REGION,
      S3_BUCKET: !!process.env.S3_BUCKET,
      S3_ENDPOINT: !!process.env.S3_ENDPOINT,
      S3_ACCESS_KEY: !!process.env.S3_ACCESS_KEY,
      S3_SECRET_KEY: !!process.env.S3_SECRET_KEY,
      AWS_REGION: !!process.env.AWS_REGION,
      S3_BUCKET_NAME: !!process.env.S3_BUCKET_NAME,
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY
    }
  });
};