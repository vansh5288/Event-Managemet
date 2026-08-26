import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

let genAI: GoogleGenerativeAI | null = null;
if (config.googleAiApiKey) {
  genAI = new GoogleGenerativeAI(config.googleAiApiKey);
}

const systemPrompt = `
You are EventHub Assistant, a helpful AI assistant for an Event Management Platform.
You can help users with:
- Finding events and recommending events based on their interests
- Answering questions about event booking, tickets, and payments
- Providing information about event features
- General event management advice

Be concise, friendly, and helpful. If you don't know something, say so honestly.
`;

/**
 * AI Chatbot for the Event Management Platform
 */
export const getChatbotResponse = async (message: string, userContext?: any) => {
  if (!genAI) {
    // Fallback rule-based responses
    return ruleBasedResponse(message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const userInfo = userContext
      ? `User context: ${JSON.stringify(userContext)}`
      : '';

    const prompt = `${systemPrompt}\n\n${userInfo}\n\nUser: ${message}\n\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      message: response.text(),
      aiGenerated: true,
    };
  } catch (error) {
    console.error('AI chatbot error:', error);
    return { message: ruleBasedResponse(message).message, aiGenerated: false };
  }
};

/**
 * AI email generator for event announcements
 */
export const generateEventEmail = async (
  eventName: string,
  emailType: string,
  audience: string,
  details?: string
) => {
  if (!genAI) {
    return ruleBasedEmail(eventName, emailType, audience);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Write a professional marketing email for an event management platform.
      Event: ${eventName}
      Email type: ${emailType}
      Audience: ${audience}
      ${details ? `Additional details: ${details}` : ''}

      The email should include:
      - A compelling subject line
      - Personalized greeting
      - Clear call to action
      - Professional formatting

      Return JSON with:
      - subject: string
      - body: string (HTML formatted)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { ...JSON.parse(jsonMatch[0]), aiGenerated: true };
    }
  } catch (error) {
    console.error('AI email generation error:', error);
  }

  return ruleBasedEmail(eventName, emailType, audience);
};

/**
 * AI spam detection for reviews and messages
 */
export const detectSpam = async (text: string) => {
  // Heuristic spam detection
  const spamIndicators = [
    { pattern: /(\w+\.){2,}\w+/g, weight: 0.3, reason: 'Too many links' },
    { pattern: /(buy now|click here|free money|urgent|act now)/gi, weight: 0.4, reason: 'Spam language' },
    { pattern: /(!!!|\.\.\.|####)/g, weight: 0.2, reason: 'Excessive punctuation' },
  ];

  let spamScore = 0;
  const reasons: string[] = [];

  spamIndicators.forEach(({ pattern, weight, reason }) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      spamScore += weight;
      reasons.push(reason);
    }
  });

  // Length-based checks
  if (text.length < 5) spamScore += 0.2;
  if (text.length > 2000) spamScore += 0.1;

  const isSpam = spamScore > 0.5;

  if (genAI && text.length > 20) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(
        `Is the following message spam? Reply with "yes" or "no" only.\n\n"${text}"`
      );
      const response = await result.response;
      const answer = response.text().trim().toLowerCase();
      if (answer.includes('yes')) {
        return { isSpam: true, score: Math.max(spamScore, 0.8), reasons: [...reasons, 'AI detection'] };
      }
    } catch (error) {
      console.error('AI spam detection error:', error);
    }
  }

  return { isSpam, score: spamScore, reasons };
};

const ruleBasedResponse = (message: string) => {
  const lower = message.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return { message: 'Hello! 👋 Welcome to EventHub. How can I help you today? You can ask me about finding events, booking tickets, or anything else!', aiGenerated: false };
  }

  if (lower.includes('event') || lower.includes('find')) {
    return { message: 'I can help you find events! You can browse events from the "Events" section in the sidebar, search by category, location, or date. Try our AI-powered recommendations for personalized suggestions! 🎯', aiGenerated: false };
  }

  if (lower.includes('ticket') || lower.includes('book')) {
    return { message: 'Booking tickets is easy! Simply find an event you like, select your ticket type, and proceed to checkout. We support secure payments via Stripe and Razorpay. 🎫', aiGenerated: false };
  }

  if (lower.includes('payment') || lower.includes('pay')) {
    return { message: 'We accept payments via Stripe and Razorpay. All payments are secure and encrypted. You can view your payment history from the Payments section. 💳', aiGenerated: false };
  }

  if (lower.includes('refund') || lower.includes('cancel')) {
    return { message: 'To cancel a booking, go to "My Tickets" and select the event you want to cancel. Refunds are processed within 5-7 business days. ⏱️', aiGenerated: false };
  }

  if (lower.includes('thank')) {
    return { message: "You're welcome! 😊 Is there anything else I can help you with?", aiGenerated: false };
  }

  return { message: "I'm here to help! You can ask me about finding events, booking tickets, payments, refunds, or anything related to the EventHub platform. 🚀", aiGenerated: false };
};

const ruleBasedEmail = (eventName: string, emailType: string, audience: string) => {
  const subject = emailType === 'announcement'
    ? `Announcement: ${eventName}`
    : emailType === 'reminder'
      ? `Reminder: ${eventName} is coming up!`
      : `You're invited to ${eventName}`;

  const body = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 16px;">
      <h2 style="color: #0f172a; margin: 0 0 16px;">${subject}</h2>
      <p style="color: #475569; margin: 0 0 16px;">Dear ${audience},</p>
      <p style="color: #475569; margin: 0 0 24px;">We're excited to share details about <strong>${eventName}</strong> with you!</p>
      <a href="${config.appUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Learn More</a>
    </div>
  `;

  return { subject, body, aiGenerated: false };
};
