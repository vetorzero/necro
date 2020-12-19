import { Command } from "commander";
import { log } from "../utils/log";
import { deploy } from "../utils/s3";

export default function raise() {
  return new Command("raise").action(action);
}

async function action(command: Command) {
  const client = "necro";
  const project = "testes";
  const distFolder = "./distas";

  const result = await deploy(client, project, distFolder);

  log(result);
}
