import { basename, join } from "path";
import { existsSync, PathLike } from "fs";

export function guessProjectName(): string {
  return basename(process.cwd());
}

export function guessClientName(): string {
  return basename(join(process.cwd(), ".."));
}

export function getCurrentDirectoryBase() {
  return basename(process.cwd());
}

export function directoryExists(path: string) {
  return existsSync(path);
}
