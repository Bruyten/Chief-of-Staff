import {
  ensureAvailableUsage,
  refundUsage,
  reserveUsage,
} from "./usage.service.js";

export async function assertVideoStudioAccess(userId: string) {
  return ensureAvailableUsage(userId, "video", 0);
}

export async function consumeVideoCredit(userId: string): Promise<number> {
  const result = await reserveUsage(userId, "video", 1, "video_job_submit");
  return result.remaining;
}

export async function refundVideoCredit(userId: string): Promise<number> {
  const result = await refundUsage(userId, "video", 1, "video_job_refund");
  return result.remaining;
}
