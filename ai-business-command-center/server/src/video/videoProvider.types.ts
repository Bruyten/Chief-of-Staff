export type VideoProviderCreateInput = {
  internalJobId: string;
  promptBrief: string;
  aspectRatio: "9:16" | "1:1" | "16:9";
  durationSeconds: 6 | 8 | 12;
  title: string;
};

export type VideoProviderCreateResult = {
  externalJobId: string;
  providerStatus: string;
  raw?: Record<string, unknown>;
};

export type VideoProviderPollInput = {
  externalJobId: string;
  internalJobId: string;
  pollAttempts: number;
};

export type VideoProviderPollResult = {
  providerStatus: string;
  normalizedStatus: "submitted" | "processing" | "completed" | "failed";
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
  raw?: Record<string, unknown>;
};

export interface VideoProvider {
  readonly name: string;
  createJob(input: VideoProviderCreateInput): Promise<VideoProviderCreateResult>;
  pollJob(input: VideoProviderPollInput): Promise<VideoProviderPollResult>;
}
