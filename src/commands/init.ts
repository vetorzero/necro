import assert from "assert";
import { Command } from "commander";
import { existsSync, writeFileSync } from "fs";
import inquirer, { Answers, QuestionCollection } from "inquirer";
import { kebabCase, omitBy } from "lodash/fp";
import { join } from "path";
import YAML from "yaml";
import { getGlobalConfig } from "../lib/config/global";
import { singlePrompt } from "../utils/cli";
import { PROJECT_CONFIG_FILE } from "../utils/config";
import { directoryExists, guessClientName, guessProjectName } from "../utils/file";
import { success, warn } from "../utils/log";
import { notEmpty } from "../utils/validators";

const FILE_PATH = join(process.cwd(), PROJECT_CONFIG_FILE);
const FILE_EXISTS = existsSync(FILE_PATH);

export default function init() {
  return new Command("init")
    .description("Creates a necro config file in the current dir.")
    .action(action);
}

async function action(command: Command) {
  const overwrite = FILE_EXISTS
    ? await singlePrompt({
        message: "Necro file already exists. Overwrite?",
        type: "confirm",
        when: FILE_EXISTS,
      })
    : true;
  if (FILE_EXISTS && !overwrite) {
    warn("Aborted.");
    return;
  }

  const answers = await projectConfig();

  const yaml = YAML.stringify(answers);
  writeFileSync(FILE_PATH, yaml);
  success(`Config file written:\n${FILE_PATH}`);
}

async function projectConfig() {
  const globalConfig = await getGlobalConfig();

  const allAwnswers = await inquirer.prompt([
    {
      name: "use_profile",
      message: "Which profile shoud we use to raise this demo?",
      type: "list",
      choices: [
        { value: null, name: "Global default (recommended)" },
        ...globalConfig.profiles.map(p => p.name),
      ],
      filter: v => (v === null ? null : v),
    },
    {
      name: "client",
      message: "What is the name of the client for this project?",
      filter: kebabCase,
      default: kebabCase(guessClientName()),
    },
    {
      name: "project",
      message: "What is the codename for this project?",
      filter: kebabCase,
      default: kebabCase(guessProjectName()),
    },
    {
      name: "dist_folder",
      message: "Where are the files to be published?",
      validate: path => {
        if (!directoryExists(path)) {
          return `The folder ${path} doesn't exist.`;
        }
        return true;
      },
    },
    {
      name: "_auth",
      message: "Should this demo be password protected?",
      type: "confirm",
    },
    {
      name: "auth.username",
      message: "What is the username for this demo?",
      when: prev => prev._auth,
      validate: notEmpty("username"),
      default: (prev: Answers) => prev.client ?? "",
    },
    {
      name: "auth.password",
      message: "What is the password for this demo?",
      type: "password",
      mask: "•",
      when: prev => prev._auth,
      validate: notEmpty("password"),
    },
  ]);

  const answers = omitBy((_: any, k: string) => k.startsWith("_"))(allAwnswers);

  if (answers.use_profile === null) {
    delete answers.use_profile;
  }

  return answers;
}
