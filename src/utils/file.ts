import path, { basename, join } from "path";
import { existsSync, lstatSync, PathLike, readdirSync } from "fs";
import { assert } from "console";
import { AssertionError } from "assert";

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

/**
 * Asserts that path is a valid file/dir/link.
 */
export function assertFileExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Path ${path} doesn't exist.`);
  }
}

/**
 * Asserts that path is a valid dir.
 */
export function assertIsDir(path: string): void {
  const stat = lstatSync(path);
  if (!stat.isDirectory()) {
    throw new Error(`Path ${path} is not a dir.`);
  }
}

/**
 * Asserts that a folder is not empty
 */
export function assertNotEmpty(path: string): void {
  const ls = readdirSync(path);
  if (!ls.length) {
    throw new Error(`Dir ${path} is empty.`);
  }
}
