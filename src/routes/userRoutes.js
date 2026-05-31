import express from "express";
import { getProgress, completeLesson, solveChallenge, toggleBookmark, resetProgress, getLeaderboard, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Apply auth middleware to protect all progress routes
router.use(protectRoute);

router.get("/progress", getProgress);
router.get("/leaderboard", getLeaderboard);
router.put("/profile", upload.single('profileImage'), updateProfile);
router.post("/progress/reset", resetProgress);
router.post("/lesson/complete", completeLesson);
router.post("/challenge/solve", solveChallenge);
router.post("/challenge/bookmark", toggleBookmark);

export default router;
