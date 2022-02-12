import assert from "assert";
import chalk from "chalk";
import { Command } from "commander";
import { getConfig, ValidationError } from "../utils/config";
import { error, debug } from "../utils/log";
import { listDeployments } from "../utils/s3";

export default function list() {
  return new Command("list")
    .description("List all versions of the current project.")
    .action(action);
}

async function action(command: Command) {
  const config = await getConfig();
  const deployments = await listDeployments(
    config.profile.hosting.s3_bucket,
    config.client,
    config.project,
  );

  debug(`Found ${deployments.length} deployment(s).`);
  for (const deployment of deployments) {
    const name = chalk.bold(deployment.name);
    debug(`${name}\tLast modified: ${deployment.lastModified.toUTCString()}`);
    debug("");
  }
}
