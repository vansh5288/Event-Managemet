"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCertificateEmail = exports.sendPaymentConfirmation = exports.sendWelcomeEmail = exports.sendOTPEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.config.smtpHost,
    port: config_1.config.smtpPort,
    secure: config_1.config.smtpPort === 465,
    auth: {
        user: config_1.config.smtpUser,
        pass: config_1.config.smtpPass,
    },
});
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"EventHub" <${config_1.config.emailFrom}>`,
            to,
            subject,
            html,
        });
        return true;
    }
    catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};
exports.sendEmail = sendEmail;
const sendOTPEmail = async (email, otp) => {
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
    return (0, exports.sendEmail)(email, 'Verify Your Email - EventHub', html);
};
exports.sendOTPEmail = sendOTPEmail;
const sendWelcomeEmail = async (email, name) => {
    const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Welcome to EventHub! 🎉</h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <p style="color: #475569; margin: 0 0 16px;">Hi ${name},</p>
        <p style="color: #475569; margin: 0 0 16px;">Welcome to EventHub! We're excited to have you on board. Start exploring events, book tickets, and connect with the community.</p>
        <a href="http://localhost:5173/dashboard" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Get Started</a>
      </div>
    </div>
  `;
    return (0, exports.sendEmail)(email, 'Welcome to EventHub!', html);
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendPaymentConfirmation = async (email, name, eventName, amount, currency) => {
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
    return (0, exports.sendEmail)(email, `Payment Confirmed - ${eventName}`, html);
};
exports.sendPaymentConfirmation = sendPaymentConfirmation;
const sendCertificateEmail = async (email, name, eventName, certificateId) => {
    const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #faf5ff, #f0f9ff); padding: 40px 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Certificate Awarded! 🎓</h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <p style="color: #475569; margin: 0 0 16px;">Hi ${name},</p>
        <p style="color: #475569; margin: 0 0 16px;">Congratulations! You've earned a certificate for <strong>${eventName}</strong>.</p>
        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px;">Certificate ID: ${certificateId}</p>
        <a href="http://localhost:5173/certificates/${certificateId}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">View Certificate</a>
      </div>
    </div>
  `;
    return (0, exports.sendEmail)(email, `Certificate Awarded - ${eventName}`, html);
};
exports.sendCertificateEmail = sendCertificateEmail;
//# sourceMappingURL=email.js.map