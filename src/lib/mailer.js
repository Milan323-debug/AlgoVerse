import * as sibSdk from "@getbrevo/brevo";

let _apiInstance = null;

function getBrevoClient() {
    if (!_apiInstance) {
        const defaultClient = sibSdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;
        _apiInstance = new sibSdk.TransactionalEmailsApi();
    }
    return _apiInstance;
}

export const sendVerificationEmail = async (email, username, otp) => {
    const hasBrevoKey = process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL;

    if (!hasBrevoKey) {
        console.log("\n=======================================================");
        console.log(`[DEV MAIL] Verification Email Sent To: ${email}`);
        console.log(`[DEV MAIL] Username: ${username}`);
        console.log(`[DEV MAIL] OTP Code: ${otp}`);
        console.log("=======================================================\n");
        return;
    }

    const apiInstance = getBrevoClient();
    const sendSmtpEmail = new sibSdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Verify Your AlgoVerse Account";
    sendSmtpEmail.htmlContent = `
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
    `;
    sendSmtpEmail.sender = { 
        name: "AlgoVerse", 
        email: process.env.BREVO_SENDER_EMAIL 
    };
    sendSmtpEmail.to = [{ email: email, name: username }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Verification email sent to ${email} (messageId: ${data.messageId})`);
    } catch (error) {
        console.error("Failed to send verification email via Brevo API:", error.response?.body || error.message);
        throw new Error("Failed to send verification email. Please try again later.");
    }
};
