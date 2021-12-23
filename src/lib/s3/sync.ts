import AWS from "aws-sdk";
import log from "../../utils/log";
import fg from "fast-glob";
import { join } from "path";
import { fileMd5 } from "../../utils/crypto";

AWS.config.credentials = new AWS.SharedIniFileCredentials();
AWS.config.region = "sa-east-1";

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
  const remoteFiles = new Set();
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
      remoteFiles.add({ path, md5: f.ETag?.slice(1, -1), isDir });
    });
  } while (response.IsTruncated);

  // list local files
  const localFiles = new Set();
  const ls = await fg("**/*", { dot: true, cwd: sourceDir });
  await Promise.all(
    ls.map(async (path) => {
      localFiles.add({
        path,
        md5: await fileMd5(join(sourceDir, path)),
      });
    }),
  );

  console.log("remote", remoteFiles);
  console.log("local", localFiles);

  // @todo compare md5
  // @todo upload files
  // @todo delete files
  // @todo adjust meta
  // @todo sync dirs (dont ignore on fetch; add on local glob)
}
