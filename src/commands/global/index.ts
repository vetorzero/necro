import { Command } from "commander";
import config from "./config";

export default function () {
  // @TODO add description
  const cmd = new Command("global");
  // .description()

  cmd.addCommand(config);

  return cmd;
}
