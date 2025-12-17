import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  await s3Client.send(command);
}

export function getS3Url(key: string): string {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export function generateS3Key(userId: string, filename: string): string {
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `uploads/${userId}/${timestamp}-${safeFilename}`;
}
