import chalk from "chalk";
import { Command } from "commander";
import { getConfig, ValidationError } from "../utils/config";
import { error, log } from "../utils/log";
import { listDeployments } from "../utils/s3";

export default function list() {
  return new Command("list")
    .description("List all versions of the current site.")
    .action(action);
}

async function action(command: Command) {
  let config;
  try {
    config = getConfig();
  } catch (err) {
    if (err instanceof ValidationError) {
      error(`There was a problem validating your configuration. Check it out:
${err.errorsText}`);
    } else {
      const cmd = chalk.bold("necro init");
      error(`Couldn't find a necro config file.
Configure necro by running ${cmd} in the root directory of your project.`);
    }

    throw err;
  }

  const deployments = await listDeployments(config.client, config.project);

  log(`Found ${deployments.length} deployment(s).`);
  for (const deployment of deployments) {
    const name = chalk.bold(deployment.name);
    log(`${name}\tLast modified: ${deployment.lastModified.toUTCString()}`);
    log("");
  }
}
