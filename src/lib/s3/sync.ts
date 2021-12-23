import AWS from "aws-sdk";
import log from "../../utils/log";
import fg from "fast-glob";
import { join } from "path";
import { fileMd5 } from "../../utils/crypto";
import _ from "lodash";
import { createReadStream } from "fs";
import chalk from "chalk";
import { performance } from "perf_hooks";

AWS.config.credentials = new AWS.SharedIniFileCredentials();
AWS.config.region = "sa-east-1";

type FileRow = {
  path: string;
  md5?: string;
  isDir?: boolean;
};

export async function sync(
  sourceDir: string,
  targetDir: string,
  bucket: string,
  meta: { [k: string]: any } = {},
) {
  console.log({ sourceDir, targetDir, bucket, meta });

  const s3 = new AWS.S3();

  // list remote files
  log.info(`Listing remote files...`);
  const remoteFiles: FileRow[] = [];
  const targetDirWithSlash = targetDir.endsWith("/")
    ? targetDir
    : targetDir + "/";

  console.log(bucket, targetDir);
  let response: AWS.S3.ListObjectsV2Output | null = null;
  do {
    log.debug("Making request...");
    response = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: targetDirWithSlash,
        MaxKeys: 10,
        ContinuationToken:
          response && response.NextContinuationToken
            ? response.NextContinuationToken
            : undefined,
      })
      .promise();

    response.Contents?.forEach((f) => {
      let isDir = false;
      // if it's a dir. bail out for now.
      if (!f.Key || f.Key.endsWith("/")) {
        isDir = true;
        return;
      }

      const path = f.Key?.slice(targetDirWithSlash.length);
      remoteFiles.push({ path, md5: f.ETag?.slice(1, -1), isDir });
    });
  } while (response.IsTruncated);

  // list local files
  const localFiles: FileRow[] = [];
  const ls = await fg("**/*", { dot: true, cwd: sourceDir });
  await Promise.all(
    ls.map(async (path) => {
      localFiles.push({
        path,
        md5: await fileMd5(join(sourceDir, path)),
        isDir: false,
      });
    }),
  );

  console.log("remote", remoteFiles);
  console.log("local", localFiles);

  // compare files
  // const keepFiles = _.intersectionWith(remoteFiles, localFiles, _.isEqual);
  // console.log("keep", keepFiles);

  console.time();
  const deleteFiles = _.differenceWith(remoteFiles, localFiles, _.isEqual);
  // console.log("delete", deleteFiles);

  const uploadFiles = _.differenceWith(localFiles, remoteFiles, _.isEqual);
  // console.log("upload", uploadFiles);
  console.timeEnd();

  // delete files
  for (const f of deleteFiles) {
    const startTime = performance.now();
    process.stdout.write(chalk`{red ✕ ${f.path}...} `);

    await s3
      .deleteObject({
        Bucket: bucket,
        Key: targetDirWithSlash + f.path,
      })
      .promise();

    const duration = performance.now() - startTime;
    process.stdout.write(chalk`{red Done! (${duration.toFixed(0)}ms)}\n`);
  }

  // upload new files
  for (const f of uploadFiles) {
    const startTime = performance.now();
    process.stdout.write(chalk`{green ↑ ${f.path}...} `);

    const stream = createReadStream(join(sourceDir, f.path));
    await s3
      .upload({
        Bucket: bucket,
        Key: targetDirWithSlash + f.path,
        Body: stream,
      })
      .promise();

    const duration = performance.now() - startTime;
    process.stdout.write(chalk`{green Done! (${duration.toFixed(0)}ms)}\n`);
  }

  // @todo adjust meta
  // @todo sync dirs (dont ignore on fetch; add on local glob)
}
