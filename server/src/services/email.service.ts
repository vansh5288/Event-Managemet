// Email service - re-exports the canonical email utilities from utils/email.ts
// This file exists to preserve the service-layer abstraction for callers.
export {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendCertificateEmail,
  sendRegistrationConfirmation,
} from '../utils/email';

