import { Command } from "commander";
import { log } from "../utils/log";
import { listDeployments, Deployment } from "../utils/s3";
import chalk from "chalk";

export default function list() {
  return new Command("list").description("List all versions of the current site.").action(action);
}

async function action(command: Command) {
  const client = "volvo";
  const project = "unlimited-dealers";

  const deployments = await listDeployments(client, project);

  log(`Found ${deployments.length} deployment(s).`);
  for (const deployment of deployments) {
    log(chalk.bold(deployment.name));
    log(`\tLast modified: ${deployment.lastModified.toUTCString()}`);
    log("");
  }
}
