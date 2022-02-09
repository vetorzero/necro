// --------------------------------------------------------
//                     GLOBAL CONFIG

/**
 * Global configurations that should be defined on `~/.necrorc.yaml`.
 */
type GlobalConfig = {
  default_profile?: string;
  profiles?: Config.Profile[];
};
type AWSCredentials = {
  user_key: string;
  user_secret: string;
};
type AWSHosting = {
  s3_bucket: string;
  cloudfront_distribution_id: string;
};

// --------------------------------------------------------
//                     PROJECT CONFIG

type ProjectConfig = {
  client: string;
  project: string;
  dist_folder: string;
  profile?: Config.Profile;
  auth?: Config.Auth;
};

declare namespace Config {
  type Auth = {
    /**
     * A username for the client authentication
     */
    username: string;

    /**
     * A password for client authentication
     */
    password: string;
  };

  type Profile = {
    /**
     * And identifier for the profile when using the global config.
     */
    name?: string;

    /**
     * The identification of a AWS user.
     * Leave it empty to use the current credentials configured via the AWS CLI.
     */
    credentials?: AWSCredentials;

    /**
     * The AWS resources used to serve this demo.
     */
    hosting: AWSHosting;
  };

  type MergedConfig = ProjectConfig & {
    profile: Config.Profile;
  };
}
