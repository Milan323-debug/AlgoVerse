import express from "express";
import { signup, signin, logout, githubAuthRedirect, githubCallback, googleAuthRedirect, googleCallback, verifyOTP, resendOTP } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/github", githubAuthRedirect);
router.get("/github/callback", githubCallback);
router.get("/google", googleAuthRedirect);
router.get("/google/callback", googleCallback);

export default router;