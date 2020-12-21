import AWS from "aws-sdk";
import { isNull, prop, reject, sortBy } from "lodash/fp";
import { basename, relative } from "path";
import { assertIsDir, listDir, ListDirOptionsMode } from "./file";
import child_process from "child_process";
import { on } from "commander";
import { Readable } from "stream";
import { log } from "./log";

const BUCKET = "demo.vzlab.com.br";

const s3Options: AWS.S3.ClientConfiguration = {};
const s3 = new AWS.S3(s3Options);
// const s3api = new AWS.API

export type Deployment = {
  prefix: string;
  name: string;
  lastModified: Date;
};

async function getDeploymentInformation(
  result: AWS.S3.CommonPrefix,
): Promise<Deployment | null> {
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
export async function listDeployments(
  client: string,
  project: string,
): Promise<Deployment[]> {
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
    throw new Error(
      `Could't find deployments for client ${client}, project ${project}`,
    );
  }

  const filter = reject<Deployment>(isNull);
  const sort = sortBy<Deployment>(prop("lastModified"));

  const deployments = await Promise.all(paths.map(getDeploymentInformation));

  return sort(filter(deployments));
}

export async function syncFolder(
  client: string,
  project: string,
  distFolder: string,
) {
  assertIsDir(distFolder);

  log(`Syncing folders:
./build --> s3://${BUCKET}/test/path/build
`);
  await execAwsSync();
  log(`Folders synced successfully!\n`);
}

async function execAwsSync(): Promise<void> {
  return new Promise((resolve, reject) => {
    const username = encodeURIComponent("cle:-ito");
    const password = encodeURIComponent("ra%st@");
    /** @todo decode in the lambda */
    const meta = {
      auth: `${username}:${password}`,
    };

    const cp = child_process.spawn(
      "aws",
      [
        "s3",
        "sync",
        /** @todo set cwd as the necro root */
        "build",
        /** @todo create path */
        `s3://${BUCKET}/test/path/build`,
        "--metadata",
        JSON.stringify(meta),
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
}
