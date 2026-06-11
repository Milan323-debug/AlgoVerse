import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, username, otp) => {
    const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!hasSmtpConfig) {
        console.log("\n=======================================================");
        console.log(`[DEV MAIL] Verification Email Sent To: ${email}`);
        console.log(`[DEV MAIL] Username: ${username}`);
        console.log(`[DEV MAIL] OTP Code: ${otp}`);
        console.log("=======================================================\n");
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"AlgoVerse" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Verify Your AlgoVerse Account",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #333; border-radius: 10px; background-color: #060816; color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #7C3AED; margin: 0; font-size: 28px;">Algo<span style="color: #06B6D4;">Verse</span></h2>
                        <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 5px 0 0 0;">Master Algorithms. Build the Future.</p>
                    </div>
                    <hr style="border: 0; height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 25px;" />
                    <p style="font-size: 16px; color: rgba(255,255,255,0.9);">Hello <strong>${username}</strong>,</p>
                    <p style="font-size: 16px; color: rgba(255,255,255,0.9);">Thank you for registering at AlgoVerse. To complete your sign-up, please use the 6-digit verification code (OTP) below:</p>
                    <div style="text-align: center; margin: 35px 0;">
                        <span style="font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #7C3AED; background: rgba(124,58,237,0.15); padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(124,58,237,0.3); display: inline-block;">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: rgba(255,255,255,0.5);">This verification code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                    <hr style="border: 0; height: 1px; background: rgba(255,255,255,0.1); margin-top: 30px; margin-bottom: 20px;" />
                    <p style="font-size: 11px; color: rgba(255,255,255,0.3); text-align: center; margin: 0;">© ${new Date().getFullYear()} AlgoVerse. All rights reserved.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Error sending verification email:", error.message);
        throw new Error("Failed to send verification email. Please try again later.");
    }
};
