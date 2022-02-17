import assert from "assert";
import chalk from "chalk";
import { program } from "commander";
import { info } from "../../utils/log";
import { getGlobalConfig } from "./global";
import { getProjectConfig } from "./project";

type MergedConfig = ProjectConfig & {
  profile: GlobalConfig.Profile;
};

export async function getConfig(): Promise<MergedConfig> {
  const globalConfig: GlobalConfig = await getGlobalConfig();
  const projectConfig = await getProjectConfig();

  const optsProfile = program.opts()?.profile;
  const projectProfile = projectConfig?.use_profile;
  const globalProfile = globalConfig?.default_profile;
  const profileName = optsProfile ?? projectProfile ?? globalProfile;

  const profile = globalConfig.profiles.find(p => p.name === profileName);

  if (profileName) {
    assert(profile, `Profile "${profileName}" doesn't exist.`);
  }

  if (optsProfile && profile) {
    info(`👷 Using profile ${chalk.bold(profileName)} from CLI.`);
  } else if (projectConfig.use_profile && profile) {
    info(`👷 Using profile from project.`);
  } else if (profile !== undefined) {
    info(`👷 Using profile ${chalk.bold(profileName)} from global config file.`);
  } else {
    throw new Error(
      `Can't find a profile for publishing.` +
        `\nRun "necro global config" to create a global profile` +
        `\nor add a "profile" property to the project configuration.`,
    );
  }

  return { ...projectConfig, profile } as MergedConfig;
}
