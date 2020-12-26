"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.log = exports.warn = exports.info = exports.success = void 0;
const chalk_1 = __importDefault(require("chalk"));
const util_1 = require("util");
function success(arg0, ...args) {
    console.log(chalk_1.default.green(util_1.format(arg0, ...args)));
}
exports.success = success;
function info(arg0, ...args) {
    console.info(chalk_1.default.blue(util_1.format(arg0, ...args)));
}
exports.info = info;
function warn(arg0, ...args) {
    console.info(chalk_1.default.yellow(util_1.format(arg0, ...args)));
}
exports.warn = warn;
function log(arg0, ...args) {
    console.log(arg0, ...args);
}
exports.log = log;
function error(arg0, ...args) {
    console.error(chalk_1.default.redBright(util_1.format(arg0, ...args)));
}
exports.error = error;
exports.default = {
    success,
    info,
    warn,
    log,
    error,
};
