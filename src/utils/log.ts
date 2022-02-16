import chalk from "chalk";
import { format } from "util";
import { multilinePad } from "./text";

export function success(arg0: any, ...args: any[]) {
  console.log(chalk.green(format(arg0, ...args)));
}
export function info(arg0: any, ...args: any[]) {
  console.info(format(arg0, ...args));
}
export function warn(arg0: any, ...args: any[]) {
  console.info(chalk.yellow(format(arg0, ...args)));
}
export function debug(arg0: any, ...args: any[]) {
  console.log(chalk.gray(format(arg0, ...args)));
}
export function error(arg0: any, ...args: any[]) {
  console.error(chalk.red(format(arg0, ...args)));
}
export function dir(x: any) {
  console.dir(x, { depth: null });
}

const log = {
  success,
  info,
  warn,
  debug,
  error,
};

export default log;
