export function getKeyFromS3Url(url: string): string {
  const parts = url.split(".amazonaws.com/");
  return parts[1];
}
