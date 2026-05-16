import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";

import { requireAuth } from "../middleware/requireAuth.js";
import { videoGenerationLimiter } from "../middleware/rateLimit.js";
import { errors } from "../lib/errors.js";
import {
  createVideoJob,
  getVideoJobForUser,
  listVideoJobsForUser,
  refreshVideoJobForUser,
} from "../services/videoStudio.service.js";
import type { VideoProviderReferenceImage } from "../video/videoProvider.types.js";

const router = Router();

router.use(requireAuth);

const MAX_REFERENCE_IMAGES = 5;
const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;

const uploadReferenceImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_REFERENCE_IMAGES,
    fileSize: MAX_REFERENCE_IMAGE_BYTES,
  },
  fileFilter(_req, file, callback) {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg"
    ) {
      callback(null, true);
      return;
    }

    callback(
      errors.badRequest(
        "Only PNG and JPEG reference images are supported right now.",
      ),
    );
  },
}).array("referenceImages", MAX_REFERENCE_IMAGES);

function handleReferenceImageUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  uploadReferenceImages(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(
          errors.badRequest(
            "Each reference image must be 10 MB or smaller.",
          ),
        );
        return;
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        next(
          errors.badRequest(
            `Upload no more than ${MAX_REFERENCE_IMAGES} reference images.`,
          ),
        );
        return;
      }

      next(
        errors.badRequest(
          `Image upload failed: ${error.message}`,
        ),
      );
      return;
    }

    next(error);
  });
}

const optionalNullableCuid = z.preprocess(
  (value) =>
    value === "" || value === "null" || value === undefined
      ? null
      : value,
  z.string().cuid().nullable().optional(),
);

const optionalString = (max: number) =>
  z.preprocess(
    (value) => (value === undefined || value === null ? "" : value),
    z.string().trim().max(max).optional().or(z.literal("")),
  );

const createSchema = z
  .object({
    title: z.string().trim().min(1).max(140),
    sourceType: z.enum([
      "scratch",
      "project",
      "output",
      "workflow_run",
    ]),
    projectId: optionalNullableCuid,
    sourceOutputId: optionalNullableCuid,
    sourceWorkflowRunId: optionalNullableCuid,
    useCase: z.enum([
      "promo_ad",
      "product_highlight",
      "offer_announcement",
      "social_reel",
    ]),
    aspectRatio: z.enum(["9:16", "1:1", "16:9"]),
    durationSeconds: z.preprocess(
      (value) =>
        typeof value === "string" ? Number(value) : value,
      z.union([z.literal(6), z.literal(8), z.literal(12)]),
    ),
    toneStyle: z.string().trim().min(1).max(280),
    cta: optionalString(300),
    referenceImageInstructions: optionalString(1200),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === "project" && !value.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectId"],
        message: "Select a project source",
      });
    }

    if (value.sourceType === "output" && !value.sourceOutputId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceOutputId"],
        message: "Select a saved output source",
      });
    }

    if (
      value.sourceType === "workflow_run" &&
      !value.sourceWorkflowRunId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceWorkflowRunId"],
        message: "Select a workflow run source",
      });
    }
  });

router.get("/jobs", async (req, res, next) => {
  try {
    const jobs = await listVideoJobsForUser(req.user!.id);

    res.json({ jobs });
  } catch (error) {
    next(error);
  }
});

router.get("/jobs/:id", async (req, res, next) => {
  try {
    const job = await getVideoJobForUser(
      req.user!.id,
      req.params.id,
    );

    res.json({ job });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/jobs",
  videoGenerationLimiter,
  handleReferenceImageUpload,
  async (req, res, next) => {
    try {
      const data = createSchema.parse(req.body);

      const uploadedFiles = Array.isArray(req.files)
        ? req.files
        : [];

      const referenceImages: VideoProviderReferenceImage[] =
        uploadedFiles.map((file) => ({
          originalName: file.originalname,
          mimeType: file.mimetype as "image/png" | "image/jpeg",
          sizeBytes: file.size,
          buffer: file.buffer,
        }));

      const result = await createVideoJob(req.user!.id, {
        ...data,
        projectId: data.projectId ?? null,
        sourceOutputId: data.sourceOutputId ?? null,
        sourceWorkflowRunId:
          data.sourceWorkflowRunId ?? null,
        cta: data.cta?.trim() || undefined,
        referenceImageInstructions:
          data.referenceImageInstructions?.trim() || undefined,
        referenceImages,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/jobs/:id/refresh", async (req, res, next) => {
  try {
    const job = await refreshVideoJobForUser(
      req.user!.id,
      req.params.id,
    );

    res.json({ job });
  } catch (error) {
    next(error);
  }
});

export default router;
