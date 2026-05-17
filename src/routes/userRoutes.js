import express from "express";
import { getProgress, completeLesson, solveChallenge, toggleBookmark } from "../controllers/userController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to protect all progress routes
router.use(protectRoute);

router.get("/progress", getProgress);
router.post("/lesson/complete", completeLesson);
router.post("/challenge/solve", solveChallenge);
router.post("/challenge/bookmark", toggleBookmark);

export default router;
