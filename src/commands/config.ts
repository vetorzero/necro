import { Command } from "commander";
import inquirer, { QuestionCollection, Separator } from "inquirer";
import yaml from "yaml";

// @todo add link to "https://console.aws.amazon.com/iam/home#/security_credentials"
const questions: QuestionCollection = [
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
  },
  {
    type: "input",
    name: "aws.credentials.id",
    message: "Access key ID",
    when: (prev) => prev._awsCredentials,
    validate: (answer: string) =>
      answer.length === 20 ||
      `The id must be 20 characters long. ${answer.length} given.`,
  },
  {
    type: "password",
    name: "aws.credentials.secret",
    message: "Secret access key",
    when: (prev) => prev._awsCredentials,
    validate: (answer: string) =>
      answer.length === 40 ||
      `The secret must be 40 characters long. ${answer.length} given.`,
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
  },
  {
    type: "input",
    name: "aws.region",
    message: "Region code",
    when: (prev) => prev._awsRegion,
    validate: (answer: string) =>
      !!answer.match(/^\w+-\w+-\w+$/) ||
      `Region must match the string format: ab-cde-1`,
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
  },
  {
    type: "input",
    name: "aws.hosting.s3Bucket",
    message: "S3 bucket",
    when: (prev) => prev._awsHosting,
    validate: (answer: string) => answer.length > 0 || `This must not be empty`,
  },
  {
    type: "input",
    name: "aws.hosting.cfDistributionId",
    message: "Cloudfront distribution ID",
    when: (prev) => prev._awsHosting,
    validate: (answer: string) => answer.length > 0 || `This must not be empty`,
  },
];

export default function configCommand() {
  return new Command("config")
    .description("Configure necro environment.")
    .action(action);
}

async function action(command: Command) {
  const options = command.opts();
  const answers = await inquirer.prompt(questions, options);

  console.log(answers);

  // remove temp values from inquirer
  for (const k in answers) {
    if (k.startsWith("_")) delete answers[k];
  }

  console.log(yaml.stringify(answers));
}
