import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import { createDistributionInvalidation } from "../lib/aws/cloudfront";
import { getConfig } from "../lib/config/merged";
import { singlePrompt } from "../utils/cli";
import { debug, info } from "../utils/log";
import { emptyS3Directory, listDeployments } from "../utils/s3";

export default function list() {
  return new Command("delete").description("Delete current project.").action(action);
}

async function action(command: Command) {
  const config = await getConfig();
  const deployments = await listDeployments(
    config.profile.hosting.s3_bucket,
    config.client,
    config.project,
  );

  debug(`Found ${deployments.length} deployment(s).`);
  if (deployments.length === 0) {
    return;
  }

  const answer: string[] = await singlePrompt({
    message: "Select deployments to delete",
    type: "checkbox",
    when: () => deployments.length > 0,
    choices: deployments.map((deployment, index) => ({
      name: `${chalk.bold(
        deployment.name,
      )} - Last modified: ${deployment.lastModified.toUTCString()}`,
      value: deployment.name,
    })),
  });

  if (answer?.length === 0) {
    info("No deployments selected.");
    return;
  }

  const deploymentsToDelete = deployments.filter(deployment => answer.includes(deployment.name));

  for (const deployment of deploymentsToDelete) {
    await emptyS3Directory(config.profile.hosting.s3_bucket, deployment.prefix);
  }

  const targetDir = `${config.client}/${config.project}`;
  const cfDistributionId = config.profile.hosting.cloudfront_distribution_id;
  await createDistributionInvalidation(cfDistributionId, targetDir);
}
