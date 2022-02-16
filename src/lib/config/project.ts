import assert from "assert";
import { join } from "path";
import { GLOBAL_CONFIG_FILE, loadYaml, PROJECT_CONFIG_FILE } from "../../utils/config";
import { getProjectBaseDirectory } from "../../utils/file";

let cachedConfig: Promise<ProjectConfig | null>;

export async function getProjectConfig(): Promise<ProjectConfig> {
  const baseDir = getProjectBaseDirectory();
  assert(baseDir, `Couldn't find a necro config file.`);

  if (!cachedConfig) {
    cachedConfig = loadYaml<ProjectConfig>(
      join(baseDir, PROJECT_CONFIG_FILE),
      "#/definitions/ProjectConfig",
    );
  }

  const config = await cachedConfig;
  assert(config, "Global config does not exist.");

  return config;
}
