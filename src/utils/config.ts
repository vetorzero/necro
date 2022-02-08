import { getProjectBaseDirectory } from "./file";
import { readFileSync } from "fs";
import { join } from "path";
import Ajv from "ajv";
import assert from "assert";
import { homedir } from "os";
import yaml from "yaml";
import { merge } from "lodash";
import schema from "../@schema/config.schema.json";
import { program } from "commander";
import { profile } from "console";

export const PROJECT_CONFIG_FILE = "necro.json";
export const GLOBAL_CONFIG_FILE = join(homedir(), ".necrorc.yaml");

// create schema validator
const ajv = new Ajv({ allErrors: true, verbose: true });

// load schema
assert(
  schema,
  "Invalid schema. Run `npm run generate-config-schema` to generate config schema from the definition file.",
);
ajv.addSchema(schema);

export class ValidationError extends Error {
  constructor(public errorsText: string) {
    super();
    this.message = errorsText;
  }
}

function validateConfig<T>(
  definition: string,
  data: any,
  dataVar: string = "",
): asserts data is T {
  const validate = ajv.getSchema(definition);
  assert(validate, `Definition ${definition} not found in schema.`);

  const isValid = validate(data);
  if (!isValid) {
    throw new ValidationError(
      ajv.errorsText(validate.errors, {
        separator: "\n",
        dataVar,
      }),
    );
  }
}

/**
 * Check if the local config is valid.
 */
function validateProjectConfig<T extends ProjectConfig>(
  data: any,
): asserts data is T {
  validateConfig<T>("#/definitions/ProjectConfig", data);
}

/**
 * Check if the global config is valid.
 */
function validateGlobalConfig<T extends GlobalConfig>(
  data: any,
): asserts data is T {
  validateConfig<T>("#/definitions/GlobalConfig", data, "global");
}

/**
 * Get the merged configs from the global (~/.necrorc.yaml) and the
 * project (ROOT/necro.yaml) config files.
 *
 * @todo make local config supersede global
 * @todo bizarre errors when schema is slightly out of sync
 */
export function getConfig(): NecroConfig {
  const globalConfigFile = readFileSync(GLOBAL_CONFIG_FILE, "utf-8");
  const globalConfig = yaml.parse(globalConfigFile) ?? {};
  validateGlobalConfig(globalConfig);

  // select profile
  const selectedProfileName: string | undefined =
    program.opts()?.profile ?? globalConfig.default_profile;
  assert(
    selectedProfileName,
    `Default profile not configured nor custom profile provided via command.\nRun "necro global config" to start using Necro.`,
  );

  const selectedProfile: Profile | undefined = globalConfig.profiles?.find(
    (p) => p.name === selectedProfileName,
  );
  assert(
    selectedProfile,
    `Profile "${selectedProfileName}" does not exist in the global config.\nRun "necro global config" to start using Necro.`,
  );

  // load project config
  const baseDir = getProjectBaseDirectory();
  if (baseDir === null) {
    throw new Error(`Couldn't find a necro config file.`);
  }

  const projectConfigFile = readFileSync(
    join(baseDir, PROJECT_CONFIG_FILE),
    "utf-8",
  );

  const projectConfig = JSON.parse(projectConfigFile);
  validateProjectConfig(projectConfig);

  // merge configs
  const mergedConfigs = merge(selectedProfile, projectConfig);

  return mergedConfigs;
}
