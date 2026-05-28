import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EmbeddingService } from './embeddings/embedding.service';
import { EXPLANATION_VALIDATION_RULES } from './prompts/planner.prompt';
import { DayDto } from './dto/update-trip.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AIService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly prisma: PrismaService,
  ) {}

  async seedEmbeddingsFromAiPlanner(): Promise<void> {
    await this.embeddingService.seedEmbeddings();
  }

  async getAllEmbeddings() {
    return this.embeddingService.getAllEmbeddings();
  }

  async search(vector: number[], limit: number) {
    return this.embeddingService.searchEmbeddings(vector, limit);
  }

  generateDummyEmbedding(text: string, dim = 1536): number[] {
    return this.embeddingService.generateDummyEmbedding(text, dim);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    return this.embeddingService.cosineSimilarity(a, b);
  }

  isPartialMatch(token: string, text: string): boolean {
    return this.embeddingService.isPartialMatch(token, text);
  }

  validateExplanations(days: DayDto[]): void {
    days.forEach((day, dayIndex) => {
      const { explanation, activities } = day;
      const fullExplanation = `${explanation.sequence} ${explanation.reasoning}`;

      // Check 1: Explanation must mention activity names
      const activityNames = activities.map((a) => a.name);
      const mentionsActivities = activityNames.some((name) =>
        fullExplanation.toLowerCase().includes(name.toLowerCase()),
      );

      if (!mentionsActivities) {
        throw new BadRequestException(
          `Day ${dayIndex + 1} explanation doesn't reference actual activities. ` +
            `Expected mention of: ${activityNames.join(', ')}`,
        );
      }

      // Check 2: No generic phrases
      const hasGeneric = EXPLANATION_VALIDATION_RULES.BANNED_PHRASES.some(
        (phrase) => fullExplanation.toLowerCase().includes(phrase),
      );

      if (hasGeneric) {
        throw new BadRequestException(
          `Day ${dayIndex + 1} explanation contains generic phrases. ` +
            `Be specific about timing, logistics, or experiences.`,
        );
      }

      // Check 3: Must mention times or sequence
      const mentionsTiming =
        /\d{1,2}:\d{2}|morning|afternoon|evening|first|then|after|AM|PM/i.test(
          fullExplanation,
        );

      if (!mentionsTiming) {
        throw new BadRequestException(
          `Day ${dayIndex + 1} explanation missing timing/sequence information.`,
        );
      }

      // Check 4: Sequence must match activity order
      const sequenceOrder = this.extractActivityOrderFromSequence(
        explanation.sequence,
        activityNames,
      );

      if (
        sequenceOrder.length > 0 &&
        !this.isOrderCorrect(sequenceOrder, activityNames)
      ) {
        throw new BadRequestException(
          `Day ${dayIndex + 1} explanation sequence doesn't match activity order.`,
        );
      }
    });
  }

  private extractActivityOrderFromSequence(
    sequence: string,
    activityNames: string[],
  ): string[] {
    const foundActivities: { name: string; index: number }[] = [];

    activityNames.forEach((name) => {
      const idx = sequence.toLowerCase().indexOf(name.toLowerCase());
      if (idx !== -1) {
        foundActivities.push({ name, index: idx });
      }
    });

    return foundActivities.sort((a, b) => a.index - b.index).map((f) => f.name);
  }

  private isOrderCorrect(
    sequenceOrder: string[],
    actualOrder: string[],
  ): boolean {
    let lastIndex = -1;
    for (const activity of sequenceOrder) {
      const currentIndex = actualOrder.indexOf(activity);
      if (currentIndex <= lastIndex) return false;
      lastIndex = currentIndex;
    }
    return true;
  }

  cleanExplanation(explanation: string): string {
    // Remove filler words
    const cleaned = explanation
      .replace(/\b(basically|essentially|actually|really)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit length
    return cleaned.length > 120 ? cleaned.substring(0, 117) + '...' : cleaned;
  }

  private parseGenerativeJson(rawText: string): unknown {
    const trimmed = rawText.trim();
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      // Robust recovery parser for LLM formatting: extract standard curly braces block
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as unknown;
        } catch (innerErr) {
          throw new Error(
            `Generative JSON extraction regex failed to parse: ${innerErr.message}`,
          );
        }
      }
      throw new Error(
        `Generative JSON could not find any enclosing curly braces: "${trimmed}"`,
      );
    }
  }

  async extractTripParameters(
    message: string,
    currentParams: Record<string, unknown>,
    userId: string,
    sessionId?: string,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('GEMINI_API_KEY is not configured.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
    });

    let retrievedFactsText = '';
    if (this.embeddingService) {
      try {
        const queryVector = this.generateDummyEmbedding(message);
        const searchResults = await this.search(queryVector, 3);
        if (searchResults && searchResults.length > 0) {
          retrievedFactsText = searchResults
            .map((r) => `- **${r.title}**: ${r.content}`)
            .join('\n');
        }
      } catch (e) {
        console.error('Failed to retrieve search facts for AI context:', e);
      }
    }

    const prompt = `You are a world-class, premium conversational travel assistant specializing in Sri Lanka.
Your audience consists of high-end international travelers expecting detailed, highly accurate, and context-rich assistance.
Current trip parameters: ${JSON.stringify(currentParams)}.
User message: "${message}".

${
  retrievedFactsText
    ? `Retrieved context facts from our verified Sri Lanka travel database matching the user's query:
${retrievedFactsText}
Use the above database facts to provide extremely accurate answers if the user asks about these locations or regions. Always prioritize these real database facts.`
    : ''
}

You must perform two simultaneous tasks:
1. ANSWER THE USER'S QUESTIONS:
   - If the user asks ANY question (about safety, weather, monsoon seasons, toddler friendliness, local routes, train tickets, packing, or cultural etiquettes), you must answer it with profound local expertise.
   - Be specific: Mention real facts (e.g., Sigiriya is best climbed at 6 AM; Kandy-to-Ella train is iconic and takes 7 hours; southwest monsoon runs May-September, northeast runs October-January).
   - If their question is complex, break down the answer logically and offer practical solutions (e.g. private driver vs. train, safety precautions).

2. EXTRACT TRIP PARAMETERS (SLOT-FILLING):
   - Analyze the conversation and silently extract or update the 5 key parameters:
     a. destination (string - e.g. "Ella", "Galle", "Kandy")
     b. duration (string - e.g. "5 days")
     c. pax (string - e.g. "2 adults", "Family of 4 with a toddler")
     d. budget (string - "Low", "Medium", "High", "Luxury")
     e. interests (array of strings - e.g. ["hiking", "culture", "beaches"])
   - Keep current values if not updated in the new message.

CONVERSATIONAL GUIDANCE:
- If the user asked a question, prioritize answering it first in a warm, helpful, and sophisticated tone. After answering, if parameters are still missing, smoothly transition into asking for ONE missing parameter (e.g. "To help me tailor the perfect route, how many days are you planning to spend in Sri Lanka?").
- If no question was asked, generate a natural reply acknowledging their inputs and asking for ONE missing parameter.
- If all 5 parameters are collected (none are null) or the user explicitly requests to build/generate their trip plan, set isComplete to true and give a concluding reply letting them know you are generating the itinerary (e.g. "Perfect, I have all the details! Preparing your custom Sri Lankan adventure now.").

Return ONLY a JSON object with this exact structure (no markdown tags, no backticks):
{
  "isComplete": boolean,
  "reply": string,
  "extractedData": {
    "destination": string | null,
    "duration": string | null,
    "pax": string | null,
    "budget": string | null,
    "interests": string[] | null
  }
}`;

    const ExtractedDataSchema = z.object({
      isComplete: z.boolean(),
      reply: z.string(),
      extractedData: z.object({
        destination: z.string().nullable(),
        duration: z.string().nullable(),
        pax: z.string().nullable(),
        budget: z.string().nullable(),
        interests: z.array(z.string()).nullable(),
      }),
    });

    let currentSessionId = sessionId;

    try {
      if (!currentSessionId) {
        const session = await this.prisma.chatSession.create({
          data: { userId },
        });
        currentSessionId = session.id;
      }

      await this.prisma.message.create({
        data: {
          sessionId: currentSessionId,
          sender: 'user',
          content: message,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsedJson = this.parseGenerativeJson(text);
      const validatedData = ExtractedDataSchema.parse(parsedJson);

      await this.prisma.message.create({
        data: {
          sessionId: currentSessionId,
          sender: 'ai',
          content: validatedData,
        },
      });

      return { ...validatedData, sessionId: currentSessionId };
    } catch (error) {
      console.error('Gemini extraction failed:', error);

      let customReply =
        'I experienced a brief connection glitch, but please let me know your destination, group size, or interests, and we will get your custom Sri Lankan plan generated!';

      // Advanced RAG Fallback Reply: If we have retrieved local RAG facts, extract the first one to present to the user
      if (retrievedFactsText) {
        const firstLine = retrievedFactsText.split('\n')[0] || '';
        const cleanedFact = firstLine.replace(/^- \*\*(.*?)\*\*:\s*/, '$1: ');
        if (cleanedFact) {
          customReply = `I'm having a brief connection glitch with my cognitive engine, but I successfully retrieved this verified info from RoamCeylon's local database: ${cleanedFact}\n\nCould you tell me how many days you plan to spend or your budget so we can keep building your itinerary?`;
        }
      }

      const fallbackReply = {
        isComplete: false,
        reply: customReply,
        extractedData: currentParams,
      };

      if (currentSessionId) {
        await this.prisma.message
          .create({
            data: {
              sessionId: currentSessionId,
              sender: 'ai',
              content: fallbackReply as unknown as Prisma.InputJsonValue,
            },
          })
          .catch((e) => console.error('Failed to save fallback msg', e));
      }

      return { ...fallbackReply, sessionId: currentSessionId };
    }
  }

  async getChatSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        tripPlans: {
          select: { id: true, name: true, destination: true },
        },
      },
    });
  }

  async getChatMessages(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Chat session not found');
    }

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
