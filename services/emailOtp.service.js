const crypto = require("crypto");
const transporter = require("../config/email");

// Configuration
const OTP_EXPIRY_MS = (parseInt(process.env.EMAIL_OTP_EXPIRY_MINUTES, 10) || 10) * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = (parseInt(process.env.EMAIL_OTP_COOLDOWN_SECONDS, 10) || 60) * 1000; // 60 seconds
const MAX_VERIFY_ATTEMPTS = 5; // Max 5 incorrect attempts before invalidating OTP

// In-Memory store (No Redis required - lightweight & zero dependencies)
// Structure: email -> { otp, expiresAt, attempts, lastSentAt }
const memoryStore = new Map();

// Pre-verified emails store (valid for 30 minutes to complete registration)
const verifiedStore = new Map();

/**
 * Clean up expired memory records periodically every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memoryStore.entries()) {
    if (val.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
  for (const [key, expiresAt] of verifiedStore.entries()) {
    if (expiresAt < now) {
      verifiedStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

const emailOtpService = {
  /**
   * Generate and store OTP in memory, then send via Nodemailer
   */
  sendOTP: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    // 1. Resend cooldown check (e.g. 60 seconds)
    const existing = memoryStore.get(normalizedEmail);
    if (existing && existing.lastSentAt && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const secondsRemaining = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      const err = new Error(`Please wait ${secondsRemaining} seconds before requesting a new OTP`);
      err.statusCode = 429;
      throw err;
    }

    // 2. Generate secure 6-digit random OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = now + OTP_EXPIRY_MS;

    // 3. Store in memory
    memoryStore.set(normalizedEmail, {
      otp,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    console.log(`[EmailOTP] Generated OTP for ${normalizedEmail}: ${otp} (expires in 10m)`);

    // 4. Branded Email template
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Leaf Homeo Care" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Your Email Verification OTP - Leaf Homeo Care",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #64a281 0%, #145656 100%); padding: 35px 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">Leaf Homeo Care</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 14px;">Natural Healing, Personalized Care</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #145656; margin-top: 0; font-size: 20px; font-weight: bold;">Email Verification</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 15px;">
              Your One-Time Password (OTP) for email verification is:
            </p>
            <div style="background: linear-gradient(135deg, #64a281 0%, #528f6e 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; font-size: 32px; font-weight: bold; letter-spacing: 6px;">
              ${otp}
            </div>
            <p style="color: #374151; line-height: 1.6; font-size: 14px;">
              This code is valid for <strong>${Math.round(OTP_EXPIRY_MS / 60000)} minutes</strong>.
            </p>
            <p style="color: #6b7280; margin-bottom: 0; font-size: 13px;">
              If you didn't request this verification, please safely ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    // 5. Send email via Nodemailer
    await transporter.sendMail(mailOptions);
    return true;
  },

  /**
   * Verify OTP submitted by user
   * Returns: { status: 'approved' | 'expired' | 'denied' | 'too_many_attempts', message: string }
   */
  verifyOTP: async (email, otpInput) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otpInput).trim();
    const now = Date.now();

    const record = memoryStore.get(normalizedEmail);

    // 1. Check if record exists
    if (!record) {
      return {
        status: "expired",
        message: "OTP has expired. Please request a new OTP.",
      };
    }

    // 2. Check expiration
    if (now > record.expiresAt) {
      memoryStore.delete(normalizedEmail);
      return {
        status: "expired",
        message: "OTP has expired. Please request a new OTP.",
      };
    }

    // 3. Brute force protection check (max 5 attempts)
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      memoryStore.delete(normalizedEmail);
      return {
        status: "too_many_attempts",
        message: "Too many failed attempts. Please request a new OTP.",
      };
    }

    // 4. Compare OTP
    if (record.otp === cleanOtp) {
      // Single-use: Delete OTP immediately
      memoryStore.delete(normalizedEmail);

      // Pre-verify email for 30 minutes so user can complete registration
      verifiedStore.set(normalizedEmail, now + 30 * 60 * 1000);

      return {
        status: "approved",
        message: "Email verified successfully",
      };
    }

    // 5. Increment failed attempts
    record.attempts += 1;
    memoryStore.set(normalizedEmail, record);

    return {
      status: "denied",
      message: "Invalid OTP",
    };
  },

  /**
   * Check if email was verified via verify-email-otp
   */
  isEmailVerified: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const expiresAt = verifiedStore.get(normalizedEmail);
    return Boolean(expiresAt && expiresAt > Date.now());
  },

  /**
   * Clear pre-verified record after successful registration
   */
  consumeEmailVerification: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    verifiedStore.delete(normalizedEmail);
  },
};

module.exports = emailOtpService;
