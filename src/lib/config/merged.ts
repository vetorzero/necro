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
  const globalConfig = await getGlobalConfig().catch(_ => null);
  const projectConfig = await getProjectConfig().catch(_ => null);

  assert(globalConfig, "Global config does not exist.");
  assert(projectConfig, "Project config does not exist.");

  const optsProfileName = program.opts()?.profile;
  const projectProfileName = projectConfig?.use_profile;
  const globalProfileName = globalConfig?.default_profile;

  const profileName = optsProfileName ?? projectProfileName ?? globalProfileName;

  const profile = globalConfig?.profiles.find(p => p.name === profileName);

  if (profileName) {
    assert(profile, `Profile "${profileName}" doesn't exist.`);
  }

  if (optsProfileName && profile) {
    info(`👷 Using profile ${chalk.bold(profileName)} from CLI.`);
  } else if (projectProfileName && profile) {
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

  return { ...projectConfig, profile };
}
