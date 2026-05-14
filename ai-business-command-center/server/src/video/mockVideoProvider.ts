import { env } from "../env.js";
import type {
  VideoProvider,
  VideoProviderCreateInput,
  VideoProviderCreateResult,
  VideoProviderPollInput,
  VideoProviderPollResult,
} from "./videoProvider.types.js";

export class MockVideoProvider implements VideoProvider {
  readonly name = "mock";

  async createJob(input: VideoProviderCreateInput): Promise<VideoProviderCreateResult> {
    return {
      externalJobId: `mock_video_${input.internalJobId}_${Date.now()}`,
      providerStatus: "queued",
      raw: {
        mode: "mock",
        title: input.title,
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
      },
    };
  }

  async pollJob(input: VideoProviderPollInput): Promise<VideoProviderPollResult> {
    if (input.pollAttempts >= 1) {
      return {
        providerStatus: "completed",
        normalizedStatus: "completed",
        videoUrl: env.VIDEO_MOCK_COMPLETED_URL || null,
        thumbnailUrl: null,
        raw: {
          mode: "mock",
          pollAttempts: input.pollAttempts,
        },
      };
    }

    return {
      providerStatus: "processing",
      normalizedStatus: "processing",
      raw: {
        mode: "mock",
        pollAttempts: input.pollAttempts,
      },
    };
  }
}
