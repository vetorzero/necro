import { Command } from "commander";
import { info } from "console";
import { readFile, writeFile } from "fs/promises";
import inquirer, { DistinctQuestion } from "inquirer";
import { kebabCase } from "lodash/fp";
import YAML from "yaml";
import { GLOBAL_CONFIG_FILE } from "../../utils/config";
import { header } from "../../utils/log";

enum CredentialChoices {
  SHARED,
  KEY_PAIR,
}

type AWSCredentials = {
  user_key: string;
  user_secret: string;
};

type AWSHosting = {
  s3_bucket: string;
  cloudfront_distribution_id: string;
};

type Profile = {
  credentials?: AWSCredentials;
  hosting: AWSHosting;
};

type GlobalConfig = {
  default_profile?: string;
  profiles?: Record<string, Profile>;
};

export default function config() {
  const cmd = new Command("config");
  cmd.action(action);
  return cmd;
}

async function action() {
  // load config file contents
  const config = await loadConfig();
  if (!config.profiles) config.profiles = {};
  const isNew = Object.keys(config.profiles).length < 1;

  // select profile (if it exists)
  const profileName: string = await askProfileName(
    config.profiles ? Object.keys(config.profiles) : [],
  );
  const currentProfile: Profile = config?.profiles?.[profileName] ?? {
    credentials: null,
    hosting: { s3_bucket: "", cloudfront_distribution_id: "" },
  };
  config.profiles[profileName] = currentProfile;

  // set credentials
  header("Credential options:");
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
  if (config.default_profile !== profileName) {
    const setDefault = await askSetDefault(profileName, isNew);
    if (setDefault) {
      config.default_profile = profileName;
    }
  }

  await writeFile(GLOBAL_CONFIG_FILE, YAML.stringify(config), "utf-8");

  header(`Global config saved to ${GLOBAL_CONFIG_FILE}`);
}

async function loadConfig(): Promise<GlobalConfig> {
  const config: GlobalConfig = await readFile(GLOBAL_CONFIG_FILE, "utf-8")
    .then(YAML.parse)
    .catch((err) => {
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

async function askProfileName(profiles: string[]): Promise<string> {
  const selectedProfile = await singlePrompt({
    message: "Which profile do you want to config?",
    type: "list",
    choices: [
      { value: null, name: "Create a new profile" },
      ...profiles.map((x) => ({ name: `Edit profile "${x}"`, value: x })),
    ],
  });

  if (selectedProfile) {
    return selectedProfile;
  }

  return singlePrompt({
    message: "What's the name of the profile?",
    default: "default",
    filter: kebabCase,
    validate: (x: string) =>
      x.trim().length < 1 ? "The profile name can't be empty" : true,
  });
}

async function askCredentials(
  credentials?: Profile["credentials"],
): Promise<AWSCredentials | undefined> {
  const credentialType = await singlePrompt({
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
    default: credentials
      ? CredentialChoices.KEY_PAIR
      : CredentialChoices.SHARED,
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
          validate: (x: string) =>
            x.trim().length < 1 ? "The user key can't be empty" : true,
        },
        {
          name: "user_secret",
          message: "User secret",
          default: credentials?.["user_secret"],
          validate: (x: string) =>
            x.trim().length < 1 ? "The user secret can't be empty" : true,
        },
      ]);
  }
}

async function askHosting<T extends Profile["hosting"]>(hosting?: T) {
  return inquirer.prompt<T>([
    {
      name: "s3_bucket",
      message: "S3 bucket",
      default: hosting?.s3_bucket,
      validate: (x: string) =>
        x.trim().length < 1 ? "The bucket name can't be empty" : true,
    },
    {
      name: "cloudfront_distribution_id",
      message: "CloudFront distribution ID",
      default: hosting?.cloudfront_distribution_id,
      validate: (x: string) =>
        x.trim().length < 1 ? "The distribution id can't be empty" : true,
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

async function singlePrompt(question: DistinctQuestion) {
  const { answer } = await inquirer.prompt({
    ...question,
    name: "answer",
  });

  return answer;
}
