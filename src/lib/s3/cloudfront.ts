import AWS from "aws-sdk";
import { performance } from "perf_hooks";
import { getConfig } from "../../utils/config";

AWS.config.credentials = new AWS.SharedIniFileCredentials();
AWS.config.region = "sa-east-1";

const cfPromise = getConfig().then(
  config =>
    new AWS.CloudFront(
      config.profile.credentials
        ? {
            credentials: {
              accessKeyId: config.profile.credentials.user_key,
              secretAccessKey: config.profile.credentials.user_secret,
            },
          }
        : { credentials: new AWS.SharedIniFileCredentials() },
    ),
);

/**
 * @todo invalidate only deleted files
 */
export async function createDistributionInvalidation(distributionId: string, prefix: string) {
  const cf = await cfPromise;

  const startTime = performance.now();
  process.stdout.write(`☁️  Invalidating Cloudfront cache... `);

  const res = await cf
    .createInvalidation({
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: [`/${prefix}/*`],
        },
        CallerReference: `Created by necro @ ${new Date().toISOString()}`,
      },
    })
    .promise();

  if (!res.Invalidation?.Id) {
    throw new Error("Unable to create CloudFront invalidation.");
  }

  await cf
    .waitFor("invalidationCompleted", {
      DistributionId: distributionId,
      Id: res.Invalidation.Id,
    })
    .promise();

  const duration = performance.now() - startTime;
  process.stdout.write(`Done! (${duration.toFixed(0)}ms)\n`);
}

export async function getDomainName(distributionId: string) {
  const cf = await cfPromise;
  const res = await cf.getDistribution({ Id: distributionId }).promise();

  return res.Distribution?.DistributionConfig.Aliases?.Items?.[0] || res.Distribution?.DomainName;
}
