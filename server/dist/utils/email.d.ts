export declare const sendEmail: (to: string, subject: string, html: string) => Promise<boolean>;
export declare const sendOTPEmail: (email: string, otp: string) => Promise<boolean>;
export declare const sendWelcomeEmail: (email: string, name: string) => Promise<boolean>;
export declare const sendPaymentConfirmation: (email: string, name: string, eventName: string, amount: number, currency: string) => Promise<boolean>;
export declare const sendCertificateEmail: (email: string, name: string, eventName: string, certificateId: string) => Promise<boolean>;
//# sourceMappingURL=email.d.ts.map