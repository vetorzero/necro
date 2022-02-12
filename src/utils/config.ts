import Ajv, { ValidateFunction } from "ajv";
import assert from "assert";
import chalk from "chalk";
import { program } from "commander";
import { PathLike } from "fs";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import YAML from "yaml";
import schema from "../@schema/config.schema.json";
import { getProjectBaseDirectory } from "./file";
import { info } from "./log";

export const PROJECT_CONFIG_FILE = "necro.yaml";
export const GLOBAL_CONFIG_FILE = join(homedir(), ".necrorc.yaml");

// create schema validator
const ajv = new Ajv({ allErrors: true, verbose: true });

// load schema
assert(
  schema,
  "Invalid schema. Run `npm run generate-config-schema` to generate config schema from the definition file.",
);
ajv.addSchema(schema);

/**
 * Get the merged configs from the global (~/.necrorc.yaml) and the
 * project (ROOT/necro.yaml) config files.
 *
 * Config priority:
 *  - --profile option
 *  - project config
 *  - global config with default profile
 */
export async function getConfig(): Promise<Config.MergedConfig> {
  if (!configPromise) {
    configPromise = loadConfig();
  }
  return configPromise;
}
let configPromise: Promise<Config.MergedConfig>;

export async function loadConfig(): Promise<Config.MergedConfig> {
  // find the project's root dir
  const baseDir = getProjectBaseDirectory();
  assert(baseDir, `Couldn't find a necro config file.`);

  // load project config
  const projectConfig = (await loadYaml<ProjectConfig>(
    join(baseDir, PROJECT_CONFIG_FILE),
    "#/definitions/ProjectConfig",
  )) as ProjectConfig;

  // load global config
  const globalConfig = await loadYaml<GlobalConfig>(
    GLOBAL_CONFIG_FILE,
    "#/definitions/GlobalConfig",
  );

  // select profile
  const profileName = program.opts()?.profile ?? globalConfig?.default_profile;
  const profile = globalConfig?.profiles?.find(p => p.name === profileName);
  if (profileName) {
    assert(profile, `Profile "${profileName}" doesn't exist.`);
  }

  // merge configs
  const config = { ...projectConfig };
  if (program.opts()?.profile && profile) {
    info(`👷 Using profile ${chalk.bold(profileName)} from CLI.`);
    config.profile = profile;
  } else if (projectConfig.profile) {
    info(`👷 Using profile from project.`);
  } else if (profile !== undefined) {
    info(`👷 Using profile ${chalk.bold(profileName)} from global config file.`);
    config.profile = profile;
  } else {
    throw new Error(
      `Can't find a profile for publishing.` +
        `\nRun "necro global config" to create a global profile` +
        `\nor add a "profile" property to the project configuration.`,
    );
  }

  return config as Config.MergedConfig;
}

async function loadYaml<T>(path: PathLike, schema: string): Promise<T | null> {
  const contents = await readFile(path, "utf-8").catch(err => {
    switch (err?.code) {
      case "ENOENT":
        return null;
      default:
        // file not readable
        throw new Error(
          `The config file ${path} is not readable.` +
            `\nMake sure you are its owner and have read and write access (at least 0600) to it.`,
        );
    }
  });
  if (contents === null) return null;

  const parsed = YAML.parse(contents); // @todo check for errors

  const validator = ajv.getSchema(schema);
  assert(validator, `Schema ${schema} doens't exist.`);

  validateConfig<T>(validator, parsed);

  return parsed;
}

function validateConfig<T>(validate: ValidateFunction, data: any): asserts data is T {
  const isValid = validate(data);
  if (!isValid) {
    throw new ValidationError(
      ajv.errorsText(validate.errors, {
        separator: "\n",
        dataVar: "config",
      }),
    );
  }
}

export class ValidationError extends Error {
  constructor(public errorsText: string) {
    super();
    this.message = errorsText;
  }
}
