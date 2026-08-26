"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.config.smtpHost,
    port: config_1.config.smtpPort,
    secure: config_1.config.smtpPort === 465,
    auth: {
        user: config_1.config.smtpUser,
        pass: config_1.config.smtpPass,
    },
});
class EmailService {
    static async sendEmail(to, subject, html) {
        try {
            await transporter.sendMail({
                from: `"EventHub" <${config_1.config.emailFrom}>`,
                to,
                subject,
                html,
            });
            logger_1.logger.info(`Email sent to ${to}: ${subject}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Email failed to ${to}: ${error}`);
            return false;
        }
    }
    static async sendOTP(email, otp) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: #f0f9ff; border-radius: 12px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Your OTP Code</h2>
        <p style="color: #475569;">Use the following code to verify your account:</p>
        <div style="background: #3b82f6; color: white; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px;">This code expires in 10 minutes.</p>
      </div>
    `;
        return this.sendEmail(email, 'Your EventHub OTP Code', html);
    }
    static async sendWelcome(email, name) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: #f0fdf4; border-radius: 12px;">
        <h2 style="color: #1e293b;">Welcome to EventHub, ${name}! 🎉</h2>
        <p style="color: #475569;">We're excited to have you on board. Start exploring amazing events today!</p>
      </div>
    `;
        return this.sendEmail(email, 'Welcome to EventHub!', html);
    }
    static async sendRegistrationConfirmation(email, name, eventTitle) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: #fefce8; border-radius: 12px;">
        <h2 style="color: #1e293b;">Registration Confirmed ✅</h2>
        <p style="color: #475569;">Hi ${name},</p>
        <p style="color: #475569;">You've successfully registered for <strong>${eventTitle}</strong>.</p>
      </div>
    `;
        return this.sendEmail(email, `Registration Confirmed - ${eventTitle}`, html);
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map