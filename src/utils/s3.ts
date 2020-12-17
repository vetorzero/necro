import AWS from "aws-sdk";
import { basename } from "path";

const s3Options: AWS.S3.ClientConfiguration = {};
const s3 = new AWS.S3(s3Options);
const baseRequest: AWS.S3.ListObjectsRequest = {
  Bucket: "demo.vzlab.com.br",
  Delimiter: "/",
};

/**
 * List all deployments for a given client and project
 */
export async function listDeployments(client: string, project: string): Promise<Deployment[]> {
  const deployments = await s3
    .listObjects({
      ...baseRequest,
      Prefix: `${client}/${project}/`,
    })
    .promise();

  const prefixes = (deployments.CommonPrefixes ?? [])
    // filter out empty results
    .filter((x) => x.Prefix?.length)
    // get the folder (deployment) name
    .map((x): Deployment => ({ prefix: x.Prefix! }));

  return prefixes;
}
