#!/usr/bin/env ts-node-script

import { program } from "commander";
import { readdir } from "fs/promises";
import { join } from "path";
import { error } from "./src/utils/log";

Error.stackTraceLimit = Infinity;

async function main() {
  program.storeOptionsAsProperties(false);

  program.option("--debug", "Show extended debug information.");

  // load commands
  const commandsDir = join(__dirname, "src/commands");
  const commandFiles = await readdir(commandsDir);
  await Promise.all(
    commandFiles.map(async (file) => {
      const path = join(commandsDir, file);
      const { default: command } = await import(path);
      program.addCommand(command());
    }),
  );

  await program.parseAsync(process.argv).catch(commandError);
}
main().catch(mainError);

function commandError(err: unknown): void {
  const { debug } = program.opts();
  if (!debug) {
    error("\nRun your command again with --debug to see more details.");
  } else {
    error("\n\n", err);
  }
}

function mainError(err: unknown): void {
  error("Error on main: ", err);
}
