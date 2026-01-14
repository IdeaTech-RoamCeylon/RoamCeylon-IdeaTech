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

type ItineraryCategory =
  | 'Arrival'
  | 'Sightseeing'
  | 'Culture'
  | 'History'
  | 'Nature'
  | 'Beach'
  | 'Adventure'
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
  theme: string;
  themeExplanation?: string;
  activities: EnhancedItineraryItemDto[];
  groupingReason?: string;
}

// Enhanced itinerary with additional fields
interface EnhancedItineraryItemDto extends ItineraryItemDto {
  dayNumber: number;
  timeSlot?: 'Morning' | 'Afternoon' | 'Evening';
  estimatedDuration?: string;
  priority: number;
  dayPlacementReason?: string;
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
    NO_HIGH_CONFIDENCE:
      'No high-confidence matches found. Showing best available results.',
    NO_MATCHES:
      'No relevant items found. Please try refining your search with different keywords.',
    LOW_QUALITY:
      'Search results have low confidence scores. Consider adding more specific details to your query.',
    PARTIAL_RESULTS:
      'Only partial results available. Some recommendations may not strongly match your preferences.',
  };

  private readonly INTEREST_CATEGORY_MAP: Record<string, ItineraryCategory[]> =
    {
      nature: ['Nature'],
      history: ['History', 'Culture', 'Sightseeing'],
      culture: ['Culture', 'History', 'Sightseeing'],
      adventure: ['Adventure', 'Nature'],
      beach: ['Beach', 'Relaxation'],
      relaxation: ['Relaxation', 'Beach'],
      food: ['Culture', 'Relaxation'],
      shopping: ['Sightseeing', 'Culture'],
      nightlife: ['Sightseeing', 'Relaxation'],
    };

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
    const filtered = results.filter(
      (item) => item.score !== undefined && item.score >= threshold,
    );

    // Default fallback
    let fallbackMessage: string | undefined;

    // Case 1: No results after filtering
    if (filtered.length === 0) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_MATCHES;
    }
    // Case 2: Minimum confidence is High, but no high-confidence matches
    else if (
      minConfidence === 'High' &&
      !filtered.some((r) => r.confidence === 'High')
    ) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_HIGH_CONFIDENCE;
    }
    // Case 3: Partial high-confidence coverage
    else if (minConfidence === 'High') {
      const highConfidenceCount = filtered.filter(
        (r) => r.confidence === 'High',
      ).length;
      if (highConfidenceCount < filtered.length * 0.5) {
        fallbackMessage = this.FALLBACK_MESSAGES.PARTIAL_RESULTS;
      }
    }
    // Case 4: Average score is low
    const avgScore =
      filtered.reduce((sum, r) => sum + (r.score || 0), 0) / filtered.length;
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
    const validated = this.validateAndPreprocess(q);
    if (typeof validated === 'string')
      return {
        query: typeof q === 'string' ? q : '',
        results: [],
        message: validated,
      };

    const { cleaned } = validated;

    const parsedLimit = Number(limit);

    const lim =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 20)
        : 10;

    // ---- Embedding ----
    const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);

    // ---- Vector DB Search (ONE CALL ONLY) ----
    const rawResults =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );

    // Apply confidence filtering to vector results
    if (Array.isArray(rawResults)) {
      const confidenceLevel =
        minConfidence === 'High' ||
        minConfidence === 'Medium' ||
        minConfidence === 'Low'
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
    dayCount?: number,
  ): Array<SearchResultItem & { priorityScore: number }> {
    const tripType = dayCount ? this.getTripLengthType(dayCount) : undefined;

    return results
      .map((result) => {
        let priorityScore = result.score || 0.5;

        const text = `${result.title} ${result.content}`.toLowerCase();

        /* ---------- INTEREST TYPE PERSONALIZATION ---------- */
        if (preferences) {
          for (const pref of preferences) {
            const prefLower = pref.toLowerCase();
            const mappedCategories = this.INTEREST_CATEGORY_MAP[prefLower];
            const CATEGORY_MATCH_HIGH_BOOST = 0.2;
            const CATEGORY_MATCH_LOW_BOOST = 0.1;

            if (!mappedCategories) continue;

            for (const cat of mappedCategories) {
              if (text.includes(cat.toLowerCase())) {
                priorityScore +=
                  result.confidence === 'High'
                    ? CATEGORY_MATCH_HIGH_BOOST
                    : CATEGORY_MATCH_LOW_BOOST;
                break;
              }
            }
          }
        }

        /* ---------- TRIP LENGTH PERSONALIZATION ---------- */
        if (tripType === 'short') {
          // Short trips → compact / high-value experiences
          if (text.match(/fort|temple|kovil|church|museum|beach/)) {
            priorityScore += 0.15;
          }
        }

        if (tripType === 'long') {
          // Long trips → nature + relaxation
          if (text.match(/nature|park|wildlife|relax|spa|garden/)) {
            priorityScore += 0.15;
          }
        }

        /* ---------- CONFIDENCE WEIGHTING ---------- */
        if (result.confidence === 'High') priorityScore *= 1.2;
        else if (result.confidence === 'Low') priorityScore *= 0.85;

        // Cap score to avoid overfitting
        priorityScore = Math.min(priorityScore, 2.0);

        return { ...result, priorityScore };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  private getTripLengthType(dayCount: number): 'short' | 'medium' | 'long' {
    if (dayCount <= 2) return 'short';
    if (dayCount <= 5) return 'medium';
    return 'long';
  }

  // Generate explanation metadata for itinerary items
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

  // Prevents meaningless AI searches, Enables intelligent fallback logic
  private isValidDestination(destination?: string): boolean {
    if (!destination) return false;

    const trimmed = destination.trim().toLowerCase();

    if (trimmed.length < 3) return false;

    const invalidValues = ['unknown', 'n/a', 'none'];
    return !invalidValues.includes(trimmed);
  }

  //Create fallback itinerary when confidence is too low
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

  // Main enhanced itinerary generation (MULTI-DAY SAFE)
  private generateItinerary(
    searchResults: SearchResultItem[],
    dayCount: number,
    startDate: string,
    preferences?: string[],
    destination?: string,
  ): DayPlan[] {
    // Strict filtering
    const filteredResults = searchResults.filter((result) => {
      if (!result.score || result.score < this.CONFIDENCE_THRESHOLDS.MINIMUM) {
        this.logger.warn(
          `Filtered out low score result: "${result.title}" (score: ${result.score})`,
        );
        return false;
      }

      if (!result.content || result.content.length < 20) {
        this.logger.warn(
          `Filtered out short content: "${result.title}" (length: ${result.content?.length ?? 0})`,
        );
        return false;
      }

      return true;
    });

    // If nothing usable → full fallback plan
    if (filteredResults.length === 0) {
      this.logger.error('No results passed confidence threshold filters');
      return this.createFallbackItinerary(dayCount, startDate, destination);
    }

    // Score + diversify
    const scored = this.scoreResultsByPreferences(
      filteredResults,
      preferences,
      dayCount,
    );

    // total max activities for the full tripok
    const MAX_PER_DAY = dayCount === 1 ? 2 : 4; // Arrival day: max 2 activities
    const maxTotalActivities = Math.min(
      dayCount * MAX_PER_DAY,
      15,
      scored.length,
    );

    const selectedResults = this.selectDiverseActivities(
      scored,
      maxTotalActivities,
      preferences,
    );

    // Build day buckets (balanced distribution)
    const dayBuckets = this.allocateAcrossDays(
      selectedResults,
      dayCount,
      MAX_PER_DAY,
    );

    // Build day plans + pad empty days with fallback activity
    const dayPlans: DayPlan[] = [];
    const baseDate = new Date(startDate);

    for (let day = 1; day <= dayCount; day++) {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + (day - 1));

      const bucket = dayBuckets[day - 1] ?? [];
      const activitiesForDay: EnhancedItineraryItemDto[] = [];

      for (let i = 0; i < bucket.length; i++) {
        const result = bucket[i];
        const scoredResult = scored.find((s) => s.id === result.id);
        const priorityScore = scoredResult?.priorityScore || 0;

        const category = this.determineActivityCategory(
          result.title,
          result.content,
          day,
          i,
          preferences,
        );

        const activityItem: EnhancedItineraryItemDto = {
          order: i + 1,
          dayNumber: day,
          placeName: result.title,
          shortDescription: result.content,
          category,
          timeSlot: this.assignTimeSlot(i, bucket.length, day),
          estimatedDuration: this.estimateDuration(category),
          confidenceScore: result.confidence || 'Low',
          priority: Math.round((priorityScore || 0) * 100) / 100,
          explanation: this.generateExplanation(
            result,
            priorityScore,
            category,
            preferences,
          ),
        };

        activitiesForDay.push(activityItem);

        // Generate day placement explanation after adding to array
        activityItem.dayPlacementReason = this.generateDayPlacementExplanation(
          day,
          activityItem,
          dayCount,
          activitiesForDay,
        );
      }

      // Guarantee at least 1 activity per day
      if (activitiesForDay.length === 0) {
        activitiesForDay.push(this.createSingleDayFallback(day, destination));
      }

      // Guarantee day 1 has Arrival as first item
      if (day === 1 && activitiesForDay.length > 0) {
        activitiesForDay[0].category = 'Arrival';
        activitiesForDay[0].timeSlot = 'Afternoon';
        activitiesForDay[0].estimatedDuration = '2-3 hours';
      }

      const themeData = this.generateDayTheme(activitiesForDay);
      const groupingReason = this.generateGroupingExplanation(activitiesForDay);

      dayPlans.push({
        day,
        date: dayDate.toISOString().split('T')[0],
        theme: themeData.theme,
        themeExplanation: themeData.explanation,
        groupingReason,
        activities: activitiesForDay,
      });
    }

    return dayPlans;
  }

  // Balanced distribution across days (keeps daily cap)
  private allocateAcrossDays(
    activities: SearchResultItem[],
    dayCount: number,
    maxPerDay: number,
  ): SearchResultItem[][] {
    const buckets: SearchResultItem[][] = Array.from(
      { length: dayCount },
      () => [],
    );

    // Round-robin distribution for balance
    let dayIndex = 0;
    for (const item of activities) {
      // find next day that still has space
      let tries = 0;
      while (tries < dayCount && buckets[dayIndex].length >= maxPerDay) {
        dayIndex = (dayIndex + 1) % dayCount;
        tries++;
      }

      // if all full, stop
      if (tries >= dayCount && buckets[dayIndex].length >= maxPerDay) break;

      buckets[dayIndex].push(item);
      dayIndex = (dayIndex + 1) % dayCount;
    }

    return buckets;
  }

  // Single fallback activity (used to pad empty days)
  private createSingleDayFallback(
    day: number,
    destination?: string,
  ): EnhancedItineraryItemDto {
    const isDay1 = day === 1;

    return {
      order: 1,
      dayNumber: day,
      placeName: destination || 'Destination',
      shortDescription: isDay1
        ? 'Arrival and check-in at accommodation. Explore nearby area.'
        : `Explore ${destination || 'the destination'} at your own pace. Visit local landmarks and attractions.`,
      category: isDay1 ? 'Arrival' : 'Sightseeing',
      timeSlot: isDay1 ? 'Afternoon' : 'Morning',
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
  }

  private inferCategoryFromText(
    title: string,
    content: string,
    preferences?: string[],
  ): ItineraryCategory {
    const lower = `${title} ${content}`.toLowerCase();

    if (preferences?.length) {
      for (const pref of preferences) {
        if (lower.includes(pref.toLowerCase())) {
          const mapped = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()];
          if (mapped?.length) return mapped[0];
        }
      }
    }

    if (lower.includes('beach') || lower.includes('surf')) return 'Beach';
    if (
      lower.includes('fort') ||
      lower.includes('historical') ||
      lower.includes('ruins') ||
      lower.includes('temple') ||
      lower.includes('kovil') ||
      lower.includes('church')
    )
      return 'History';
    if (lower.includes('museum') || lower.includes('culture')) return 'Culture';
    if (
      lower.includes('park') ||
      lower.includes('wildlife') ||
      lower.includes('forest') ||
      lower.includes('nature')
    )
      return 'Nature';
    if (
      lower.includes('adventure') ||
      lower.includes('hiking') ||
      lower.includes('rafting')
    )
      return 'Adventure';

    return 'Sightseeing';
  }

  // Enhanced category determination with better logic
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
      'History',
      'Culture',
      'Beach',
      'Nature',
      'Adventure',
      'Relaxation',
      'Beach',
    ];

    if (!category || category === 'Sightseeing') {
      category =
        rotationPattern[(dayNumber + activityIndex) % rotationPattern.length];
    }

    return category;
  }

  // Ensure diversity in activity categories
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
      const category = this.inferCategoryFromText(
        result.title,
        result.content,
        preferences,
      );

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

  // Assign time slots to activities for better day structure
  private assignTimeSlot(
    activityIndex: number,
    totalActivitiesInDay: number,
    dayNumber?: number,
  ): 'Morning' | 'Afternoon' | 'Evening' {
    // DAY 1 RULE
    if (dayNumber === 1) {
      // Arrival handled separately
      if (activityIndex === 0) return 'Afternoon';
      return 'Evening';
    }

    // OTHER DAYS LOGIC
    if (totalActivitiesInDay === 1) return 'Morning';

    if (totalActivitiesInDay === 2) {
      return activityIndex === 0 ? 'Morning' : 'Afternoon';
    }

    const ratio = activityIndex / (totalActivitiesInDay - 1);
    if (ratio < 0.4) return 'Morning';
    if (ratio < 0.7) return 'Afternoon';
    return 'Evening';
  }

  // Estimate activity duration based on category
  private estimateDuration(category: ItineraryCategory): string {
    const durations: Record<ItineraryCategory, string> = {
      Arrival: '2-3 hours',
      Sightseeing: '2-4 hours',
      Culture: '2-3 hours',
      History: '2-4 hours',
      Nature: '3-5 hours',
      Adventure: '3-6 hours',
      Beach: '2-4 hours',
      Relaxation: '2-3 hours',
    };

    return durations[category];
  }

  // Generate day themes based on activities with explanations
  private generateDayTheme(activities: EnhancedItineraryItemDto[]): {
    theme: string;
    explanation: string;
  } {
    if (!activities?.length) {
      return {
        theme: 'Exploration Day',
        explanation: 'No specific activities scheduled for this day.',
      };
    }

    const categories = activities
      .map((a) => (a.category || '').trim().toLowerCase())
      .filter(Boolean);

    const unique = Array.from(new Set(categories));

    const counts = categories.reduce<Record<string, number>>((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    const topCategory =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'sightseeing';

    const hasAll = (req: string[]) => req.every((r) => unique.includes(r));
    const hasAny = (req: string[]) => req.some((r) => unique.includes(r));

    // Rules (ordered by priority)
    const THEME_RULES: Array<{
      all?: string[];
      any?: string[];
      title: string;
      explanation: string;
    }> = [
      // Arrival-aware themes
      {
        all: ['arrival', 'sightseeing'],
        title: 'Arrival & City Highlights',
        explanation:
          'Arrival activities paired with city sightseeing to ease into your trip while exploring key landmarks.',
      },
      {
        all: ['arrival', 'culture'],
        title: 'Arrival & Cultural Start',
        explanation:
          'Arrival day combined with cultural experiences to provide an immersive introduction to local traditions.',
      },
      {
        all: ['arrival', 'beach'],
        title: 'Arrival & Coastal Unwind',
        explanation:
          'Arrival activities followed by beach time to help you relax and settle in after travel.',
      },
      {
        all: ['arrival', 'nature'],
        title: 'Arrival & Nature Intro',
        explanation:
          'Arrival paired with nature activities to start your trip with a refreshing outdoor experience.',
      },
      {
        any: ['arrival'],
        title: 'Arrival & Orientation',
        explanation:
          'First day focused on settling in and getting oriented with your destination.',
      },

      // Strong combos
      {
        all: ['beach', 'relaxation'],
        title: 'Beach & Relaxation',
        explanation:
          'Beach and relaxation activities are grouped together as they complement each other and are often located in the same coastal areas.',
      },
      {
        all: ['culture', 'sightseeing'],
        title: 'Cultural Exploration',
        explanation:
          'Cultural and sightseeing activities combined to provide deep insights into local heritage and landmarks.',
      },
      {
        all: ['nature', 'sightseeing'],
        title: 'Nature & Highlights',
        explanation:
          'Nature experiences paired with key highlights to showcase both natural beauty and important sites.',
      },
      {
        all: ['culture', 'nature'],
        title: 'Culture & Nature',
        explanation:
          'Cultural and nature activities balanced to explore both local traditions and natural landscapes.',
      },
      {
        all: ['beach', 'culture'],
        title: 'Coast & Culture',
        explanation:
          'Coastal experiences combined with cultural activities for a diverse day by the sea.',
      },
      {
        all: ['beach', 'sightseeing'],
        title: 'Coastal Highlights',
        explanation:
          'Beach activities paired with sightseeing to maximize coastal exploration.',
      },
      {
        all: ['nature', 'beach'],
        title: 'Nature & Coast',
        explanation:
          'Nature and beach activities grouped to provide varied outdoor experiences in scenic areas.',
      },
      {
        all: ['relaxation', 'culture'],
        title: 'Relaxation & Culture',
        explanation:
          'Relaxing activities combined with cultural experiences for a balanced, rejuvenating day.',
      },
    ];

    let theme = '';
    let explanation = '';

    // 1) If single-category day → "{Category} Day"
    if (unique.length === 1) {
      const only = unique[0];
      theme = `${only[0].toUpperCase() + only.slice(1)} Day`;
      explanation = `This day focuses on ${only} activities to provide a concentrated experience.`;
      return { theme, explanation };
    }

    // 2) Apply first matching rule
    for (const rule of THEME_RULES) {
      const okAll = rule.all ? hasAll(rule.all) : true;
      const okAny = rule.any ? hasAny(rule.any) : true;
      if (okAll && okAny) {
        return { theme: rule.title, explanation: rule.explanation };
      }
    }

    // 3) Weighted fallback based on dominant category
    const DOMINANT_FALLBACK: Record<
      string,
      { theme: string; explanation: string }
    > = {
      beach: {
        theme: 'Beach Escape',
        explanation:
          'This day focuses on beach activities to provide a concentrated coastal experience.',
      },
      nature: {
        theme: 'Nature Day',
        explanation:
          'Nature activities are prioritized to immerse you in the natural beauty of the region.',
      },
      culture: {
        theme: 'Cultural Day',
        explanation:
          'Cultural activities are highlighted to deepen your understanding of local traditions.',
      },
      relaxation: {
        theme: 'Relax & Recharge',
        explanation:
          'Relaxation activities are scheduled to provide rest and recovery during your trip.',
      },
      sightseeing: {
        theme: 'Highlights Day',
        explanation:
          'Sightseeing activities grouped to cover key landmarks and attractions efficiently.',
      },
      arrival: {
        theme: 'Arrival Day',
        explanation:
          'First day activities designed to ease you into the destination after arrival.',
      },
    };

    const fallback = DOMINANT_FALLBACK[topCategory] || {
      theme: 'Discovery Day',
      explanation: `This day combines ${unique.join(', ')} activities to provide variety while maintaining efficient routing between locations.`,
    };

    return fallback;
  }

  private generateDayPlacementExplanation(
    dayNumber: number,
    activity: EnhancedItineraryItemDto,
    totalDays: number,
    dayActivities: EnhancedItineraryItemDto[],
  ): string {
    const explanations: string[] = [];

    // Day 1 specific logic
    if (dayNumber === 1) {
      if (activity.category === 'Arrival') {
        return 'Placed on arrival day to allow time for check-in and settling in.';
      }
      explanations.push(
        'Scheduled for Day 1 as a gentle introduction to the destination',
      );
    }

    // Last day logic
    if (dayNumber === totalDays) {
      explanations.push(
        'Placed on final day to conclude the trip with a memorable experience',
      );
    }

    // Mid-trip logic
    if (dayNumber > 1 && dayNumber < totalDays) {
      explanations.push(
        'Scheduled mid-trip when you are most settled and energized',
      );
    }

    // Category-based reasoning
    if (activity.category === 'Beach' || activity.category === 'Relaxation') {
      explanations.push('positioned after more active days for recovery');
    }

    if (activity.category === 'Adventure' || activity.category === 'Nature') {
      explanations.push('scheduled when energy levels are typically higher');
    }

    if (activity.category === 'Culture' || activity.category === 'History') {
      explanations.push(
        'timed to allow for in-depth exploration and appreciation',
      );
    }

    // Grouping logic
    const sameCategory = dayActivities.filter(
      (a) => a.category === activity.category,
    );
    if (sameCategory.length > 1) {
      explanations.push(
        `grouped with ${sameCategory.length - 1} other ${activity.category.toLowerCase()} activities for efficient routing`,
      );
    }

    // Priority-based
    if (activity.priority > 0.8) {
      explanations.push(
        'prioritized due to high relevance to your preferences',
      );
    }

    if (activity.priority < 0.4) {
      explanations.push('included to add variety to the itinerary');
    }

    return explanations.length > 0
      ? explanations.join('; ')
      : 'Scheduled based on optimal trip flow and timing';
  }

  private generateGroupingExplanation(
    activities: EnhancedItineraryItemDto[],
  ): string {
    if (activities.length <= 1) {
      // Even single activities should have an explanation
      if (activities.length === 1) {
        const activity = activities[0];
        if (activity.priority > 0.7) {
          return `Single high-priority ${activity.category.toLowerCase()} activity selected for focused exploration`;
        } else if (activity.priority < 0.4) {
          return `Fallback activity provided to maintain trip structure`;
        }
        return `Single ${activity.category.toLowerCase()} activity scheduled for this day`;
      }
      return 'No activities scheduled for this day';
    }

    const categories = activities.map((a) => a.category);
    const uniqueCategories = Array.from(new Set(categories));

    const explanations: string[] = [];

    // Category-based grouping
    if (uniqueCategories.length === 1) {
      explanations.push(
        `All ${categories[0].toLowerCase()} activities grouped for a focused experience`,
      );
    } else if (uniqueCategories.length === 2) {
      explanations.push(
        `${uniqueCategories.join(' and ')} activities paired for complementary experiences`,
      );
    } else {
      explanations.push(
        `Diverse mix of ${uniqueCategories.length} activity types for a well-rounded day`,
      );
    }

    // Time slot efficiency
    const timeSlots = activities.map((a) => a.timeSlot).filter(Boolean);
    if (timeSlots.length > 1) {
      explanations.push(
        'scheduled across different time slots for optimal pacing',
      );
    }

    // Priority grouping
    const highPriority = activities.filter((a) => a.priority > 0.7).length;
    if (highPriority > 1) {
      explanations.push(
        `includes ${highPriority} high-priority activities matching your preferences`,
      );
    }

    // Duration consideration
    const totalEstimatedHours = activities.reduce((sum, a) => {
      const duration = a.estimatedDuration || '';
      const hours = parseInt(duration.split('-')[0]) || 2;
      return sum + hours;
    }, 0);

    if (totalEstimatedHours > 8) {
      explanations.push('balanced to avoid over-scheduling');
    }

    return explanations.join('; ');
  }

  @Post('trip-plan')
  async tripPlanEnhanced(
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    const isValidDestination = this.isValidDestination(body.destination);
    let dayByDayPlan: DayPlan[] = [];
    let preferencesMatched: string[] = [];
    const suggestions: EnhancedItineraryItemDto[] = [];

    const startDateStr =
      body.startDate || new Date().toISOString().split('T')[0];
    const endDateStr = body.endDate || startDateStr;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const dayCount = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    );

    // ===== Fetch all embeddings once =====
    const allEmbeddings = await this.aiService.getAllEmbeddings();

    // FALLBACK for invalid destination
    if (!isValidDestination) {
      // Match preferences in database
      (body.preferences ?? []).forEach((pref) => {
        const mappedCategories = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()];
        const matchedItems = allEmbeddings.filter((item) =>
          `${item.title} ${item.content}`
            .toLowerCase()
            .includes(pref.toLowerCase()),
        );

        matchedItems.slice(0, 2).forEach((item) => {
          suggestions.push({
            order: suggestions.length + 1,
            dayNumber: 1,
            placeName: item.title,
            shortDescription: item.content,
            category: mappedCategories?.[0] || 'Sightseeing',
            confidenceScore: 'Medium',
            priority: 0.7,
            explanation: {
              selectionReason: `Matches your preference "${pref}" in title/content.`,
              rankingFactors: {
                relevanceScore: 0.6,
                confidenceLevel: 'Medium',
                categoryMatch: true,
                preferenceMatch: [pref],
              },
            },
          });
        });
      });

      // If no matches found, use top 3 general attractions
      if (suggestions.length === 0) {
        allEmbeddings.slice(0, 3).forEach((item, idx) => {
          suggestions.push({
            order: idx + 1,
            dayNumber: 1,
            placeName: item.title,
            shortDescription: item.content,
            category: 'Sightseeing',
            confidenceScore: 'High',
            priority: 0.5,
          });
        });
      }

      // Calculate preferencesMatched based on actual returned activities
      preferencesMatched = (body.preferences ?? []).filter((pref) => {
        const mapped = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()] || [];
        return suggestions.some((item) => mapped.includes(item.category));
      });

      // Return fallback plan immediately
      return {
        plan: {
          destination: body.destination || 'Unknown',
          dates: { start: startDateStr, end: endDateStr },
          totalDays: dayCount,
          dayByDayPlan: [
            {
              day: 1,
              date: startDate.toISOString().split('T')[0],
              theme: 'Suggested Places',
              activities: suggestions,
            },
          ],
          summary: {
            totalActivities: suggestions.length,
            categoriesIncluded: [
              ...new Set(suggestions.map((a) => a.category)),
            ],
            preferencesMatched,
          },
        },
        message:
          preferencesMatched.length > 0
            ? 'High-confidence suggestions found for your preferred categories.'
            : 'No strong preference matches found. Showing best available results.',
      };
    }

    // ===== Normal itinerary mode =====
    const searchTerms = [
      body.destination,
      'attractions',
      'places to visit',
      ...(body.preferences ?? []),
    ];
    const query = searchTerms.join(' ');

    const searchResults = await this.executeSearch(query);

    dayByDayPlan = this.generateItinerary(
      searchResults.results,
      dayCount,
      startDateStr,
      body.preferences,
      body.destination,
    );

    // Calculate preferencesMatched based on actual returned activities
    const allCategoriesInPlan = dayByDayPlan.flatMap((d) =>
      d.activities.map((a) => a.category),
    );

    preferencesMatched = (body.preferences ?? []).filter((pref) => {
      const mapped = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()] || [];
      return allCategoriesInPlan.some((cat) => mapped.includes(cat));
    });

    return {
      plan: {
        destination: body.destination,
        dates: { start: startDateStr, end: endDateStr },
        totalDays: dayCount,
        dayByDayPlan,
        summary: {
          totalActivities: dayByDayPlan.reduce(
            (sum, d) => sum + d.activities.length,
            0,
          ),
          categoriesIncluded: [...new Set(allCategoriesInPlan)],
          preferencesMatched,
        },
      },
      message:
        preferencesMatched.length > 0
          ? 'High-confidence suggestions found for your preferred categories.'
          : 'No strong preference matches found. Showing best available results.',
    };
  }
}
