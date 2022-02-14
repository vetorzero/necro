import { Command } from "commander";
import { writeFile } from "fs/promises";
import inquirer from "inquirer";
import { kebabCase } from "lodash/fp";
import { getGlobalConfig } from "../../lib/config/global";
import { singlePrompt } from "../../utils/cli";
import { GLOBAL_CONFIG_FILE } from "../../utils/config";
import { info } from "../../utils/log";
import { BANNER, multilinePad } from "../../utils/text";
import YAML from "yaml";

enum CredentialChoices {
  SHARED,
  KEY_PAIR,
}

export default function () {
  const cmd = new Command("config");
  cmd.action(action);
  return cmd;
}

async function action() {
  info(`\n${multilinePad(BANNER)}\n`);

  const config: GlobalConfig = await getGlobalConfig().catch(_ => ({
    default_profile: "",
    profiles: [],
  }));
  const isNew = !config.profiles.length;

  if (isNew) {
    info(
      `\nLet's create your global config file.` +
        `\nIt'll be located at ${GLOBAL_CONFIG_FILE}` +
        `\n  and it will contain all the necessary information to raise a demo to the clouds.\n`,
    );
  }

  // select profile (if it exists)
  const currentProfile = await askProfileName(config.profiles);
  if (!config.profiles.find(p => p.name === currentProfile.name)) {
    config.profiles.push(currentProfile);
  }

  // set credentials
  const currentCredentials = currentProfile?.credentials;
  const credentials = await askCredentials(currentCredentials);
  if (credentials) {
    currentProfile.credentials = credentials;
  } else {
    delete currentProfile.credentials;
  }

  // set hosting
  const currentHosting = currentProfile.hosting;
  const hosting = await askHosting(currentHosting);
  currentProfile.hosting = hosting;

  // set default profile
  if (config.default_profile !== currentProfile.name) {
    const setDefault = await askSetDefault(currentProfile.name, isNew);
    if (setDefault) {
      config.default_profile = currentProfile.name;
    }
  }

  await writeFile(GLOBAL_CONFIG_FILE, YAML.stringify(config), "utf-8");
}

async function askProfileName(profiles: GlobalConfig.Profile[]): Promise<GlobalConfig.Profile> {
  if (profiles.length) {
    const selectedProfile = await singlePrompt({
      message: "Which profile do you want to config?",
      type: "list",
      choices: [
        { value: null, name: "Create a new profile" },
        ...profiles.map(x => ({ name: `Edit profile "${x.name}"`, value: x })),
      ],
    });

    if (selectedProfile) {
      return selectedProfile;
    }
  }

  const name = await singlePrompt({
    message: "What's the name of the profile?",
    default: "default",
    validate: (x: string) => (x.trim().length < 1 ? "The profile name can't be empty" : true),
    filter: kebabCase,
  });

  return {
    name,
    hosting: { s3_bucket: "", cloudfront_distribution_id: "" },
  };
}

async function askCredentials(
  credentials?: GlobalConfig.Profile["credentials"],
): Promise<GlobalConfig.AWSCredentials | undefined> {
  const credentialType = await singlePrompt({
    message: "Do you want to use this machine's credentials or a custom key/secret pair?",
    type: "list",
    choices: [
      { value: CredentialChoices.SHARED, name: "Shared" },
      {
        value: CredentialChoices.KEY_PAIR,
        name: "Key/secret pair",
      },
    ],
    default: credentials ? CredentialChoices.KEY_PAIR : CredentialChoices.SHARED,
  });

  switch (credentialType) {
    case CredentialChoices.SHARED:
      return;
    case CredentialChoices.KEY_PAIR:
      return await inquirer.prompt([
        {
          name: "user_key",
          message: "User key",
          default: credentials?.["user_key"],
          validate: (x: string) => (x.trim().length < 1 ? "The user key can't be empty" : true),
        },
        {
          name: "user_secret",
          message: "User secret",
          default: credentials?.["user_secret"],
          validate: (x: string) => (x.trim().length < 1 ? "The user secret can't be empty" : true),
        },
      ]);
  }
}

async function askHosting<T extends GlobalConfig.Profile["hosting"]>(hosting?: T) {
  return inquirer.prompt<T>([
    {
      name: "s3_bucket",
      message: "S3 bucket",
      default: hosting?.s3_bucket,
      validate: (x: string) => (x.trim().length < 1 ? "The bucket name can't be empty" : true),
    },
    {
      name: "cloudfront_distribution_id",
      message: "CloudFront distribution ID",
      default: hosting?.cloudfront_distribution_id,
      validate: (x: string) => (x.trim().length < 1 ? "The distribution id can't be empty" : true),
    },
  ]);
}

async function askSetDefault<T extends GlobalConfig["default_profile"]>(
  profileName: T,
  defaultValue: boolean,
): Promise<boolean> {
  return singlePrompt({
    type: "confirm",
    default: defaultValue,
    message: `Set profile "${profileName}" as default?`,
  });
}
