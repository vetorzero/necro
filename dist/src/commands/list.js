"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const config_1 = require("../utils/config");
const log_1 = require("../utils/log");
const s3_1 = require("../utils/s3");
function list() {
    return new commander_1.Command("list")
        .description("List all versions of the current site.")
        .action(action);
}
exports.default = list;
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
    const deployments = await s3_1.listDeployments(config.client, config.project);
    log_1.log(`Found ${deployments.length} deployment(s).`);
    for (const deployment of deployments) {
        const name = chalk_1.default.bold(deployment.name);
        log_1.log(`${name}\tLast modified: ${deployment.lastModified.toUTCString()}`);
        log_1.log("");
    }
}
