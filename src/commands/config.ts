import { Command } from "commander";
import { readFileSync, readSync, writeFileSync } from "fs";
import inquirer, { QuestionCollection, Separator } from "inquirer";
import yaml from "yaml";
import { GLOBAL_CONFIG_FILE } from "../utils/config";
import log from "../utils/log";

type InitialConfig = GlobalConfig & { [key: `_${string}`]: any };

function getQuestions(initial: InitialConfig): QuestionCollection {
  return [
    // credentials
    {
      type: "list",
      name: "_awsCredentials",
      message: "AWS credentials",
      choices: [
        {
          value: false,
          name: "Use system credentials configured by AWS CLI (recommended)",
        },
        { value: true, name: "Specify the user credentials for necro" },
      ],
      default: initial._awsCredentials,
    },
    {
      type: "input",
      name: "aws.credentials.id",
      message:
        "You can create new user credendials in the link:\n" +
        "https://console.aws.amazon.com/iam/home#/security_credentials\n" +
        "Access key ID",
      when: (prev) => prev._awsCredentials,
      validate: (answer: string) =>
        answer.length === 20 ||
        `The id must be 20 characters long. ${answer.length} given.`,
      default: initial.aws?.credentials?.id,
    },
    {
      type: "password",
      name: "aws.credentials.secret",
      message: "Secret access key",
      when: (prev) => prev._awsCredentials,
      validate: (answer: string) =>
        answer.length === 40 ||
        `The secret must be 40 characters long. ${answer.length} given.`,
      default: initial.aws?.credentials?.secret,
    },

    // region
    {
      type: "list",
      name: "_awsRegion",
      message: "AWS region",
      choices: [
        {
          value: false,
          name: "Use default system region configured by AWS CLI (recommended)",
        },
        { value: true, name: "Specify the region manually" },
      ],
      default: initial._awsRegion,
    },
    {
      type: "input",
      name: "aws.region",
      message: "Region code",
      when: (prev) => prev._awsRegion,
      validate: (answer: string) =>
        !!answer.match(/^\w+-\w+-\w+$/) ||
        `Region must match the string format: ab-cde-1`,
      default: initial.aws?.region,
    },

    // hosting
    {
      type: "list",
      name: "_awsHosting",
      message: "AWS Hosting",
      choices: [
        {
          value: true,
          name: "Configure default hosting for all projects. (recommended)",
        },
        {
          value: false,
          name: "Don't configure default hosting. Every project will be configured separately.",
        },
      ],
      default: initial._awsHosting,
    },
    {
      type: "input",
      name: "aws.hosting.s3Bucket",
      message: "S3 bucket",
      when: (prev) => prev._awsHosting,
      validate: (answer: string) =>
        answer.length > 0 || `This must not be empty`,
      default: initial.aws?.hosting?.s3Bucket,
    },
    {
      type: "input",
      name: "aws.hosting.cfDistributionId",
      message: "Cloudfront distribution ID",
      when: (prev) => prev._awsHosting,
      validate: (answer: string) =>
        answer.length > 0 || `This must not be empty`,
      default: initial.aws?.hosting?.cfDistributionId,
    },
  ];
}

export default function configCommand() {
  return new Command("config")
    .description("Configure necro environment.")
    .action(action);
}

async function action(command: Command) {
  // const options = command.opts();

  // load existing configs from file
  let current: GlobalConfig;
  try {
    const file = readFileSync(GLOBAL_CONFIG_FILE, "utf-8");
    current = yaml.parse(file);
  } catch (_) {
    current = {};
  }

  // add utility values
  const initial = {
    ...current,
    _awsCredentials: !!current.aws?.credentials,
    _awsRegion: !!current.aws?.region,
    _awsHosting: !!current.aws?.hosting,
  };

  // remove utility values
  const answers = await inquirer.prompt(getQuestions(initial));
  for (const k in answers) {
    if (k.startsWith("_")) delete answers[k];
  }

  // save to file
  writeFileSync(GLOBAL_CONFIG_FILE, yaml.stringify(answers));

  log.success(`Config file written: ${GLOBAL_CONFIG_FILE}`);
}
