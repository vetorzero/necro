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
exports.listDir = exports.ListDirOptionsMode = exports.assertNotEmpty = exports.assertIsDir = exports.assertFileExists = exports.getProjectBaseDirectory = exports.directoryExists = exports.getCurrentDirectoryBase = exports.guessClientName = exports.guessProjectName = void 0;
const path_1 = __importStar(require("path"));
const fs_1 = require("fs");
const config_1 = require("./config");
function guessProjectName() {
    return path_1.basename(process.cwd());
}
exports.guessProjectName = guessProjectName;
function guessClientName() {
    return path_1.basename(path_1.join(process.cwd(), ".."));
}
exports.guessClientName = guessClientName;
function getCurrentDirectoryBase() {
    return path_1.basename(process.cwd());
}
exports.getCurrentDirectoryBase = getCurrentDirectoryBase;
function directoryExists(path) {
    return fs_1.existsSync(path);
}
exports.directoryExists = directoryExists;
/**
 * Find the closest folder backwards containing a necro.json file.
 *
 * @returns A string with the folder, null otherwise.
 */
function getProjectBaseDirectory() {
    const currentFolder = process.cwd();
    const parts = currentFolder
        .split(path_1.default.sep)
        // remove empty parts
        .filter((x) => x.length);
    while (parts.length) {
        const scanningPath = path_1.default.join("/", ...parts);
        if (fs_1.existsSync(path_1.join(scanningPath, config_1.CONFIG_FILE))) {
            return scanningPath;
        }
        parts.pop();
    }
    return null;
}
exports.getProjectBaseDirectory = getProjectBaseDirectory;
/**
 * Asserts that path is a valid file/dir/link.
 */
function assertFileExists(path) {
    if (!fs_1.existsSync(path)) {
        throw new Error(`Path ${path} doesn't exist.`);
    }
}
exports.assertFileExists = assertFileExists;
/**
 * Asserts that path is a valid dir.
 */
function assertIsDir(path) {
    const stat = fs_1.statSync(path);
    if (!stat.isDirectory()) {
        throw new Error(`Path ${path} is not a dir.`);
    }
}
exports.assertIsDir = assertIsDir;
/**
 * Asserts that a folder is not empty
 */
function assertNotEmpty(path) {
    const ls = fs_1.readdirSync(path);
    if (!ls.length) {
        throw new Error(`Dir ${path} is empty.`);
    }
}
exports.assertNotEmpty = assertNotEmpty;
var ListDirOptionsMode;
(function (ListDirOptionsMode) {
    /** Wide then deep */
    ListDirOptionsMode[ListDirOptionsMode["BFS"] = 0] = "BFS";
    /** Deep then wide */
    ListDirOptionsMode[ListDirOptionsMode["DFS"] = 1] = "DFS";
})(ListDirOptionsMode = exports.ListDirOptionsMode || (exports.ListDirOptionsMode = {}));
/**
 * Deeply list the files of a directory using a BFS algorithm.
 */
function listDir(base, options) {
    const defaultOptions = {
        includeDirs: false,
        mode: ListDirOptionsMode.BFS,
    };
    const { includeDirs, mode } = { ...defaultOptions, ...options };
    const found = [];
    const queue = [base];
    while (queue.length) {
        const current = mode === ListDirOptionsMode.BFS ? queue.shift() : queue.pop();
        const recurse = isDir(current);
        if (recurse) {
            const ls = fs_1.readdirSync(current).map((x) => path_1.join(current, x));
            queue.push(...ls);
        }
        if (!recurse || includeDirs) {
            found.push(current);
        }
    }
    return found;
}
exports.listDir = listDir;
/**
 * Tells wheter or not a path is a directory.
 */
function isDir(path) {
    try {
        const stat = fs_1.statSync(path);
        return stat.isDirectory();
    }
    catch (err) {
        return false;
    }
}
