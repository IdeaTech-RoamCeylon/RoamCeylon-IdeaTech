import { Controller, Get, Post, Query, Logger, Body } from '@nestjs/common';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';
import { STOP_WORDS } from '../../constants/stop-words';

/* -------------------- TYPES -------------------- */

export interface SearchResultItem {
  rank: number;
  id: number | string;
  title: string;
  content: string;
  score: number;
  confidence?: 'High' | 'Medium' | 'Low';
  metadata?: unknown;
}

export interface SearchResponseDto {
  query: string;
  results: SearchResultItem[];
  message?: string;
}

export interface TripPlanRequestDto {
  destination: string;
  startDate: string;
  endDate: string;
  preferences?: string[];
}

interface EmbeddedItem {
  id: number | string;
  title: string;
  content: string;
  embedding: number[];
}

type ItineraryCategory =
  | 'Arrival'
  | 'Sightseeing'
  | 'Culture'
  | 'Nature'
  | 'Beach'
  | 'Relaxation';

interface ItineraryItemDto {
  order: number;
  placeName: string;
  shortDescription: string;
  category: ItineraryCategory;
  confidenceScore?: 'High' | 'Medium' | 'Low';
}

interface TripPlanResponseDto {
  plan: {
    destination: string;
    dates: {
      start: string;
      end: string;
    };
    itinerary: ItineraryItemDto[];
  };
  message: string;
}

type VectorSearchResult = SearchResultItem[] | { message: string };

/* -------------------- CONTROLLER -------------------- */

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) {}

  @Get('health')
  getHealth() {
    return { message: 'AI Planner Module Operational' };
  }

  /* ---------- Validate & Preprocess ---------- */
  private validateAndPreprocess(
    query: unknown,
  ): { cleaned: string; tokens: string[] } | string {
    if (typeof query !== 'string') return 'Invalid query format.';

    const trimmed = query.trim();
    if (!trimmed) return 'Query cannot be empty.';

    const cleaned = preprocessQuery(trimmed);
    if (!cleaned) return 'Query contains no valid searchable characters.';

    if (cleaned.length < 3) return 'Query too short (minimum 3 characters).';

    if (cleaned.length > 300) return 'Query too long (maximum 300 characters).';

    const tokens = cleaned.split(/\s+/).filter((t) => !STOP_WORDS.has(t));

    if (tokens.length === 0)
      return 'Query contains no meaningful searchable terms.';

    return { cleaned, tokens };
  }

  /* ---------- In-memory cosine search ---------- */
  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();
    const originalQuery = typeof query === 'string' ? query : '';

    const validated = this.validateAndPreprocess(query);
    if (typeof validated === 'string') {
      return {
        query: originalQuery,
        results: [],
        message: validated,
      };
    }

    const { cleaned, tokens } = validated;
    const queryComplexity = tokens.length * cleaned.length;

    const embedStart = process.hrtime.bigint();
    const queryVector = this.aiService.generateDummyEmbedding(cleaned, 1536);
    const embeddingTimeMs =
      Number(process.hrtime.bigint() - embedStart) / 1_000_000;

    const items: EmbeddedItem[] = await this.aiService.getAllEmbeddings();

    const rowsScanned = items.length;

    const keywordFiltered = items.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      return tokens.some(
        (token) =>
          text.includes(token) || this.aiService.isPartialMatch(token, text),
      );
    });

    const rowsAfterGate = keywordFiltered.length;

    if (rowsAfterGate === 0) {
      return {
        query: cleaned,
        results: [],
        message: 'No strong matches found.',
      };
    }

    const scored = keywordFiltered
      .map((item) => {
        const score = this.aiService.cosineSimilarity(
          queryVector,
          item.embedding,
        );

        return {
          id: item.id,
          title: item.title,
          content: item.content,
          score,
          confidence: this.searchService.getConfidence(score),
        };
      })
      .filter((item) => item.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const totalTimeMs =
      Number(process.hrtime.bigint() - totalStart) / 1_000_000;

    this.logger.log(`
      [SEARCH METRICS]
      Query            : "${cleaned}"
      Tokens           : ${tokens.length}
      Query Complexity : ${queryComplexity}
      Rows Scanned     : ${rowsScanned}
      Rows After Gate  : ${rowsAfterGate}
      Vector Gen Time  : ${embeddingTimeMs.toFixed(2)} ms
      Total Time       : ${totalTimeMs.toFixed(2)} ms
      `);

    return {
      query: originalQuery,
      results: scored.map((item, idx) => ({
        rank: idx + 1,
        ...item,
      })),
    };
  }

  /* ---------- REST endpoints ---------- */

  @Get('search')
  async search(@Query('query') query: unknown): Promise<SearchResponseDto> {
    return this.executeSearch(query);
  }

  @Get('search/vector')
  async searchVector(
    @Query('q') q: unknown,
    @Query('limit') limit?: string,
  ): Promise<SearchResponseDto> {
    const validated = this.validateAndPreprocess(q);
    if (typeof validated === 'string') {
      return {
        query: typeof q === 'string' ? q : '',
        results: [],
        message: validated,
      };
    }

    const { cleaned } = validated;

    const parsedLimit = Number(limit);
    const lim =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 20)
        : 10;

    const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);

    const rawResults: VectorSearchResult =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );

    if (Array.isArray(rawResults)) {
      return { query: cleaned, results: rawResults };
    }

    return {
      query: cleaned,
      results: [],
      message: rawResults.message,
    };
  }

  /* ---------- Seed ---------- */

  @Post('seed')
  async seedDatabase(): Promise<{ message: string }> {
    try {
      await this.aiService.seedEmbeddingsFromAiPlanner();
      return { message: 'Seeding completed successfully!' };
    } catch {
      return { message: 'Seeding failed.' };
    }
  }

  /* ---------- Debug ---------- */

  @Get('debug/embedding')
  debugEmbedding(@Query('text') text: string) {
    const cleaned = preprocessQuery(text);
    const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);

    return {
      cleanedQuery: cleaned,
      embedding,
      dimension: embedding.length,
      min: Math.min(...embedding),
      max: Math.max(...embedding),
    };
  }

  /* ---------- Trip Planner ---------- */
  private generateItinerary(
    searchResults: SearchResultItem[],
    dayCount: number,
    preferences?: string[],
    destination?: string, // Add destination parameter
  ): ItineraryItemDto[] {
    const itinerary: ItineraryItemDto[] = [];

    // Categorization keywords
    const categoryKeywords: Record<ItineraryCategory, string[]> = {
      Arrival: ['airport', 'hotel', 'accommodation', 'check-in'],
      Sightseeing: [
        'fortress',
        'rock',
        'temple',
        'monument',
        'historical',
        'ancient',
      ],
      Culture: ['museum', 'art', 'cultural', 'traditional', 'heritage'],
      Nature: [
        'park',
        'wildlife',
        'forest',
        'mountain',
        'national park',
        'lake',
      ],
      Beach: ['beach', 'ocean', 'coast', 'surf', 'whale', 'diving'],
      Relaxation: ['spa', 'resort', 'tea', 'scenic', 'plantation'],
    };

    // Helper to determine category
    const determineCategory = (
      title: string,
      content: string,
      index: number,
    ): ItineraryCategory => {
      const text = `${title} ${content}`.toLowerCase();

      // First day should be arrival-related
      if (index === 0) return 'Arrival';

      // Check preferences first
      if (preferences && preferences.length > 0) {
        for (const pref of preferences) {
          const prefLower = pref.toLowerCase();
          if (text.includes(prefLower)) {
            if (prefLower.includes('beach')) return 'Beach';
            if (prefLower.includes('nature') || prefLower.includes('wildlife'))
              return 'Nature';
            if (prefLower.includes('culture') || prefLower.includes('temple'))
              return 'Culture';
          }
        }
      }

      // Match against category keywords
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => text.includes(keyword))) {
          return category as ItineraryCategory;
        }
      }

      // Default rotation
      const defaultRotation: ItineraryCategory[] = [
        'Sightseeing',
        'Nature',
        'Culture',
        'Beach',
        'Relaxation',
      ];
      return defaultRotation[index % defaultRotation.length];
    };

    // Map search results to itinerary items
    searchResults.forEach((result, index) => {
      itinerary.push({
        order: index + 1,
        placeName: result.title,
        shortDescription: result.content,
        category: determineCategory(result.title, result.content, index),
        confidenceScore: result.confidence,
      });
    });

    // Add fallback if no results
    if (itinerary.length === 0) {
      itinerary.push({
        order: 1,
        placeName: destination || 'Unknown Destination', // Fixed typo
        shortDescription:
          'Explore local attractions and get familiar with the area.',
        category: 'Arrival',
        confidenceScore: 'Low',
      });
    }

    return itinerary;
  }

  @Post('trip-plan')
  async tripPlan(
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    this.logger.log(`🗺️ Generating trip plan for: ${body.destination}`);

    // Step 1: Build search query from destination + preferences
    const query = [body.destination, ...(body.preferences ?? [])].join(' ');

    // Step 2: Call internal search pipeline
    const searchResults = await this.executeSearch(query);

    // Step 3: Calculate trip duration
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const dayCount =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    this.logger.log(`📅 Trip duration: ${dayCount} days`);

    // Step 4: Select top results based on trip duration (more days = more places)
    const maxPlaces = Math.min(dayCount * 2, searchResults.results.length, 10); // 2 activities per day, max 10
    const topResults = searchResults.results.slice(0, maxPlaces);

    // Step 5: Generate ordered itinerary with smart categorization
    const itinerary = this.generateItinerary(
      topResults,
      dayCount,
      body.preferences,
      body.destination,
    ); // Pass destination

    // Step 6: Return structured plan
    return {
      plan: {
        destination: body.destination,
        dates: {
          start: body.startDate,
          end: body.endDate,
        },
        itinerary,
      },
      message: `Generated ${itinerary.length} activities for your ${dayCount}-day trip to ${body.destination}`,
    };
  }
}
