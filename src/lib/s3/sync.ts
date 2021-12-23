import AWS from "aws-sdk";
import chalk from "chalk";
import fg from "fast-glob";
import { createReadStream } from "fs";
import _ from "lodash";
import { join } from "path";
import { performance } from "perf_hooks";
import { fileMd5 } from "../../utils/crypto";

type FileRow = {
  path: string;
  md5?: string;
  isDir?: boolean;
};

AWS.config.credentials = new AWS.SharedIniFileCredentials();
AWS.config.region = "sa-east-1";

const s3 = new AWS.S3();

export async function sync(
  sourceDir: string,
  targetDir: string,
  bucket: string,
  meta: Record<string, string> = {},
) {
  const targetDirWithSlash = targetDir.endsWith("/")
    ? targetDir
    : targetDir + "/";

  const remoteFiles = _.sortBy(
    await listRemoteFiles(bucket, targetDirWithSlash),
    "path",
  );
  const localFiles = _.sortBy(await listLocalFiles(sourceDir), "path");

  const filesToDelete = _.differenceWith(remoteFiles, localFiles, _.isEqual);
  const filesToUpload = _.differenceWith(localFiles, remoteFiles, _.isEqual);

  await deleteFiles(bucket, targetDirWithSlash, filesToDelete);
  await uploadFiles(bucket, sourceDir, targetDirWithSlash, filesToUpload);

  // @todo adjust meta
  // @todo sync dirs (dont ignore on fetch; add on local glob)
}

async function listRemoteFiles(
  bucket: string,
  targetDir: string,
): Promise<FileRow[]> {
  const files: FileRow[] = [];
  let response: AWS.S3.ListObjectsV2Output | null = null;
  do {
    response = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: targetDir,
        MaxKeys: 10,
        ContinuationToken:
          response && response.NextContinuationToken
            ? response.NextContinuationToken
            : undefined,
      })
      .promise();

    response.Contents?.forEach((f) => {
      let isDir = false;

      // if it's a dir. bail out (for now).
      if (!f.Key || f.Key.endsWith("/")) {
        isDir = true;
        return;
      }

      const path = f.Key?.slice(targetDir.length);
      files.push({ path, md5: f.ETag?.slice(1, -1), isDir });
    });
  } while (response.IsTruncated);

  return files;
}

async function listLocalFiles(sourceDir: string): Promise<FileRow[]> {
  const files: FileRow[] = [];

  const ls = await fg("**/*", { dot: true, cwd: sourceDir });
  await Promise.all(
    ls.map(async (path) => {
      files.push({
        path,
        md5: await fileMd5(join(sourceDir, path)),
        isDir: false,
      });
    }),
  );

  return files;
}

async function deleteFiles(
  bucket: string,
  targetDir: string,
  files: FileRow[],
): Promise<void> {
  for (const f of files) {
    const startTime = performance.now();
    process.stdout.write(chalk`{red ✕ ${f.path}...} `);

    await s3
      .deleteObject({
        Bucket: bucket,
        Key: join(targetDir, f.path),
      })
      .promise();

    const duration = performance.now() - startTime;
    process.stdout.write(chalk`{red Done! (${duration.toFixed(0)}ms)}\n`);
  }
}

async function uploadFiles(
  bucket: string,
  sourceDir: string,
  targetDir: string,
  files: FileRow[],
): Promise<void> {
  for (const f of files) {
    const startTime = performance.now();
    process.stdout.write(chalk`{green ↑ ${f.path}...} `);

    const stream = createReadStream(join(sourceDir, f.path));
    await s3
      .upload({
        Bucket: bucket,
        Key: join(targetDir, f.path),
        Body: stream,
      })
      .promise();

    const duration = performance.now() - startTime;
    process.stdout.write(chalk`{green Done! (${duration.toFixed(0)}ms)}\n`);
  }
}
