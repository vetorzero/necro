import { Command } from "commander";
import inquirer, { QuestionCollection } from "inquirer";
import { kebabCase, pick } from "lodash/fp";
import { CONFIG_FILE, guessClientName, guessProjectName } from "../utils/file";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import log from "../utils/log";
import chalk from "chalk";

const questions: QuestionCollection = [
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
    name: "public",
    message: "Should this project be made public?",
    type: "confirm",
    default: false,
  },
  {
    name: "username",
    message: "What is the default username for this demo?",
    when: (prev: any) => !prev.public,
    default: (prev: any) => prev.project,
  },
  {
    name: "password",
    message: "What is the default password for this demo?",
    when: (prev: any) => !prev.public,
    filter: (password: string) => (password.length ? password : null),
  },
  {
    name: "overwrite",
    message: "The necro file already exists. Overwrite?",
    type: "confirm",
    when: (prev: any) => fileExists() && !prev.overwrite,
    default: (prev: any) => !!prev.overwrite,
  },
];

const filePath = join(process.cwd(), CONFIG_FILE);

function fileExists(): boolean {
  return existsSync(filePath);
}

export default function init() {
  return new Command("init")
    .description("Creates a necro config file in the current dir.")
    .option("--client [name]", "the client's name")
    .option("--project [codename]", "the project's codename")
    .option("--public", "disable authentication")
    .option("--username [username]", "a default username for the demo")
    .option("--password [password]", "a default password for the demo")
    .option("--overwrite", "replace the file if it already exists")
    .action(action);
}

async function action(command: Command) {
  const options = command.opts();
  const { overwrite, ...answers } = await inquirer.prompt(questions, options);

  if (!fileExists() || overwrite) {
    const json = JSON.stringify(answers, null, 2);
    writeFileSync(filePath, json);
    log.success(`Config file written:\n\t${filePath}`);
  }
}
