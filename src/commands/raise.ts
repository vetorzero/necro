import { Command, program } from "commander";
import { join } from "path";
import {
  assertFileExists,
  assertIsDir,
  assertNotEmpty,
  getProjectBaseDirectory,
} from "../utils/file";
import { error, info, success } from "../utils/log";
import { getConfig, ValidationError } from "../utils/config";
import chalk from "chalk";
import assert from "assert";
import { sync } from "../lib/s3/sync";
import {
  createDistributionInvalidation,
  getDomainName,
} from "../lib/s3/cloudfront";

/**
 * @todo set passwords only on html files
 */
export default function raise() {
  return new Command("raise")
    .storeOptionsAsProperties(false)
    .alias("publish")
    .description("Publish a new version of a demo.")
    .option(
      "--version <number-or-name>",
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
      throw err;
    } else {
      const cmd = chalk.bold("necro init");
      throw new Error(
        `Couldn't find a necro config file.` +
          `\nConfigure necro by running ${cmd} in the root directory of your project.`,
      );
    }
  }

  const version = encodeURIComponent(command.opts().version || createVersion());
  const baseDir = getProjectBaseDirectory()!;
  const sourceDir = join(baseDir, config.dist_folder);
  const targetDir = `${config.client}/${config.project}/${version}`;
  const bucket = config.hosting?.s3_bucket;
  assert(bucket, "Bucket (hosting.s3_bucket) is not defined.");
  const cfDistributionId = config.hosting?.cloudfront_distribution_id;
  assert(
    cfDistributionId,
    "CloudFront distribution ID (hosting.cloudfront_distribution_id) is not defined.",
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

  const [createdFiles, deletedFiles] = await sync(
    sourceDir,
    targetDir,
    bucket,
    options,
  );

  try {
    if (deletedFiles.length) {
      await createDistributionInvalidation(cfDistributionId, targetDir);
    } else {
      console.log(`🌤  No need to clear the CloudFront cache at this time.`);
    }
  } catch (err) {
    throw err;
  }

  const domainName = await getDomainName(cfDistributionId);
  info(`🔗 http://${domainName}/${targetDir}`);
}

/**
 * Get the current date as YYYY-MM-DD.
 */
function createVersion(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}
