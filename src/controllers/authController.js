
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../lib/mailer.js";

export const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const emailLower = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: emailLower });
        
        // Ensure username uniqueness among verified users
        const existingUsername = await User.findOne({ username, isVerified: true });
        if (existingUsername) {
            return res.status(400).json({ message: "Username is already taken" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (existingUser) {
            // 1. If the existing user is verified, block signup
            if (existingUser.isVerified) {
                return res.status(400).json({ message: "Email is already in use" });
            }
            
            // 2. If the existing user signed up via social login, block overwriting
            if (existingUser.githubId || existingUser.googleId) {
                return res.status(400).json({ 
                    message: "This email is registered with a social provider (Google or GitHub). Please sign in using that provider." 
                });
            }

            // 3. If a different username is trying to claim this unverified email,
            // block it if the active OTP has not expired yet to prevent hijacking/spam.
            if (existingUser.username !== username) {
                const now = new Date();
                if (existingUser.verificationOTPExpires && existingUser.verificationOTPExpires > now) {
                    return res.status(400).json({ 
                        message: "A verification code is already active for this email address. Please verify it or wait for the code to expire." 
                    });
                }
            }
            
            // If the user signed up before but never verified (and is same user, or previous code expired),
            // safely overwrite the details and send a new OTP.
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            existingUser.username = username;
            existingUser.password = hashedPassword;
            existingUser.verificationOTP = otp;
            existingUser.verificationOTPExpires = otpExpires;
            
            await existingUser.save();

            try {
                await sendVerificationEmail(emailLower, username, otp);
            } catch (emailError) {
                console.error("Email send failed during signup (existing user):", emailError.message);
                return res.status(503).json({ message: emailError.message });
            }
            
            return res.status(200).json({
                message: "Verification code sent to your email",
                email: emailLower,
                isVerified: false
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email: emailLower,
            password: hashedPassword,
            isVerified: false,
            verificationOTP: otp,
            verificationOTPExpires: otpExpires,
        });

        if (newUser) {
            await newUser.save();

            try {
                await sendVerificationEmail(emailLower, username, otp);
            } catch (emailError) {
                console.error("Email send failed during signup (new user):", emailError.message);
                return res.status(503).json({ message: emailError.message });
            }

            res.status(201).json({
                message: "Verification code sent to your email",
                email: emailLower,
                isVerified: false
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailLower = email.trim().toLowerCase();
        const user = await User.findOne({ email: emailLower });
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

        if (!user.isVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationOTP = otp;
            user.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            try {
                await sendVerificationEmail(emailLower, user.username, otp);
            } catch (err) {
                console.error("Error sending email on unverified signin:", err.message);
                return res.status(503).json({ message: err.message });
            }

            return res.status(403).json({
                message: "Please verify your email address. A fresh code has been sent to your email.",
                email: emailLower,
                isVerified: false,
            });
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
        res.status(500).json({ message: error.message || "Internal Server Error" });
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
            if (!user.githubId || !user.isVerified) {
                user.githubId = githubUser.id.toString();
                user.isVerified = true;
                await user.save();
            }
        } else {
            user = new User({
                username: githubUser.login,
                email: primaryEmail,
                githubId: githubUser.id.toString(),
                profileImage: githubUser.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                isVerified: true,
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
            if (!user.googleId || !user.isVerified) {
                user.googleId = googleUser.id;
                user.isVerified = true;
                await user.save();
            }
        } else {
            user = new User({
                username: googleUser.name || googleUser.email.split('@')[0],
                email: googleUser.email,
                googleId: googleUser.id,
                profileImage: googleUser.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                isVerified: true,
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

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and verification code are required" });
        }

        const emailLower = email.trim().toLowerCase();
        const user = await User.findOne({ email: emailLower });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            const token = generateToken(user._id, res);
            return res.status(200).json({
                message: "Email already verified",
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                token
            });
        }

        if (user.verificationOTP !== otp.trim() || user.verificationOTPExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        user.isVerified = true;
        user.verificationOTP = undefined;
        user.verificationOTPExpires = undefined;
        await user.save();

        const token = generateToken(user._id, res);

        res.status(200).json({
            message: "Email verified successfully",
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            token
        });
    } catch (error) {
        console.log("Error in verifyOTP controller", error.message);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const emailLower = email.trim().toLowerCase();
        const user = await User.findOne({ email: emailLower });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationOTP = otp;
        user.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        try {
            await sendVerificationEmail(emailLower, user.username, otp);
        } catch (emailError) {
            console.error("Email send failed during resendOTP:", emailError.message);
            return res.status(503).json({ message: emailError.message });
        }

        res.status(200).json({ message: "Verification code resent successfully" });
    } catch (error) {
        console.log("Error in resendOTP controller", error.message);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const emailLower = email.trim().toLowerCase();
        const user = await User.findOne({ email: emailLower });

        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        // Check if account has no password set (OAuth only user)
        if (!user.password || user.googleId || user.githubId) {
            return res.status(400).json({
                message: "This email is registered using a social provider (Google or GitHub). Please sign in using that provider."
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp;
        user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        try {
            await sendResetPasswordEmail(emailLower, user.username, otp);
        } catch (emailError) {
            console.error("Email send failed during forgotPassword:", emailError.message);
            return res.status(503).json({ message: emailError.message });
        }

        res.status(200).json({ message: "Password reset verification code sent to your email." });
    } catch (error) {
        console.log("Error in forgotPassword controller", error.message);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, verification code (OTP), and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const emailLower = email.trim().toLowerCase();
        const user = await User.findOne({ email: emailLower });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.resetOTP || user.resetOTP !== otp.trim() || user.resetOTPExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired password reset verification code" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.resetOTP = undefined;
        user.resetOTPExpires = undefined;
        
        // Also ensure user is verified if they reset their password successfully
        user.isVerified = true;
        
        await user.save();

        res.status(200).json({ message: "Password reset successfully. You can now sign in with your new password." });
    } catch (error) {
        console.log("Error in resetPassword controller", error.message);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

