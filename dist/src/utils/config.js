"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.getConfig = exports.CONFIG_FILE = void 0;
const file_1 = require("./file");
const fs_1 = require("fs");
const path_1 = require("path");
const ajv_1 = __importDefault(require("ajv"));
exports.CONFIG_FILE = "necro.json";
function validateConfig(config) {
    const schema = {
        type: "object",
        properties: {
            client: { type: "string" },
            project: { type: "string" },
            distFolder: { type: "string" },
            public: { type: "boolean" },
        },
        allOf: [
            {
                if: {
                    properties: {
                        public: { type: "boolean", const: false },
                    },
                },
                then: {
                    properties: {
                        username: { type: "string" },
                        password: { type: "string" },
                    },
                    required: ["username", "password"],
                },
            },
        ],
        required: ["client", "project", "distFolder", "public"],
    };
    const ajv = new ajv_1.default({ allErrors: true, verbose: true });
    const validate = ajv.compile(schema);
    const isValid = validate(config);
    if (!isValid) {
        throw new ValidationError(ajv.errorsText(validate.errors, {
            separator: "\n",
            dataVar: "config",
        }));
    }
}
function getConfig() {
    const baseDir = file_1.getProjectBaseDirectory();
    if (baseDir === null) {
        throw new Error(`Couldn't find a necro config file.`);
    }
    const file = fs_1.readFileSync(path_1.join(baseDir, exports.CONFIG_FILE));
    const config = JSON.parse(file.toString());
    validateConfig(config);
    return config;
}
exports.getConfig = getConfig;
class ValidationError extends Error {
    constructor(errorsText) {
        super();
        this.errorsText = errorsText;
    }
}
exports.ValidationError = ValidationError;
