import AWS from "aws-sdk";
import { isNull, prop, reject, sortBy } from "lodash/fp";
import { basename, join } from "path";
import { assertFileExists, assertIsDir, assertNotEmpty } from "./file";
import { error } from "./log";

const BUCKET = "demo.vzlab.com.br";

const s3Options: AWS.S3.ClientConfiguration = {};
const s3 = new AWS.S3(s3Options);

export type Deployment = {
  prefix: string;
  name: string;
  lastModified: Date;
};

async function getDeploymentInformation(result: AWS.S3.CommonPrefix): Promise<Deployment | null> {
  if (!result.Prefix) return null;

  const prefix = result.Prefix;

  return {
    prefix,
    name: basename(prefix),
    lastModified: await getDeploymentLastModified(prefix),
  };
}

async function getDeploymentLastModified(prefix: string): Promise<Date> {
  const result = await s3
    .getObject({
      Bucket: BUCKET,
      Key: `${prefix}index.html`,
    })
    .promise();

  return result.LastModified!;
}
/**
 * List all deployments for a given client and project
 * @todo sort by lastModified
 */
export async function listDeployments(client: string, project: string): Promise<Deployment[]> {
  const result = await s3
    .listObjects({
      Bucket: BUCKET,
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

  const deployments = await Promise.all(paths.map(getDeploymentInformation));

  return sort(filter(deployments));
}

// export async function upload(client: string, project: string, sourceFolder: string) {
//   const path = join(process.cwd(), sourceFolder);
// }
