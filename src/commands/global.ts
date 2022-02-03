import { Command } from "commander";
import config from "./global/config";

/**
 * @todo add description
 */
export default function global() {
  const cmd = new Command("global").storeOptionsAsProperties(false);
  // .description(
  //   "Get the URL for a demo. If no version is provided, show the link of the latest version.",
  //   {
  //     v: "The specific version of the demo.",
  //   },
  // );

  cmd.addCommand(config());

  return cmd;
}
