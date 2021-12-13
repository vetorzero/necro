import { getProjectBaseDirectory } from "./file";
import { readFileSync } from "fs";
import { join } from "path";
import Ajv, { JSONSchemaType } from "ajv";

export const CONFIG_FILE = "necro.json";

type ConfigCommon = {
  client: string;
  project: string;
  bucket: string;
  distFolder: string;
};
type ConfigPrivate = ConfigCommon & {
  public: false;
  username: string;
  password: string;
};
type ConfigPublic = ConfigCommon & {
  public: true;
};
type Config = ConfigPrivate | ConfigPublic;

function validateConfig(config: unknown): asserts config is Config {
  const schema: JSONSchemaType<Config> = {
    type: "object",
    properties: {
      bucket: { type: "string" },
      client: { type: "string" },
      project: { type: "string" },
      distFolder: { type: "string" },
      public: { type: "boolean" },
    },
    allOf: [
      {
        if: {
          properties: {
            public: { type: "boolean", const: false },
          },
        },
        then: {
          properties: {
            username: { type: "string" },
            password: { type: "string" },
          },
          required: ["username", "password"],
        },
      },
    ],
    required: ["bucket", "client", "project", "distFolder", "public"],
  };

  const ajv = new Ajv({ allErrors: true, verbose: true });
  const validate = ajv.compile(schema);

  const isValid = validate(config);
  if (!isValid) {
    throw new ValidationError(
      ajv.errorsText(validate.errors, {
        separator: "\n",
        dataVar: "config",
      }),
    );
  }
}

export function getConfig(): Config {
  const baseDir = getProjectBaseDirectory();
  if (baseDir === null) {
    throw new Error(`Couldn't find a necro config file.`);
  }

  const file = readFileSync(join(baseDir, CONFIG_FILE));
  const config = JSON.parse(file.toString()) as Config;
  validateConfig(config);

  return config;
}

export class ValidationError extends Error {
  constructor(public errorsText: string) {
    super();
  }
}
