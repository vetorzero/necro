import AWS from "aws-sdk";
import { isNull, prop, reject, sortBy } from "lodash/fp";
import { basename } from "path";

const s3Options: AWS.S3.ClientConfiguration = {};
const s3 = new AWS.S3(s3Options);

export type Deployment = {
  prefix: string;
  name: string;
  lastModified: Date;
};

async function getDeploymentInformation(
  bucket: string,
  result: AWS.S3.CommonPrefix,
): Promise<Deployment | null> {
  if (!result.Prefix) return null;

  const prefix = result.Prefix;

  return {
    prefix,
    name: basename(prefix),
    lastModified: await getDeploymentLastModified(bucket, prefix),
  };
}

async function getDeploymentLastModified(
  bucket: string,
  prefix: string,
): Promise<Date> {
  const result = await s3
    .getObject({
      Bucket: bucket,
      Key: `${prefix}index.html`,
    })
    .promise();

  return result.LastModified!;
}

/**
 * List all deployments for a given client and project
 * @todo sort by lastModified
 */
export async function listDeployments(
  bucket: string,
  client: string,
  project: string,
): Promise<Deployment[]> {
  const result = await s3
    .listObjects({
      Bucket: bucket,
      Delimiter: "/",
      MaxKeys: 1_000_000,
      Prefix: `${client}/${project}/`,
    })
    .promise();

  const paths = result.CommonPrefixes;
  if (!paths) {
    throw new Error(
      `Could't find deployments for client ${client}, project ${project}`,
    );
  }

  const filter = reject<Deployment>(isNull);
  const sort = sortBy<Deployment>(prop("lastModified"));

  const deployments = await Promise.all(
    paths.map((path) => getDeploymentInformation(bucket, path)),
  );

  return sort(filter(deployments));
}
