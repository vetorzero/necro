/**
 *
 *
 *            TO REFACTOR
 *
 *
 */

import chalk from "chalk";
import { Command } from "commander";
import { getConfig } from "../utils/config";
import { success, warn } from "../utils/log";
import { listDeployments } from "../utils/s3";

export default function list() {
  return new Command("link")
    .storeOptionsAsProperties(false)
    .description(
      "Get the URL for a demo. If no version is provided, show the link of the latest version.",
    )
    .action(action);
}

async function action(command: Command) {
  const config = await getConfig();

  const deployments = await listDeployments(
    config.profile.hosting.s3_bucket,
    config.client,
    config.project,
  );

  const { version } = command.opts();

  const deployment = version
    ? deployments.reverse().find(x => x.name.startsWith(version))
    : deployments[deployments.length - 1];

  if (deployment) {
    success(`https://demo.vzlab.com.br/${deployment.prefix}`);
  } else {
    const cmd = chalk.bold("necro list");
    warn(`Deployment not found.\nUse ${cmd} to get the available deployments.`);
  }
}
