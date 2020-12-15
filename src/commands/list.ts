import { Command } from "commander";

export default function list() {
  return new Command("list").description("List all versions of the current site.");
}
