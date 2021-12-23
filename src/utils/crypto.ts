import { createHash } from "crypto";
import { createReadStream } from "fs";

export async function fileMd5(path: string): Promise<string> {
  const md5 = createHash("md5");
  const rs = createReadStream(path);

  return new Promise((resolve, reject) => {
    rs.pipe(md5);
    rs.on("end", () => {
      resolve(md5.digest("hex"));
    });
  });
}
