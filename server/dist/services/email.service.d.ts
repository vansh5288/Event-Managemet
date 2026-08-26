export declare class EmailService {
    static sendEmail(to: string, subject: string, html: string): Promise<boolean>;
    static sendOTP(email: string, otp: string): Promise<boolean>;
    static sendWelcome(email: string, name: string): Promise<boolean>;
    static sendRegistrationConfirmation(email: string, name: string, eventTitle: string): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=email.service.d.ts.map