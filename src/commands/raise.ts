/**
 *
 *
 *            TO REFACTOR
 *
 *
 */

import { Command } from "commander";
import { format } from "date-fns";
import { join } from "path";
import { createDistributionInvalidation, getDomainName } from "../lib/aws/cloudfront";
import { sync } from "../lib/aws/sync";
import { getConfig } from "../lib/config/merged";
import {
  assertFileExists,
  assertIsDir,
  assertNotEmpty,
  getProjectBaseDirectory,
} from "../utils/file";
import { error, info } from "../utils/log";
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
  let config = await getConfig();

  const version = encodeURIComponent(command.opts().version ?? config.version ?? createVersion());
  const baseDir = getProjectBaseDirectory()!;
  const sourceDir = join(baseDir, config.dist_folder);
  const targetDir = `${config.client}/${config.project}/${version}`;
  const bucket = config.profile.hosting.s3_bucket;
  const cfDistributionId = config.profile.hosting.cloudfront_distribution_id;

  try {
    assertFileExists(sourceDir);
  } catch (err) {
    error(
      `Source dir "${sourceDir}" doesn't exist.\n` +
        `You should provide a valid path relative to the "necro.yaml" config file.`,
    );
    throw err;
  }

  try {
    assertIsDir(sourceDir);
  } catch (err) {
    error(
      `Source folder "${sourceDir}" is… well… not a folder.\n` +
        `You should provide a valid path relative to the "necro.yaml" config file.`,
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
  if (config.auth) {
    options["auth"] =
      encodeURIComponent(config.auth.username) + ":" + encodeURIComponent(config.auth.password);
  }

  const [createdFiles, deletedFiles] = await sync(sourceDir, targetDir, bucket, options);

  try {
    if (deletedFiles.length) {
      await createDistributionInvalidation(cfDistributionId, targetDir);
    } else {
      info(`🌤  No need to clear CloudFront cache at this time.`);
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
  return format(Date.now(), "yyyy-MM-dd");
}
