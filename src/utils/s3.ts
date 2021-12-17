import AWS from "aws-sdk";
import child_process from "child_process";
import { isNull, prop, reject, sortBy } from "lodash/fp";
import { basename } from "path";
import { assertIsDir } from "./file";
import { log } from "./log";

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

export async function syncDir(
  sourceDir: string,
  targetDir: string,
  bucket: string,
  meta: { [k: string]: any } = {},
) {
  assertIsDir(sourceDir);

  log(`BUcket: ${bucket}`);
  log(`Syncing folders:\n${sourceDir} --> s3://${bucket}/${targetDir}`);

  await new Promise<void>((resolve, reject) => {
    const cp = child_process.spawn(
      "aws",
      [
        "s3",
        "sync",
        sourceDir,
        `s3://${bucket}/${targetDir}`,
        "--metadata",
        JSON.stringify(meta),
        "--metadata-directive",
        "REPLACE",
      ],
      {},
    );

    // redirect streams
    cp.stderr.pipe(process.stderr);
    cp.stdout.pipe(process.stdout);

    // callbacks
    cp.on("exit", (...x) => {
      resolve();
    });
    cp.on("error", (...x) => {
      reject(new Error("Couldn't sync folders"));
    });
  });

  log(`Folders synced successfully!\n`);
}
