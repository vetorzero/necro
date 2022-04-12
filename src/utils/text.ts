import chalk from "chalk";
import { format } from "date-fns";

export function multilinePad(s: string, spaces: number = 4, fillChar: string = " "): string {
  return s
    .split("\n")
    .map(l => fillChar.repeat(spaces) + l)
    .join("\n");
}

export const banner = chalk.red(
  "\n" +
    `  @@@  @@@ @@@@@@@@  @@@@@@@ @@@@@@@   @@@@@@\n` +
    `  @@!@!@@@ @@!      !@@      @@!  @@@ @@!  @@@\n` +
    `  @!@@!!@! @!!!:!   !@!      @!@!!@!  @!@  !@!\n` +
    `  !!:  !!! !!:      :!!      !!: :!!  !!:  !!!\n` +
    `  ::    :  : :: :::  :: :: :  :   : :  : :. :\n`,
);

/**
 * Get the current date as YYYY-MM-DD.
 */
export function createVersion(): string {
  return format(Date.now(), "yyyy-MM-dd");
}
