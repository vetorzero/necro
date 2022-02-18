import { getS3Client } from ".";
import { isString } from "../../utils/guards";

type Client = {
  name: string;
  projects: Project[];
};
type Project = {
  name: string;
};

async function listClients(bucket: string): Promise<string[]> {
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
      .map(x => x.slice(0, -1)) ?? [] // remove last slash
  );
}

async function listProjectsByClient(bucket: string, client: string): Promise<string[]> {
  const s3 = await getS3Client();

  const prefix = `${client}/`;

  const res = await s3
    .listObjectsV2({
      Bucket: bucket,
      Delimiter: "/",
      Prefix: prefix,
    })
    .promise();

  return (
    res.CommonPrefixes?.map(p => p.Prefix)
      .filter(isString)
      .map(x => x.slice(prefix.length, -1)) ?? [] // remove prefix + last slash
  );
}

export async function listProjects(bucket: string): Promise<Client[]> {
  const clients = await listClients(bucket);
  return Promise.all(
    clients.map(async c => ({
      name: c,
      projects: (await listProjectsByClient(bucket, c)).map(p => ({ name: p })),
    })),
  );
}
