import AWS from "aws-sdk";
import log from "../../utils/log";

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

  // List remote files
  log.info(`Listing remote files...`);
  const remoteFiles = new Set<AWS.S3.Object>();

  let response: AWS.S3.ListObjectsV2Output | null = null;

  do {
    console.log("Making request...");

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

    response.Contents?.forEach(remoteFiles.add, remoteFiles);
  } while (response.IsTruncated);
  console.log("Files:");
  console.log(
    [...remoteFiles].map((f) => `  - ${f.Key} (${f.ETag})`).join("\n"),
  );

  // @todo list local files
  // @todo compare md5
  // @todo upload files
  // @todo delete files
  // @todo adjust meta
}
