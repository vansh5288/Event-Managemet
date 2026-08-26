"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendSpeakers = exports.findSimilarUsers = exports.recommendEvents = void 0;
const Event_1 = require("../models/Event");
const User_1 = require("../models/User");
const Registration_1 = require("../models/Registration");
/**
 * AI-based event recommendation system
 * Uses collaborative filtering based on user's registration history
 * and content-based filtering based on categories/tags
 */
const recommendEvents = async (userId, limit = 6) => {
    const user = await User_1.User.findById(userId);
    if (!user)
        return [];
    // Get user's past registrations
    const registrations = await Registration_1.Registration.find({ user: userId })
        .populate('event', 'category tags title');
    // Build user preference profile
    const categoryScores = {};
    const tagScores = {};
    registrations.forEach((reg) => {
        const event = reg.event;
        if (!event)
            return;
        categoryScores[event.category] = (categoryScores[event.category] || 0) + 1;
        event.tags?.forEach((tag) => {
            tagScores[tag] = (tagScores[tag] || 0) + 1;
        });
    });
    // Get all published events
    const events = await Event_1.Event.find({
        status: Event_1.EventStatus.PUBLISHED,
        startDate: { $gte: new Date() },
    }).populate('organizer', 'name');
    // Score events based on user preferences
    const scoredEvents = events.map((event) => {
        let score = 0;
        // Category match
        if (categoryScores[event.category]) {
            score += categoryScores[event.category] * 10;
        }
        // Tag match
        event.tags?.forEach((tag) => {
            if (tagScores[tag]) {
                score += tagScores[tag] * 5;
            }
        });
        // Popularity boost
        score += Math.min(event.registeredCount / Math.max(event.capacity, 1), 1) * 3;
        // Recency boost
        const daysUntilEvent = Math.max(0, (new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        score += Math.max(0, 1 - daysUntilEvent / 30) * 2;
        return { event, score };
    });
    // Sort by score and return top events
    return scoredEvents
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.event);
};
exports.recommendEvents = recommendEvents;
/**
 * Find similar users based on event registrations (for networking suggestions)
 */
const findSimilarUsers = async (userId, limit = 5) => {
    const registrations = await Registration_1.Registration.find({ user: userId }).select('event');
    if (registrations.length === 0)
        return [];
    const eventIds = registrations.map((r) => r.event);
    // Find users who registered for similar events
    const similarRegistrations = await Registration_1.Registration.find({
        event: { $in: eventIds },
        user: { $ne: userId },
        status: { $in: [Registration_1.RegistrationStatus.CONFIRMED, Registration_1.RegistrationStatus.CHECKED_IN] },
    }).populate('user', 'name email avatar bio organization');
    // Count common events
    const userScores = {};
    similarRegistrations.forEach((reg) => {
        const uid = reg.user._id.toString();
        if (!userScores[uid]) {
            userScores[uid] = { user: reg.user, score: 0 };
        }
        userScores[uid].score += 1;
    });
    return Object.values(userScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.user);
};
exports.findSimilarUsers = findSimilarUsers;
/**
 * AI speaker recommendations based on event category and past speakers
 */
const recommendSpeakers = async (eventCategory) => {
    const speakers = await User_1.User.find({ role: User_1.UserRole.SPEAKER, isActive: true }).select('name email avatar bio organization');
    // Score speakers by their profile completeness and bio relevance
    const scored = speakers.map((speaker) => {
        let score = 0;
        if (speaker.bio)
            score += 3;
        if (speaker.organization)
            score += 2;
        if (speaker.avatar)
            score += 1;
        if (speaker.bio?.toLowerCase().includes(eventCategory.toLowerCase()))
            score += 5;
        return { speaker, score };
    });
    return scored.sort((a, b) => b.score - a.score).map((s) => s.speaker);
};
exports.recommendSpeakers = recommendSpeakers;
//# sourceMappingURL=recommendation.js.map