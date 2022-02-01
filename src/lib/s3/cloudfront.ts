import AWS from "aws-sdk";

AWS.config.credentials = new AWS.SharedIniFileCredentials();
AWS.config.region = "sa-east-1";

const cf = new AWS.CloudFront();

export async function createCloudfrontDistributionInvalidation(prefix: string) {
  console.log(`Invalidating cache...`); // @fixme
  await cf
    .createInvalidation({
      DistributionId: "E22L6LO8OY0R0U",
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: [`/${prefix}`],
        },
        CallerReference: `Created by necro @ ${new Date().toISOString()}`,
      },
    })
    .promise();
  // @todo wait for invalidation to happen
}
