"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const log_1 = require("./src/utils/log");
Error.stackTraceLimit = Infinity;
async function main() {
    commander_1.program.storeOptionsAsProperties(false);
    commander_1.program.option("--debug", "Show extended debug information.");
    // load commands
    const commandsDir = path_1.join(__dirname, "src/commands");
    const commandFiles = await promises_1.readdir(commandsDir);
    await Promise.all(commandFiles.map(async (file) => {
        const path = path_1.join(commandsDir, file);
        const { default: command } = await Promise.resolve().then(() => __importStar(require(path)));
        commander_1.program.addCommand(command());
    }));
    await commander_1.program.parseAsync(process.argv).catch(commandError);
}
main().catch(mainError);
function commandError(err) {
    const { debug } = commander_1.program.opts();
    if (!debug) {
        log_1.error("\nRun your command again with --debug to see more details.");
    }
    else {
        log_1.error("\n\n", err);
    }
}
function mainError(err) {
    log_1.error("Error on main: ", err);
}
