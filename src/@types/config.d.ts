// ===========================================
//                  Global

type GlobalConfig = {
  default_profile: string;
  profiles: GlobalConfig.Profile[];
};

declare namespace GlobalConfig {
  type Profile = {
    /**
     * And identifier for the profile.
     */
    name: string;

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

  type AWSCredentials = {
    user_key: string;
    user_secret: string;
  };

  type AWSHosting = {
    s3_bucket: string;
    cloudfront_distribution_id: string;
  };
}

// ===========================================
//                  Project

type ProjectConfig = {
  client: string;
  project: string;
  dist_folder: string;
  auth?: ProjectConfig.Auth;
  use_profile?: string;
};

type MergedConfig = ProjectConfig & {
  profile: GlobalConfig.Profile;
};

declare namespace ProjectConfig {
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
}
