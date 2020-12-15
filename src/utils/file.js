import { basename } from "path";
import { existsSync } from "fs";

export function getCurrentDirectoryBase() {
  return basename(process.cwd());
}

export function directoryExists(path) {
  return existsSync(path);
}
