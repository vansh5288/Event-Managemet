import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"EventHub" <${config.emailFrom}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    logger.error(`Email send error: ${(error as Error).message}`);
    return false;
  }
};

export const sendOTPEmail = async (email: string, otp: string) => {
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #3b82f6, #06b6d4); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
        </div>
        <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Verify Your Email</h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <p style="color: #475569; margin: 0 0 20px;">Use the following OTP to verify your email address:</p>
        <div style="background: linear-gradient(135deg, #eff6ff, #f0fdf4); border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid rgba(59,130,246,0.1);">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">This OTP will expire in 10 minutes.</p>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail(email, 'Verify Your Email - EventHub', html);
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Welcome to EventHub! 🎉</h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <p style="color: #475569; margin: 0 0 16px;">Hi ${name},</p>
        <p style="color: #475569; margin: 0 0 16px;">Welcome to EventHub! We're excited to have you on board. Start exploring events, book tickets, and connect with the community.</p>
        <a href="${config.appUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Get Started</a>
      </div>
    </div>
  `;
  return sendEmail(email, 'Welcome to EventHub!', html);
};

export const sendPaymentConfirmation = async (email: string, name: string, eventName: string, amount: number, currency: string) => {
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Payment Confirmed! ✅</h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <p style="color: #475569; margin: 0 0 16px;">Hi ${name},</p>
        <p style="color: #475569; margin: 0 0 8px;">Your payment for <strong>${eventName}</strong> has been confirmed.</p>
        <p style="color: #0f172a; font-size: 24px; font-weight: bold; margin: 16px 0;">${currency} ${amount.toFixed(2)}</p>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Thank you for your purchase!</p>
      </div>
    </div>
  `;
  return sendEmail(email, `Payment Confirmed - ${eventName}`, html);
};

export const sendCertificateEmail = async (email: string, name: string, eventName: string, certificateId: string) => {
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #faf5ff, #f0f9ff); padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Certificate Awarded! 🎓</h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <p style="color: #475569; margin: 0 0 16px;">Hi ${name},</p>
        <p style="color: #475569; margin: 0 0 16px;">Congratulations! You've earned a certificate for <strong>${eventName}</strong>.</p>
        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px;">Certificate ID: ${certificateId}</p>
        <a href="${config.appUrl}/certificates/${certificateId}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">View Certificate</a>
      </div>
    </div>
  `;
  return sendEmail(email, `Certificate Awarded - ${eventName}`, html);
};

export const sendRegistrationConfirmation = async (email: string, name: string, eventTitle: string) => {
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #fefce8, #ecfdf5); padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #3b82f6, #06b6d4); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
        </div>
        <h2 style="color: #1e293b; margin: 0;">Registration Confirmed ✅</h2>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <p style="color: #475569; margin: 0 0 16px;">Hi ${name},</p>
        <p style="color: #475569; margin: 0 0 16px;">You've successfully registered for <strong>${eventTitle}</strong>.</p>
        <a href="${config.appUrl}/registrations" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">View My Tickets</a>
      </div>
    </div>
  `;
  return sendEmail(email, `Registration Confirmed - ${eventTitle}`, html);
};
