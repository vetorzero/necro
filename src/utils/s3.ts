import AWS from "aws-sdk";
import { assert, debug, info } from "console";
import { isNull, prop, reject, sortBy } from "lodash/fp";
import { basename } from "path";
import { getS3Client } from "../lib/aws";

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

async function getDeploymentLastModified(bucket: string, prefix: string): Promise<Date> {
  const s3 = await getS3Client();
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
  const s3 = await getS3Client();
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
    throw new Error(`Could't find deployments for client ${client}, project ${project}`);
  }

  const filter = reject<Deployment>(isNull);
  const sort = sortBy<Deployment>(prop("lastModified"));

  const deployments = await Promise.all(paths.map(path => getDeploymentInformation(bucket, path)));

  return sort(filter(deployments));
}

export async function emptyS3Directory(bucket: string, dir: string) {
  const s3 = await getS3Client();

  const listParams: AWS.S3.ListObjectsV2Request = {
    Bucket: bucket,
    Prefix: dir,
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();
  assert(listedObjects.Contents, "No objects found");

  if (listedObjects.Contents == undefined) return;

  const objectsToDelete: AWS.S3.ObjectIdentifierList = listedObjects.Contents.map(obj => ({
    Key: obj.Key!,
  }));

  const deleteParams: AWS.S3.DeleteObjectsRequest = {
    Bucket: bucket,
    Delete: { Objects: objectsToDelete },
  };

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) {
    await emptyS3Directory(bucket, dir);
  }

  info(`❌ deleted ${listedObjects.Contents?.length} objects from ${dir}`);
  debug(`🗑️ ${objectsToDelete.map(obj => obj.Key).join("\n🗑️ ")}`);
}
