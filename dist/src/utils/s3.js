"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDir = exports.listDeployments = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const child_process_1 = __importDefault(require("child_process"));
const fp_1 = require("lodash/fp");
const path_1 = require("path");
const file_1 = require("./file");
const log_1 = require("./log");
const BUCKET = "demo.vzlab.com.br";
const s3Options = {};
const s3 = new aws_sdk_1.default.S3(s3Options);
async function getDeploymentInformation(result) {
    if (!result.Prefix)
        return null;
    const prefix = result.Prefix;
    return {
        prefix,
        name: path_1.basename(prefix),
        lastModified: await getDeploymentLastModified(prefix),
    };
}
async function getDeploymentLastModified(prefix) {
    const result = await s3
        .getObject({
        Bucket: BUCKET,
        Key: `${prefix}index.html`,
    })
        .promise();
    return result.LastModified;
}
/**
 * List all deployments for a given client and project
 * @todo sort by lastModified
 */
async function listDeployments(client, project) {
    const result = await s3
        .listObjects({
        Bucket: BUCKET,
        Delimiter: "/",
        MaxKeys: 1000000,
        Prefix: `${client}/${project}/`,
    })
        .promise();
    const paths = result.CommonPrefixes;
    if (!paths) {
        throw new Error(`Could't find deployments for client ${client}, project ${project}`);
    }
    const filter = fp_1.reject(fp_1.isNull);
    const sort = fp_1.sortBy(fp_1.prop("lastModified"));
    const deployments = await Promise.all(paths.map(getDeploymentInformation));
    return sort(filter(deployments));
}
exports.listDeployments = listDeployments;
async function syncDir(sourceDir, targetDir, meta = {}) {
    file_1.assertIsDir(sourceDir);
    log_1.log(`Syncing folders:
${sourceDir} --> s3://${BUCKET}/${targetDir}
`);
    await new Promise((resolve, reject) => {
        const cp = child_process_1.default.spawn("aws", [
            "s3",
            "sync",
            sourceDir,
            `s3://${BUCKET}/${targetDir}`,
            "--metadata",
            JSON.stringify(meta),
            "--metadata-directive",
            "REPLACE",
        ], {});
        // redirect streams
        cp.stderr.pipe(process.stderr);
        cp.stdout.pipe(process.stdout);
        // callbacks
        cp.on("exit", (...x) => {
            resolve();
        });
        cp.on("error", (...x) => {
            reject(new Error("Couldn't sync folders"));
        });
    });
    log_1.log(`Folders synced successfully!\n`);
}
exports.syncDir = syncDir;
