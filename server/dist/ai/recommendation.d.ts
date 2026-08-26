/**
 * AI-based event recommendation system
 * Uses collaborative filtering based on user's registration history
 * and content-based filtering based on categories/tags
 */
export declare const recommendEvents: (userId: string, limit?: number) => Promise<Omit<import("mongoose").Document<unknown, {}, import("../models/Event").IEvent> & import("../models/Event").IEvent & {
    _id: import("mongoose").Types.ObjectId;
}, never>[]>;
/**
 * Find similar users based on event registrations (for networking suggestions)
 */
export declare const findSimilarUsers: (userId: string, limit?: number) => Promise<any[]>;
/**
 * AI speaker recommendations based on event category and past speakers
 */
export declare const recommendSpeakers: (eventCategory: string) => Promise<(import("mongoose").Document<unknown, {}, import("../models/User").IUser> & import("../models/User").IUser & {
    _id: import("mongoose").Types.ObjectId;
})[]>;
//# sourceMappingURL=recommendation.d.ts.map