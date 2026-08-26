import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { Event, EventStatus } from '../models/Event';

let genAI: GoogleGenerativeAI | null = null;
if (config.googleAiApiKey) {
  genAI = new GoogleGenerativeAI(config.googleAiApiKey);
}

/**
 * AI sentiment analysis for event feedback and reviews
 */
export const analyzeSentiment = async (text: string) => {
  if (!genAI) {
    // Fallback heuristic sentiment analysis
    return heuristicSentiment(text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
      Analyze the sentiment of the following event feedback text.
      Return a JSON object with:
      - sentiment: "positive" | "negative" | "neutral"
      - score: number between -1 (very negative) and 1 (very positive)
      - keywords: array of key sentiment-bearing words

      Text: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse JSON from response (strip markdown code blocks if present)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return heuristicSentiment(text);
  } catch (error) {
    console.error('AI sentiment analysis error:', error);
    return heuristicSentiment(text);
  }
};

/**
 * Generate AI event summary
 */
export const generateEventSummary = async (event: any, reviews: any[]) => {
  if (!genAI) {
    return {
      summary: event.shortDescription || event.description?.substring(0, 200),
      highlights: event.highlights || [],
      aiGenerated: false,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const reviewText = reviews
      .map((r) => `"${r.comment}" (${r.rating}/5)`)
      .join('\n');

    const prompt = `
      Generate a concise event summary and key highlights based on the following data:
      Event: ${event.title}
      Description: ${event.description}
      Reviews: ${reviewText || 'No reviews yet'}

      Return JSON with:
      - summary: string (2-3 sentences)
      - highlights: array of 3-5 key highlights
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { ...JSON.parse(jsonMatch[0]), aiGenerated: true };
    }
  } catch (error) {
    console.error('AI summary generation error:', error);
  }

  return {
    summary: event.shortDescription || event.description?.substring(0, 200),
    highlights: [],
    aiGenerated: false,
  };
};

/**
 * AI duplicate event detection
 */
export const detectDuplicateEvents = async (title: string, description: string) => {
  const events = await Event.find({ status: { $ne: EventStatus.CANCELLED } }).select(
    'title description category'
  );

  const duplicates = events
    .map((event) => {
      const titleSimilarity = calculateSimilarity(title, event.title);
      const descSimilarity = calculateSimilarity(
        description,
        event.description || ''
      );
      const overall = (titleSimilarity * 0.7 + descSimilarity * 0.3);
      return { event, similarity: overall };
    })
    .filter((item) => item.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  return duplicates;
};

const calculateSimilarity = (a: string, b: string): number => {
  const aWords = a.toLowerCase().split(/\W+/).filter(Boolean);
  const bWords = b.toLowerCase().split(/\W+/).filter(Boolean);
  const bSet = new Set(bWords);

  let matches = 0;
  aWords.forEach((word) => {
    if (bSet.has(word)) matches++;
  });

  const maxLength = Math.max(aWords.length, bWords.length);
  return maxLength === 0 ? 0 : matches / maxLength;
};

/**
 * Heuristic sentiment analysis (fallback when AI not configured)
 */
const heuristicSentiment = (text: string) => {
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'good', 'love', 'best', 'awesome', 'perfect', 'helpful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'poor', 'hate', 'boring', 'waste', 'disappointing', 'horrible'];

  const words = text.toLowerCase().split(/\W+/);
  let score = 0;

  words.forEach((word) => {
    if (positiveWords.includes(word)) score += 0.25;
    if (negativeWords.includes(word)) score -= 0.25;
  });

  const clampedScore = Math.max(-1, Math.min(1, score));
  const sentiment = clampedScore > 0.1 ? 'positive' : clampedScore < -0.1 ? 'negative' : 'neutral';

  return {
    sentiment,
    score: clampedScore,
    keywords: words.filter((w) => positiveWords.includes(w) || negativeWords.includes(w)),
  };
};
