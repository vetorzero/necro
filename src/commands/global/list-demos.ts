import chalk from "chalk";
import commander from "commander";
import { listProjects } from "../../lib/aws/s3";
import { getProfile } from "../../utils/config";
import { dir, info } from "../../utils/log";

export default function () {
  const cmd = commander
    .command("list-demos")
    .aliases(["ld"])
    .description("List all the demos for the current profile.")
    .action(action);
  return cmd;
}

async function action(cmd: commander.Command) {
  const profile = await getProfile();
  info(`\nListing projects for the profile "${chalk.bold(profile.name)}"...`);

  const clients = await listProjects(profile.hosting.s3_bucket);
  for (const client of clients) {
    info(`\nclient: ${chalk.bold(client.name)}`);
    info(`projects:`);
    for (const project of client.projects) {
      info(`  /${client.name}/${chalk.bold(project.name)}`);
    }
  }
}
