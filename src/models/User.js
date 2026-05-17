import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 50,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    password: {
        type: String,
        required: true,
    },
    profileImage: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 1 },
    level: { type: Number, default: 1 },
    completedLessons: { type: [String], default: [] },
    solvedChallenges: { type: [String], default: [] },
    bookmarkedChallenges: { type: [String], default: [] }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
