// src/services/otp.service.ts
import nodemailer from 'nodemailer';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/error';

// Expiration time for OTP in minutes
const OTP_EXPIRATION_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;

/**
 * Standardize email addresses.
 */
export function normalizeEmail(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

export interface VerificationResult {
  success: boolean;
  message?: string;
}

/**
 * Generate a random 6-digit OTP code, enforce rate limits, save to DB, and send HTML Email.
 */
export async function generateAndSendEmailOtp(rawEmail: string): Promise<string> {
  const email = normalizeEmail(rawEmail);

  // 1. Enforce 60-second resend cooldown rate limit
  const recent = await prisma.otpVerification.findFirst({
    where: { identifier: email },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    const elapsedSeconds = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000);
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      throw new AppError(429, `Please wait ${waitTime} seconds before requesting another code`);
    }
  }

  // 2. Generate new 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  // 3. Clear existing codes for this email
  await prisma.otpVerification.deleteMany({
    where: { identifier: email },
  });

  // 4. Store code with attempts counter initialized to 0
  await prisma.otpVerification.create({
    data: {
      identifier: email,
      code,
      attempts: 0,
      expiresAt,
    },
  });

  // 5. Dispatch Email via configured provider or fallback
  await sendEmailNotification(email, code);

  return code;
}

/**
 * Verify Email OTP code with attempt limiting and expiration checking.
 */
export async function verifyEmailOtp(rawEmail: string, code: string): Promise<VerificationResult> {
  const email = normalizeEmail(rawEmail);

  const verification = await prisma.otpVerification.findFirst({
    where: { identifier: email },
    orderBy: { createdAt: 'desc' },
  });

  if (!verification) {
    return {
      success: false,
      message: 'No verification code found. Please request a new code.',
    };
  }

  // Check if expired
  if (verification.expiresAt < new Date()) {
    await prisma.otpVerification.delete({ where: { id: verification.id } });
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  // Check attempt limit
  if (verification.attempts >= MAX_ATTEMPTS) {
    await prisma.otpVerification.delete({ where: { id: verification.id } });
    return {
      success: false,
      message: 'Too many failed verification attempts. Please request a new code.',
    };
  }

  // Check code match
  if (verification.code !== code.trim()) {
    const nextAttempts = verification.attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      await prisma.otpVerification.delete({ where: { id: verification.id } });
      return {
        success: false,
        message: 'Incorrect code. Maximum attempt limit reached. Please request a new code.',
      };
    } else {
      await prisma.otpVerification.update({
        where: { id: verification.id },
        data: { attempts: nextAttempts },
      });
      const remaining = MAX_ATTEMPTS - nextAttempts;
      return {
        success: false,
        message: `Incorrect verification code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
      };
    }
  }

  // Code verified! Delete OTP record to prevent reuse
  await prisma.otpVerification.delete({ where: { id: verification.id } });
  return { success: true };
}

/**
 * Internal Email Dispatcher supporting Nodemailer SMTP, Resend API, and Dev Console Fallback
 */
async function sendEmailNotification(email: string, code: string): Promise<void> {
  const provider = env.EMAIL_PROVIDER;
  const sender = env.EMAIL_FROM || 'OmniAI <no-reply@omniai.app>';
  const subject = `Your OmniAI Verification Code is ${code}`;
  
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #0b0f19; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f293d;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">OmniAI</h2>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 6px;">Multi-Model Artificial Intelligence Consensus</p>
      </div>
      <div style="background-color: #111827; padding: 28px 24px; border-radius: 10px; border: 1px solid #1f2937; text-align: center;">
        <h3 style="color: #ffffff; margin-top: 0; font-size: 18px; font-weight: 600;">Confirm your registration</h3>
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Enter the 6-digit verification code below to complete your account setup.</p>
        <div style="font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #818cf8; background-color: #1e1b4b; padding: 16px 20px; border-radius: 8px; border: 1px dashed #6366f1; display: inline-block; margin: 10px 0;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px; margin-bottom: 0;">⏱ Valid for 5 minutes. Do not share this code with anyone.</p>
      </div>
    </div>
  `;

  // Option 1: Nodemailer SMTP (Gmail or custom SMTP)
  if ((provider === 'smtp' || provider === 'auto') && env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(env.SMTP_PORT || '587', 10),
        secure: parseInt(env.SMTP_PORT || '587', 10) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: sender,
        to: email,
        subject,
        html: htmlContent,
      });

      console.log(`[Email Gateway: SMTP] OTP sent successfully to ${email}`);
      return;
    } catch (err) {
      console.error('[Email Gateway: SMTP Error]:', err);
    }
  }

  // Option 2: Resend API
  if ((provider === 'resend' || provider === 'auto') && env.RESEND_API_KEY) {
    try {
      let response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: sender,
          to: [email],
          subject,
          html: htmlContent,
        }),
      });

      let data = await response.json() as any;
      if (response.ok && data?.id) {
        console.log(`[Email Gateway: Resend] OTP sent successfully to ${email}`);
        return;
      }

      // Fallback try: use onboarding@resend.dev for Resend free tier accounts
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'OmniAI <onboarding@resend.dev>',
          to: [email],
          subject,
          html: htmlContent,
        }),
      });

      data = await response.json() as any;
      if (response.ok && data?.id) {
        console.log(`[Email Gateway: Resend (Default Domain)] OTP sent successfully to ${email}`);
        return;
      }

      console.warn('[Email Gateway: Resend Warning]:', data?.message || data);
    } catch (err) {
      console.error('[Email Gateway: Resend Error]:', err);
    }
  }

  // Option 3: Local Dev Console Fallback Banner
  console.log('\n' + '═'.repeat(60));
  console.log(` ✉️ [EMAIL OTP DEV FALLBACK] To: ${email}`);
  console.log(` 🔑 VERIFICATION CODE:  ${code}`);
  console.log(` ⏰ Valid for ${OTP_EXPIRATION_MINUTES} minutes`);
  console.log('═'.repeat(60) + '\n');
}



