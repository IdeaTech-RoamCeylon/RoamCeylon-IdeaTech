import {
  Controller,
  Get,
  Post,
  Query,
  Logger,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
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

// interface EmbeddedItem {
//   id: number | string;
//   title: string;
//   content: string;
//   embedding: number[];
// }

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
  explanation?: {
    selectionReason: string;
    rankingFactors: {
      relevanceScore: number;
      confidenceLevel: string;
      categoryMatch?: boolean;
      preferenceMatch?: string[];
    };
  };
}

// Day-based planning structure
interface DayPlan {
  day: number;
  date: string;
  theme?: string;
  activities: EnhancedItineraryItemDto[];
}

// Enhanced itinerary with additional fields
interface EnhancedItineraryItemDto extends ItineraryItemDto {
  dayNumber: number;
  timeSlot?: 'Morning' | 'Afternoon' | 'Evening';
  estimatedDuration?: string;
  priority: number;
}

// Enhanced response with day-by-day structure
interface TripPlanResponseDto {
  plan: {
    destination: string;
    dates: { start: string; end: string };
    totalDays: number;
    dayByDayPlan: DayPlan[];
    summary: {
      totalActivities: number;
      categoriesIncluded: ItineraryCategory[];
      preferencesMatched: string[];
    };
  };
  message: string;
}

// type VectorSearchResult = SearchResultItem[] | { message: string };

/* -------------------- CONTROLLER -------------------- */

@Controller('ai')
@UseGuards(ThrottlerGuard)
export class AIController {
  private readonly logger = new Logger(AIController.name);

  // Confidence threshold constants
  private readonly CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.5,
    MINIMUM: 0.55,
  };

  private readonly FALLBACK_MESSAGES = {
    NO_HIGH_CONFIDENCE: 'No high-confidence matches found. Showing best available results.',
    NO_MATCHES: 'No relevant items found. Please try refining your search with different keywords.',
    LOW_QUALITY: 'Search results have low confidence scores. Consider adding more specific details to your query.',
    PARTIAL_RESULTS: 'Only partial results available. Some recommendations may not strongly match your preferences.',
  };

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) { }

  @Get('health')
  getHealth() {
    return { message: 'AI Planner Module Operational' };
  }

  /* ---------- Validate & Preprocess ---------- */

  private validateAndPreprocess(
    query: unknown,
  ): { cleaned: string; tokens: string[] } | string {
    if (typeof query !== 'string') {
      return 'Invalid query format.';
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return 'Query cannot be empty.';
    }

    // Preprocess FIRST
    const cleaned = preprocessQuery(trimmed);

    if (!cleaned) {
      return 'Query contains no valid searchable characters.';
    }

    // Length validation AFTER preprocessing
    if (cleaned.length < 3) {
      return 'Query too short (minimum 3 characters).';
    }

    if (cleaned.length > 300) {
      return 'Query too long (maximum 300 characters).';
    }

    const tokens = cleaned.split(/\s+/);

    // Remove stop words before final check
    const meaningfulTokens = tokens.filter((t) => !STOP_WORDS.has(t));

    if (meaningfulTokens.length === 0) {
      return 'Query contains no meaningful searchable terms.';
    }

    return {
      cleaned,
      tokens: meaningfulTokens,
    };
  }

  /**
   * Filter results based on confidence thresholds
   * Returns filtered results and appropriate fallback message if needed
   */
  private filterByConfidenceThreshold(
    results: SearchResultItem[],
    minConfidence: 'High' | 'Medium' | 'Low' = 'Medium',
  ): { filtered: SearchResultItem[]; fallbackMessage?: string } {
    if (results.length === 0) {
      return {
        filtered: [],
        fallbackMessage: this.FALLBACK_MESSAGES.NO_MATCHES,
      };
    }

    // Threshold map
    const thresholdMap = {
      High: this.CONFIDENCE_THRESHOLDS.HIGH,
      Medium: this.CONFIDENCE_THRESHOLDS.MEDIUM,
      Low: this.CONFIDENCE_THRESHOLDS.MINIMUM,
    };
    const threshold = thresholdMap[minConfidence];

    // Filter results above threshold
    const filtered = results.filter((item) => item.score !== undefined && item.score >= threshold);

    // Default fallback
    let fallbackMessage: string | undefined;

    // Case 1: No results after filtering
    if (filtered.length === 0) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_MATCHES;
    }
    // Case 2: Minimum confidence is High, but no high-confidence matches
    else if (minConfidence === 'High' && !filtered.some((r) => r.confidence === 'High')) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_HIGH_CONFIDENCE;
    }
    // Case 3: Partial high-confidence coverage
    else if (minConfidence === 'High') {
      const highConfidenceCount = filtered.filter((r) => r.confidence === 'High').length;
      if (highConfidenceCount < filtered.length * 0.5) {
        fallbackMessage = this.FALLBACK_MESSAGES.PARTIAL_RESULTS;
      }
    }
    // Case 4: Average score is low
    const avgScore = filtered.reduce((sum, r) => sum + (r.score || 0), 0) / filtered.length;
    if (!fallbackMessage && avgScore < 0.65) {
      fallbackMessage = this.FALLBACK_MESSAGES.LOW_QUALITY;
    }

    return { filtered, fallbackMessage };
  }

  /* ---------- In-memory cosine search ---------- */
  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();

    const originalQuery = typeof query === 'string' ? query.trim() : '';

    // ---------- TYPE SAFETY ----------
    const validated = this.validateAndPreprocess(query);
    if (typeof validated === 'string')
      return {
        query: originalQuery,
        results: [],
        message: validated,
      };

    const { cleaned, tokens: queryTokens } = validated;
    const queryComplexity = queryTokens.length * cleaned.length;

    // ---------------- VECTOR GENERATION ----------------
    const embeddingStart = process.hrtime.bigint();
    const queryVector = this.aiService.generateDummyEmbedding(cleaned, 1536);
    const embeddingEnd = process.hrtime.bigint();
    const embeddingTimeMs = Number(embeddingEnd - embeddingStart) / 1_000_000;

    // ---------------- FETCH DATA ----------------
    const items = await this.aiService.getAllEmbeddings();
    const rowsScanned = items.length;

    // ---------------- SEARCH EXECUTION ----------------
    const searchStart = process.hrtime.bigint();

    // -------- KEYWORD + FUZZY GATE --------
    // 🔹 Log preprocessed query and filtered tokens
    this.logger.log(`🧹 Preprocessed query: "${cleaned}"`);

    const keywordFiltered = items.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();

      // Find matched tokens
      const matchedTokens = queryTokens.filter(
        (token) =>
          text.includes(token) || this.aiService.isPartialMatch(token, text),
      );

      // Return true if any token matched
      return matchedTokens.length > 0;
    });

    const rowsAfterGate = keywordFiltered.length;

    // -------- STOP EARLY --------
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
          normalizedText: `${item.title} ${item.content}`.toLowerCase().trim(),
        };
      })
      .filter((item) => item.score >= this.CONFIDENCE_THRESHOLDS.MINIMUM)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.id).localeCompare(String(b.id)); // Stable sort
      })
      .slice(0, 5)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
      }));

    // Apply confidence threshold filtering
    const { filtered, fallbackMessage } = this.filterByConfidenceThreshold(
      scored,
      'Medium', // Require at least Medium confidence
    );

    const searchEnd = process.hrtime.bigint();
    const searchTimeMs = Number(searchEnd - searchStart) / 1_000_000;

    const totalEnd = process.hrtime.bigint();
    const totalTimeMs = Number(totalEnd - totalStart) / 1_000_000;

    this.logger.log(
      `[SEARCH METRICS]
  Query           : "${originalQuery}"
  Tokens          : ${queryTokens.length}
  Query Complexity: ${queryComplexity}
  Rows Scanned    : ${rowsScanned}
  Rows After Gate : ${rowsAfterGate}
  Vector Gen Time : ${embeddingTimeMs.toFixed(2)} ms
  Search Exec Time: ${searchTimeMs.toFixed(2)} ms
  Total Time      : ${totalTimeMs.toFixed(2)} ms`,
    );

    return {
      query: originalQuery,
      results: filtered.map((item, idx) => ({
        ...item,
        rank: idx + 1, // Re-assign ranks after filtering
      })),
      message: fallbackMessage,
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
    @Query('minConfidence') minConfidence?: string, // optional confidence filter
  ): Promise<SearchResponseDto> {
    try {
      const validated = this.validateAndPreprocess(q);
      if (typeof validated === 'string')
        return {
          query: typeof q === 'string' ? q : '',
          results: [],
          message: validated,
        };

      const { cleaned } = validated;

      const startTotal = Date.now();

      const parsedLimit = Number(limit);

      const lim =
        Number.isInteger(parsedLimit) && parsedLimit > 0
          ? Math.min(parsedLimit, 20)
          : 10;

      this.logger.log(`🔍 Vector search - query received: "${String(q)}"`);
      this.logger.log(`🧹 Preprocessed query: "${cleaned}"`);

      // ---- Embedding ----
      const embedStart = Date.now();
      const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);
      const embedTime = Date.now() - embedStart;
      this.logger.log(`⚙️ Embedding generated in ${embedTime}ms`);

      // ---- Vector DB Search (ONE CALL ONLY) ----
      const searchStart = Date.now();

      const rawResults =
        await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
          embedding,
          lim,
        );
      const searchTime = Date.now() - searchStart;

      this.logger.log(`⏳ Vector DB search duration: ${searchTime}ms`);
      this.logger.log(`🏆 Ranked results: ${JSON.stringify(rawResults)}`);

      const total = Date.now() - startTotal;
      this.logger.log(`✅ Total vector search pipeline time: ${total}ms`);

      // Apply confidence filtering to vector results
      if (Array.isArray(rawResults)) {
        const confidenceLevel =
          minConfidence === 'High' || minConfidence === 'Medium' || minConfidence === 'Low'
            ? minConfidence
            : 'Medium';

        const { filtered, fallbackMessage } = this.filterByConfidenceThreshold(
          rawResults,
          confidenceLevel,
        );

        return {
          query: cleaned,
          results: filtered,
          message: fallbackMessage,
        };
      } else {
        return { query: cleaned, results: [], message: rawResults.message };
      }
    } catch (error) {
      this.logger.error(`Vector search failed: ${error.message}`, error.stack);
      return {
        query: typeof q === 'string' ? q : '',
        results: [],
        message: 'A temporary issue occurred with our search service. Please try keyword search instead.',
      };
    }
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

  /**
   * Score search results based on preferences and relevance
   */
  private scoreResultsByPreferences(
    results: SearchResultItem[],
    preferences?: string[],
  ): Array<SearchResultItem & { priorityScore: number }> {
    if (!preferences || preferences.length === 0) {
      return results.map((r) => ({
        ...r,
        priorityScore: r.score || 0.5,
      }));
    }

    return results
      .map((result) => {
        let priorityScore = result.score || 0.5;

        const text = `${result.title} ${result.content}`.toLowerCase();
        let matchCount = 0;

        for (const pref of preferences) {
          const prefLower = pref.toLowerCase();

          // Exact phrase match in title (highest priority)
          if (result.title.toLowerCase().includes(prefLower)) {
            priorityScore += 0.3;
            matchCount++;
          }
          // Match in content
          else if (text.includes(prefLower)) {
            priorityScore += 0.15;
            matchCount++;
          }

          // Bonus for multiple word preferences (more specific)
          if (prefLower.split(' ').length > 1 && text.includes(prefLower)) {
            priorityScore += 0.1;
          }
        }

        // Boost results that match multiple preferences
        if (matchCount > 1) {
          priorityScore += matchCount * 0.1;
        }

        // Confidence level weighting
        if (result.confidence === 'High') {
          priorityScore *= 1.2;
        } else if (result.confidence === 'Medium') {
          priorityScore *= 1.0;
        } else if (result.confidence === 'Low') {
          priorityScore *= 0.8;
        }

        // Cap the score
        priorityScore = Math.min(priorityScore, 2.0);

        return { ...result, priorityScore };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore); // Sort by priority
  }
  /* ---------- Trip Planner ---------- */
  /**
   * Generate explanation metadata for itinerary items
   */
  private generateExplanation(
    result: SearchResultItem,
    priorityScore: number,
    category: ItineraryCategory,
    preferences?: string[],
  ): {
    selectionReason: string;
    rankingFactors: {
      relevanceScore: number;
      confidenceLevel: string;
      categoryMatch?: boolean;
      preferenceMatch?: string[];
    };
  } {
    const matchedPreferences: string[] = [];
    let titleMatches = 0;
    let contentMatches = 0;

    // Check preference matches with detail
    if (preferences && preferences.length > 0) {
      const titleLower = result.title.toLowerCase();
      const contentLower = result.content.toLowerCase();

      for (const pref of preferences) {
        const prefLower = pref.toLowerCase();

        if (titleLower.includes(prefLower)) {
          matchedPreferences.push(pref);
          titleMatches++;
        } else if (contentLower.includes(prefLower)) {
          matchedPreferences.push(pref);
          contentMatches++;
        }
      }
    }

    // Build accurate selection reason
    const reasons: string[] = [];

    // Preference matching (most important)
    if (titleMatches > 0) {
      reasons.push(
        `strong match with preferences in title: ${matchedPreferences.slice(0, titleMatches).join(', ')}`,
      );
    } else if (contentMatches > 0) {
      reasons.push(`matches preferences: ${matchedPreferences.join(', ')}`);
    }

    // Relevance score (second most important)
    if (result.score && result.score >= 0.8) {
      reasons.push(
        `high relevance score (${(result.score * 100).toFixed(0)}%)`,
      );
    } else if (result.score && result.score >= 0.6) {
      reasons.push(
        `good relevance score (${(result.score * 100).toFixed(0)}%)`,
      );
    }

    // Confidence level
    if (result.confidence === 'High') {
      reasons.push(`high confidence match`);
    } else if (result.confidence === 'Medium') {
      reasons.push(`medium confidence`);
    }

    // Priority boost
    if (priorityScore > 1.5) {
      reasons.push(`highly prioritized by multiple factors`);
    } else if (priorityScore > 1.0) {
      reasons.push(`boosted priority`);
    }

    // Category fit
    if (reasons.length === 0) {
      reasons.push(`fits ${category.toLowerCase()} category`);
    }

    const selectionReason =
      reasons.length > 0
        ? `Selected: ${reasons.join('; ')}`
        : `Selected based on category fit (${category})`;

    return {
      selectionReason,
      rankingFactors: {
        relevanceScore: result.score || 0,
        confidenceLevel: result.confidence || 'Low',
        categoryMatch: true,
        preferenceMatch:
          matchedPreferences.length > 0 ? matchedPreferences : undefined,
      },
    };
  }

  private isValidDestination(destination?: string): boolean {
    if (!destination || typeof destination !== 'string') return false;

    const trimmed = destination.trim().toLowerCase();

    // Minimum length for a meaningful destination
    if (trimmed.length < 2) return false;

    // Reject common placeholder/nonsense values
    const invalidValues = [
      'unknown',
      'n/a',
      'none',
      'test',
      'undefined',
      'null',
      'somewhere',
    ];
    if (invalidValues.includes(trimmed)) return false;

    // Reject searches that are purely numeric (likely zip codes or IDs, not city names)
    if (/^\d+$/.test(trimmed)) return false;

    return true;
  }

  /**
   * Safely parse and validate trip dates
   */
  private validateDates(
    start?: string,
    end?: string,
  ): { startDate: string; endDate: string; dayCount: number; isValid: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = (d?: string): Date | null => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    let startDate = parseDate(start);
    let endDate = parseDate(end);

    // Default: 3-day trip starting today
    if (!startDate) {
      startDate = new Date(today);
    }

    if (!endDate || endDate < startDate) {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2); // Default 3 days (e.g., 9th to 11th)
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const dayCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Cap trip duration to 14 days to prevent performance issues
    const finalDayCount = Math.min(Math.max(1, dayCount), 14);

    // Recalculate end date if capped
    if (finalDayCount !== dayCount) {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + finalDayCount - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dayCount: finalDayCount,
      isValid: !!start && !!end && !isNaN(new Date(start).getTime()) && !isNaN(new Date(end).getTime()),
    };
  }

  /**
   * Create fallback itinerary when confidence is too low
   */
  private createFallbackItinerary(
    dayCount: number,
    startDate: string,
    destination?: string,
  ): DayPlan[] {
    const dayPlans: DayPlan[] = [];
    const baseDate = new Date(startDate);

    for (let day = 1; day <= dayCount; day++) {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + day - 1);

      const fallbackActivity: EnhancedItineraryItemDto = {
        order: day,
        dayNumber: day,
        placeName: destination || 'Destination',
        shortDescription:
          day === 1
            ? 'Arrival and check-in at accommodation. Explore nearby area.'
            : `Explore ${destination || 'the destination'} at your own pace. Visit local attractions and landmarks.`,
        category: day === 1 ? 'Arrival' : 'Sightseeing',
        timeSlot: day === 1 ? 'Afternoon' : 'Morning',
        estimatedDuration: '3-4 hours',
        confidenceScore: 'Low',
        priority: 0.3,
        explanation: {
          selectionReason:
            'Fallback activity - insufficient high-confidence recommendations available',
          rankingFactors: {
            relevanceScore: 0,
            confidenceLevel: 'Low',
            categoryMatch: false,
          },
        },
      };

      dayPlans.push({
        day,
        date: dayDate.toISOString().split('T')[0],
        theme: day === 1 ? 'Arrival Day' : 'Exploration',
        activities: [fallbackActivity],
      });
    }

    return dayPlans;
  }

  /**
   * Main enhanced itinerary generation
   */
  private generateItinerary(
    searchResults: SearchResultItem[],
    dayCount: number,
    startDate: string,
    preferences?: string[],
    destination?: string,
  ): DayPlan[] {
    // Apply stricter confidence filtering with logging
    const filteredResults = searchResults.filter((result) => {
      // Remove results below minimum threshold
      if (!result.score || result.score < this.CONFIDENCE_THRESHOLDS.MINIMUM) {
        this.logger.warn(
          `Filtered out low score result: "${result.title}" (score: ${result.score})`,
        );
        return false;
      }

      // Remove very short descriptions
      if (result.content.length < 20) {
        this.logger.warn(
          `Filtered out short content: "${result.title}" (length: ${result.content.length})`,
        );
        return false;
      }

      return true;
    });

    // Check if we have enough quality results
    if (filteredResults.length === 0) {
      this.logger.error('No results passed confidence threshold filters');
      // Return minimal fallback itinerary
      return this.createFallbackItinerary(dayCount, startDate, destination);
    }

    const scored = this.scoreResultsByPreferences(filteredResults, preferences);
    const maxActivities = Math.min(15, scored.length);
    const selectedResults = this.selectDiverseActivities(scored, maxActivities);

    const avgScore =
      selectedResults.reduce((sum, r) => sum + (r.score || 0), 0) /
      selectedResults.length;

    const highConfidenceCount = selectedResults.filter(
      (r) => r.confidence === 'High',
    ).length;

    if (avgScore < 0.6) {
      this.logger.warn(`Low average relevance score: ${avgScore.toFixed(2)}`);
    }

    if (highConfidenceCount < selectedResults.length * 0.3) {
      this.logger.warn(
        `Low confidence warning: only ${highConfidenceCount}/${selectedResults.length} are high confidence`,
      );
    }

    const dayPlans: DayPlan[] = [];
    let activityIndex = 0;

    const categorySequence: ItineraryCategory[] = [
      'Arrival',
      'Sightseeing',
      'Culture',
      'Nature',
      'Beach',
      'Relaxation',
    ];

    for (let day = 1; day <= dayCount; day++) {
      const activitiesForDay: EnhancedItineraryItemDto[] = [];
      const rawActivitiesThisDay = Math.max(
        1,
        Math.ceil((maxActivities - activityIndex) / (dayCount - day + 1)),
      );

      // Realistic daily cap
      const MAX_ACTIVITIES_PER_DAY = dayCount === 1 ? 3 : 4;
      const activitiesThisDay = Math.min(
        rawActivitiesThisDay,
        MAX_ACTIVITIES_PER_DAY,
      );

      for (
        let i = 0;
        i < activitiesThisDay && activityIndex < selectedResults.length;
        i++
      ) {
        const result = selectedResults[activityIndex];
        const scoredResult = scored.find((s) => s.id === result.id);
        const priorityScore = scoredResult?.priorityScore || 0;

        // Prefer logical order using category sequence
        let category = this.determineActivityCategory(
          result.title,
          result.content,
          day,
          i,
          preferences,
        );
        const seqIndex = categorySequence.indexOf(category);
        category = categorySequence[seqIndex >= 0 ? seqIndex : 0];

        activitiesForDay.push({
          order: activityIndex + 1,
          dayNumber: day,
          placeName: result.title,
          shortDescription: result.content,
          category,
          timeSlot: this.assignTimeSlot(i, activitiesThisDay, day),
          estimatedDuration: this.estimateDuration(category),
          confidenceScore: result.confidence,
          priority:
            Math.round(
              (scored.find((s) => s.id === result.id)?.priorityScore || 0) *
              100,
            ) / 100,
          explanation: this.generateExplanation(
            result,
            priorityScore,
            category,
            preferences,
          ),
        });

        activityIndex++;
      }

      // Fallback for empty day 1
      if (activitiesForDay.length === 0 && day === 1) {
        activitiesForDay.push({
          order: 1,
          dayNumber: 1,
          placeName: destination || 'Destination',
          shortDescription:
            'Arrival and check-in at accommodation. Explore nearby area.',
          category: 'Arrival',
          timeSlot: 'Afternoon',
          estimatedDuration: '2-3 hours',
          confidenceScore: 'Low',
          priority: 0.5,
          explanation: {
            selectionReason:
              'Default arrival activity - no specific matches found',
            rankingFactors: {
              relevanceScore: 0,
              confidenceLevel: 'Low',
              categoryMatch: false,
            },
          },
        });
      }

      const baseDate = new Date(startDate);
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + day - 1);

      dayPlans.push({
        day,
        date: dayDate.toISOString().split('T')[0],
        theme: this.generateDayTheme(activitiesForDay),
        activities: activitiesForDay,
      });
    }
    return dayPlans;
  }

  private inferCategoryFromText(
    title: string,
    content: string,
    preferences?: string[],
  ): ItineraryCategory {
    const text = `${title} ${content}`.toLowerCase();

    if (preferences) {
      for (const pref of preferences) {
        const p = pref.toLowerCase();
        if (p.match(/beach|coast/)) return 'Beach';
        if (p.match(/culture|temple|heritage/)) return 'Culture';
        if (p.match(/nature|wildlife|park/)) return 'Nature';
        if (p.match(/relax|spa|resort/)) return 'Relaxation';
      }
    }

    if (text.match(/beach|coast|ocean/)) return 'Beach';
    if (text.match(/temple|museum|heritage/)) return 'Culture';
    if (text.match(/park|wildlife|forest/)) return 'Nature';
    if (text.match(/fort|ancient|historical/)) return 'Sightseeing';

    return 'Sightseeing';
  }

  /**
   * Enhanced category determination with better logic
   */
  private determineActivityCategory(
    title: string,
    content: string,
    dayNumber: number,
    activityIndex: number,
    preferences?: string[],
  ): ItineraryCategory {
    // Day 1 afternoon should always be Arrival
    if (dayNumber === 1 && activityIndex === 0) return 'Arrival';

    // Start with base inference
    let category = this.inferCategoryFromText(title, content, preferences);

    // Optional: apply day rotation fallback if no strong match
    const rotationPattern: ItineraryCategory[] = [
      'Sightseeing',
      'Nature',
      'Culture',
      'Beach',
      'Relaxation',
    ];

    if (!category || category === 'Sightseeing') {
      category = rotationPattern[(dayNumber + activityIndex) % rotationPattern.length];
    }

    return category;
  }


  /**
   * Ensure diversity in activity categories
   */
  private selectDiverseActivities(
    scoredResults: Array<
      SearchResultItem & { priorityScore: number; normalizedText?: string }
    >,
    maxCount: number,
    preferences?: string[],
  ): SearchResultItem[] {
    const selected: SearchResultItem[] = [];
    const categoryCount: Record<string, number> = {};
    const textSet = new Set<string>();
    const maxPerCategory = Math.ceil(maxCount / 4);

    const sorted = [...scoredResults].sort(
      (a, b) => b.priorityScore - a.priorityScore,
    );

    for (const result of sorted) {
      if (selected.length >= maxCount) break;

      const textKey =
        result.normalizedText ||
        `${result.title} ${result.content}`.toLowerCase();
      if (textSet.has(textKey)) continue;

      // Determine category using the new helper
      const category = this.inferCategoryFromText(result.title, result.content, preferences);

      // Respect category limit for diversity
      const currentCount = categoryCount[category] || 0;
      if (currentCount < maxPerCategory) {
        selected.push(result);
        categoryCount[category] = currentCount + 1;
        textSet.add(textKey);
      }
    }

    // Fill remaining if not enough
    for (const result of sorted) {
      if (selected.length >= maxCount) break;
      const textKey =
        result.normalizedText ||
        `${result.title} ${result.content}`.toLowerCase();
      if (!textSet.has(textKey)) {
        selected.push(result);
        textSet.add(textKey);
      }
    }

    return selected;
  }

  /**
   * Assign time slots to activities for better day structure
   */
  private assignTimeSlot(
    activityIndex: number,
    totalActivitiesInDay: number,
    dayNumber?: number,
  ): 'Morning' | 'Afternoon' | 'Evening' {
    // 🔹 DAY 1 RULE
    if (dayNumber === 1) {
      // Arrival handled separately
      if (activityIndex === 0) return 'Afternoon';
      return 'Evening';
    }

    // 🔹 OTHER DAYS LOGIC
    if (totalActivitiesInDay === 1) return 'Morning';

    if (totalActivitiesInDay === 2) {
      return activityIndex === 0 ? 'Morning' : 'Afternoon';
    }

    const ratio = activityIndex / (totalActivitiesInDay - 1);
    if (ratio < 0.4) return 'Morning';
    if (ratio < 0.7) return 'Afternoon';
    return 'Evening';
  }

  /**
   * Estimate activity duration based on category
   */
  private estimateDuration(category: ItineraryCategory): string {
    const durations: Record<ItineraryCategory, string> = {
      Arrival: '2-3 hours',
      Sightseeing: '2-4 hours',
      Culture: '2-3 hours',
      Nature: '3-5 hours',
      Beach: '2-4 hours',
      Relaxation: '2-3 hours',
    };
    return durations[category];
  }

  /**
   * Generate day themes based on activities
   */
  private generateDayTheme(activities: EnhancedItineraryItemDto[]): string {
    const categories = activities.map((a) => a.category);
    const uniqueCategories = [...new Set(categories)];

    if (uniqueCategories.length === 1) {
      return `${uniqueCategories[0]} Day`;
    }

    if (categories.includes('Beach') && categories.includes('Relaxation')) {
      return 'Beach & Relaxation';
    }

    if (categories.includes('Culture') && categories.includes('Sightseeing')) {
      return 'Cultural Exploration';
    }

    if (categories.includes('Nature')) {
      return 'Nature & Wildlife';
    }

    return 'Mixed Activities';
  }

  @Post('trip-plan')
  async tripPlanEnhanced(
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    try {
      // 1. Strict Input Validation & Preprocessing
      const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
      const preferences = Array.isArray(body.preferences)
        ? body.preferences.filter((p) => typeof p === 'string' && p.length > 0)
        : [];

      const { startDate, endDate, dayCount, isValid: datesAreValid } = this.validateDates(
        body.startDate,
        body.endDate,
      );

      const isValidDestination = this.isValidDestination(destination);

      const validThemes: ItineraryCategory[] = [
        'Arrival',
        'Sightseeing',
        'Culture',
        'Nature',
        'Beach',
        'Relaxation',
      ];

      let dayByDayPlan: DayPlan[] = [];
      let preferencesMatched: string[] = [];

      // Fetch all DB embeddings for fallback scenarios
      const allEmbeddings = await this.aiService.getAllEmbeddings();

      // ----- CASE 1: INVALID DESTINATION OR DATES -----
      if (!isValidDestination || !datesAreValid) {
        const suggestions: EnhancedItineraryItemDto[] = [];
        const matchedPrefsSet = new Set<string>();

        // Match preferences in database for personalized suggestions even without destination
        preferences.forEach((pref) => {
          const prefLower = pref.toLowerCase();
          const matchedItems = allEmbeddings.filter((item) => {
            const text = `${item.title} ${item.content}`.toLowerCase();
            return text.includes(prefLower);
          });

          matchedItems.slice(0, 2).forEach((item) => {
            if (!suggestions.some(s => s.placeName === item.title)) {
              suggestions.push({
                order: suggestions.length + 1,
                dayNumber: 1,
                placeName: item.title,
                shortDescription: item.content,
                category: validThemes.includes(pref as ItineraryCategory)
                  ? (pref as ItineraryCategory)
                  : 'Sightseeing',
                confidenceScore: 'Medium',
                priority: 0.7,
                explanation: {
                  selectionReason: `Matches your preference "${pref}"`,
                  rankingFactors: {
                    relevanceScore: 0.6,
                    confidenceLevel: 'Medium',
                    categoryMatch: true,
                    preferenceMatch: [pref],
                  },
                },
              });
              matchedPrefsSet.add(pref);
            }
          });
        });

        // Fill with general attractions if needed
        if (suggestions.length < 3) {
          allEmbeddings
            .sort((a, b) => String(a.title).localeCompare(String(b.title))) // Stable sort
            .slice(0, 5 - suggestions.length)
            .forEach((item) => {
              if (!suggestions.some(s => s.placeName === item.title)) {
                suggestions.push({
                  order: suggestions.length + 1,
                  dayNumber: 1,
                  placeName: item.title,
                  shortDescription: item.content,
                  category: 'Sightseeing',
                  confidenceScore: 'High',
                  priority: 0.5,
                });
              }
            });
        }

        preferencesMatched = Array.from(matchedPrefsSet);

        return {
          plan: {
            destination: isValidDestination ? destination : 'Travel Discovery',
            dates: { start: startDate, end: endDate },
            totalDays: dayCount,
            dayByDayPlan: [
              {
                day: 1,
                date: startDate,
                theme: 'Travel Suggestions',
                activities: suggestions.slice(0, 4),
              },
            ],
            summary: {
              totalActivities: Math.min(suggestions.length, 4),
              categoriesIncluded: [...new Set(suggestions.map((a) => a.category))],
              preferencesMatched,
            },
          },
          message: !isValidDestination
            ? 'Destination not recognized. Showing top travel recommendations based on your preferences.'
            : 'Invalid dates provided. Showing a suggested itinerary based on default travel dates.',
        };
      }

      // ----- CASE 2: VALID DESTINATION - Normal Workflow -----
      const searchTerms = [
        destination,
        'attractions',
        ...(preferences.length > 0 ? preferences : ['best places']),
      ];
      const query = searchTerms.join(' ');

      const searchResults = await this.executeSearch(query);

      dayByDayPlan = this.generateItinerary(
        searchResults.results,
        dayCount,
        startDate,
        preferences,
        destination,
      );

      // Final metadata calculation
      const allActivities = dayByDayPlan.flatMap((d) => d.activities);
      const allCategoriesInPlan = [...new Set(allActivities.map((a) => a.category))];

      preferencesMatched = preferences.filter((pref) =>
        allActivities.some(
          (a) =>
            a.category.toLowerCase() === pref.toLowerCase() ||
            a.placeName.toLowerCase().includes(pref.toLowerCase()) ||
            a.shortDescription.toLowerCase().includes(pref.toLowerCase()),
        ),
      );

      const message =
        preferencesMatched.length > 0
          ? `Personalized itinerary generated for ${destination} with matches for ${preferencesMatched.length} preferences.`
          : `Itinerary generated for ${destination}. Explore the best attractions this location has to offer.`;

      return {
        plan: {
          destination,
          dates: { start: startDate, end: endDate },
          totalDays: dayCount,
          dayByDayPlan,
          summary: {
            totalActivities: allActivities.length,
            categoriesIncluded: allCategoriesInPlan as ItineraryCategory[],
            preferencesMatched,
          },
        },
        message,
      };
    } catch (error) {
      this.logger.error(`Critical error in tripPlanEnhanced: ${error.message}`, error.stack);

      // ABSOLUTE FALLBACK - Never return 500
      const today = new Date().toISOString().split('T')[0];
      return {
        plan: {
          destination: body.destination || 'Sri Lanka',
          dates: { start: today, end: today },
          totalDays: 1,
          dayByDayPlan: [
            {
              day: 1,
              date: today,
              theme: 'Exploration Day',
              activities: [
                {
                  order: 1,
                  dayNumber: 1,
                  placeName: 'Local Exploration',
                  shortDescription: 'Discover the hidden gems and local culture of the area at your own pace.',
                  category: 'Sightseeing',
                  timeSlot: 'Morning',
                  estimatedDuration: '4 hours',
                  confidenceScore: 'Low',
                  priority: 0.5,
                },
              ],
            },
          ],
          summary: {
            totalActivities: 1,
            categoriesIncluded: ['Sightseeing'],
            preferencesMatched: [],
          },
        },
        message: 'We encountered a temporary issue generating your personalized plan. Showing a general recommendation instead.',
      };
    }
  }
}
