import assert from "assert";
import chalk from "chalk";
import { program } from "commander";
import { GLOBAL_CONFIG_FILE } from "../../utils/config";
import { info } from "../../utils/log";
import { getGlobalConfig } from "./global";
import { getProjectConfig } from "./project";

export async function getConfig(): Promise<MergedConfig> {
  try {
    const globalConfig = await getGlobalConfig();
    const projectConfig = await getProjectConfig();

    const profile = await getProfile(globalConfig, projectConfig);

    return { ...projectConfig, profile };
  } catch (err) {
    throw err;
  }
}

export async function getProfile(
  globalConfig: GlobalConfig,
  projectConfig: ProjectConfig,
): Promise<GlobalConfig.Profile> {
  const profileName =
    program.opts().profile ?? projectConfig?.use_profile ?? globalConfig?.default_profile;
  assert(profileName, `default_profile not configured in ${GLOBAL_CONFIG_FILE}`);

  const profile = globalConfig?.profiles.find(p => profileName === p.name);
  assert(profile, `profile ${profileName} does not exist.`);

  return profile;
}
