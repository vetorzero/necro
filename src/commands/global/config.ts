import { Command } from "commander";
import inquirer from "inquirer";
import { debug, error, info } from "../../utils/log";
import YAML from "yaml";
import os from "os";
import { readFile, writeFile } from "fs/promises";
import { GLOBAL_CONFIG_FILE } from "../../utils/config";

/**
 * @todo add description
 */
export default function config() {
  const cmd = new Command("config");
  cmd.action(action);

  return cmd;
}

async function action() {
  const currentConfigContent = await readFile(
    GLOBAL_CONFIG_FILE,
    "utf-8",
  ).catch((e) => {
    debug(`Global config file not found or not readable`);
    return "";
  });

  const currentConfig = YAML.parse(currentConfigContent) || {};

  debug({ currentConfig });
  // process.exit();

  /** @todo check if it's the first profile */
  const { shouldCreate } = await inquirer.prompt({
    name: "shouldCreate",
    message: "You don't have a profile set yet. Do you want to create one now?",
    type: "confirm",
  });

  if (!shouldCreate) {
    info("Config aborted");
    return;
  }

  const { profileName } = await inquirer.prompt({
    name: "profileName",
    message: "How do you want to name this profile?",
    default: "default",
  });

  /** @todo only show this when aws cli is installed and configured */
  enum CredentialChoices {
    SHARED, //= "shared",
    KEY_PAIR, // = "key/secret pair",
  }
  const { credentialType } = await inquirer.prompt({
    name: "credentialType",
    message:
      "Do you want to use this machine's credentials or a custom key/secret pair?",
    type: "list",
    choices: [
      { value: CredentialChoices.SHARED, name: "Shared" },
      { value: CredentialChoices.KEY_PAIR, name: "Key/secret pair" },
    ],
  });

  const credentials =
    credentialType === CredentialChoices.KEY_PAIR
      ? await inquirer.prompt([
          { name: "user-key", default: "USRKEY" },
          { name: "user-secret", default: "USRSCRT" },
        ])
      : undefined;

  const hosting = await inquirer.prompt([
    { name: "s3-bucket", default: "my-bucket" },
    { name: "cloudfront-distribution-id", default: "0000000000" },
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

  debug({ profileName, credentialType, credentials, hosting });
  debug(YAML.stringify(newConfig));

  /** @todo deal with errors */
  await writeFile(GLOBAL_CONFIG_FILE, YAML.stringify(newConfig), "utf-8");
}
