import { Command } from "commander";

const set = new Command("get").description(
  "reads a config variable for your user",
);

export default set;
