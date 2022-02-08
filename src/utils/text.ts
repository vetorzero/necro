export function multilinePad(
  s: string,
  spaces: number = 4,
  fillChar: string = " ",
): string {
  return s
    .split("\n")
    .map((l) => fillChar.repeat(spaces) + l)
    .join("\n");
}
