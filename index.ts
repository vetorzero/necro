#!/usr/bin/env ts-node-script

import { program } from "commander";
import { readdirSync } from "fs";
import { join } from "path";
import { error } from "./src/utils/log";

Error.stackTraceLimit = Infinity;

/**
 * @TODO Subcommands:
 *
 *    raise       Publishes a new version of the demo site
 *    obliterate  Remove all instances of the demo site
 *    browse      Retrieves the link (?)
 */

async function main() {
  program.storeOptionsAsProperties(false);

  program.option("--debug", "Show extended debug information.", false);

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

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  const { debug } = program.opts();

  if (debug) {
    error("\n\n", err);
  } else {
    error("\nRun your command again with --debug to see more details.");
  }
});
