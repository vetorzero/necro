import { Command } from "commander";
import config from "./config";

/**
 * @todo add description
 */
export default function global() {
  const cmd = new Command("global").description("Actions for the whole demo legion.");

  cmd.addCommand(config());

  return cmd;
}
