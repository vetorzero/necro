#!/usr/bin/env node

import chalk from "chalk";
import { program } from "commander";
import { readdir } from "fs/promises";
import { join } from "path";
import { error } from "./src/utils/log";
import { multilinePad } from "./src/utils/text";

Error.stackTraceLimit = Infinity;

async function main() {
  program.storeOptionsAsProperties(false);

  program.option("--debug", "Show extended debug information.");
  program.option(
    "--profile <profile-name>",
    "Use a specific profile from the global configuration.",
  );

  // load commands
  const commandsDir = join(__dirname, "src/commands");
  const commandFiles = await readdir(commandsDir, { withFileTypes: true });
  await Promise.all(
    commandFiles.map(async file => {
      if (!file.isFile()) return; // skip dirs
      const path = join(commandsDir, file.name);
      const { default: command } = await import(path);
      program.addCommand(command());
    }),
  );

  await program.parseAsync(process.argv).catch(commandError);
}
main().catch(mainError);

function commandError(err: Error | any): void {
  const { debug } = program.opts();
  if (!debug) {
    error(
      `\nError:\n` +
        chalk.bold(multilinePad(err?.message ?? err)) +
        "\n\nRun your command again with --debug to see more details.",
    );
  } else {
    error("\n\n", err);
  }
}

function mainError(err: unknown): void {
  error("Error on main: ", err);
}
