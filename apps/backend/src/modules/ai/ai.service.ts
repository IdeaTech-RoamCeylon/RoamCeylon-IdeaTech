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

    const prompt = `You are a conversational travel assistant for Sri Lanka.
Current trip parameters: ${JSON.stringify(currentParams)}.
User message: "${message}".

Your task is to extract 5 parameters for a trip to Sri Lanka:
1. destination (string)
2. duration (string, e.g. "5 days")
3. pax (string, number of people)
4. budget (string, "Low", "Medium", "High", "Luxury")
5. interests (array of strings)

Analyze the user message and update the current parameters.
If any parameter is still missing (null), generate a friendly, natural conversational reply asking for ONE missing parameter.
If all 5 parameters are collected (not null), set isComplete to true and generate a friendly closing reply (e.g. "Perfect, I have all the details! Generating your plan now.").

Return ONLY a JSON object with this exact structure (no markdown tags):
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
      const cleanedText = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const parsedJson = JSON.parse(cleanedText) as unknown;
      const validatedData = ExtractedDataSchema.parse(parsedJson);

      await this.prisma.message.create({
        data: {
          sessionId: currentSessionId,
          sender: 'ai',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          content: validatedData as any,
        },
      });

      return { ...validatedData, sessionId: currentSessionId };
    } catch (error) {
      console.error('Gemini extraction failed:', error);

      const fallbackReply = {
        isComplete: false,
        reply:
          "I'm having a little trouble understanding that. Could you rephrase your last message?",
        extractedData: currentParams,
      };

      if (currentSessionId) {
        await this.prisma.message
          .create({
            data: {
              sessionId: currentSessionId,
              sender: 'ai',
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              content: fallbackReply as any,
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
