import express from "express";
import { getProgress, completeLesson, solveChallenge, toggleBookmark, resetProgress, getLeaderboard } from "../controllers/userController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to protect all progress routes
router.use(protectRoute);

router.get("/progress", getProgress);
router.get("/leaderboard", getLeaderboard);
router.post("/progress/reset", resetProgress);
router.post("/lesson/complete", completeLesson);
router.post("/challenge/solve", solveChallenge);
router.post("/challenge/bookmark", toggleBookmark);

export default router;
