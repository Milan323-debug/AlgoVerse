import express from "express";
import dotenv from "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/video/download", express.static("out"));


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});