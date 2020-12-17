import { Command } from "commander";
import { listDeployments, Deployment } from "../utils/s3";

export default function list() {
  return new Command("list").description("List all versions of the current site.").action(action);
}

async function action(command: Command) {
  const client = "volvo";
  const project = "unlimited-dealers";

  const deployments = await listDeployments(client, project);
  console.log({ deployments });

  // const { client } = command.opts();

  // // console.log(client);
  // // const clients = await getClients();
  // // console.log(clients);

  // const projects = await listProjects(client);
  // console.log(projects);
}
