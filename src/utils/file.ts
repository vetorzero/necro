import path, { basename, join } from "path";
import { existsSync, PathLike } from "fs";

export const CONFIG_FILE = "necro.json";

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

/**
 * Find the closest folder backwards containing a necro.json file.
 *
 * @returns A string with the folder, null otherwise.
 */
export function getProjectBaseDirectory(): string | null {
  const currentFolder = process.cwd();
  const parts = currentFolder
    .split(path.sep)
    // remove empty parts
    .filter((x) => x.length);

  while (parts.length) {
    const scanningPath = path.join("/", ...parts);
    if (existsSync(join(scanningPath, CONFIG_FILE))) {
      return scanningPath;
    }
    parts.pop();
  }

  return null;
}
