import AWS from "aws-sdk";
import { performance } from "perf_hooks";

AWS.config.credentials = new AWS.SharedIniFileCredentials();
AWS.config.region = "sa-east-1";

const cf = new AWS.CloudFront();

/**
 * @todo invalidate only deleted files
 */
export async function createDistributionInvalidation(
  distributionId: string,
  prefix: string,
) {
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
  const distribution = await cf
    .getDistribution({ Id: distributionId })
    .promise();

  return distribution.Distribution?.DomainName;
}
