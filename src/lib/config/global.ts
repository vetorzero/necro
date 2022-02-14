import assert from "assert";
import { GLOBAL_CONFIG_FILE, loadYaml } from "../../utils/config";

let cachedConfig: Promise<GlobalConfig | null>;

export async function getGlobalConfig(): Promise<GlobalConfig> {
  if (!cachedConfig) {
    cachedConfig = loadYaml<GlobalConfig>(GLOBAL_CONFIG_FILE, "#/definitions/GlobalConfig");
  }
  const config = await cachedConfig;
  assert(config, "Global config does not exist.");

  return config;
}
