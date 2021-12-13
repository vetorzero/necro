import { Command } from "commander";
import set from "./set";
import get from "./get";
import getAll from "./get-all";

const config = new Command("config");

config.addCommand(get);
config.addCommand(set);
config.addCommand(getAll);

export default config;
