import chalk from "chalk";
import { format } from "util";

export function success(arg0: any, ...args: any[]) {
  console.log(chalk.green(format(arg0, ...args)));
}
export function info(arg0: any, ...args: any[]) {
  console.info(chalk.blue(format(arg0, ...args)));
}
export function warn(arg0: any, ...args: any[]) {
  console.info(chalk.yellow(format(arg0, ...args)));
}
export function debug(arg0: any, ...args: any[]) {
  console.log(arg0, ...args);
}
export function error(arg0: any, ...args: any[]) {
  console.error(chalk.redBright(format(arg0, ...args)));
}
export function header(str: string): void {
  debug(`\n  ${str}\n`);
}

const log = {
  success,
  info,
  warn,
  debug,
  error,
  header,
};

export default log;
