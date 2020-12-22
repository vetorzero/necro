import { Command } from "commander";
import { join } from "path";
import {
  assertFileExists,
  assertIsDir,
  assertNotEmpty,
  getProjectBaseDirectory,
} from "../utils/file";
import { error, log, success } from "../utils/log";
import { syncDir } from "../utils/s3";
import { getConfig, ValidationError } from "../utils/config";
import chalk from "chalk";

export default function raise() {
  return new Command("raise").action(action);
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

  const baseDir = getProjectBaseDirectory()!;
  const sourceDir = join(baseDir, config.distFolder);
  const targetDir = `${config.client}/${config.project}`;

  try {
    assertFileExists(sourceDir);
  } catch (err) {
    error(`Source dir "${sourceDir}" doesn't exist.
You should provide a valid path relative to the necro.json config file.`);
    throw err;
  }

  try {
    assertIsDir(sourceDir);
  } catch (err) {
    error(`Source folder "${sourceDir}" is… well… not a folder.
You should provide a valid path relative to the necro.json config file.`);
    throw err;
  }

  try {
    assertNotEmpty(sourceDir);
  } catch (err) {
    error(`Source folder "${sourceDir}" is empty.
Make sure to build yout project before raising the demo.`);
    throw err;
  }

  const options: { [k: string]: any } = {};
  if (!config.public) {
    options["auth"] =
      encodeURIComponent(config.username) +
      ":" +
      encodeURIComponent(config.password);
  }
  console.log(options);
  await syncDir(sourceDir, targetDir, options);

  success("Demo successfully raised");
}
