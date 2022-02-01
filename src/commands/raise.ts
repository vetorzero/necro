import { Command } from "commander";
import { join } from "path";
import {
  assertFileExists,
  assertIsDir,
  assertNotEmpty,
  getProjectBaseDirectory,
} from "../utils/file";
import { error, success } from "../utils/log";
import { getConfig, ValidationError } from "../utils/config";
import chalk from "chalk";
import assert from "assert";
import { sync } from "../lib/s3/sync";
import { createDistributionInvalidation } from "../lib/s3/cloudfront";

/**
 * @todo set passwords only on html files
 */
export default function raise() {
  return new Command("raise")
    .storeOptionsAsProperties(false)
    .alias("publish")
    .description("Publish a new version of a demo.")
    .option(
      "--version [number-or-name]",
      "The version of the demo. Defaults to the date and time of the invocation.",
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

  const version = encodeURIComponent(command.opts().version || createVersion());
  const baseDir = getProjectBaseDirectory()!;
  const sourceDir = join(baseDir, config.distFolder);
  const targetDir = `${config.client}/${config.project}/${version}`;
  const bucket = config.aws?.hosting?.s3Bucket;
  assert(bucket, "Bucket (config.aws.hosting.s3Bucket) is not defined.");
  const cfDistributionId = config.aws?.hosting?.cfDistributionId;
  assert(
    cfDistributionId,
    "CloudFront distribution ID (config.aws.hosting.cfDistributionId) is not defined.",
  );

  try {
    assertFileExists(sourceDir);
  } catch (err) {
    error(
      `Source dir "${sourceDir}" doesn't exist.\n` +
        `You should provide a valid path relative to the necro.json config file.`,
    );
    throw err;
  }

  try {
    assertIsDir(sourceDir);
  } catch (err) {
    error(
      `Source folder "${sourceDir}" is… well… not a folder.\n` +
        `You should provide a valid path relative to the necro.json config file.`,
    );
    throw err;
  }

  try {
    assertNotEmpty(sourceDir);
  } catch (err) {
    error(
      `Source folder "${sourceDir}" is empty.\n` +
        `Make sure to build yout project before raising the demo.`,
    );
    throw err;
  }

  const options: Record<string, string> = {};
  if (!config.public) {
    options["auth"] =
      encodeURIComponent(config.username) +
      ":" +
      encodeURIComponent(config.password);
  }

  await sync(sourceDir, targetDir, bucket, options);

  try {
    await createDistributionInvalidation(cfDistributionId, targetDir);
  } catch (err) {
    throw err;
  }

  success("Demo successfully raised");
}

/**
 * Get the current date as YYYY-MM-DD.
 */
function createVersion(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}
