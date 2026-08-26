import { Event, EventStatus } from '../models/Event';
import { User, UserRole } from '../models/User';
import { Registration, RegistrationStatus } from '../models/Registration';

/**
 * AI-based event recommendation system
 * Uses collaborative filtering based on user's registration history
 * and content-based filtering based on categories/tags
 */
export const recommendEvents = async (userId: string, limit: number = 6) => {
  const user = await User.findById(userId);
  if (!user) return [];

  // Get user's past registrations
  const registrations = await Registration.find({ user: userId })
    .populate('event', 'category tags title');

  // Build user preference profile
  const categoryScores: Record<string, number> = {};
  const tagScores: Record<string, number> = {};

  registrations.forEach((reg: any) => {
    const event = reg.event;
    if (!event) return;
    categoryScores[event.category] = (categoryScores[event.category] || 0) + 1;
    event.tags?.forEach((tag: string) => {
      tagScores[tag] = (tagScores[tag] || 0) + 1;
    });
  });

  // Get all published events
  const events = await Event.find({
    status: EventStatus.PUBLISHED,
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
    event.tags?.forEach((tag: string) => {
      if (tagScores[tag]) {
        score += tagScores[tag] * 5;
      }
    });

    // Popularity boost
    score += Math.min(event.registeredCount / Math.max(event.capacity, 1), 1) * 3;

    // Recency boost
    const daysUntilEvent = Math.max(
      0,
      (new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    score += Math.max(0, 1 - daysUntilEvent / 30) * 2;

    return { event, score };
  });

  // Sort by score and return top events
  return scoredEvents
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.event);
};

/**
 * Find similar users based on event registrations (for networking suggestions)
 */
export const findSimilarUsers = async (userId: string, limit: number = 5) => {
  const registrations = await Registration.find({ user: userId }).select('event');

  if (registrations.length === 0) return [];

  const eventIds = registrations.map((r) => r.event);

  // Find users who registered for similar events
  const similarRegistrations = await Registration.find({
    event: { $in: eventIds },
    user: { $ne: userId },
    status: { $in: [RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN] },
  }).populate('user', 'name email avatar bio organization');

  // Count common events
  const userScores: Record<string, any> = {};
  similarRegistrations.forEach((reg: any) => {
    const uid = reg.user._id.toString();
    if (!userScores[uid]) {
      userScores[uid] = { user: reg.user, score: 0 };
    }
    userScores[uid].score += 1;
  });

  return Object.values(userScores)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit)
    .map((item: any) => item.user);
};

/**
 * AI speaker recommendations based on event category and past speakers
 */
export const recommendSpeakers = async (eventCategory: string) => {
  const speakers = await User.find({ role: UserRole.SPEAKER, isActive: true }).select(
    'name email avatar bio organization'
  );

  // Score speakers by their profile completeness and bio relevance
  const scored = speakers.map((speaker) => {
    let score = 0;
    if (speaker.bio) score += 3;
    if (speaker.organization) score += 2;
    if (speaker.avatar) score += 1;
    if (speaker.bio?.toLowerCase().includes(eventCategory.toLowerCase())) score += 5;
    return { speaker, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.speaker);
};
