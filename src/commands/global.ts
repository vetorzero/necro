import { Command } from "commander";
import config from "./global/config";

/**
 * @todo add description
 */
export default function global() {
  const cmd = new Command("global").storeOptionsAsProperties(false);
  cmd.addCommand(config());

  return cmd;
}
