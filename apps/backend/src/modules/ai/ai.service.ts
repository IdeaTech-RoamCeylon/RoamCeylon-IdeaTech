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

    const ragSection = retrievedFactsText
      ? 'Retrieved context facts from our verified Sri Lanka travel database:\n' +
        retrievedFactsText +
        '\nAlways prioritize these real database facts in your answer.'
      : '';

    // Build the prompt using string concatenation to avoid template-literal escaping issues
    const prompt =
      'You are a world-class, premium conversational travel assistant specializing in Sri Lanka.\n' +
      'Your audience consists of high-end international travelers expecting detailed, highly accurate, and context-rich assistance.\n' +
      'Current trip parameters (already known — do NOT reset these, only update or add): ' +
      JSON.stringify(currentParams) +
      '.\n' +
      'User message: "' +
      message +
      '".\n' +
      '\n' +
      ragSection +
      '\n\n' +
      'You must perform two simultaneous tasks:\n' +
      "1. ANSWER THE USER'S QUESTIONS:\n" +
      '   - Answer any question with profound local expertise (safety, weather, monsoon, train routes, culture, packing).\n' +
      '   - Be specific with real facts (e.g., Sigiriya is best climbed at 6 AM; Kandy-to-Ella train takes 7 hours; southwest monsoon May-September).\n' +
      '   - Recommend SPECIFIC named places where relevant (e.g., "Mirissa Beach", "Galle Fort", "Ella Rock hike").\n' +
      '\n' +
      '2. EXTRACT TRIP PARAMETERS (SLOT-FILLING):\n' +
      '   - Extract or update only the parameters that the user has explicitly mentioned.\n' +
      '   - Keep all existing parameter values — NEVER set a filled field back to null.\n' +
      '   a. destination: primary city/region (e.g. "Ella", "Galle", "South Coast")\n' +
      '   b. duration: always include the unit (e.g. "5 days", "7 days")\n' +
      '   c. pax: full group description:\n' +
      '      - "honeymoon", "couple" → "Couple (2)"\n' +
      '      - "solo", "by myself" → "Solo (1)"\n' +
      '      - "family" + kids/children → "Family of [N]"\n' +
      "      - Otherwise use the user's exact description\n" +
      '   d. budget: MUST be exactly one of: "Low", "Medium", "High", "Luxury"\n' +
      '      - "budget", "backpacker", "cheap" → "Low"\n' +
      '      - "comfortable", "mid-range" → "Medium"\n' +
      '      - "nice hotels", "good quality" → "High"\n' +
      '      - "luxury", "5-star", "premium" → "Luxury"\n' +
      '   e. interests: array of strings — MERGE with existing, do NOT replace:\n' +
      '      - Include BOTH generic interests AND any specific places/activities mentioned.\n' +
      '      - Example: "Mirissa for whale watching" → add ["beach", "whale watching", "Mirissa"]\n' +
      '      - Example: "Ella Rock hike" → add ["hiking", "Ella Rock", "nature"]\n' +
      '   f. lastDayPreference: exactly one of "explore" or "head_home"\n' +
      '      - "look around", "visit places", "explore" → "explore"\n' +
      '      - "go back", "leave", "head home" → "head_home"\n' +
      '\n' +
      'CONVERSATIONAL GUIDANCE:\n' +
      '- Priority for missing params: destination → duration → pax → budget → interests → lastDayPreference.\n' +
      '- Ask for the HIGHEST PRIORITY missing param only, one at a time.\n' +
      '- For lastDayPreference, specifically ask: "Would you like to explore some places on your last day, or just head straight home?"\n' +
      '- Answer questions first in a warm, sophisticated tone, then ask for the next missing param.\n' +
      '- When all 6 are collected OR user says "generate"/"build my plan", set isComplete=true.\n' +
      '\n' +
      'Return ONLY a JSON object (no markdown, no backticks):\n' +
      '{\n' +
      '  "isComplete": boolean,\n' +
      '  "reply": string,\n' +
      '  "extractedData": {\n' +
      '    "destination": string | null,\n' +
      '    "duration": string | null,\n' +
      '    "pax": string | null,\n' +
      '    "budget": string | null,\n' +
      '    "interests": string[] | null,\n' +
      '    "lastDayPreference": string | null\n' +
      '  }\n' +
      '}';

    const ExtractedDataSchema = z.object({
      isComplete: z.boolean(),
      reply: z.string(),
      extractedData: z.object({
        destination: z.string().nullable(),
        duration: z.string().nullable(),
        pax: z.string().nullable(),
        budget: z.string().nullable(),
        interests: z.array(z.string()).nullable(),
        lastDayPreference: z.string().nullable(),
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

      const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash-lite',
      ];
      let result: any;
      let lastError: unknown;

      for (const modelName of modelsToTry) {
        try {
          const currentModel = genAI.getGenerativeModel({ model: modelName });
          result = await currentModel.generateContent(prompt);
          break; // Success
        } catch (err: unknown) {
          lastError = err;
          const error = err as { status?: number; message?: string };
          if (
            error?.status === 429 ||
            error?.message?.includes('429') ||
            error?.status === 503 ||
            error?.message?.includes('503') ||
            error?.status === 404 ||
            error?.message?.includes('404')
          ) {
            console.log(`[AI Chat] Model ${modelName} failed. Trying next...`);
            continue;
          } else {
            throw err instanceof Error ? err : new Error(String(err));
          }
        }
      }
      if (!result) {
        throw lastError instanceof Error
          ? lastError
          : new Error(String(lastError));
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const text = String(result.response.text());
      const parsedJson = this.parseGenerativeJson(text);
      const validatedData = ExtractedDataSchema.parse(parsedJson);

      await this.prisma.message.create({
        data: {
          sessionId: currentSessionId,
          sender: 'ai',
          content: validatedData,
        },
      });

      if (validatedData.extractedData.destination) {
        this.autoLearnDestination(
          validatedData.extractedData.destination,
        ).catch((e) => console.error('Background self-learning failed:', e));
      }

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
          customReply =
            "I'm having a brief connection glitch with my cognitive engine, but I successfully retrieved this verified info from RoamCeylon's local database: " +
            cleanedFact +
            '\n\nCould you tell me how many days you plan to spend or your budget so we can keep building your itinerary?';
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

  async autoLearnDestination(destination: string): Promise<void> {
    try {
      const existing = await this.prisma.embeddings.findFirst({
        where: {
          title: {
            equals: destination.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        return; // Already learned!
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return;

      const genAI = new GoogleGenerativeAI(apiKey);

      const learnPrompt =
        'You are a professional travel compiler. Generate a highly accurate, structured travel database record for this Sri Lankan location: "' +
        destination +
        '".\n' +
        'Return ONLY a JSON object with this exact structure (no markdown, no backticks, no comments):\n' +
        '{\n' +
        '  "title": "Clean, official name of the place",\n' +
        '  "description": "A 1-sentence detailed travel description of the place, highlights, and travel tips.",\n' +
        '  "near": ["adjacent town 1", "adjacent town 2"],\n' +
        '  "region": "one of: south, cultural_triangle, kandy, hill_country, safari_south, east_coast, north, west, south_west, uva, sabaragamuwa, east"\n' +
        '}';

      const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash-lite',
      ];
      let result: any;
      let lastError: unknown;

      for (const modelName of modelsToTry) {
        try {
          const currentModel = genAI.getGenerativeModel({ model: modelName });
          result = await currentModel.generateContent(learnPrompt);
          break; // Success
        } catch (err: unknown) {
          lastError = err;
          const error = err as { status?: number; message?: string };
          if (
            error?.status === 429 ||
            error?.message?.includes('429') ||
            error?.status === 503 ||
            error?.message?.includes('503') ||
            error?.status === 404 ||
            error?.message?.includes('404')
          ) {
            console.log(`[AI Learn] Model ${modelName} failed. Trying next...`);
            continue;
          } else {
            throw err instanceof Error ? err : new Error(String(err));
          }
        }
      }
      if (!result) {
        throw lastError instanceof Error
          ? lastError
          : new Error(String(lastError));
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const text = String(result.response.text());

      const parsed = this.parseGenerativeJson(text) as {
        title?: string;
        description?: string;
        near?: string[];
        region?: string;
      };

      const title = String(parsed.title || destination).trim();
      const desc = String(parsed.description || '').trim();
      const near = Array.isArray(parsed.near)
        ? parsed.near.map((x) => String(x).toLowerCase().trim())
        : [];
      const region = String(parsed.region || '')
        .toLowerCase()
        .trim();

      if (title && desc) {
        const metaLines: string[] = [];
        if (near.length) metaLines.push('Near: ' + near.join(', '));
        if (region) metaLines.push('Region: ' + region);
        const contentWithMeta = metaLines.length
          ? desc + '\n\n' + metaLines.join('\n')
          : desc;

        const textForEmbedding = title + '. ' + contentWithMeta;
        const embedding = this.generateDummyEmbedding(textForEmbedding);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await (this.embeddingService as any).saveNewEmbedding(
          title,
          contentWithMeta,
          embedding,
        );
        console.log(
          '[Self-Learning] Automatically learned new destination: "' +
            title +
            '"',
        );
      }
    } catch (e) {
      console.error(
        '[Self-Learning] Failed to automatically learn destination:',
        e,
      );
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

  async deleteChatSession(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Chat session not found');
    }

    return this.prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }
}
