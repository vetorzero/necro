import Ajv from "ajv";
import { Command } from "commander";
import { readFile, writeFile } from "fs/promises";
import inquirer, { DistinctQuestion } from "inquirer";
import YAML from "yaml";
import { GLOBAL_CONFIG_FILE } from "../../utils/config";
import { header } from "../../utils/log";
import schema from "../../@schema/config.schema.json";
import assert from "assert";
import { singlePrompt } from "../../utils/cli";

enum CredentialChoices {
  SHARED,
  KEY_PAIR,
}

export default function config() {
  const cmd = new Command("config");
  cmd.action(action);
  return cmd;
}

async function action() {
  // await validateGlobalConfig();

  // load config file contents
  const config = await loadConfig();
  if (!config.profiles) config.profiles = [];
  const isNew = !config.profiles.length;

  // select profile (if it exists)
  const currentProfile = await askProfileName(config.profiles);
  if (!config.profiles.find(p => p.name === currentProfile.name)) {
    console.log("add prof");
    config.profiles.push(currentProfile);
  }

  // set credentials
  header("Credential options:");
  // console.log({ currentProfile });
  const currentCredentials = currentProfile?.credentials;
  const credentials = await askCredentials(currentCredentials);
  if (credentials) {
    currentProfile.credentials = credentials;
  } else {
    delete currentProfile.credentials;
  }

  // set hosting
  header("Hosting options:");
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

  header(`Global config saved to ${GLOBAL_CONFIG_FILE}`);
}

async function loadConfig(): Promise<GlobalConfig> {
  const config: GlobalConfig = await readFile(GLOBAL_CONFIG_FILE, "utf-8")
    .then(YAML.parse)
    .catch(err => {
      switch (err?.code) {
        case "ENOENT":
          // file not found
          return {
            default_profile: "",
            profiles: {},
          };
        default:
          // file not readable
          throw new Error(
            `The global config file is not readable. (${GLOBAL_CONFIG_FILE})` +
              `\nMake sure you are its owner and have read and write access (at least 0600) to it.`,
          );
      }
    });

  return config;
}

async function askProfileName(profiles: Config.Profile[]): Promise<Config.Profile> {
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

  const name = await singlePrompt({
    message: "What's the name of the profile?",
    default: "default",
    validate: (x: string) => (x.trim().length < 1 ? "The profile name can't be empty" : true),
  });

  return {
    name,
    hosting: { s3_bucket: "", cloudfront_distribution_id: "" },
  };
}

async function askCredentials(
  credentials?: Config.Profile["credentials"],
): Promise<AWSCredentials | undefined> {
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

async function askHosting<T extends Config.Profile["hosting"]>(hosting?: T) {
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
