/**
 * AI Chatbot for the Event Management Platform
 */
export declare const getChatbotResponse: (message: string, userContext?: any) => Promise<{
    message: string;
    aiGenerated: boolean;
}>;
/**
 * AI email generator for event announcements
 */
export declare const generateEventEmail: (eventName: string, emailType: string, audience: string, details?: string) => Promise<any>;
/**
 * AI spam detection for reviews and messages
 */
export declare const detectSpam: (text: string) => Promise<{
    isSpam: boolean;
    score: number;
    reasons: string[];
}>;
//# sourceMappingURL=chatbot.d.ts.map