/**
 * AI sentiment analysis for event feedback and reviews
 */
export declare const analyzeSentiment: (text: string) => Promise<any>;
/**
 * Generate AI event summary
 */
export declare const generateEventSummary: (event: any, reviews: any[]) => Promise<any>;
/**
 * AI duplicate event detection
 */
export declare const detectDuplicateEvents: (title: string, description: string) => Promise<{
    event: import("mongoose").Document<unknown, {}, import("../models/Event").IEvent> & import("../models/Event").IEvent & {
        _id: import("mongoose").Types.ObjectId;
    };
    similarity: number;
}[]>;
//# sourceMappingURL=sentiment.d.ts.map