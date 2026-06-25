// src/services/otp.service.ts
import { prisma } from '../config/prisma';

// Expiration time for OTP in minutes
const OTP_EXPIRATION_MINUTES = 5;

/**
 * Generate a random 6-digit OTP code, save it to database, and "send" it.
 * If Twilio is configured, sends a real SMS. Otherwise logs to console.
 */
export async function generateAndSendOtp(phoneNumber: string): Promise<string> {
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  // Delete any existing codes for this phone number to avoid pollution
  await prisma.otpVerification.deleteMany({
    where: { phoneNumber },
  });

  // Create new OTP verification record
  await prisma.otpVerification.create({
    data: {
      phoneNumber,
      code,
      expiresAt,
    },
  });

  // Send the OTP via Twilio if config exists, otherwise fallback to console.log
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: fromNumber,
            Body: `Your OmniAI verification code is: ${code}. Valid for 5 minutes.`,
          }).toString(),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Twilio SMS Error]: Status ${response.status} - ${errText}`);
        // Fallback to console log in development even if Twilio fails
        console.log(`\n[SMS OTP (Twilio Fallback)] Verification code for ${phoneNumber} is: ${code}\n`);
      } else {
        console.log(`[SMS OTP] Verification code successfully sent via Twilio to ${phoneNumber}`);
      }
    } catch (err) {
      console.error('[SMS OTP Service Error]: Failed to send via Twilio:', err);
      console.log(`\n[SMS OTP (Fallback)] Verification code for ${phoneNumber} is: ${code}\n`);
    }
  } else {
    // Console log the OTP for easy local testing
    console.log(`\n[SMS OTP] Verification code for ${phoneNumber} is: ${code}\n`);
  }

  return code;
}

/**
 * Verify if the OTP is correct and not expired.
 * Deletes the OTP record on successful verification.
 */
export async function verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
  // Find the latest OTP record for this phone number
  const verification = await prisma.otpVerification.findFirst({
    where: { phoneNumber },
    orderBy: { createdAt: 'desc' },
  });

  if (!verification) {
    return false;
  }

  // Check if code matches
  if (verification.code !== code) {
    return false;
  }

  // Check if expired
  if (verification.expiresAt < new Date()) {
    // Delete expired record
    await prisma.otpVerification.delete({ where: { id: verification.id } });
    return false;
  }

  // OTP verified successfully! Delete it to prevent reuse
  await prisma.otpVerification.delete({ where: { id: verification.id } });
  return true;
}
