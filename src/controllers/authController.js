
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

        if (!user.password) {
            return res.status(400).json({ message: "This account is linked with a social provider (GitHub or Google). Please sign in with the appropriate provider." });
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
    const redirectUri = 'https://algoverse-1-5cvc.onrender.com/api/auth/github/callback';

    // The mobile app sends its own redirect URL so we know where to send the user back.
    // We encode it into the OAuth "state" parameter so it survives the GitHub round-trip.
    const mobileRedirect = req.query.mobile_redirect || 'algoverse://login';
    const state = Buffer.from(JSON.stringify({ mobile_redirect: mobileRedirect })).toString('base64');

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${encodeURIComponent(state)}`;

    res.redirect(githubAuthUrl);
};

export const githubCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        // Decode the mobile redirect URL from the state parameter
        let mobileRedirect = 'algoverse://login';
        if (state) {
            try {
                const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
                if (stateData.mobile_redirect) {
                    mobileRedirect = stateData.mobile_redirect;
                }
            } catch (e) {
                console.warn("Failed to parse state parameter:", e.message);
            }
        }

        const redirectUri = 'https://algoverse-1-5cvc.onrender.com/api/auth/github/callback';

        // Exchange code for access token (include redirect_uri as required by GitHub spec)
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
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            console.error("GitHub token exchange failed:", tokenData);
            return res.redirect(`${mobileRedirect}?error=Failed_to_exchange_code`);
        }

        // Fetch user data from GitHub
        const githubUserRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!githubUserRes.ok) {
            return res.redirect(`${mobileRedirect}?error=Invalid_GitHub_token`);
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
            return res.redirect(`${mobileRedirect}?error=No_email_associated_with_this_GitHub_account`);
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

        // Redirect back to the mobile app via deep link with token and user data
        res.redirect(`${mobileRedirect}?token=${token}&userData=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        console.log("Error in githubCallback controller", error.message);
        res.redirect(`algoverse://login?error=Internal_Server_Error`);
    }
};


export const googleAuthRedirect = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = 'https://algoverse-1-5cvc.onrender.com/api/auth/google/callback';

    const mobileRedirect = req.query.mobile_redirect || 'algoverse://login';
    const state = Buffer.from(JSON.stringify({ mobile_redirect: mobileRedirect })).toString('base64');

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&state=${encodeURIComponent(state)}` +
        `&access_type=offline` +
        `&prompt=select_account`;

    res.redirect(googleAuthUrl);
};

export const googleCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        let mobileRedirect = 'algoverse://login';
        if (state) {
            try {
                const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
                if (stateData.mobile_redirect) {
                    mobileRedirect = stateData.mobile_redirect;
                }
            } catch (e) {
                console.warn('Failed to parse state parameter:', e.message);
            }
        }

        if (error || !code) {
            return res.redirect(`${mobileRedirect}?error=${error || 'Authorization_code_missing'}`);
        }

        const redirectUri = 'https://algoverse-1-5cvc.onrender.com/api/auth/google/callback';

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error('Google token exchange failed:', tokenData);
            return res.redirect(`${mobileRedirect}?error=Failed_to_exchange_code`);
        }

        const googleUserRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!googleUserRes.ok) {
            return res.redirect(`${mobileRedirect}?error=Invalid_Google_token`);
        }

        const googleUser = await googleUserRes.json();

        if (!googleUser.email) {
            return res.redirect(`${mobileRedirect}?error=No_email_associated_with_this_Google_account`);
        }

        let user = await User.findOne({
            $or: [{ googleId: googleUser.id }, { email: googleUser.email }]
        });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleUser.id;
                await user.save();
            }
        } else {
            user = new User({
                username: googleUser.name || googleUser.email.split('@')[0],
                email: googleUser.email,
                googleId: googleUser.id,
                profileImage: googleUser.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
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

        res.redirect(`${mobileRedirect}?token=${token}&userData=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        console.log('Error in googleCallback controller', error.message);
        res.redirect('algoverse://login?error=Internal_Server_Error');
    }
};
