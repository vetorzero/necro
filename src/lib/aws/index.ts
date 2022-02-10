import AWS from "aws-sdk";
import { getConfig } from "../../utils/config";

/**
 * @todo region?
 */
const configPromise = getConfig().then(config => {
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

export async function getAwsConfig() {
  return configPromise;
}
