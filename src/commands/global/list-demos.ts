import commander, { program } from "commander";
import { listClients } from "../../lib/aws/s3";
import { getGlobalConfig } from "../../lib/config/global";
import { getProfile } from "../../utils/config";
import { dir } from "../../utils/log";

export default function () {
  const cmd = commander
    .command("list-demos")
    .description("List all the demos for the current profile.")
    .action(action);
  return cmd;
}

async function action(cmd: commander.Command) {
  const profile = await getProfile();
  const clients = await listClients(profile.hosting.s3_bucket);

  dir(clients);
}
