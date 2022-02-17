import assert from "assert";
import _ from "lodash";
import { getS3Client } from ".";
import { dir } from "../../utils/log";

export async function listClients(bucket: string): Promise<string[]> {
  const s3 = await getS3Client();
  const res = await s3
    .listObjectsV2({
      Bucket: bucket,
      Delimiter: "/",
    })
    .promise();

  return (
    res.CommonPrefixes?.map(p => p.Prefix)
      .filter(isString)
      .map(x => x.slice(-1)) ?? []
  );
}

/**
 * function required for type narrowing
 * @see https://github.com/microsoft/TypeScript/issues/20812
 */
function isString(x: any): x is string {
  return typeof x === "string";
}
