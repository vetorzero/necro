type ConfigCommon = {
  /**
   * Who's the client that this demo will be sent to?
   */
  client: string;

  /**
   * The codename of the project. (usually the same as the git repos)
   * Avoid using names that are too specific, as they tend to change a lot.
   */
  project: string;

  /**
   * Where do the built files live?
   */
  distFolder: string;

  /**
   * Whether or not this demo will require a password.
   */
  public: boolean;

  /**
   * AWS Configuration.
   */
  aws?: Partial<AWSConfig>;
};

/**
 * The configs for a private demo that requires username and password
 * for authentication.
 */
type ConfigPrivate = ConfigCommon & {
  public: false;
  username: string;
  password: string;
};

/**
 * The configs for a public demo.
 */
type ConfigPublic = ConfigCommon & {
  public: true;
};

/**
 * The configs of the AWS account.
 */
type AWSConfig = {
  region?: string;
  hosting: HostingConfig;
  credentials?: AWSCredentialsConfig;
};

/**
 * The configs for the hosting services.
 */
type HostingConfig = {
  s3Bucket: string;
  cfDistributionId: string;
};

/**
 * Security credentials for AWS.
 */
type AWSCredentialsConfig = {
  id: string;
  secret: string;
};

/**
 * Project configutations that should be defined on `.necro`,
 * at the root of the project.
 */
type ProjectConfig = ConfigPrivate | ConfigPublic;

/**
 * Global configurations that should be defined on `~/.necrorc.yaml`.
 */
type GlobalConfig = {
  aws?: AWSConfig;
};
