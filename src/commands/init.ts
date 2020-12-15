import { Command } from "commander";
import inquirer, { QuestionCollection } from "inquirer";
import { kebabCase } from "lodash/fp";
import { guessClientName, guessProjectName } from "../utils/file";

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
];

export default function init() {
  return new Command("init")
    .description("Creates a necro config file in the current dir.")
    .option("--client [name]", "the client's name")
    .option("--project [codename]", "the project's codename")
    .action(action);
}

async function action(command: Command) {
  const options = command.opts();
  const answers = await inquirer.prompt(questions, options);
}
