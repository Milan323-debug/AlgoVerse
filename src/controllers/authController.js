import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";

export const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            await newUser.save();
            const token = generateToken(newUser._id, res);

            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                profileImage: newUser.profileImage,
                token
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            token
        });
    } catch (error) {
        console.log("Error in signin controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    try {
        // Mobile app will discard the token on its end.
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const githubAuthRedirect = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    // We pass the redirect URI to GitHub, which must match the Render backend callback
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'https://algoverse-uzz5.onrender.com/api/auth/github/callback';
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    
    res.redirect(githubAuthUrl);
};

export const githubCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        // Exchange code for access token
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return res.redirect(`algoverse://login?error=Failed_to_exchange_code`);
        }

        // Fetch user data from GitHub
        const githubUserRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        
        if (!githubUserRes.ok) {
            return res.redirect(`algoverse://login?error=Invalid_GitHub_token`);
        }
        
        const githubUser = await githubUserRes.json();
        
        // Fetch user emails from GitHub
        const githubEmailsRes = await fetch("https://api.github.com/user/emails", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        
        let primaryEmail = githubUser.email;
        if (githubEmailsRes.ok) {
            const emails = await githubEmailsRes.json();
            const primaryEmailObj = emails.find(e => e.primary);
            if (primaryEmailObj) {
                primaryEmail = primaryEmailObj.email;
            }
        }

        if (!primaryEmail) {
            return res.redirect(`algoverse://login?error=No_email_associated_with_this_GitHub_account`);
        }

        let user = await User.findOne({ 
            $or: [{ githubId: githubUser.id.toString() }, { email: primaryEmail }]
        });

        if (user) {
            if (!user.githubId) {
                user.githubId = githubUser.id.toString();
                await user.save();
            }
        } else {
            user = new User({
                username: githubUser.login,
                email: primaryEmail,
                githubId: githubUser.id.toString(),
                profileImage: githubUser.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            });
            await user.save();
        }

        const token = generateToken(user._id, res);

        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        };

        // Redirect back to the Expo app via deep link with token and user data
        res.redirect(`algoverse://login?token=${token}&userData=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        console.log("Error in githubCallback controller", error.message);
        res.redirect(`algoverse://login?error=Internal_Server_Error`);
    }
};
