import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AMPLIFY_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY!,
  },
});

export default s3;
