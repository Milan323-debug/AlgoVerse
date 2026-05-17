import User from "../models/User.js";

const XP_PER_LEVEL = [0, 200, 450, 750, 1100, 1500, 2000, 2600];

function calcLevel(totalXp) {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (totalXp >= XP_PER_LEVEL[i]) level = i + 1;
    else break;
  }
  const xpStart = XP_PER_LEVEL[Math.min(level - 1, XP_PER_LEVEL.length - 1)];
  const xpNext = XP_PER_LEVEL[Math.min(level, XP_PER_LEVEL.length - 1)];
  return {
    level,
    xpInLevel: totalXp - xpStart,
    xpForNext: xpNext - xpStart,
  };
}

export const getProgress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json({
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            completedLessons: user.completedLessons,
            solvedChallenges: user.solvedChallenges,
            bookmarkedChallenges: user.bookmarkedChallenges,
            // Calculate dynamic progress values
            ...calcLevel(user.xp)
        });
    } catch (error) {
        console.error("Error in getProgress:", error.message);
        res.status(500).json({ message: "Failed to fetch user progress" });
    }
};

export const completeLesson = async (req, res) => {
    try {
        const { lessonId, xpReward } = req.body;

        if (!lessonId || typeof xpReward !== "number") {
            return res.status(400).json({ message: "Lesson ID and XP reward are required" });
        }

        const user = await User.findById(req.user._id);

        if (!user.completedLessons.includes(lessonId)) {
            user.completedLessons.push(lessonId);
            user.xp += xpReward;
            
            const levelInfo = calcLevel(user.xp);
            user.level = levelInfo.level;
        }

        await user.save();

        res.status(200).json({
            xp: user.xp,
            level: user.level,
            completedLessons: user.completedLessons,
            ...calcLevel(user.xp)
        });
    } catch (error) {
        console.error("Error in completeLesson:", error.message);
        res.status(500).json({ message: "Failed to save completed lesson" });
    }
};

export const solveChallenge = async (req, res) => {
    try {
        const { challengeId, xpReward } = req.body;

        if (!challengeId || typeof xpReward !== "number") {
            return res.status(400).json({ message: "Challenge ID and XP reward are required" });
        }

        const user = await User.findById(req.user._id);

        if (!user.solvedChallenges.includes(challengeId)) {
            user.solvedChallenges.push(challengeId);
            user.xp += xpReward;

            const levelInfo = calcLevel(user.xp);
            user.level = levelInfo.level;
        }

        await user.save();

        res.status(200).json({
            xp: user.xp,
            level: user.level,
            solvedChallenges: user.solvedChallenges,
            ...calcLevel(user.xp)
        });
    } catch (error) {
        console.error("Error in solveChallenge:", error.message);
        res.status(500).json({ message: "Failed to save solved challenge" });
    }
};

export const toggleBookmark = async (req, res) => {
    try {
        const { challengeId } = req.body;

        if (!challengeId) {
            return res.status(400).json({ message: "Challenge ID is required" });
        }

        const user = await User.findById(req.user._id);

        const index = user.bookmarkedChallenges.indexOf(challengeId);
        if (index > -1) {
            user.bookmarkedChallenges.splice(index, 1);
        } else {
            user.bookmarkedChallenges.push(challengeId);
        }

        await user.save();

        res.status(200).json({
            bookmarkedChallenges: user.bookmarkedChallenges
        });
    } catch (error) {
        console.error("Error in toggleBookmark:", error.message);
        res.status(500).json({ message: "Failed to toggle bookmark" });
    }
};
