import { getProfile } from "../../utils/config";
import { getProjectConfig } from "./project";

export async function getConfig(): Promise<MergedConfig> {
  try {
    const projectConfig = await getProjectConfig();
    const profile = await getProfile();

    return { ...projectConfig, profile };
  } catch (err) {
    throw err;
  }
}
