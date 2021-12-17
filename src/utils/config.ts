import { getProjectBaseDirectory } from "./file";
import { readFileSync } from "fs";
import { join } from "path";
import Ajv from "ajv";
import assert from "assert";
import { homedir } from "os";
import yaml from "yaml";
import { merge } from "lodash";

export const PROJECT_CONFIG_FILE = "necro.json";
export const GLOBAL_CONFIG_FILE = join(homedir(), ".necrorc.yaml");

// load schema
const file = readFileSync(
  join(__dirname, "../@schema/config.schema.json"),
  "utf8",
);
const schema = JSON.parse(file);
assert(
  schema,
  "Invalid schema. Run `npm run generate-config-schema` to generate config schema from the definition file.",
);

// create schema validator
const ajv = new Ajv({ allErrors: true, verbose: true });
ajv.addSchema(schema);

export class ValidationError extends Error {
  constructor(public errorsText: string) {
    super();
  }
}

function validateConfig<T>(definition: string, data: any): asserts data is T {
  const validate = ajv.getSchema(definition);
  assert(validate, `Definition ${definition} not found in schema.`);

  const isValid = validate(data);
  if (!isValid) {
    throw new ValidationError(
      ajv.errorsText(validate.errors, {
        separator: "\n",
        dataVar: "data",
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
  validateConfig<T>("#/definitions/GlobalConfig", data);
}

/**
 * Get the merged configs from the global (~/.necrorc.yaml) and the
 * project (ROOT/necro.yaml) config files.
 */
export function getConfig(): ProjectConfig {
  /** @todo load global configs */

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

  const globalConfigFile = readFileSync(GLOBAL_CONFIG_FILE, "utf-8");
  const globalConfig = yaml.parse(globalConfigFile);
  validateGlobalConfig(globalConfig);

  return merge(globalConfig, projectConfig);
}
