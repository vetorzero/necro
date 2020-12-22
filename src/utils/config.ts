import { getProjectBaseDirectory } from "./file";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * @todo add distDir to config file
 */

export const CONFIG_FILE = "necro.json";

type ConfigCommon = {
  client: string;
  project: string;
  distDir: string;
};
type ConfigPrivate = ConfigCommon & {
  public: false;
  username: string;
  password: string;
};
type ConfigPublic = ConfigCommon & {
  public: true;
};
type Config = ConfigPrivate | ConfigPublic;

export function getConfig(): Config {
  const baseDir = getProjectBaseDirectory();
  if (baseDir === null) {
    throw new Error(`Couldn't find a necro config file.`);
  }

  const file = readFileSync(join(baseDir, CONFIG_FILE));
  return JSON.parse(file.toString()) as Config;
}
