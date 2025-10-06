import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./s3-client";
type UploadArgs = {
  key: string;
  contentType: string;
  body: Buffer;
  publicRead?: boolean; // default true for simplicity
};

export async function uploadToS3({ key, contentType, body }: UploadArgs) {
  const Bucket = process.env.NEXT_PUBLIC_AMPLIFY_BUCKET!;
  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `https://${Bucket}.s3.${process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION}.amazonaws.com/${key}`;
}

export async function deleteFromS3(key: string) {
  const Bucket = process.env.NEXT_PUBLIC_AMPLIFY_BUCKET!;
  await s3.send(
    new DeleteObjectCommand({
      Bucket,
      Key: key,
    })
  );
}
