import { Command } from "commander";

const getAll = new Command("get-all").description(
  "reads all the config variables for your user",
);

export default getAll;
