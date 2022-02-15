import chalk from "chalk";

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
