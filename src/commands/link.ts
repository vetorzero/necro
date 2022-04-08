/**
 *
 *
 *            TO REFACTOR
 *
 *
 */

import chalk from "chalk";
import { Command } from "commander";
import { getDomainName } from "../lib/aws/cloudfront";
import { getConfig } from "../lib/config/merged";
import { dir, info, success, warn } from "../utils/log";
import { listDeployments } from "../utils/s3";

export default function list() {
  return new Command("link")
    .description(
      "Get the URL for a demo. If no version is provided, show the link of the latest version.",
    )
    .action(action);
}

async function action(command: Command) {
  const config = await getConfig();
  const cfDistributionId = config.profile.hosting.cloudfront_distribution_id;

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
    const domainName = await getDomainName(cfDistributionId);
    info(`🔗 https://${domainName}/${deployment.prefix}/`);
  } else {
    const cmd = chalk.bold("necro list");
    warn(`Deployment not found.\nUse ${cmd} to get the available deployments.`);
  }
}
