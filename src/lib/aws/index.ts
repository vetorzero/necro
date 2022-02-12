import AWS from "aws-sdk";
import { getConfig } from "../../utils/config";

export async function getAwsConfig() {
  if (!configPromise) {
    configPromise = getConfig().then(config => {
      const credentials = config.profile.credentials
        ? new AWS.Credentials({
            accessKeyId: config.profile.credentials.user_key,
            secretAccessKey: config.profile.credentials.user_secret,
          })
        : new AWS.SharedIniFileCredentials();

      return new AWS.Config({
        credentials,
      });
    });
  }
  return configPromise;
}
let configPromise: Promise<AWS.Config>;

export async function getS3Client() {
  return new AWS.S3(await getAwsConfig());
}

export async function getCloudFrontClient() {
  return new AWS.CloudFront(await getAwsConfig());
}
