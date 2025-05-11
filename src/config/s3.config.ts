// src/config/s3.config.ts
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

// S3 설정
export const s3Config = {
  region: process.env.S3_REGION || 'ap-northeast-2',
  bucketName: process.env.S3_BUCKET || 'kidsplan-uploads',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  endpoint: process.env.S3_ENDPOINT, // 필요한 경우 사용 (예: 다른 S3 호환 서비스)
};

// S3 클라이언트 생성
export const s3Client = new S3Client({
  region: s3Config.region,
  credentials: {
    accessKeyId: s3Config.accessKeyId!,
    secretAccessKey: s3Config.secretAccessKey!,
  },
  endpoint: s3Config.endpoint,
});

/**
 * 이미지를 S3에 업로드하는 함수
 * @param buffer 업로드할 이미지 버퍼
 * @param mimetype 이미지의 MIME 타입
 * @param folder 업로드할 폴더 경로 (기본값: 'promise-verifications')
 * @returns 업로드된 이미지의 URL
 */
export async function uploadToS3(
  buffer: Buffer,
  mimetype: string,
  folder: string = 'promise-verifications'
): Promise<string> {
  try {
    const fileExtension = mimetype.split('/')[1];
    const key = `${folder}/${uuidv4()}.${fileExtension}`;
    
    // PutObjectCommand 사용
    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read' as ObjectCannedACL,
    });

    await s3Client.send(command);

    // S3 버킷의 공개 URL 생성
    return `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 업로드 오류:', error);
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

/**
 * URL에서 키 추출
 * @param url S3 URL
 * @returns S3 키
 */
export function extractKeyFromUrl(url: string): string | null {
  const pattern = new RegExp(`https?://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/(.+)`);
  const match = url.match(pattern);
  return match ? match[1] : null;
}