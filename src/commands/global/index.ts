import { Command } from "commander";
import config from "./config";
import listDemos from "./list-demos";

/**
 * @todo add description
 */
export default function global() {
  const cmd = new Command("global")
    .aliases(["g"])
    .description("Actions for the whole demo legion.");

  cmd.addCommand(config());
  cmd.addCommand(listDemos());

  return cmd;
}
