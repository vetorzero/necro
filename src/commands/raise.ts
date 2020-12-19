import { Command } from "commander";
import { join } from "path";
import { assertFileExists, assertIsDir, assertNotEmpty } from "../utils/file";
import { error, log } from "../utils/log";

export default function raise() {
  return new Command("raise").action(action);
}

async function action(command: Command) {
  // @todo read config from necro.json
  const client = "necro";
  const project = "testes";
  const distFolder = join(process.cwd(), "./dista");

  try {
    assertFileExists(distFolder);
  } catch (err) {
    error(`Source folder "${distFolder}" doesn't exist.
You should provide a valid path relative to the necro.json config file.`);
    throw err;
  }

  try {
    assertIsDir(distFolder);
  } catch (err) {
    error(`Source folder "${distFolder}" is… well… not a folder.
    You should provide a valid path relative to the necro.json config file.`);
    throw err;
  }

  try {
    assertNotEmpty(distFolder);
  } catch (err) {
    error(`Source folder "${distFolder}" is empty.
Make sure to build yout project before raising the demo`);
    throw err;
  }

  // const result = await deploy(client, project, distFolder);
}
