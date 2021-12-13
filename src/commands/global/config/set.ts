import { Command } from "commander";

const set = new Command("set").description(
  "writes a config variable for your user",
);

export default set;
