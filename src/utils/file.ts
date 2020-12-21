import path, { basename, join } from "path";
import { existsSync, lstatSync, readdirSync } from "fs";

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

type ListDirOptions = {
  /** Whether or not directories should be included in the results. */
  includeDirs?: boolean;
  /** Traverse the dir using breadth or depth first search. */
  mode?: "BFS" | "DFS";
};
/**
 * Deeply list the files of a directory using a BFS algorithm.
 */
export function listDir(base: string, options?: ListDirOptions): string[] {
  const defaultOptions = { includeDirs: false, mode: "BFS" };
  const { includeDirs, mode } = { ...defaultOptions, ...options };

  const found: string[] = [];
  const queue = [base];
  while (queue.length) {
    const current = mode === "BFS" ? queue.shift()! : queue.pop()!;
    const recurse = isDir(current);
    if (recurse) {
      const ls = readdirSync(current).map((x) => join(current, x));
      queue.push(...ls);
    }
    if (!recurse || includeDirs) {
      found.push(current);
    }
  }
  return found;
}

/**
 * Tells wheter or not a path is a directory.
 */
function isDir(path: string) {
  try {
    const stat = lstatSync(path);
    return stat.isDirectory();
  } catch (err) {
    return false;
  }
}
