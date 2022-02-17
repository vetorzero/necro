import AWS from "aws-sdk";
import { getProfile } from "../../utils/config";

export async function getAwsConfig() {
  const profile = await getProfile();

  const credentials = profile.credentials
    ? new AWS.Credentials({
        accessKeyId: profile.credentials.user_key,
        secretAccessKey: profile.credentials.user_secret,
      })
    : new AWS.SharedIniFileCredentials();

  return new AWS.Config({
    credentials,
  });
}

export async function getS3Client() {
  return new AWS.S3(await getAwsConfig());
}

export async function getCloudFrontClient() {
  return new AWS.CloudFront(await getAwsConfig());
}
