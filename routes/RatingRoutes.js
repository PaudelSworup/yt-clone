import express from "express";
import {
  getSingle,
  getratingsDetails,
  provideRating,
  recommendedVideos,
} from "../controllers/RatingController.js";

const router = express.Router();

router.post("/rate", provideRating);
router.get("/rate", getratingsDetails);
router.get("/rate/:video", getSingle);
router.get("/recommend/:id", recommendedVideos);

export default router;
