import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
  getChannelVideosById,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);
router.route("/videos/:userId").get(getChannelVideosById);

export default router;
