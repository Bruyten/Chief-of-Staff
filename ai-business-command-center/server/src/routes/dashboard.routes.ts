import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getDashboardCommandCenter } from "../services/dashboard.service.js";

const router = Router();
router.use(requireAuth);

router.get("/command-center", async (req, res, next) => {
  try {
    const dashboard = await getDashboardCommandCenter(req.user!.id);
    res.json(dashboard);
  } catch (e) {
    next(e);
  }
});

export default router;
