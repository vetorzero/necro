import chalk from "chalk";
import { format } from "util";

export function success(arg0: any, ...args: any[]) {
  console.log(chalk.green(format(arg0, ...args)));
}
export function info(arg0: any, ...args: any[]) {
  console.info(chalk.green(format(arg0, ...args)));
}
export function log(arg0: any, ...args: any[]) {
  console.log(arg0, ...args);
}
export function error(arg0: any, ...args: any[]) {
  console.error(chalk.redBright(format(arg0, ...args)));
}

export default {
  success,
  info,
  log,
  error,
};
