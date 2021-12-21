import assert from "assert";
import chalk from "chalk";
import { Command } from "commander";
import { getConfig, ValidationError } from "../utils/config";
import { error, success, warn } from "../utils/log";
import { listDeployments } from "../utils/s3";

export default function list() {
  return new Command("link")
    .storeOptionsAsProperties(false)
    .description(
      "Get the URL for a demo. If no version is provided, show the link of the latest version.",
      {
        v: "The specific version of the demo.",
      },
    )
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

  const bucket = config.aws?.hosting?.s3Bucket;
  assert(bucket, "Bucket not defined.");

  const deployments = await listDeployments(
    bucket,
    config.client,
    config.project,
  );

  const { version } = command.opts();
  // log(command.opts());

  const deployment = version
    ? deployments.reverse().find((x) => x.name.startsWith(version))
    : deployments[deployments.length - 1];

  if (deployment) {
    success(`https://demo.vzlab.com.br/${deployment.prefix}`);
  } else {
    const cmd = chalk.bold("necro list");
    warn(`Deployment not found.
Use ${cmd} to get the available deployments.
`);
  }
}
