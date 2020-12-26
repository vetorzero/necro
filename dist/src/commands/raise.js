"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = require("path");
const file_1 = require("../utils/file");
const log_1 = require("../utils/log");
const s3_1 = require("../utils/s3");
const config_1 = require("../utils/config");
const chalk_1 = __importDefault(require("chalk"));
/**
 * @todo set passwords only on html files
 */
function raise() {
    return new commander_1.Command("raise")
        .storeOptionsAsProperties(false)
        .description("Publish a new version of a demo.")
        .option("--version [number-or-name]", "The version of the demo. Defaults to the date and time of the invocation.")
        .action(action);
}
exports.default = raise;
async function action(command) {
    let config;
    try {
        config = config_1.getConfig();
    }
    catch (err) {
        if (err instanceof config_1.ValidationError) {
            log_1.error(`There was a problem validating your configuration. Check it out:
${err.errorsText}`);
        }
        else {
            const cmd = chalk_1.default.bold("necro init");
            log_1.error(`Couldn't find a necro config file.
Configure necro by running ${cmd} in the root directory of your project.`);
        }
        throw err;
    }
    const version = encodeURIComponent(command.opts().version || createVersion());
    const baseDir = file_1.getProjectBaseDirectory();
    const sourceDir = path_1.join(baseDir, config.distFolder);
    const targetDir = `${config.client}/${config.project}/${version}`;
    try {
        file_1.assertFileExists(sourceDir);
    }
    catch (err) {
        log_1.error(`Source dir "${sourceDir}" doesn't exist.
You should provide a valid path relative to the necro.json config file.`);
        throw err;
    }
    try {
        file_1.assertIsDir(sourceDir);
    }
    catch (err) {
        log_1.error(`Source folder "${sourceDir}" is… well… not a folder.
You should provide a valid path relative to the necro.json config file.`);
        throw err;
    }
    try {
        file_1.assertNotEmpty(sourceDir);
    }
    catch (err) {
        log_1.error(`Source folder "${sourceDir}" is empty.
Make sure to build yout project before raising the demo.`);
        throw err;
    }
    const options = {};
    if (!config.public) {
        options["auth"] =
            encodeURIComponent(config.username) +
                ":" +
                encodeURIComponent(config.password);
    }
    await s3_1.syncDir(sourceDir, targetDir, options);
    log_1.success("Demo successfully raised");
}
/**
 * Get the current date as YYYY-MM-DD.
 */
function createVersion() {
    const now = new Date();
    return now.toISOString().split("T")[0];
}
