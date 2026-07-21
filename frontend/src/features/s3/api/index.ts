// S3 feature API — bucket listing, object browsing, and upload simulation.

import type { S3Object } from '../../../types';
import { request } from '../../../api/client';
import { mockStore } from '../../../api/mock-store';

export async function getS3Buckets(): Promise<string[]> {
  try {
    return await request<string[]>('/aws/s3/buckets');
  } catch {
    return [...mockStore.s3Buckets];
  }
}

export async function getS3Objects(bucketName: string): Promise<S3Object[]> {
  try {
    return await request<S3Object[]>(`/aws/s3/buckets/${bucketName}/objects`);
  } catch {
    return [...(mockStore.s3Objects[bucketName] || [])];
  }
}

export async function uploadS3ObjectSimulate(
  bucketName: string,
  fileName: string,
  fileSize: number
): Promise<S3Object> {
  const newObj: S3Object = {
    key: fileName,
    size: fileSize,
    lastModified: new Date().toISOString()
  };

  if (!mockStore.s3Objects[bucketName]) {
    mockStore.s3Objects[bucketName] = [];
  }

  // Prevent duplicate keys
  mockStore.s3Objects[bucketName] = mockStore.s3Objects[bucketName].filter(o => o.key !== fileName);
  mockStore.s3Objects[bucketName].push(newObj);

  return newObj;
}
