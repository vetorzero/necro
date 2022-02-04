import chalk from "chalk";
import { Command } from "commander";
import { readFile, writeFile } from "fs/promises";
import inquirer from "inquirer";
import { kebabCase } from "lodash/fp";
import YAML from "yaml";
import { GLOBAL_CONFIG_FILE } from "../../utils/config";
import { debug, info } from "../../utils/log";

enum CredentialChoices {
  SHARED,
  KEY_PAIR,
}

/**
 * @todo add description
 */
export default function config() {
  const cmd = new Command("config");
  cmd.action(action);

  return cmd;
}

async function action() {
  let profileName = "";
  let currentProfile: any = {};

  const currentConfigContent = await readFile(
    GLOBAL_CONFIG_FILE,
    "utf-8",
  ).catch((e) => {
    debug(`Global config file not found or not readable`);
    return "";
  });

  const currentConfig = YAML.parse(currentConfigContent) || {};

  const profiles = Object.keys(currentConfig?.profiles);

  if (profiles.length) {
    profileName = (
      await inquirer.prompt({
        name: "profileName",
        message: "Which profile do you want to config?",
        type: "list",
        choices: [
          { value: null, name: "Create a new profile" },
          ...profiles.map((x) => ({ name: `Edit profile "${x}"`, value: x })),
        ],
      })
    ).profileName;
  }

  if (profileName) {
    currentProfile = currentConfig.profiles[profileName] ?? {};
  } else {
    profileName = (
      await inquirer.prompt({
        name: "profileName",
        message: "What's the name of the profile?",
        filter: kebabCase,
        validate: (x: string) =>
          x.trim().length < 1 ? "The profile name can't be empty" : true,
      })
    ).profileName;
  }

  debug(chalk.green(`\n  Configuring profile: ${chalk.bold(profileName)}`));

  header("Credential options:");

  /** @todo only show this when aws cli is installed and configured */
  const { credentialType } = await inquirer.prompt({
    name: "credentialType",
    message:
      "Do you want to use this machine's credentials or a custom key/secret pair?",
    type: "list",
    choices: [
      { value: CredentialChoices.SHARED, name: "Shared" },
      {
        value: CredentialChoices.KEY_PAIR,
        name: "Key/secret pair",
      },
    ],
    // @ts-ignore
    default: currentProfile.credentials
      ? CredentialChoices.KEY_PAIR
      : CredentialChoices.SHARED,
  });

  const credentials =
    credentialType === CredentialChoices.KEY_PAIR
      ? await inquirer.prompt([
          {
            name: "user-key",
            message: "User key",
            default: currentProfile.credentials?.["user-key"],
            validate: (x: string) =>
              x.trim().length < 1 ? "The distribution id can't be empty" : true,
          },
          {
            name: "user-secret",
            message: "User secret",
            default: currentProfile.credentials?.["user-secret"],
            validate: (x: string) =>
              x.trim().length < 1 ? "The distribution id can't be empty" : true,
          },
        ])
      : undefined;

  header("Hosting options:");

  const hosting = await inquirer.prompt([
    {
      name: "s3-bucket",
      message: "S3 bucket",
      default: currentProfile.hosting?.["s3-bucket"],
      validate: (x: string) =>
        x.trim().length < 1 ? "The bucket name can't be empty" : true,
    },
    {
      name: "cloudfront-distribution-id",
      message: "CloudFront distribution ID",
      default: currentProfile.hosting?.["cloudfront-distribution-id"],
      validate: (x: string) =>
        x.trim().length < 1 ? "The distribution id can't be empty" : true,
    },
  ]);

  /** @todo confirm override */

  const newConfig = {
    ...currentConfig,
    profiles: {
      ...currentConfig.profiles,
      [profileName]: {
        credentials,
        hosting,
      },
    },
  };

  /** @todo deal with errors */
  await writeFile(GLOBAL_CONFIG_FILE, YAML.stringify(newConfig), "utf-8");
}

function header(str: string): void {
  debug(`\n  ${str}\n`);
}
