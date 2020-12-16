#!/usr/bin/env ts-node-script

import chalk from "chalk";
import { program } from "commander";
import { readdirSync } from "fs";
import { join } from "path";
import { format } from "util";

/**
 * @TODO Subcommands:
 *
 *    raise       Publishes a new version of the demo site
 *    obliterate  Remove all instances of the demo site
 *    browse      Retrieves the link (?)
 */

async function main() {
  program.storeOptionsAsProperties(false);
  program.version("0.0.0");

  // load commands
  const commandsDir = join(__dirname, "src/commands");
  const commandFiles = readdirSync(commandsDir);
  await Promise.all(
    commandFiles.map(async (file) => {
      const path = join(commandsDir, file);
      const { default: command } = await import(path);
      program.addCommand(command());
    }),
  );

  program.parse(process.argv);
}

main().catch((err) => {
  console.error(chalk.red(format("Oops. Something went wrong...\n\n", err)));
});
