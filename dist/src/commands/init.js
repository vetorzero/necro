"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const inquirer_1 = __importDefault(require("inquirer"));
const fp_1 = require("lodash/fp");
const path_1 = require("path");
const config_1 = require("../utils/config");
const file_1 = require("../utils/file");
const log_1 = __importDefault(require("../utils/log"));
const questions = [
    {
        name: "client",
        message: "What is the name of the client for this project?",
        filter: fp_1.kebabCase,
        default: fp_1.kebabCase(file_1.guessClientName()),
    },
    {
        name: "project",
        message: "What is the codename for this project?",
        filter: fp_1.kebabCase,
        default: fp_1.kebabCase(file_1.guessProjectName()),
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
        when: (prev) => !prev.public,
        default: (prev) => prev.project,
    },
    {
        name: "password",
        message: "What is the default password for this demo?",
        when: (prev) => !prev.public,
        filter: (password) => (password.length ? password : null),
    },
    {
        name: "distFolder",
        message: "Where are the files to be published?",
        validate: (path) => {
            if (!file_1.directoryExists(path)) {
                return `The folder ${path} doesn't exist.`;
            }
            return true;
        },
    },
    {
        name: "overwrite",
        message: "The necro file already exists. Overwrite?",
        type: "confirm",
        when: (prev) => fileExists() && !prev.overwrite,
        default: (prev) => !!prev.overwrite,
    },
];
const filePath = path_1.join(process.cwd(), config_1.CONFIG_FILE);
function fileExists() {
    return fs_1.existsSync(filePath);
}
function init() {
    return new commander_1.Command("init")
        .description("Creates a necro config file in the current dir.")
        .option("--client [name]", "the client's name")
        .option("--project [codename]", "the project's codename")
        .option("--public", "disable authentication")
        .option("--username [username]", "a default username for the demo")
        .option("--password [password]", "a default password for the demo")
        .option("--dist-folder [path]", "the folder containing the built project")
        .option("--overwrite", "replace the file if it already exists")
        .action(action);
}
exports.default = init;
async function action(command) {
    const options = command.opts();
    const { overwrite, ...answers } = await inquirer_1.default.prompt(questions, options);
    if (!fileExists() || overwrite) {
        const json = JSON.stringify(answers, null, 2);
        fs_1.writeFileSync(filePath, json);
        log_1.default.success(`Config file written:
${filePath}`);
    }
}
