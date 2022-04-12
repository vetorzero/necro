import { Command } from "commander";
import { getDomainName } from "../lib/aws/cloudfront";
import { getConfig } from "../lib/config/merged";
import { info } from "../utils/log";
import { createVersion } from "../utils/text";

export default function init() {
  return new Command("target-url").description("Create an URL for the next demo.").action(action);
}

async function action(command: Command) {
  let config = await getConfig();

  const version = encodeURIComponent(command.opts().version ?? config.version ?? createVersion());
  const cfDistributionId = config.profile.hosting.cloudfront_distribution_id;
  const domainName = await getDomainName(cfDistributionId);
  const targetDir = `${config.client}/${config.project}/${version}`;

  info(`https://${domainName}/${targetDir}/`);
}
