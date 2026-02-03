import { Injectable, BadRequestException } from '@nestjs/common';
import { EmbeddingService } from './embeddings/embedding.service';
import { EXPLANATION_VALIDATION_RULES } from './prompts/planner.prompt';
import { DayDto } from './dto/update-trip.dto';

@Injectable()
export class AIService {
  constructor(private readonly embeddingService: EmbeddingService) {}

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
    const foundActivities: string[] = [];
    activityNames.forEach((name) => {
      if (sequence.toLowerCase().includes(name.toLowerCase())) {
        foundActivities.push(name);
      }
    });
    return foundActivities;
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
}
