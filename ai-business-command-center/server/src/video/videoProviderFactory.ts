import { env } from "../env.js";
import { errors } from "../lib/errors.js";
import { MockVideoProvider } from "./mockVideoProvider.js";
import type { VideoProvider } from "./videoProvider.types.js";

let cachedProvider: VideoProvider | null = null;

export function getVideoProvider(): VideoProvider {
  if (cachedProvider) return cachedProvider;

  if (env.VIDEO_PROVIDER === "mock") {
    cachedProvider = new MockVideoProvider();
    return cachedProvider;
  }

  throw errors.server(
    `VIDEO_PROVIDER=${env.VIDEO_PROVIDER} is not implemented yet. Add the chosen provider adapter first.`
  );
}
